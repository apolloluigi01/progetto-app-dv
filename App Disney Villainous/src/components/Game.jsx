// ============================================================
// Game.jsx — Componente principale della partita
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useGame }    from '../hooks/useGame.js'
import VillainSelect  from './VillainSelect.jsx'
import PlayerBoard    from './PlayerBoard.jsx'
import Card           from './Card.jsx'
import { VILLAINS }   from '../data/villains.js'

const VILLAIN_EMOJI = {
  maleficent:      '🧙‍♀️',
  jafar:           '🐍',
  hook:            '🏴‍☠️',
  ursula:          '🐙',
  prince_john:     '👑',
  queen_of_hearts: '🃏',
}

function findCardFromAll(gameState, cardId) {
  for (const p of gameState.players) {
    const v = VILLAINS[p.villainId]
    const c = [...(v?.villainDeck || []), ...(v?.fateDeck || [])].find(x => x.id === cardId)
    if (c) return c
  }
  return null
}

export default function Game() {
  const { roomCode }   = useParams()
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  // ── Macchina a stati interazione ─────────────────────────
  // mode: null | 'play_card' | 'play_ally_location' | 'play_ally_confirm'
  //       | 'discard_mode' | 'move_ally_pick' | 'move_ally_dest'
  //       | 'move_ally_confirm' | 'vanquish_mode' | 'fate_target'
  //       | 'assign_fate_item' | 'assign_fate_item_confirm'
  const [mode,           setMode]           = useState(null)
  const [modeData,       setModeData]       = useState({})
  const [stagedLocation, setStagedLocation] = useState(null)
  const [actionError,    setActionError]    = useState(null)
  const [uiMsg,          setUiMsg]          = useState(null)
  // Fato: carta selezionata in attesa di conferma prima di giocarla
  const [fatePendingCard, setFatePendingCard] = useState(null)
  // Condizioni: carta per cui si sta dichiarando il trigger
  const [conditionDeclaring, setConditionDeclaring] = useState(null)

  const isJoining = searchParams.get('join') === '1'
  const joinName  = searchParams.get('name') || ''

  const {
    gameState, myPlayerId, myPlayer, isMyTurn, isHost,
    currentPlayer, loading, error,
    joinGame, selectVillain, startGame,
    moveVillain, gainPower, playCard, playCardToLocation,
    discardCard, moveAllyOrItem, vanquish,
    startFate, resolveFate, placeFateCard,
    assignFateItem, declareConditionTrigger, playCondition,
    requestUndo, respondUndo,
    completeAction, endTurn,
  } = useGame(roomCode)

  const [hasJoined, setHasJoined] = useState(false)
  useEffect(() => {
    if (isJoining && gameState && !myPlayer && !hasJoined) {
      setHasJoined(true)
      joinGame(joinName || 'Giocatore').then(res => {
        if (res?.error) setActionError(res.error)
      })
    }
  }, [isJoining, gameState, myPlayer, hasJoined, joinGame, joinName])

  // Reset tutto quando cambia turno o fase
  useEffect(() => {
    setMode(null)
    setModeData({})
    setStagedLocation(null)
    setActionError(null)
    setUiMsg(null)
    setFatePendingCard(null)
    setConditionDeclaring(null)
  }, [gameState?.currentPlayerIndex, gameState?.phase])

  async function exec(fn, ...args) {
    setActionError(null)
    const res = await fn(...args)
    if (res?.error) setActionError(res.error)
    return res
  }

  function resetMode() { setMode(null); setModeData({}) }

  // ── Loading / Error ───────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 font-display animate-pulse text-lg">Caricamento partita…</div>
    </div>
  )
  if (error || !gameState) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{error || 'Partita non trovata.'}</p>
      <button onClick={() => navigate('/')} className="btn-secondary">← Torna alla Home</button>
    </div>
  )

  if (gameState.status === 'lobby' || gameState.status === 'villain_select') return (
    <VillainSelect
      gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
      roomCode={roomCode}
      onSelect={vid => exec(selectVillain, vid)}
      onStart={() => exec(startGame)}
      error={actionError}
    />
  )

  if (gameState.status === 'game_over') {
    const winner = gameState.players.find(p => p.id === gameState.winnerId)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl">🏆</div>
        <h1 className="font-display text-4xl font-black text-yellow-400">{winner?.name} ha vinto!</h1>
        <p className="text-gray-400 text-lg">{VILLAINS[winner?.villainId]?.name} trionfa su tutti!</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">Nuova Partita</button>
      </div>
    )
  }

  // ── Computed ──────────────────────────────────────────────
  const phase        = gameState.phase
  const actionQueue  = gameState.actionQueue || []
  const opponents    = gameState.players.filter(p => p.id !== myPlayerId)
  const myVillain    = myPlayer ? VILLAINS[myPlayer.villainId] : null
  const myLocState   = myPlayer ? myPlayer.board.locations[myPlayer.currentLocation] : null

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────

  // ── Movimento villain ─────────────────────────────────────
  async function handleConfirmMove() {
    if (stagedLocation === null) return
    const res = await exec(moveVillain, stagedLocation)
    if (!res?.error) setStagedLocation(null)
  }

  // ── Click su azione ───────────────────────────────────────
  async function handleActionClick(actionIndex, action) {
    setActionError(null)
    setUiMsg(null)
    resetMode()

    if (action.type === 'gain_power') {
      await exec(gainPower, action.value)
      await exec(completeAction, actionIndex)

    } else if (action.type === 'play_card') {
      setMode('play_card')
      setModeData({ actionIndex })
      setUiMsg('Seleziona una carta dalla mano da giocare.')

    } else if (action.type === 'discard') {
      setMode('discard_mode')
      setModeData({ actionIndex })

    } else if (action.type === 'move') {
      const hasMovables = myPlayer.board.locations.some(
        loc => loc.allies.length > 0 || loc.items.length > 0
      )
      if (!hasMovables) {
        setActionError('Nessun Alleato o Oggetto presente nel Reame da spostare.')
        await exec(completeAction, actionIndex)
        return
      }
      setMode('move_ally_pick')
      setModeData({ actionIndex })
      setUiMsg('Clicca su un Alleato o Oggetto nella plancia per selezionarlo.')

    } else if (action.type === 'vanquish') {
      if (!myLocState || myLocState.heroes.length === 0) {
        setActionError('Scontro non applicabile: nessun Eroe nel tuo luogo corrente.')
        return
      }
      if (!myLocState || myLocState.allies.length === 0) {
        setActionError('Scontro non applicabile: nessun Alleato nel tuo luogo corrente.')
        return
      }
      setMode('vanquish_mode')
      setModeData({ actionIndex, selectedHeroId: null, selectedAllyIds: [] })

    } else if (action.type === 'fate') {
      if (opponents.length === 0) {
        setActionError('Nessun avversario disponibile.')
      } else if (opponents.length === 1) {
        await exec(startFate, opponents[0].id)
        await exec(completeAction, actionIndex)
      } else {
        setMode('fate_target')
        setModeData({ actionIndex })
      }

    } else if (action.type === 'activate') {
      setUiMsg('Attiva: usa l\'abilità di un Oggetto o Alleato nella tua plancia.')
      await exec(completeAction, actionIndex)

    } else if (action.type === 'move_hero') {
      setUiMsg('Muovi Eroe: sposta un Eroe della plancia avversaria in un luogo adiacente (operazione manuale).')
      await exec(completeAction, actionIndex)

    } else {
      await exec(completeAction, actionIndex)
    }
  }

  // ── Click su carta in mano ────────────────────────────────
  async function handleHandCardClick(cardId) {
    const card = myVillain?.villainDeck.find(c => c.id === cardId)
    if (!card) return

    if (mode === 'play_card') {
      if (card.type === 'condition') {
        setActionError('Le Condizioni non si giocano con "Gioca Carta": si attivano durante il turno avversario.')
        return
      }
      if (card.type === 'ally' || card.type === 'item') {
        setMode('play_ally_location')
        setModeData(prev => ({ ...prev, cardId, cardName: card.name }))
        setUiMsg(`Scegli il luogo dove giocare "${card.name}". Clicca su un luogo della tua plancia.`)
        return
      }
      // Effetti, Maledizioni, Wicket → luogo corrente
      const res = await exec(playCard, cardId)
      if (!res?.error) {
        await exec(completeAction, modeData.actionIndex)
        resetMode()
      }

    } else if (mode === 'discard_mode') {
      setModeData(prev => ({ ...prev, pendingCardId: cardId, pendingCardName: card.name }))
    }
  }

  // ── Scarto ───────────────────────────────────────────────
  async function handleConfirmDiscard() {
    const res = await exec(discardCard, modeData.pendingCardId)
    if (!res?.error) setModeData(prev => ({ ...prev, pendingCardId: null, pendingCardName: null }))
  }

  async function handleEndDiscard() {
    await exec(completeAction, modeData.actionIndex)
    resetMode()
  }

  // ── Click su luogo (mia plancia) ─────────────────────────
  function handleMyLocationClick(idx) {
    if (phase === 'move') {
      if (idx !== myPlayer.lastLocation) setStagedLocation(idx)
      return
    }
    if (mode === 'play_ally_location') {
      const locName = myVillain?.locations[idx]?.name || `Luogo ${idx + 1}`
      setMode('play_ally_confirm')
      setModeData(prev => ({ ...prev, targetLocIdx: idx, targetLocName: locName }))
    }
    if (mode === 'move_ally_dest') {
      if (idx === modeData.fromLocIdx) { setActionError('Scegli un luogo diverso da quello attuale.'); return }
      const toLocName = myVillain?.locations[idx]?.name || `Luogo ${idx + 1}`
      setMode('move_ally_confirm')
      setModeData(prev => ({ ...prev, toLocIdx: idx, toLocName }))
    }
  }

  // ── Conferma gioca alleato/oggetto in luogo ───────────────
  async function handleConfirmPlayAlly() {
    const res = await exec(playCardToLocation, modeData.cardId, modeData.targetLocIdx)
    if (!res?.error) {
      await exec(completeAction, modeData.actionIndex)
      resetMode()
    }
  }

  // ── Click su alleato/oggetto nella plancia ────────────────
  function handleAllyItemClick(cardId, fromLocIdx) {
    if (mode !== 'move_ally_pick') return
    const allCards = myVillain ? [...myVillain.villainDeck, ...myVillain.fateDeck] : []
    const card     = allCards.find(c => c.id === cardId)
    const fromLocName = myVillain?.locations[fromLocIdx]?.name || `Luogo ${fromLocIdx + 1}`
    setMode('move_ally_dest')
    setModeData(prev => ({ ...prev, cardId, cardName: card?.name || cardId, fromLocIdx, fromLocName }))
    setUiMsg(`"${card?.name || cardId}" selezionato. Clicca il luogo di destinazione.`)
  }

  // ── Conferma spostamento alleato/oggetto ──────────────────
  async function handleConfirmMoveAlly() {
    const { cardId, fromLocIdx, toLocIdx, actionIndex } = modeData
    const res = await exec(moveAllyOrItem, cardId, fromLocIdx, toLocIdx)
    if (!res?.error) {
      await exec(completeAction, actionIndex)
      resetMode()
    }
  }

  // ── Scontro ───────────────────────────────────────────────
  function handleVanquishSelectHero(heroId) {
    setModeData(prev => ({ ...prev, selectedHeroId: prev.selectedHeroId === heroId ? null : heroId }))
  }
  function handleVanquishToggleAlly(allyId) {
    setModeData(prev => {
      const ids = prev.selectedAllyIds || []
      return { ...prev, selectedAllyIds: ids.includes(allyId) ? ids.filter(i => i !== allyId) : [...ids, allyId] }
    })
  }
  async function handleConfirmVanquish() {
    const { selectedHeroId, selectedAllyIds, actionIndex } = modeData
    if (!selectedHeroId || !selectedAllyIds?.length) return
    const res = await exec(vanquish, selectedHeroId, selectedAllyIds)
    if (!res?.error) {
      await exec(completeAction, actionIndex)
      resetMode()
    }
  }

  function getHeroStrength(heroId) {
    const c = findCardFromAll(gameState, heroId)
    return c?.strength || 0
  }
  function getAllyStrength() {
    if (!myVillain || !modeData.selectedAllyIds) return 0
    return modeData.selectedAllyIds.reduce((sum, id) => {
      const c = myVillain.villainDeck.find(x => x.id === id)
      return sum + (c?.strength || 0)
    }, 0)
  }

  // ── Fato ─────────────────────────────────────────────────
  async function handleSelectFateTarget(targetPlayerId) {
    const { actionIndex } = modeData
    resetMode()
    await exec(startFate, targetPlayerId)
    await exec(completeAction, actionIndex)
  }

  // Primo click su una carta Fato → mostra conferma
  function handleFateCardClick(cardId) {
    setFatePendingCard(cardId)
  }

  // Conferma: effettivamente gioca la carta Fato
  async function handleConfirmFateCard() {
    const cardId = fatePendingCard
    if (!cardId || !gameState.pendingFate) return
    const { targetPlayerId } = gameState.pendingFate
    const targetP = gameState.players.find(p => p.id === targetPlayerId)
    const card    = VILLAINS[targetP?.villainId]?.fateDeck.find(c => c.id === cardId)
    setFatePendingCard(null)
    await exec(resolveFate, cardId)
    if (card?.type === 'fate_effect') await exec(placeFateCard, cardId, targetPlayerId, 0)
  }

  async function handlePlaceFateCard(locationIndex) {
    const pi = gameState.pendingInteraction
    if (!pi || pi.type !== 'place_fate_card') return
    const res = await exec(placeFateCard, pi.cardId, pi.targetPlayerId, locationIndex)
    if (!res?.error) {
      // Se è un fate_item con eroi nello stesso luogo → proponi assegnazione
      const targetP = gameState.players.find(p => p.id === pi.targetPlayerId)
      const card    = VILLAINS[targetP?.villainId]?.fateDeck.find(c => c.id === pi.cardId)
      if (card?.type === 'fate_item') {
        // Usa lo stato aggiornato per leggere il luogo
        const locHeroes = targetP?.board.locations[locationIndex]?.heroes || []
        if (locHeroes.length > 0) {
          setMode('assign_fate_item')
          setModeData({ itemCardId: pi.cardId, itemName: card.name, targetPlayerId: pi.targetPlayerId, locationIndex })
        }
      }
    }
  }

  async function handleAssignFateItem(heroCardId) {
    const { targetPlayerId } = modeData
    const targetP  = gameState.players.find(p => p.id === targetPlayerId)
    const heroCard = VILLAINS[targetP?.villainId]?.fateDeck.find(c => c.id === heroCardId)
    setModeData(prev => ({ ...prev, pendingHeroId: heroCardId, heroName: heroCard?.name || heroCardId }))
    setMode('assign_fate_item_confirm')
  }

  async function handleConfirmAssignFateItem() {
    const { itemCardId, targetPlayerId, pendingHeroId } = modeData
    await exec(assignFateItem, targetPlayerId, itemCardId, pendingHeroId)
    resetMode()
  }

  // ── Condizione fuori turno: step 1 — dichiara trigger ────
  async function handleDeclareCondition(cardId) {
    const res = await exec(declareConditionTrigger, cardId)
    if (!res?.error) setConditionDeclaring(cardId)
  }

  // ── Condizione fuori turno: step 2 — attiva ───────────────
  async function handleActivateCondition(cardId) {
    const res = await exec(playCondition, cardId)
    if (!res?.error) setConditionDeclaring(null)
  }

  // ── Banner stato turno ────────────────────────────────────
  function getTurnMessage() {
    if (actionError) return { text: `⚠️ ${actionError}`, cls: 'border-red-700/50 bg-red-950/30 text-red-300' }
    if (uiMsg)       return { text: `ℹ️ ${uiMsg}`,       cls: 'border-blue-700/50 bg-blue-950/30 text-blue-300' }
    if (phase === 'move') {
      if (stagedLocation !== null) {
        const loc = myVillain?.locations[stagedLocation]
        return { text: `📍 "${loc?.name}" selezionato. Conferma o scegli un altro.`, cls: 'border-yellow-700/50 bg-yellow-950/30 text-yellow-300' }
      }
      return { text: '📍 Scegli dove spostarti cliccando su un luogo della tua plancia.', cls: 'border-yellow-700/30 bg-yellow-950/20 text-yellow-400' }
    }
    if (phase === 'action') return { text: '⚡ Esegui le azioni disponibili, poi premi "Fine Turno".', cls: 'border-green-700/30 bg-green-950/20 text-green-400' }
    if (phase === 'fate_choice') return { text: '🔮 Scegli 1 carta Fato da giocare.', cls: 'border-purple-700/30 bg-purple-950/20 text-purple-400' }
    if (phase === 'fate_resolve') {
      const pi   = gameState.pendingInteraction
      const tP   = gameState.players.find(p => p.id === pi?.targetPlayerId)
      const card = VILLAINS[tP?.villainId]?.fateDeck.find(c => c.id === pi?.cardId)
      return { text: `🔮 Clicca un luogo sulla plancia di ${tP?.name || 'avversario'} per posizionare "${card?.name || '?'}".`, cls: 'border-purple-700/30 bg-purple-950/20 text-purple-400' }
    }
    return null
  }
  const turnMsg = isMyTurn ? getTurnMessage() : null

  // ── Condizioni in mano (fuori turno) ─────────────────────
  const myConditions = (!isMyTurn && myPlayer && myVillain)
    ? myPlayer.hand
        .map(id => myVillain.villainDeck.find(c => c.id === id))
        .filter(c => c?.type === 'condition')
    : []

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800
                         bg-gray-950/95 backdrop-blur sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-400 text-sm">← Home</button>
          <span className="font-display text-gray-500 text-xs">Stanza</span>
          <span className="font-display font-bold text-yellow-400 tracking-widest text-sm">{roomCode}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">Turno di:</span>
          <span className={`font-display font-bold text-sm ${isMyTurn ? 'text-yellow-400' : 'text-gray-300'}`}>
            {currentPlayer?.name}
            {isMyTurn && <span className="text-yellow-600"> (Tu)</span>}
          </span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider border border-gray-800 rounded px-1.5 py-0.5">
            {phase}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isMyTurn && gameState.undoSnapshot && !gameState.undoRequest && (
            <button onClick={() => exec(requestUndo)}
                    className="btn-secondary text-xs px-3 py-1.5 border-orange-700/50 text-orange-300 hover:border-orange-500">
              ↩ Annulla
            </button>
          )}
          {isMyTurn && phase === 'action' && (
            <button onClick={() => exec(endTurn)} className="btn-secondary text-xs px-3 py-1.5">
              Fine Turno →
            </button>
          )}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── COLONNA SINISTRA ─────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto divide-y divide-gray-800/60">

          {/* Banner turno */}
          {turnMsg && (
            <div className={`px-4 py-2 text-sm border-b ${turnMsg.cls} shrink-0`}>{turnMsg.text}</div>
          )}

          {/* Banner: richiesta undo in attesa (visibile al richiedente) */}
          {gameState.undoRequest && gameState.undoRequest.requestingPlayerId === myPlayerId && (
            <div className="px-4 py-2 text-sm border-b border-orange-700/50 bg-orange-950/30 text-orange-300 shrink-0">
              ↩ Richiesta di annullamento inviata — in attesa degli altri giocatori
              ({gameState.undoRequest.approvals?.length ?? 0}/{gameState.undoRequest.required})
            </div>
          )}

          {/* Modale: approvazione undo (visibile ai NON richiedenti) */}
          {gameState.undoRequest &&
           gameState.undoRequest.requestingPlayerId !== myPlayerId &&
           !gameState.undoRequest.approvals?.includes(myPlayerId) &&
           !gameState.undoRequest.denials?.includes(myPlayerId) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-gray-900 border border-orange-700/50 rounded-2xl p-6 max-w-sm w-full mx-4
                              flex flex-col gap-4 shadow-2xl">
                <div className="text-3xl text-center">↩</div>
                <h3 className="font-display text-orange-300 font-bold text-lg text-center">
                  Annulla Ultima Giocata
                </h3>
                <p className="text-gray-300 text-sm text-center">
                  <strong>{gameState.undoRequest.requestingPlayerName}</strong> vuole annullare l'ultima giocata.<br/>
                  Sei d'accordo?
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => exec(respondUndo, false)} className="btn-secondary text-sm px-5">
                    ✗ Rifiuta
                  </button>
                  <button onClick={() => exec(respondUndo, true)}  className="btn-primary text-sm px-5">
                    ✓ Approva
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Plance avversari ── */}
          <section className="p-4 flex flex-col gap-3 bg-gray-950/40">
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest">Avversari</p>
            {opponents.length === 0 && (
              <p className="text-gray-700 text-xs italic">Nessun avversario ancora connesso.</p>
            )}
            {opponents.map(opp => {
              const isFateTarget =
                isMyTurn && phase === 'fate_resolve' &&
                gameState.pendingInteraction?.type === 'place_fate_card' &&
                gameState.pendingInteraction?.targetPlayerId === opp.id
              return (
                <PlayerBoard key={opp.id} player={opp} isMyBoard={false} isMyTurn={false}
                  phase={phase} actionQueue={[]} stagedLocation={null} selectedCardId={null}
                  onLocationClick={isFateTarget ? handlePlaceFateCard : undefined}
                />
              )
            })}
          </section>

          {/* ── Separatore ── */}
          <div className="flex items-center gap-2 px-4 py-1 bg-gray-900/80 shrink-0">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-[10px] font-display text-gray-600 uppercase tracking-widest">La tua plancia</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* ── Mia plancia ── */}
          {myPlayer && (
            <section className="p-4 flex flex-col gap-3">

              {/* Pannello conferma movimento villain */}
              {isMyTurn && phase === 'move' && stagedLocation !== null && (
                <ConfirmPanel
                  message={`Sposta il villain in: "${myVillain?.locations[stagedLocation]?.name}"?`}
                  sub="Puoi ancora cambiare cliccando un altro luogo."
                  onConfirm={handleConfirmMove}
                  onCancel={() => setStagedLocation(null)}
                />
              )}

              {/* Pannello conferma gioca alleato/oggetto */}
              {isMyTurn && mode === 'play_ally_confirm' && (
                <ConfirmPanel
                  message={`Gioca "${modeData.cardName}" in "${modeData.targetLocName}"?`}
                  onConfirm={handleConfirmPlayAlly}
                  onCancel={() => { setMode('play_ally_location'); setModeData(prev => ({ ...prev, targetLocIdx: null, targetLocName: null })) }}
                  confirmLabel="✓ Gioca"
                />
              )}

              {/* Pannello conferma sposta alleato/oggetto */}
              {isMyTurn && mode === 'move_ally_confirm' && (
                <ConfirmPanel
                  message={`Confermi di voler spostare "${modeData.cardName}" da "${modeData.fromLocName}" a "${modeData.toLocName}"?`}
                  onConfirm={handleConfirmMoveAlly}
                  onCancel={() => { setMode('move_ally_pick'); setModeData(prev => ({ ...prev, cardId: null, fromLocIdx: null })) }}
                  confirmLabel="✓ Sposta"
                />
              )}

              <PlayerBoard
                player={myPlayer}
                isMyBoard={true}
                isMyTurn={isMyTurn}
                phase={phase}
                actionQueue={actionQueue}
                stagedLocation={stagedLocation}
                activeMode={mode}
                selectedCardId={modeData.cardId || null}
                onLocationClick={isMyTurn ? handleMyLocationClick : undefined}
                onActionClick={isMyTurn && phase === 'action' ? handleActionClick : undefined}
                onHandCardClick={isMyTurn ? handleHandCardClick : undefined}
                onAllyItemClick={isMyTurn && mode === 'move_ally_pick' ? handleAllyItemClick : undefined}
              />

              {/* Panel: modalità scarto */}
              {isMyTurn && mode === 'discard_mode' && (
                <div className="bg-orange-950/40 border border-orange-700/50 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="font-display text-orange-300 font-bold text-sm">🗑️ Scarta Carte</h3>
                  {modeData.pendingCardId ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-orange-200">
                        Sei sicuro di scartare <strong>"{modeData.pendingCardName}"</strong>?
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setModeData(prev => ({ ...prev, pendingCardId: null, pendingCardName: null }))}
                                className="btn-secondary text-xs px-3">Annulla</button>
                        <button onClick={handleConfirmDiscard} className="btn-primary text-xs px-4">✓ Scarta</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-400">Clicca una carta dalla mano per selezionarla da scartare.</p>
                  )}
                  <button onClick={handleEndDiscard} className="btn-secondary text-xs px-4 self-start">
                    ✓ Fine Scarto
                  </button>
                </div>
              )}

              {/* Panel: selezione target Fato */}
              {isMyTurn && mode === 'fate_target' && (
                <div className="bg-purple-950/40 border border-purple-700/50 rounded-xl p-4">
                  <h3 className="font-display text-purple-300 font-bold mb-3 text-sm">🔮 Scegli l'avversario da colpire</h3>
                  <div className="flex gap-2 flex-wrap">
                    {opponents.map(opp => (
                      <button key={opp.id} onClick={() => handleSelectFateTarget(opp.id)} className="btn-fate text-xs px-4">
                        {VILLAIN_EMOJI[opp.villainId] || '❓'} {opp.name}
                      </button>
                    ))}
                    <button onClick={resetMode} className="btn-secondary text-xs px-3">Annulla</button>
                  </div>
                </div>
              )}

              {/* Panel: scontro */}
              {isMyTurn && mode === 'vanquish_mode' && (
                <VanquishPanel
                  myVillain={myVillain}
                  heroes={myLocState?.heroes || []}
                  allies={myLocState?.allies || []}
                  selectedHeroId={modeData.selectedHeroId}
                  selectedAllyIds={modeData.selectedAllyIds || []}
                  allyStrength={getAllyStrength()}
                  heroStrength={modeData.selectedHeroId ? getHeroStrength(modeData.selectedHeroId) : 0}
                  onSelectHero={handleVanquishSelectHero}
                  onToggleAlly={handleVanquishToggleAlly}
                  onConfirm={handleConfirmVanquish}
                  onCancel={resetMode}
                  findCard={id => findCardFromAll(gameState, id)}
                />
              )}
            </section>
          )}

          {/* ── Fate choice ── */}
          {isMyTurn && phase === 'fate_choice' && gameState.pendingFate && (
            <section className="p-4 shrink-0">
              <div className="bg-purple-950/40 border border-purple-700/50 rounded-xl p-4">
                <h3 className="font-display text-purple-300 font-bold mb-3 text-sm">
                  🔮 Scegli 1 carta — l'altra torna allo scarto del Fato
                </h3>

                {/* Conferma prima di giocare */}
                {fatePendingCard ? (() => {
                  const target = gameState.players.find(p => p.id === gameState.pendingFate.targetPlayerId)
                  const card   = VILLAINS[target?.villainId]?.fateDeck.find(c => c.id === fatePendingCard)
                  return (
                    <ConfirmPanel
                      message={`Confermi di giocare la carta "${card?.name || fatePendingCard}"?`}
                      onConfirm={handleConfirmFateCard}
                      onCancel={() => setFatePendingCard(null)}
                      confirmLabel="✓ Gioca"
                    />
                  )
                })() : (
                  <div className="flex gap-3 flex-wrap">
                    {gameState.pendingFate.cards.map(cardId => {
                      const target = gameState.players.find(p => p.id === gameState.pendingFate.targetPlayerId)
                      const card   = VILLAINS[target?.villainId]?.fateDeck.find(c => c.id === cardId)
                      if (!card) return null
                      return (
                        <div key={cardId} className="flex flex-col items-center gap-2">
                          <Card card={card} onClick={() => handleFateCardClick(cardId)} />
                          <button onClick={() => handleFateCardClick(cardId)} className="btn-fate text-xs px-4">
                            Gioca questa
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Assegna oggetto fato ── */}
          {(mode === 'assign_fate_item' || mode === 'assign_fate_item_confirm') && (
            <section className="p-4 shrink-0">
              <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-4">
                {mode === 'assign_fate_item' ? (
                  <>
                    <h3 className="font-display text-amber-300 font-bold mb-3 text-sm">
                      📦 Assegna "{modeData.itemName}" a un Eroe
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {(() => {
                        const targetP  = gameState.players.find(p => p.id === modeData.targetPlayerId)
                        const tVillain = VILLAINS[targetP?.villainId]
                        const loc      = targetP?.board.locations[modeData.locationIndex]
                        return (loc?.heroes || []).map(heroId => {
                          const heroCard = tVillain?.fateDeck.find(c => c.id === heroId)
                          return (
                            <button key={heroId} onClick={() => handleAssignFateItem(heroId)}
                                    className="btn-secondary text-xs px-3">
                              🛡️ {heroCard?.name || heroId} (F:{heroCard?.strength ?? '?'})
                            </button>
                          )
                        })
                      })()}
                      <button onClick={resetMode} className="btn-secondary text-xs px-3">Salta</button>
                    </div>
                  </>
                ) : (
                  <ConfirmPanel
                    message={`Confermi di assegnare "${modeData.itemName}" a "${modeData.heroName}"?`}
                    onConfirm={handleConfirmAssignFateItem}
                    onCancel={() => setMode('assign_fate_item')}
                    confirmLabel="✓ Assegna"
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Condizioni fuori turno ── */}
          {myConditions.length > 0 && (
            <section className="p-4 shrink-0">
              <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4">
                <h3 className="font-display text-rose-300 font-bold mb-1 text-sm">
                  🎴 Condizioni — turno di {currentPlayer?.name}
                </h3>
                <p className="text-[11px] text-rose-400 mb-3">
                  Verifica prima se la condizione si è verificata, poi attivala.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {myConditions.map(card => {
                    const isTriggered = myPlayer?.conditionsTriggered?.includes(card.id)
                    return (
                      <div key={card.id} className="flex flex-col items-center gap-1">
                        <Card card={card} small selected={conditionDeclaring === card.id || isTriggered} />
                        {!isTriggered ? (
                          <button onClick={() => handleDeclareCondition(card.id)}
                                  className="btn-secondary text-[10px] px-3 py-1">
                            📣 Dichiara Trigger
                          </button>
                        ) : (
                          <button onClick={() => handleActivateCondition(card.id)}
                                  className="btn-fate text-[10px] px-3 py-1">
                            ✓ Attiva Condizione
                          </button>
                        )}
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
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest">Log di Gioco</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
            {(gameState.log || []).length === 0 && (
              <p className="text-gray-700 text-xs italic mt-2">Il log è vuoto.</p>
            )}
            {(gameState.log || []).map(entry => <LogEntry key={entry.id} entry={entry} />)}
          </div>
          <div className="border-t border-gray-800 px-3 py-3 shrink-0 flex flex-col gap-2">
            <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest mb-1">Giocatori</p>
            {gameState.players.map(p => {
              const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === p.id
              return (
                <div key={p.id}
                     className={['flex items-center justify-between text-xs rounded-lg px-2 py-1.5',
                       isCurrentTurn ? 'bg-yellow-950/40 border border-yellow-700/40' : 'bg-gray-900/50'].join(' ')}>
                  <div className="flex items-center gap-1.5">
                    <span>{VILLAIN_EMOJI[p.villainId] || '❓'}</span>
                    <span className={isCurrentTurn ? 'text-yellow-300 font-semibold' : 'text-gray-400'}>{p.name}</span>
                    {p.id === myPlayerId && <span className="text-[9px] text-gray-600">(Tu)</span>}
                  </div>
                  <span className="power-badge text-[10px] px-1.5 py-0.5">⚡{p.power ?? 0}</span>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Sub-componenti ────────────────────────────────────────

function ConfirmPanel({ message, sub, onConfirm, onCancel, confirmLabel = '✓ Conferma' }) {
  return (
    <div className="flex items-center gap-3 bg-yellow-950/40 border border-yellow-700/50 rounded-xl px-4 py-3">
      <div className="flex-1">
        <p className="text-xs text-yellow-300 font-display font-bold">{message}</p>
        {sub && <p className="text-[11px] text-yellow-600 mt-0.5">{sub}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Annulla</button>
        <button onClick={onConfirm} className="btn-primary text-xs px-4 py-1.5">{confirmLabel}</button>
      </div>
    </div>
  )
}

function VanquishPanel({ myVillain, heroes, allies, selectedHeroId, selectedAllyIds,
  allyStrength, heroStrength, onSelectHero, onToggleAlly, onConfirm, onCancel, findCard }) {
  const canConfirm = selectedHeroId && selectedAllyIds.length > 0 && allyStrength >= heroStrength
  return (
    <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="font-display text-red-300 font-bold text-sm">⚔️ Scontro</h3>
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">1. Eroe da sconfiggere</p>
        <div className="flex gap-2 flex-wrap">
          {heroes.map(heroId => {
            const card = findCard(heroId)
            const sel  = selectedHeroId === heroId
            return (
              <button key={heroId} onClick={() => onSelectHero(heroId)}
                      className={['text-xs px-3 py-1.5 rounded-lg border font-display transition-all',
                        sel ? 'bg-red-700 border-red-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-600'].join(' ')}>
                🛡️ {card?.name || heroId} (F:{card?.strength ?? '?'})
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">2. Alleati da usare</p>
        <div className="flex gap-2 flex-wrap">
          {allies.map(allyId => {
            const card = myVillain?.villainDeck.find(c => c.id === allyId)
            const sel  = selectedAllyIds.includes(allyId)
            return (
              <button key={allyId} onClick={() => onToggleAlly(allyId)}
                      className={['text-xs px-3 py-1.5 rounded-lg border font-display transition-all',
                        sel ? 'bg-blue-700 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-600'].join(' ')}>
                ⚔️ {card?.name || allyId} (F:{card?.strength ?? '?'})
              </button>
            )
          })}
        </div>
      </div>
      {selectedHeroId && (
        <p className={['text-xs font-display font-bold', allyStrength >= heroStrength ? 'text-green-400' : 'text-red-400'].join(' ')}>
          Forza Alleati: {allyStrength} vs Forza Eroe: {heroStrength}
          {allyStrength >= heroStrength ? ' ✓ Sufficiente' : ' ✗ Insufficiente'}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs px-3">Annulla</button>
        <button onClick={onConfirm} disabled={!canConfirm}
                className={['text-xs px-4 py-1.5 rounded-lg font-display font-bold transition-all',
                  canConfirm ? 'btn-primary' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'].join(' ')}>
          ✓ Conferma Scontro
        </button>
      </div>
    </div>
  )
}

const LOG_COLORS = {
  system: 'text-gray-500', info: 'text-gray-400', move: 'text-blue-400',
  action: 'text-green-400', fate: 'text-purple-400', win: 'text-yellow-300 font-bold',
}
function LogEntry({ entry }) {
  return (
    <p className={`text-[11px] leading-snug py-0.5 border-b border-gray-900 ${LOG_COLORS[entry.type] || 'text-gray-400'}`}>
      {entry.message}
    </p>
  )
}
