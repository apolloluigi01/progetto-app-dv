// ============================================================
// useGame — Hook React per la gestione della partita
// Si occupa di:
//   - Sincronizzazione con Supabase (legge/scrive lo state)
//   - Subscription Realtime (aggiornamenti in tempo reale)
//   - Espone azioni tipizzate ai componenti
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import engine from '../engine/gameEngine.js'

const SESSION_KEY = 'dv_session_id'

// Genera o recupera l'ID di sessione anonima del browser
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = engine.generateId() + engine.generateId()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function useGame(roomCode) {
  const [gameState, setGameState]   = useState(null)
  const [gameId, setGameId]         = useState(null)
  const [myPlayerId, setMyPlayerId] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const sessionId    = useRef(getSessionId())
  // Ref al game state aggiornato: evita stale closure in dispatch
  // quando si concatenano più azioni nello stesso handler
  const gameStateRef = useRef(null)

  // ── Carica partita da Supabase ──────────────────────────
  const fetchGame = useCallback(async () => { 
    if (!roomCode) return
    const { data, error: err } = await supabase
      .from('games')
      .select('id, state')
      .eq('room_code', roomCode)
      .single()

    if (err || !data) {
      setError('Partita non trovata. Controlla il codice stanza.')
      setLoading(false)
      return
    }

    setGameId(data.id)
    setGameState(data.state)

    // Identifica il giocatore corrente per questa sessione
    const me = data.state?.players?.find(p => p.sessionId === sessionId.current)
    if (me) setMyPlayerId(me.id)

    setLoading(false)
  }, [roomCode])

  // ── Sync ref ogni volta che lo state cambia ─────────────
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // ── Subscription Realtime ───────────────────────────────
  useEffect(() => {
    if (!roomCode) return

    fetchGame()

    const channel = supabase
      .channel(`game:${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const newState = payload.new?.state
          if (newState) {
            // Aggiorna il ref immediatamente oltre che lo state React
            gameStateRef.current = newState
            setGameState(newState)
            const me = newState.players?.find(p => p.sessionId === sessionId.current)
            if (me && !myPlayerId) setMyPlayerId(me.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode, fetchGame])

  // ── Persist State su Supabase ───────────────────────────
  const persistState = useCallback(async (newState) => {
    if (!gameId) return { error: 'Game ID non disponibile.' }
    const { error: err } = await supabase
      .from('games')
      .update({ state: newState })
      .eq('id', gameId)
    if (err) return { error: err.message }
    return { ok: true }
  }, [gameId])

  // ── Helper: esegui un'azione engine + persist ───────────
  // IMPORTANTE: usa gameStateRef.current (non gameState dalla closure)
  // così chiamate concatenate nello stesso handler leggono sempre
  // lo state più recente, senza aspettare il ciclo di render React.
  const dispatch = useCallback(async (fn, ...args) => {
    const current = gameStateRef.current
    if (!current) return { error: 'State non caricato.' }
    const result = fn(current, ...args)
    if (result?.error) return result
    // Aggiorna il ref immediatamente: la prossima dispatch concatenata
    // leggerà questo stato aggiornato senza aspettare il re-render
    gameStateRef.current = result
    setGameState(result)
    return persistState(result)
  }, [persistState])   // non dipende più da gameState → nessuna stale closure

  // ── Crea partita (host) ─────────────────────────────────
  const createGame = useCallback(async (playerName) => {
    const newRoomCode = engine.generateRoomCode()
    const playerId    = engine.generateId()

    const hostPlayer = {
      id:        playerId,
      sessionId: sessionId.current,
      name:      playerName,
      isHost:    true,
      villainId: null,
      isReady:   false,
    }

    const initialState = engine.createLobbyState(hostPlayer)

    const { data, error: err } = await supabase
      .from('games')
      .insert({ room_code: newRoomCode, state: initialState })
      .select('id')
      .single()

    if (err) return { error: err.message }

    setGameId(data.id)
    setGameState(initialState)
    setMyPlayerId(playerId)

    return { roomCode: newRoomCode, playerId }
  }, [])

  // ── Entra in una partita esistente ─────────────────────
  const joinGame = useCallback(async (playerName) => {
    if (!gameState) return { error: 'State non caricato.' }

    // Già dentro?
    const existing = gameState.players?.find(p => p.sessionId === sessionId.current)
    if (existing) {
      setMyPlayerId(existing.id)
      return { ok: true, playerId: existing.id }
    }

    const newPlayer = {
      id:        engine.generateId(),
      sessionId: sessionId.current,
      name:      playerName,
      isHost:    false,
      villainId: null,
      isReady:   false,
    }

    const newState = engine.joinLobby(gameState, newPlayer)
    if (newState?.error) return newState

    setMyPlayerId(newPlayer.id)
    const res = await persistState(newState)
    if (res?.error) return res
    return { ok: true, playerId: newPlayer.id }
  }, [gameState, persistState])

  // ── Villain Select ──────────────────────────────────────
  const selectVillain = useCallback((villainId) => {
    return dispatch(engine.selectVillain, myPlayerId, villainId)
  }, [dispatch, myPlayerId])

  // ── Start Game (solo host) ──────────────────────────────
  const startGame = useCallback(() => {
    return dispatch(engine.startGame)
  }, [dispatch])

  // ── Move Villain ────────────────────────────────────────
  const moveVillain = useCallback((locationIndex) => {
    return dispatch(engine.moveVillain, myPlayerId, locationIndex)
  }, [dispatch, myPlayerId])

  // ── Gain Power (manuale, es. da effetto carta) ──────────
  const gainPower = useCallback((amount, targetPlayerId = null) => {
    return dispatch(engine.gainPower, targetPlayerId || myPlayerId, amount)
  }, [dispatch, myPlayerId])

  const removePower = useCallback((amount, targetPlayerId) => {
    return dispatch(engine.removePower, targetPlayerId, amount)
  }, [dispatch])

  // ── Play Villain Card ───────────────────────────────────
  const playCard = useCallback((cardId, overrideLocationIndex = null) => {
    return dispatch(engine.playVillainCard, myPlayerId, cardId, overrideLocationIndex)
  }, [dispatch, myPlayerId])

  // ── Play Villain Card in luogo specifico ────────────────
  const playCardToLocation = useCallback((cardId, locationIndex) => {
    return dispatch(engine.playVillainCardToLocation, myPlayerId, cardId, locationIndex)
  }, [dispatch, myPlayerId])

  // ── Discard Card ────────────────────────────────────────
  const discardCard = useCallback((cardId) => {
    return dispatch(engine.discardCard, myPlayerId, cardId)
  }, [dispatch, myPlayerId])

  // ── Move Ally or Item ───────────────────────────────────
  const moveAllyOrItem = useCallback((cardId, fromIdx, toIdx) => {
    return dispatch(engine.moveAllyOrItem, myPlayerId, cardId, fromIdx, toIdx)
  }, [dispatch, myPlayerId])

  // ── Vanquish ────────────────────────────────────────────
  const vanquish = useCallback((heroCardId, allyCardIds) => {
    return dispatch(engine.vanquish, myPlayerId, heroCardId, allyCardIds)
  }, [dispatch, myPlayerId])

  // ── Fate ────────────────────────────────────────────────
  const startFate = useCallback((targetPlayerId) => {
    return dispatch(engine.startFate, myPlayerId, targetPlayerId)
  }, [dispatch, myPlayerId])

  const resolveFate = useCallback((chosenCardId) => {
    return dispatch(engine.resolveFate, chosenCardId)
  }, [dispatch])

  const placeFateCard = useCallback((cardId, targetPlayerId, locationIndex) => {
    return dispatch(engine.placeFateCard, cardId, targetPlayerId, locationIndex)
  }, [dispatch])

  // ── Complete/Skip Action ─────────────────────────────────
  const completeAction = useCallback((actionIndex) => {
    return dispatch(engine.completeAction, myPlayerId, actionIndex)
  }, [dispatch, myPlayerId])

  // ── Assegna Oggetto Fato a Eroe ──────────────────────────
  const assignFateItem = useCallback((targetPlayerId, itemCardId, heroCardId) => {
    return dispatch(engine.assignFateItem, targetPlayerId, itemCardId, heroCardId)
  }, [dispatch])

  // ── Gioca Condizione (fuori turno) ───────────────────────
  const playCondition = useCallback((cardId) => {
    return dispatch(engine.playCondition, myPlayerId, cardId)
  }, [dispatch, myPlayerId])

  // ── End Turn (manuale fallback) ──────────────────────────
  const endTurn = useCallback(() => {
    return dispatch(engine.endTurn)
  }, [dispatch])

  // ── Draw ─────────────────────────────────────────────────
  const drawCards = useCallback((count) => {
    return dispatch(engine.drawCards, myPlayerId, count)
  }, [dispatch, myPlayerId])

  // ── Computed ─────────────────────────────────────────────
  const myPlayer     = gameState?.players?.find(p => p.id === myPlayerId)
  const isMyTurn     = gameState && myPlayer
    ? gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId
    : false
  const currentPlayer = gameState ? engine.getCurrentPlayer(gameState) : null
  const isHost       = myPlayer?.isHost === true

  return {
    // State
    gameState,
    gameId,
    myPlayerId,
    myPlayer,
    isMyTurn,
    isHost,
    currentPlayer,
    loading,
    error,
    sessionId: sessionId.current,

    // Actions
    createGame,
    joinGame,
    selectVillain,
    startGame,
    moveVillain,
    gainPower,
    removePower,
    playCard,
    playCardToLocation,
    discardCard,
    moveAllyOrItem,
    vanquish,
    startFate,
    resolveFate,
    placeFateCard,
    assignFateItem,
    playCondition,
    completeAction,
    endTurn,
    drawCards,
    fetchGame,
  }
}
