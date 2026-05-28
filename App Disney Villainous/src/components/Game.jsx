// ============================================================
// Game.jsx — Componente principale della partita
// Gestisce: join automatico, villain select, board di gioco
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame.js'
import VillainSelect from './VillainSelect.jsx'
import PlayerBoard   from './PlayerBoard.jsx'
import GameLog       from './GameLog.jsx'
import Card          from './Card.jsx'
import { VILLAINS }  from '../data/villains.js'

export default function Game() {
  const { roomCode }     = useParams()
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()
  const [actionError, setActionError] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [uiMsg, setUiMsg]  = useState(null)  // messaggi contestuali all'utente

  const isJoining = searchParams.get('join') === '1'
  const joinName  = searchParams.get('name') || ''

  const {
    gameState, myPlayerId, myPlayer, isMyTurn, isHost,
    currentPlayer, loading, error,
    joinGame, selectVillain, startGame,
    moveVillain, gainPower, playCard, discardCard,
    moveAllyOrItem, vanquish, startFate, resolveFate,
    placeFateCard, completeAction, endTurn,
  } = useGame(roomCode)

  // ── Join automatico se arrivati via link ──────────────────
  const [hasJoined, setHasJoined] = useState(false)
  useEffect(() => {
    if (isJoining && gameState && !myPlayer && !hasJoined) {
      setHasJoined(true)
      joinGame(joinName || 'Giocatore').then(res => {
        if (res?.error) setActionError(res.error)
      })
    }
  }, [isJoining, gameState, myPlayer, hasJoined, joinGame, joinName])

  // ── Helper: esegui action e mostra errore ─────────────────
  async function exec(fn, ...args) {
    setActionError(null)
    const res = await fn(...args)
    if (res?.error) setActionError(res.error)
    return res
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 font-display animate-pulse">Caricamento partita…</div>
      </div>
    )
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Partita non trovata.'}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">← Torna alla Home</button>
      </div>
    )
  }

  // ── Codice stanza (condivisione) ──────────────────────────
  const shareUrl = `${window.location.origin}/game/${roomCode}?join=1&name=Giocatore`

  // ── Villain Select ────────────────────────────────────────
  if (gameState.status === 'lobby' || gameState.status === 'villain_select') {
    return (
      <VillainSelect
        gameState={gameState}
        myPlayerId={myPlayerId}
        isHost={isHost}
        onSelect={vid => exec(selectVillain, vid)}
        onStart={() => exec(startGame)}
        error={actionError}
      />
    )
  }

  // ── Game Over ─────────────────────────────────────────────
  if (gameState.status === 'game_over') {
    const winner = gameState.players.find(p => p.id === gameState.winnerId)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl">🏆</div>
        <h1 className="font-display text-4xl font-black text-yellow-400">
          {winner?.name} ha vinto!
        </h1>
        <p className="text-gray-400 text-lg">
          {VILLAINS[winner?.villainId]?.name} trionfa su tutti!
        </p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">
          Nuova Partita
        </button>
      </div>
    )
  }

  // ── Board di Gioco ────────────────────────────────────────
  const phase        = gameState.phase
  const actionQueue  = gameState.actionQueue || []
  const myVillain    = myPlayer ? VILLAINS[myPlayer.villainId] : null

  // ── Handler: click su azione ─────────────────────────────
  async function handleActionClick(actionIndex, action) {
    setActionError(null)

    if (action.type === 'gain_power') {
      await exec(gainPower, action.value)
      await exec(completeAction, actionIndex)

    } else if (action.type === 'play_card') {
      if (!selectedCardId) {
        setUiMsg('Seleziona prima una carta dalla tua mano, poi clicca di nuovo "Gioca Carta".')
        return
      }
      const res = await exec(playCard, selectedCardId)
      if (!res?.error) {
        setSelectedCardId(null)
        await exec(completeAction, actionIndex)
      }
      setUiMsg(null)

    } else if (action.type === 'fate') {
      const opponents = gameState.players.filter(p => p.id !== myPlayerId)
      if (opponents.length === 1) {
        await exec(startFate, opponents[0].id)
        await exec(completeAction, actionIndex)
      } else {
        setUiMsg(`Fato: scegli un avversario da attaccare. (Feature multitarget — prossima versione)`)
        // Per ora attacca il primo
        await exec(startFate, opponents[0].id)
        await exec(completeAction, actionIndex)
      }

    } else if (action.type === 'activate') {
      setUiMsg('Attiva: scegli l\'oggetto/alleato da attivare cliccandolo sulla plancia.')
      await exec(completeAction, actionIndex)

    } else if (action.type === 'move') {
      setUiMsg('Sposta: scegli un alleato/oggetto e il luogo adiacente dove spostarlo.')
      await exec(completeAction, actionIndex)

    } else if (action.type === 'vanquish') {
      setUiMsg('Sconfiggi: seleziona un Eroe e gli alleati da usare (funzione disponibile nel prossimo step).')
      await exec(completeAction, actionIndex)

    } else {
      await exec(completeAction, actionIndex)
    }
  }

  // ── Handler: Fate choice ─────────────────────────────────
  async function handleFateChoice(cardId) {
    if (gameState.pendingFate) {
      const { targetPlayerId } = gameState.pendingFate
      const res = await exec(resolveFate, cardId)
      if (!res?.error && gameState.pendingInteraction) {
        // Piazza la carta Fato (hero) su un luogo del target — default: luogo 0
        await exec(placeFateCard, cardId, targetPlayerId, 0)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* Header partita */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-400 text-sm">
            ← Home
          </button>
          <span className="font-display text-gray-500 text-sm">Stanza:</span>
          <span className="font-display font-bold text-yellow-400 tracking-widest text-sm">{roomCode}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
            className="text-[10px] text-gray-600 hover:text-gray-400 border border-gray-800 rounded px-2 py-0.5"
            title="Copia link di invito"
          >
            📋 Copia Link
          </button>
        </div>

        {/* Turno corrente */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Turno di:</span>
          <span className={`font-display font-bold text-sm ${isMyTurn ? 'text-yellow-400' : 'text-gray-300'}`}>
            {currentPlayer?.name} {isMyTurn && '(Tu)'}
          </span>
          <span className="text-xs text-gray-600 capitalize">[{phase}]</span>
        </div>

        {/* End Turn manuale (fallback) */}
        {isMyTurn && (
          <button onClick={() => exec(endTurn)} className="btn-secondary text-xs px-3 py-1.5">
            Fine Turno →
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-auto">

        {/* ── Colonna sinistra: plancia mia ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Istruzioni contestuali */}
          {isMyTurn && (
            <div className={[
              'rounded-lg px-4 py-2.5 border text-sm',
              uiMsg
                ? 'border-blue-700/50 bg-blue-950/30 text-blue-300'
                : actionError
                  ? 'border-red-700/50 bg-red-950/30 text-red-300'
                  : 'border-yellow-700/30 bg-yellow-950/20 text-yellow-400',
            ].join(' ')}>
              {actionError
                ? `⚠️ ${actionError}`
                : uiMsg
                  ? `ℹ️ ${uiMsg}`
                  : phase === 'move'
                    ? '📍 Spostati in un luogo del tuo regno (clicca su un luogo).'
                    : phase === 'action'
                      ? '⚡ Esegui le azioni disponibili nel tuo luogo corrente.'
                      : phase === 'fate_choice'
                        ? '🔮 Scegli una carta Fato da giocare.'
                        : ''}
            </div>
          )}

          {/* La mia plancia */}
          {myPlayer && (
            <PlayerBoard
              player={myPlayer}
              isMyBoard={true}
              isMyTurn={isMyTurn}
              phase={phase}
              actionQueue={actionQueue}
              selectedCardId={selectedCardId}
              onLocationClick={isMyTurn && phase === 'move'
                ? (idx) => exec(moveVillain, idx)
                : undefined}
              onActionClick={isMyTurn && phase === 'action'
                ? handleActionClick
                : undefined}
              onHandCardClick={(id) => setSelectedCardId(prev => prev === id ? null : id)}
              onCardInLocationClick={(id) => {
                // TODO: mostra modal con dettagli carta
              }}
            />
          )}

          {/* ── Fate Choice ── */}
          {isMyTurn && phase === 'fate_choice' && gameState.pendingFate && (
            <div className="bg-purple-950/40 border border-purple-700/50 rounded-xl p-4">
              <h3 className="font-display text-purple-300 font-bold mb-3">
                🔮 Scegli 1 carta da giocare — l'altra torna allo scarto del Fato
              </h3>
              <div className="flex gap-3 flex-wrap">
                {gameState.pendingFate.cards.map(cardId => {
                  const target = gameState.players.find(p => p.id === gameState.pendingFate.targetPlayerId)
                  const villain = VILLAINS[target?.villainId]
                  const card = villain?.fateDeck.find(c => c.id === cardId)
                  if (!card) return null
                  return (
                    <div key={cardId} className="flex flex-col items-center gap-2">
                      <Card card={card} onClick={() => handleFateChoice(cardId)} />
                      <button onClick={() => handleFateChoice(cardId)} className="btn-fate text-xs px-4">
                        Gioca questa
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Log */}
          <GameLog log={gameState.log || []} />
        </div>

        {/* ── Colonna destra: plance avversari ── */}
        <div className="lg:w-80 xl:w-96 flex flex-col gap-4">
          <h2 className="font-display text-xs text-gray-600 uppercase tracking-widest">Avversari</h2>
          {gameState.players
            .filter(p => p.id !== myPlayerId)
            .map(opponent => (
              <PlayerBoard
                key={opponent.id}
                player={opponent}
                isMyBoard={false}
                isMyTurn={false}
                phase={phase}
                actionQueue={[]}
                selectedCardId={null}
              />
            ))}
        </div>
      </main>
    </div>
  )
}
