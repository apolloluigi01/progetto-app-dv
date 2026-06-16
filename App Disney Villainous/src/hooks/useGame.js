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

  // Azioni "principali" che aggiornano lo snapshot per l'undo step-by-step
  const SNAPSHOT_ACTIONS = [
    engine.moveVillain,
    engine.playVillainCard,
    engine.playVillainCardToLocation,
    engine.discardCard,
    engine.gainPower,
    engine.removePower,
    engine.moveAllyOrItem,
    engine.moveCorvoAlly,
    engine.vanquish,
  ]

  // ── Helper: esegui un'azione engine + persist ───────────
  const dispatch = useCallback(async (fn, ...args) => {
    const current = gameStateRef.current
    if (!current) return { error: 'State non caricato.' }

    const isMetaAction = fn === engine.requestUndo || fn === engine.respondUndo
    // Le azioni principali aggiornano lo snapshot a ogni chiamata (undo step-by-step)
    const withSnapshot = (!isMetaAction && SNAPSHOT_ACTIONS.includes(fn))
      ? { ...current, undoSnapshot: { ...current, undoSnapshot: null } }
      : current

    const result = fn(withSnapshot, ...args)
    if (result?.error) return result
    gameStateRef.current = result
    setGameState(result)
    return persistState(result)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistState])

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

  // ── Move Corvo (Malefica) ───────────────────────────────
  const moveCorvoAlly = useCallback((toIdx) => {
    return dispatch(engine.moveCorvoAlly, myPlayerId, toIdx)
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

  // ── Aurora: posiziona eroe rivelato ─────────────────────
  const placeRevealedHero = useCallback((locationIndex) => {
    return dispatch(engine.placeRevealedHero, myPlayerId, locationIndex)
  }, [dispatch, myPlayerId])

  // ── Condizioni ───────────────────────────────────────────
  const requestConditionActivation = useCallback((cardId) => {
    return dispatch(engine.requestConditionActivation, myPlayerId, cardId)
  }, [dispatch, myPlayerId])

  const respondConditionActivation = useCallback((approved) => {
    return dispatch(engine.respondConditionActivation, myPlayerId, approved)
  }, [dispatch, myPlayerId])

  const conditionDiscardCard = useCallback((cardId) => {
    return dispatch(engine.conditionDiscardCard, myPlayerId, cardId)
  }, [dispatch, myPlayerId])

  const conditionDefeatHero = useCallback((heroCardId) => {
    return dispatch(engine.conditionDefeatHero, myPlayerId, heroCardId)
  }, [dispatch, myPlayerId])

  const conditionDiscardOpponentItem = useCallback((itemCardId, targetPlayerId, locationIndex) => {
    return dispatch(engine.conditionDiscardOpponentItem, myPlayerId, itemCardId, targetPlayerId, locationIndex)
  }, [dispatch, myPlayerId])

  const conditionRecoverCard = useCallback((cardId) => {
    return dispatch(engine.conditionRecoverCard, myPlayerId, cardId)
  }, [dispatch, myPlayerId])

  const conditionPlayAllyFree = useCallback((allyCardId, locationIndex) => {
    return dispatch(engine.conditionPlayAllyFree, myPlayerId, allyCardId, locationIndex)
  }, [dispatch, myPlayerId])

  const conditionOssessioneResolve = useCallback((playHero, locationIndex) => {
    return dispatch(engine.conditionOssessioneResolve, myPlayerId, playHero, locationIndex)
  }, [dispatch, myPlayerId])

  const conditionFateOneCard = useCallback((locationIndex) => {
    return dispatch(engine.conditionFateOneCard, myPlayerId, locationIndex)
  }, [dispatch, myPlayerId])

  const conditionSkipEffect = useCallback(() => {
    return dispatch(engine.conditionSkipEffect, myPlayerId)
  }, [dispatch, myPlayerId])

  // ── Undo ─────────────────────────────────────────────────
  const requestUndo = useCallback(() => {
    return dispatch(engine.requestUndo, myPlayerId)
  }, [dispatch, myPlayerId])

  const respondUndo = useCallback((approved) => {
    return dispatch(engine.respondUndo, myPlayerId, approved)
  }, [dispatch, myPlayerId])

  // ── Malefica: Principe Filippo — scarta alleati nel suo luogo ───
  const resolveFilippoDiscard = useCallback((targetPlayerId, locationIndex, doDiscard) => {
    return dispatch(engine.resolveFilippoDiscard, myPlayerId, targetPlayerId, locationIndex, doDiscard)
  }, [dispatch, myPlayerId])

  // ── Malefica: Re Stefano — sposta Malefica ───────────────
  const resolveReStefanoMove = useCallback((targetPlayerId, destinationIndex) => {
    return dispatch(engine.resolveReStefanoMove, myPlayerId, targetPlayerId, destinationIndex)
  }, [dispatch, myPlayerId])

  // ── Malefica: Re Uberto — sposta alleato adiacente ───────
  const resolveReUbertoMove = useCallback((targetPlayerId, allyId, fromLocIdx, toLocIdx) => {
    return dispatch(engine.resolveReUbertoMove, myPlayerId, targetPlayerId, allyId, fromLocIdx, toLocIdx)
  }, [dispatch, myPlayerId])

  // ── Malefica: C'era una Volta in un Sogno ────────────────
  const resolveOnceuponatime = useCallback((targetPlayerId, curseId, locIdx) => {
    return dispatch(engine.resolveOnceuponatime, myPlayerId, targetPlayerId, curseId, locIdx)
  }, [dispatch, myPlayerId])

  // ── Malefica: Forma di Drago — sconfiggi eroe ≤3 ─────────
  const resolveFormadiDrago = useCallback((heroCardId) => {
    return dispatch(engine.resolveFormadiDrago, myPlayerId, heroCardId)
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
    moveCorvoAlly,
    vanquish,
    startFate,
    resolveFate,
    placeFateCard,
    placeRevealedHero,
    assignFateItem,
    requestConditionActivation,
    respondConditionActivation,
    conditionDiscardCard,
    conditionDefeatHero,
    conditionDiscardOpponentItem,
    conditionRecoverCard,
    conditionPlayAllyFree,
    conditionOssessioneResolve,
    conditionFateOneCard,
    conditionSkipEffect,
    requestUndo,
    respondUndo,
    completeAction,
    endTurn,
    drawCards,
    fetchGame,
    resolveFilippoDiscard,
    resolveReStefanoMove,
    resolveReUbertoMove,
    resolveOnceuponatime,
    resolveFormadiDrago,
  }
}
