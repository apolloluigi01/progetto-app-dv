// ============================================================
// Game.jsx — Componente principale della partita
// Layout: plancia avversario in alto | plancia mia in basso | log a destra
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useGame }       from '../hooks/useGame.js'
import VillainSelect     from './VillainSelect.jsx'
import PlayerBoard       from './PlayerBoard.jsx'
import GameLog           from './GameLog.jsx'
import Card              from './Card.jsx'
import { VILLAINS }      from '../data/villains.js'

const VILLAIN_EMOJI = {
  maleficent:      '🧙‍♀️',
  jafar:           '🐍',
  hook:            '🏴‍☠️',
  ursula:          '🐙',
  prince_john:     '👑',
  queen_of_hearts: '🃏',
}

export default function Game() {
  const { roomCode }     = useParams()
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()

  // ── UI State locale (non va su Supabase) ─────────────────
  const [actionError,    setActionError]    = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [uiMsg,          setUiMsg]          = useState(null)
  // Spostamento staged: il giocatore sceglie il luogo ma
  // non sposta il villain finché non preme "Conferma"
  const [stagedLocation, setStagedLocation] = useState(null)

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

  // Reset staged location quando cambia il turno o la fase
  useEffect(() => {
    setStagedLocation(null)
    setSelectedCardId(null)
    setUiMsg(null)
    setActionError(null)
  }, [gameState?.currentPlayerIndex, gameState?.phase])

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
        <div className="text-gray-500 font-display animate-pulse text-lg">
          Caricamento partita…
        </div>
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

  // ── Villain Select ────────────────────────────────────────
  if (gameState.status === 'lobby' || gameState.status === 'villain_select') {
    return (
      <VillainSelect
        gameState={gameState}
        myPlayerId={myPlayerId}
        isHost={isHost}
        roomCode={roomCode}
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
  const phase       = gameState.phase
  const actionQueue = gameState.actionQueue || []
  const opponents   = gameState.players.filter(p => p.id !== myPlayerId)

  // ── Handler: conferma spostamento ────────────────────────
  async function handleConfirmMove() {
    if (stagedLocation === null) return
    const res = await exec(moveVillain, stagedLocation)
    if (!res?.error) setStagedLocation(null)
  }

  // ── Handler: click su azione ─────────────────────────────
  async function handleActionClick(actionIndex, action) {
    setActionError(null)
    setUiMsg(null)

    if (action.type === 'gain_power') {
      await exec(gainPower, action.value)
      await exec(completeAction, actionIndex)

    } else if (action.type === 'play_card') {
      if (!selectedCardId) {
        setUiMsg('Seleziona prima una carta dalla mano, poi clicca di nuovo "Gioca Carta".')
        return
      }
      const res = await exec(playCard, selectedCardId)
      if (!res?.error) {
        setSelectedCardId(null)
        await exec(completeAction, actionIndex)
      }

    } else if (action.type === 'fate') {
      const opp = opponents[0]
      if (opp) {
        await exec(startFate, opp.id)
        await exec(completeAction, actionIndex)
      }

    } else if (action.type === 'activate') {
      setUiMsg('Attiva: clicca l\'oggetto o l\'alleato da attivare nella plancia.')
      await exec(completeAction, actionIndex)

    } else if (action.type === 'move') {
      setUiMsg('Sposta: clicca un alleato/oggetto nella plancia e scegli il luogo adiacente.')
      await exec(completeAction, actionIndex)

    } else if (action.type === 'vanquish') {
      setUiMsg('Sconfiggi: seleziona un Eroe e gli alleati da usare.')
      await exec(completeAction, actionIndex)

    } else {
      await exec(completeAction, actionIndex)
    }
  }

  // ── Handler: Fate choice ─────────────────────────────────
  async function handleFateChoice(cardId) {
    if (!gameState.pendingFate) return
    const { targetPlayerId } = gameState.pendingFate
    await exec(resolveFate, cardId)
    await exec(placeFateCard, cardId, targetPlayerId, 0)
  }

  // ── Messaggio stato turno ─────────────────────────────────
  function getTurnMessage() {
    if (actionError) return { text: `⚠️ ${actionError}`, cls: 'border-red-700/50 bg-red-950/30 text-red-300' }
    if (uiMsg)       return { text: `ℹ️ ${uiMsg}`,       cls: 'border-blue-700/50 bg-blue-950/30 text-blue-300' }
    if (phase === 'move') {
      if (stagedLocation !== null) {
        const loc = VILLAINS[myPlayer?.villainId]?.locations[stagedLocation]
        return { text: `📍 Luogo selezionato: "${loc?.name}". Conferma o scegli un altro.`, cls: 'border-yellow-700/50 bg-yellow-950/30 text-yellow-300' }
      }
      return { text: '📍 Scegli dove spostarti cliccando su un luogo della tua plancia.', cls: 'border-yellow-700/30 bg-yellow-950/20 text-yellow-400' }
    }
    if (phase === 'action') return { text: '⚡ Esegui le azioni disponibili nel tuo luogo corrente.', cls: 'border-green-700/30 bg-green-950/20 text-green-400' }
    if (phase === 'fate_choice') return { text: '🔮 Scegli una carta Fato da giocare.', cls: 'border-purple-700/30 bg-purple-950/20 text-purple-400' }
    return null
  }

  const turnMsg = isMyTurn ? getTurnMessage() : null

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800
                         bg-gray-950/95 backdrop-blur sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-400 text-sm">
            ← Home
          </button>
          <span className="font-display text-gray-500 text-xs">Stanza</span>
          <span className="font-display font-bold text-yellow-400 tracking-widest text-sm">{roomCode}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">Turno di:</span>
          <span className={`font-display font-bold text-sm ${isMyTurn ? 'text-yellow-400' : 'text-gray-300'}`}>
            {currentPlayer?.name}
            {isMyTurn && <span className="text-yellow-600"> (Tu)</span>}
          </span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider
                           border border-gray-800 rounded px-1.5 py-0.5">
            {phase}
          </span>
        </div>

        {isMyTurn && (
          <button onClick={() => exec(endTurn)} className="btn-secondary text-xs px-3 py-1.5">
            Fine Turno →
          </button>
        )}
      </header>

      {/* ── Body: colonna sinistra (plance) + destra (log) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── COLONNA SINISTRA: plance ─────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto divide-y divide-gray-800/60">

          {/* Messaggio turno */}
          {turnMsg && (
            <div className={`px-4 py-2 text-sm border-b ${turnMsg.cls} shrink-0`}>
              {turnMsg.text}
            </div>
          )}

          {/* ── PLANCIA AVVERSARIO (in alto) ── */}
          <section className="p-4 flex flex-col gap-3 bg-gray-950/40">
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest">
              Avversari
            </p>
            {opponents.length === 0 && (
              <p className="text-gray-700 text-xs italic">
                Nessun avversario ancora connesso.
              </p>
            )}
            {opponents.map(opp => (
              <PlayerBoard
                key={opp.id}
                player={opp}
                isMyBoard={false}
                isMyTurn={false}
                phase={phase}
                actionQueue={[]}
                stagedLocation={null}
                selectedCardId={null}
              />
            ))}
          </section>

          {/* ── SEPARATORE ── */}
          <div className="flex items-center gap-2 px-4 py-1 bg-gray-900/80 shrink-0">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-[10px] font-display text-gray-600 uppercase tracking-widest">
              La tua plancia
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* ── MIA PLANCIA (in basso) ── */}
          {myPlayer && (
            <section className="p-4 flex flex-col gap-3">
              {/* Pannello conferma spostamento */}
              {isMyTurn && phase === 'move' && stagedLocation !== null && (
                <div className="flex items-center gap-3 bg-yellow-950/40 border border-yellow-700/50
                                rounded-xl px-4 py-3">
                  <div className="flex-1">
                    <p className="text-xs text-yellow-300 font-display font-bold">
                      Sposta villain in:{' '}
                      <span className="text-yellow-200">
                        {VILLAINS[myPlayer.villainId]?.locations[stagedLocation]?.name}
                      </span>
                    </p>
                    <p className="text-[11px] text-yellow-600 mt-0.5">
                      Puoi ancora cambiare luogo cliccando sulla plancia.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setStagedLocation(null)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleConfirmMove}
                      className="btn-primary text-xs px-4 py-1.5"
                    >
                      ✓ Conferma
                    </button>
                  </div>
                </div>
              )}

              <PlayerBoard
                player={myPlayer}
                isMyBoard={true}
                isMyTurn={isMyTurn}
                phase={phase}
                actionQueue={actionQueue}
                stagedLocation={stagedLocation}
                selectedCardId={selectedCardId}
                onLocationClick={
                  isMyTurn && phase === 'move'
                    ? (idx) => {
                        // Blocca se è il luogo dell'ultimo turno
                        if (idx !== myPlayer.lastLocation) setStagedLocation(idx)
                      }
                    : undefined
                }
                onActionClick={isMyTurn && phase === 'action' ? handleActionClick : undefined}
                onHandCardClick={(id) => setSelectedCardId(prev => prev === id ? null : id)}
              />
            </section>
          )}

          {/* ── Fate Choice ── */}
          {isMyTurn && phase === 'fate_choice' && gameState.pendingFate && (
            <section className="p-4 shrink-0">
              <div className="bg-purple-950/40 border border-purple-700/50 rounded-xl p-4">
                <h3 className="font-display text-purple-300 font-bold mb-3 text-sm">
                  🔮 Scegli 1 carta da giocare — l'altra torna allo scarto del Fato
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {gameState.pendingFate.cards.map(cardId => {
                    const target  = gameState.players.find(p => p.id === gameState.pendingFate.targetPlayerId)
                    const villain = VILLAINS[target?.villainId]
                    const card    = villain?.fateDeck.find(c => c.id === cardId)
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
            </section>
          )}
        </div>

        {/* ── COLONNA DESTRA: log ──────────────────────────── */}
        <aside className="w-72 xl:w-80 border-l border-gray-800 flex flex-col bg-gray-950/60 shrink-0">
          <div className="px-3 py-2 border-b border-gray-800 shrink-0">
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest">
              Log di Gioco
            </p>
          </div>

          {/* Log scrollabile */}
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
            {(gameState.log || []).length === 0 && (
              <p className="text-gray-700 text-xs italic mt-2">Il log è vuoto.</p>
            )}
            {(gameState.log || []).map(entry => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Stato giocatori in fondo al log */}
          <div className="border-t border-gray-800 px-3 py-3 shrink-0 flex flex-col gap-2">
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest mb-1">
              Giocatori
            </p>
            {gameState.players.map(p => {
              const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === p.id
              const villain = VILLAINS[p.villainId]
              return (
                <div key={p.id}
                     className={[
                       'flex items-center justify-between text-xs rounded-lg px-2 py-1.5',
                       isCurrentTurn ? 'bg-yellow-950/40 border border-yellow-700/40' : 'bg-gray-900/50',
                     ].join(' ')}>
                  <div className="flex items-center gap-1.5">
                    <span>{VILLAIN_EMOJI[p.villainId] || '❓'}</span>
                    <span className={isCurrentTurn ? 'text-yellow-300 font-semibold' : 'text-gray-400'}>
                      {p.name}
                    </span>
                    {p.id === myPlayerId && (
                      <span className="text-[9px] text-gray-600">(Tu)</span>
                    )}
                  </div>
                  <span className="power-badge text-[10px] px-1.5 py-0.5">
                    ⚡{p.power ?? 0}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Sottocomponente: singola riga log ─────────────────────
const LOG_COLORS = {
  system: 'text-gray-500',
  info:   'text-gray-400',
  move:   'text-blue-400',
  action: 'text-green-400',
  fate:   'text-purple-400',
  win:    'text-yellow-300 font-bold',
}

function LogEntry({ entry }) {
  return (
    <p className={`text-[11px] leading-snug py-0.5 border-b border-gray-900 ${LOG_COLORS[entry.type] || 'text-gray-400'}`}>
      {entry.message}
    </p>
  )
}
