// ============================================================
// Game.jsx — Componente principale della partita
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useGame }    from '../hooks/useGame.js'
import VillainSelect  from './VillainSelect.jsx'
import PlayerBoard    from './PlayerBoard.jsx'
import Card           from './Card.jsx'
import { VILLAINS, ACTION_LABELS, ACTION_COLORS }   from '../data/villains.js'

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
  const [fatePendingCard, setFatePendingCard] = useState(null)
  // Condizioni: dati locali per il flusso multi-step
  const [condEffectData,  setCondEffectData]  = useState({})
  const [logOpen,         setLogOpen]         = useState(false)

  const isJoining = searchParams.get('join') === '1'
  const joinName  = searchParams.get('name') || ''

  const {
    gameState, myPlayerId, myPlayer, isMyTurn, isHost,
    currentPlayer, loading, error,
    joinGame, selectVillain, startGame,
    moveVillain, gainPower, playCard, playCardToLocation,
    discardCard, moveAllyOrItem, moveCorvoAlly, vanquish,
    startFate, resolveFate, placeFateCard, placeRevealedHero,
    assignFateItem,
    requestConditionActivation, respondConditionActivation,
    conditionDiscardCard, conditionDefeatHero, conditionDiscardOpponentItem,
    conditionRecoverCard, conditionPlayAllyFree, conditionOssessioneResolve,
    conditionFateOneCard, conditionSkipEffect,
    requestUndo, respondUndo,
    completeAction, endTurn,
    resolveFilippoDiscard, resolveReStefanoMove, resolveReUbertoMove,
    resolveOnceuponatime, resolveFormadiDrago,
  } = useGame(roomCode)

  const [corvoUsed,    setCorvoUsed]    = useState(false)
  const [corvoDestIdx, setCorvoDestIdx] = useState(null)

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
    setCondEffectData({})
    setStagedLocation(null)
    setActionError(null)
    setUiMsg(null)
    setFatePendingCard(null)
    setCorvoUsed(false)
    setCorvoDestIdx(null)
  }, [gameState?.currentPlayerIndex, gameState?.phase])

  // Sincronizza mode con pendingFateReveal (effetto Aurora)
  useEffect(() => {
    const rev = gameState?.pendingFateReveal
    if (rev && rev.actorPlayerId === myPlayerId) {
      setMode('aurora_place_hero')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.pendingFateReveal?.heroCardId, gameState?.pendingFateReveal?.actorPlayerId, myPlayerId])

  // Sincronizza mode con pendingConditionEffect
  useEffect(() => {
    const effect = gameState?.pendingConditionEffect
    if (effect && effect.playerId === myPlayerId) {
      if      (effect.type === 'discard_n_cards')  setMode('cond_discard_cards')
      else if (effect.type === 'play_ally_free')    setMode('cond_play_ally_pick')
      else if (effect.type === 'fate_one_card')     setMode('cond_fate_one_card')
      else                                          setMode(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.pendingConditionEffect?.type, gameState?.pendingConditionEffect?.playerId, myPlayerId])

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

  // Corvo (Malefica): trova l'indice del luogo dove si trova il Corvo
  const corvoLocIdx = myPlayer
    ? myPlayer.board.locations.findIndex(loc => loc.allies.includes('mal_a_cor'))
    : -1
  const corvoIsOnField = corvoLocIdx >= 0

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
      const isMaleficent = myPlayer.villainId === 'maleficent'
      const hasMovables = myPlayer.board.locations.some(
        loc => loc.allies.length > 0 || loc.items.length > 0 ||
               (isMaleficent && loc.curses.length > 0)
      )
      if (!hasMovables) {
        setActionError('Nessun Alleato, Oggetto' + (isMaleficent ? ' o Maledizione' : '') + ' presente nel Reame da spostare.')
        await exec(completeAction, actionIndex)
        return
      }
      setMode('move_ally_pick')
      setModeData({ actionIndex })
      setUiMsg(isMaleficent
        ? 'Clicca su un Alleato, Oggetto o Maledizione nella plancia per selezionarlo.'
        : 'Clicca su un Alleato o Oggetto nella plancia per selezionarlo.')

    } else if (action.type === 'vanquish') {
      const allHeroes = myPlayer.board.locations.flatMap(loc => loc.heroes)
      if (allHeroes.length === 0) {
        setActionError('Scontro non applicabile: nessun Eroe nel tuo Reame.')
        return
      }
      const allAllies = myPlayer.board.locations.flatMap(loc => loc.allies)
      if (allAllies.length === 0) {
        setActionError('Scontro non applicabile: nessun Alleato nel tuo Reame.')
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
      const allVCards = myVillain ? [...myVillain.villainDeck, ...myVillain.fateDeck] : []
      const activatable = myPlayer.board.locations.flatMap(loc =>
        [...loc.allies, ...loc.items].map(id => allVCards.find(c => c.id === id)).filter(c => c?.effect?.includes('[Attiva]'))
      )
      if (activatable.length === 0) {
        setActionError('Non ci sono carte attivabili nel reame.')
        await exec(completeAction, actionIndex)
      } else {
        setMode('activate_mode')
        setModeData({ actionIndex, activatable })
      }

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
      if (card.type === 'ally' || card.type === 'item' || card.type === 'curse' || card.type === 'wicket') {
        setMode('play_ally_location')
        setModeData(prev => ({ ...prev, cardId, cardName: card.name }))
        setUiMsg(`Scegli il luogo dove giocare "${card.name}". Clicca su un luogo della tua plancia.`)
        return
      }
      // Effetti → chiedi conferma prima di giocare
      setModeData(prev => ({ ...prev, cardId, cardName: card.name }))
      setMode('play_effect_confirm')

    } else if (mode === 'discard_mode') {
      setModeData(prev => ({ ...prev, pendingCardId: cardId, pendingCardName: card.name }))
    }
  }

  // ── Conferma gioca effetto ────────────────────────────────
  async function handleConfirmPlayEffect() {
    const cardId = modeData.cardId
    const res = await exec(playCard, cardId)
    if (!res?.error) {
      // Forma di Drago: richiede selezione eroe da sconfiggere
      if (cardId && cardId.startsWith('mal_e_dra')) {
        setMode('forma_drago_defeat')
        setModeData(prev => ({ ...prev }))
        return
      }
      if (modeData.isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null) }
      else await exec(completeAction, modeData.actionIndex)
      resetMode()
    }
  }

  // ── Scarto ───────────────────────────────────────────────
  async function handleConfirmDiscard() {
    const res = await exec(discardCard, modeData.pendingCardId)
    if (!res?.error) setModeData(prev => ({ ...prev, pendingCardId: null, pendingCardName: null }))
  }

  async function handleEndDiscard() {
    if (modeData.isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null); resetMode(); return }
    await exec(completeAction, modeData.actionIndex)
    resetMode()
  }

  // ── Click su luogo (mia plancia) ─────────────────────────
  async function handleMyLocationClick(idx) {
    if (mode === 'corvo_dest_pick') {
      if (idx === corvoLocIdx) { setActionError('Scegli un luogo diverso da quello attuale del Corvo.'); return }
      const res = await exec(moveCorvoAlly, idx)
      if (!res?.error) { setCorvoDestIdx(idx); setMode('corvo_action_pick'); setUiMsg(null) }
      return
    }
    if (isMyTurn && phase === 'move') {
      if (idx !== myPlayer.currentLocation || myPlayer?.svanireActive) setStagedLocation(idx)
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
    // Condizione: piazza alleato gratuito
    if (mode === 'cond_play_ally_location') handleConditionAllyLocation(idx)
    // Condizione: Ossessione — gioca eroe trovato
    if (mode === 'cond_ossessione_location') handleConditionOssessioneLocation(idx)
  }

  // ── Conferma gioca alleato/oggetto in luogo ───────────────
  async function handleConfirmPlayAlly() {
    const res = await exec(playCardToLocation, modeData.cardId, modeData.targetLocIdx)
    if (!res?.error) {
      if (modeData.isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null) }
      else await exec(completeAction, modeData.actionIndex)
      resetMode()
    }
  }

  // ── Click su alleato/oggetto/maledizione nella plancia ───
  function handleAllyItemClick(cardId, fromLocIdx) {
    if (mode !== 'move_ally_pick' && mode !== 'move_ally_dest') return
    // Reclicca la stessa carta in mode dest → deseleziona
    if (mode === 'move_ally_dest' && modeData.cardId === cardId && modeData.fromLocIdx === fromLocIdx) {
      setMode('move_ally_pick')
      setModeData(prev => ({ ...prev, cardId: null, cardName: null, fromLocIdx: null, fromLocName: null }))
      const isMaleficent = myPlayer?.villainId === 'maleficent'
      setUiMsg(isMaleficent
        ? 'Clicca su un Alleato, Oggetto o Maledizione nella plancia per selezionarlo.'
        : 'Clicca su un Alleato o Oggetto nella plancia per selezionarlo.')
      return
    }
    const allCards = myVillain ? [...myVillain.villainDeck, ...myVillain.fateDeck] : []
    const card     = allCards.find(c => c.id === cardId)
    const fromLocName = myVillain?.locations[fromLocIdx]?.name || `Luogo ${fromLocIdx + 1}`
    setMode('move_ally_dest')
    setModeData(prev => ({ ...prev, cardId, cardName: card?.name || cardId, fromLocIdx, fromLocName }))
    setUiMsg(`"${card?.name || cardId}" selezionato. Clicca il luogo di destinazione (o reclicca la carta per deselezionare).`)
  }

  // ── Aurora: piazza eroe rivelato ─────────────────────────
  async function handleAuroraPlaceHero(locationIndex) {
    await exec(placeRevealedHero, locationIndex)
  }

  // ── Corvo: esegui azione al luogo di destinazione ────────
  async function handleCorvoActionClick(action) {
    const isMaleficent = myPlayer?.villainId === 'maleficent'
    const doneCorvo = () => { setCorvoUsed(true); setCorvoDestIdx(null); resetMode() }

    if (action.type === 'gain_power') {
      await exec(gainPower, action.value)
      doneCorvo()
    } else if (action.type === 'play_card') {
      setMode('play_card')
      setModeData({ isCorvoAction: true })
      setUiMsg('Corvo — Seleziona una carta dalla mano da giocare.')
    } else if (action.type === 'discard') {
      setMode('discard_mode')
      setModeData({ isCorvoAction: true })
    } else if (action.type === 'move') {
      const hasMovables = myPlayer.board.locations.some(
        loc => loc.allies.length > 0 || loc.items.length > 0 || (isMaleficent && loc.curses.length > 0)
      )
      if (!hasMovables) {
        setActionError('Nessun Alleato' + (isMaleficent ? ', Oggetto o Maledizione' : ' o Oggetto') + ' da spostare.')
        return
      }
      setMode('move_ally_pick')
      setModeData({ isCorvoAction: true })
      setUiMsg(isMaleficent
        ? 'Corvo — Clicca su un Alleato, Oggetto o Maledizione da spostare.'
        : 'Corvo — Clicca su un Alleato o Oggetto da spostare.')
    } else if (action.type === 'vanquish') {
      const allHeroes = myPlayer.board.locations.flatMap(loc => loc.heroes)
      if (allHeroes.length === 0) { setActionError('Scontro non applicabile: nessun Eroe nel Reame.'); return }
      const allAllies = myPlayer.board.locations.flatMap(loc => loc.allies)
      if (allAllies.length === 0) { setActionError('Scontro non applicabile: nessun Alleato nel Reame.'); return }
      setMode('vanquish_mode')
      setModeData({ isCorvoAction: true, selectedHeroId: null, selectedAllyIds: [] })
    } else if (action.type === 'activate') {
      const allVCards = myVillain ? [...myVillain.villainDeck, ...myVillain.fateDeck] : []
      const activatable = myPlayer.board.locations.flatMap(loc =>
        [...loc.allies, ...loc.items].map(id => allVCards.find(c => c.id === id)).filter(c => c?.effect?.includes('[Attiva]'))
      )
      if (activatable.length === 0) {
        setActionError('Non ci sono carte attivabili nel reame.')
        doneCorvo()
      } else {
        setMode('activate_mode')
        setModeData({ isCorvoAction: true, activatable })
      }
    } else {
      doneCorvo()
    }
  }

  // ── Attiva: seleziona e conferma carta ──────────────────
  function handleActivateCard(cardId) {
    const card = modeData.activatable?.find(c => c.id === cardId)
    setModeData(prev => ({ ...prev, selectedActivateId: cardId, selectedActivateName: card?.name || cardId, selectedActivateEffect: card?.effect || '' }))
    setMode('activate_confirm')
  }

  async function handleConfirmActivate() {
    if (modeData.isCorvoAction) {
      setCorvoUsed(true)
      setCorvoDestIdx(null)
    } else {
      await exec(completeAction, modeData.actionIndex)
    }
    resetMode()
  }

  // ── Conferma spostamento alleato/oggetto ──────────────────
  async function handleConfirmMoveAlly() {
    const { cardId, fromLocIdx, toLocIdx, actionIndex, isCorvoAction } = modeData
    const res = await exec(moveAllyOrItem, cardId, fromLocIdx, toLocIdx)
    if (!res?.error) {
      if (isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null) }
      else await exec(completeAction, actionIndex)
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
    const { selectedHeroId, selectedAllyIds, actionIndex, isCorvoAction } = modeData
    if (!selectedHeroId || !selectedAllyIds?.length) return
    const res = await exec(vanquish, selectedHeroId, selectedAllyIds)
    if (!res?.error) {
      if (isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null) }
      else await exec(completeAction, actionIndex)
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
      const targetP = gameState.players.find(p => p.id === pi.targetPlayerId)
      const card    = VILLAINS[targetP?.villainId]?.fateDeck.find(c => c.id === pi.cardId)

      if (card?.type === 'fate_item') {
        const locHeroes = targetP?.board.locations[locationIndex]?.heroes || []
        const isMandatory = card.effect?.includes('Assegna a un Eroe')
        if (isMandatory || locHeroes.length > 0) {
          setMode('assign_fate_item')
          setModeData({ itemCardId: pi.cardId, itemName: card.name, targetPlayerId: pi.targetPlayerId, locationIndex, isMandatory })
          return
        }
      }

      // Principe Filippo — chiedi se scartare alleati nel luogo
      if (pi.cardId === 'fmal_filippo' && targetP?.villainId === 'maleficent') {
        const loc = targetP?.board.locations[locationIndex]
        if (loc && loc.allies.length > 0) {
          setMode('filippo_discard_choice')
          setModeData({ filippoData: { targetPlayerId: pi.targetPlayerId, locationIndex, allyCount: loc.allies.length } })
          return
        }
      }

      // Re Stefano — chiedi dove spostare Malefica
      if (pi.cardId === 'fmal_stefano' && targetP?.villainId === 'maleficent') {
        setMode('re_stefano_move')
        setModeData({ stefanoData: { targetPlayerId: pi.targetPlayerId } })
        return
      }

      // Re Uberto — chiedi quale alleato spostare
      if (pi.cardId === 'fmal_uberto' && targetP?.villainId === 'maleficent') {
        const adjacentIndices = [locationIndex - 1, locationIndex + 1].filter(
          i => i >= 0 && i < (targetP?.board.locations.length || 0)
        )
        const mVillain = VILLAINS['maleficent']
        const alliesInAdj = adjacentIndices.flatMap(adjIdx =>
          (targetP?.board.locations[adjIdx]?.allies || []).map(allyId => ({
            allyId,
            fromLocIdx: adjIdx,
            allyName: mVillain?.villainDeck.find(c => c.id === allyId)?.name || allyId,
          }))
        )
        if (alliesInAdj.length > 0) {
          setMode('re_uberto_move')
          setModeData({ ubertoData: { targetPlayerId: pi.targetPlayerId, toLocIdx: locationIndex, allies: alliesInAdj } })
          return
        }
      }

      // C'era una Volta in un Sogno — se più bersagli, chiedi quale
      if ((pi.cardId === 'fmal_sogno_1' || pi.cardId === 'fmal_sogno_2') && targetP?.villainId === 'maleficent') {
        const mVillain = VILLAINS['maleficent']
        const validCurses = (targetP?.board.locations || []).reduce((acc, loc, idx) => {
          if (loc.curses.length > 0 && loc.heroes.length > 0) {
            loc.curses.forEach(cId => {
              acc.push({
                curseId: cId,
                curseName: mVillain?.villainDeck.find(c => c.id === cId)?.name || cId,
                locIdx: idx,
                locName: mVillain?.locations[idx]?.name || `Luogo ${idx + 1}`,
              })
            })
          }
          return acc
        }, [])
        if (validCurses.length > 1) {
          setMode('sogno_choose_curse')
          setModeData({ sognoData: { targetPlayerId: pi.targetPlayerId, validCurses } })
          return
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

  // ── Condizione: richiedi attivazione (turno avversario) ──
  async function handleRequestCondition(cardId) {
    await exec(requestConditionActivation, cardId)
  }

  // ── Condizione: risposta avversario (conferma / nega) ─────
  async function handleRespondCondition(approved) {
    await exec(respondConditionActivation, approved)
  }

  // ── Condizione effect: scarta una carta (Tirannia) ────────
  async function handleConditionDiscardCard(cardId) {
    await exec(conditionDiscardCard, cardId)
  }

  // ── Condizione effect: sconfiggi Eroe ≤4 (Malignità) ─────
  async function handleConditionDefeatHero(heroCardId) {
    await exec(conditionDefeatHero, heroCardId)
  }

  // ── Condizione effect: scarta oggetto avversario (Jafar) ──
  async function handleConditionDiscardItem(itemCardId, targetPlayerId, locationIndex) {
    await exec(conditionDiscardOpponentItem, itemCardId, targetPlayerId, locationIndex)
  }

  // ── Condizione effect: recupera carta da scarti (Jafar) ───
  async function handleConditionRecoverCard(cardId) {
    await exec(conditionRecoverCard, cardId)
  }

  // ── Condizione effect: gioca alleato gratis ───────────────
  async function handleConditionAllyPicked(allyCardId) {
    setCondEffectData(prev => ({ ...prev, allyCardId }))
    setMode('cond_play_ally_location')
  }
  async function handleConditionAllyLocation(locationIndex) {
    const res = await exec(conditionPlayAllyFree, condEffectData.allyCardId, locationIndex)
    if (!res?.error) { setMode(null); setCondEffectData({}) }
  }

  // ── Condizione effect: Ossessione ─────────────────────────
  async function handleConditionOssessionePlay() {
    setMode('cond_ossessione_location')
  }
  async function handleConditionOssessioneLocation(locationIndex) {
    const res = await exec(conditionOssessioneResolve, true, locationIndex)
    if (!res?.error) { setMode(null); setCondEffectData({}) }
  }
  async function handleConditionOssessioneDiscard() {
    const res = await exec(conditionOssessioneResolve, false, null)
    if (!res?.error) { setMode(null); setCondEffectData({}) }
  }

  // ── Condizione effect: Fato singolo (Ursula Inganno) ──────
  async function handleConditionFateOneCardLocation(locationIndex) {
    const res = await exec(conditionFateOneCard, locationIndex)
    if (!res?.error) { setMode(null); setCondEffectData({}) }
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
          {isMyTurn && gameState.undoSnapshot && !gameState.undoRequest && !gameState.fateDoneThisTurn && (
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
          <button onClick={() => setLogOpen(o => !o)}
                  className="btn-secondary text-xs px-3 py-1.5 border-gray-700 text-gray-400">
            {logOpen ? '📋 ✕ Log' : '📋 Log'}
          </button>
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

          {/* Modale: conferma condizione (visibile al giocatore IN TURNO) */}
          {gameState.pendingConditionActivation && isMyTurn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-gray-900 border border-rose-700/50 rounded-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4 shadow-2xl">
                <div className="text-3xl text-center">🎴</div>
                <h3 className="font-display text-rose-300 font-bold text-lg text-center">Conferma Condizione</h3>
                <p className="text-gray-300 text-sm text-center">
                  <strong>{gameState.players.find(p => p.id === gameState.pendingConditionActivation.playerId)?.name}</strong>
                  {' '}vuole attivare <strong>"{gameState.pendingConditionActivation.cardName}"</strong>.
                </p>
                {(() => {
                  const owner = gameState.players.find(p => p.id === gameState.pendingConditionActivation.playerId)
                  const v = VILLAINS[owner?.villainId]
                  const card = v?.villainDeck.find(c => c.id === gameState.pendingConditionActivation.cardId)
                  return card?.effect ? (
                    <p className="text-gray-400 text-xs text-center italic bg-gray-800/50 rounded-lg px-3 py-2">{card.effect}</p>
                  ) : null
                })()}
                <p className="text-gray-500 text-xs text-center">La condizione descritta si è verificata?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => handleRespondCondition(false)} className="btn-secondary text-sm px-5">✗ No</button>
                  <button onClick={() => handleRespondCondition(true)}  className="btn-primary text-sm px-5">✓ Sì</button>
                </div>
              </div>
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
              // Condizione: Inganno Ursula — piazza carta fato sull'avversario
              const isConditionFateTarget =
                mode === 'cond_fate_one_card' &&
                gameState.pendingConditionEffect?.playerId === myPlayerId &&
                gameState.pendingConditionEffect?.targetPlayerId === opp.id
              // Aurora: piazza eroe rivelato nel Reame di Malefica
              const isAuroraTarget =
                mode === 'aurora_place_hero' &&
                gameState.pendingFateReveal?.actorPlayerId === myPlayerId &&
                gameState.pendingFateReveal?.targetPlayerId === opp.id
              const oppClickHandler = isFateTarget ? handlePlaceFateCard
                : isConditionFateTarget ? handleConditionFateOneCardLocation
                : isAuroraTarget ? handleAuroraPlaceHero
                : undefined
              return (
                <div key={opp.id} className="flex flex-col gap-2">
                  <PlayerBoard player={opp} isMyBoard={false} isMyTurn={false}
                    phase={phase} actionQueue={[]} stagedLocation={null} selectedCardId={null}
                    onLocationClick={oppClickHandler}
                  />
                  {/* Flora: mostra mano di Malefica agli avversari */}
                  {opp.floraActive && opp.villainId === 'maleficent' && (
                    <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl px-4 py-3 flex flex-col gap-2">
                      <p className="text-[10px] font-display text-emerald-500 uppercase tracking-wider">🌿 Flora — Mano di {opp.name} (carte scoperte)</p>
                      <div className="flex gap-2 flex-wrap">
                        {opp.hand.map(cardId => {
                          const card = VILLAINS['maleficent']?.villainDeck.find(c => c.id === cardId)
                          return card ? <Card key={cardId} card={card} small showEffect={false} /> : null
                        })}
                        {opp.hand.length === 0 && <p className="text-xs text-gray-600 italic">Mano vuota.</p>}
                      </div>
                    </div>
                  )}
                </div>
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
                  message={stagedLocation === myPlayer?.currentLocation
                    ? `Rimani in: "${myVillain?.locations[stagedLocation]?.name}"? (Svanire)`
                    : `Sposta il villain in: "${myVillain?.locations[stagedLocation]?.name}"?`}
                  sub="Puoi ancora cambiare cliccando un altro luogo."
                  onConfirm={handleConfirmMove}
                  onCancel={() => setStagedLocation(null)}
                />
              )}

              {/* Pannello conferma gioca effetto */}
              {isMyTurn && mode === 'play_effect_confirm' && (
                <ConfirmPanel
                  message={`Gioca l'effetto "${modeData.cardName}"?`}
                  sub="La carta sarà risolta e andrà nello scarto."
                  onConfirm={handleConfirmPlayEffect}
                  onCancel={() => { setMode('play_card'); setModeData(prev => ({ ...prev, cardId: null, cardName: null })) }}
                  confirmLabel="✓ Gioca Effetto"
                />
              )}

              {/* Pannello conferma gioca alleato/oggetto/maledizione/wicket */}
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

              {/* Pannello selezione carta da spostare (con tasto annulla selezione) */}
              {isMyTurn && mode === 'move_ally_dest' && (
                <div className="bg-blue-950/40 border border-blue-700/50 rounded-xl p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-blue-200">
                    <strong>"{modeData.cardName}"</strong> selezionato — clicca il luogo di destinazione.
                  </p>
                  <button
                    onClick={() => {
                      setMode('move_ally_pick')
                      setModeData(prev => ({ ...prev, cardId: null, cardName: null, fromLocIdx: null, fromLocName: null }))
                    }}
                    className="btn-secondary text-xs px-3 shrink-0"
                  >✕ Deseleziona</button>
                </div>
              )}

              {/* Pannello Muovi Corvo — visibile durante fase move se Corvo è in campo */}
              {isMyTurn && phase === 'move' && !corvoUsed && corvoIsOnField && myPlayer.villainId === 'maleficent' && mode !== 'corvo_dest_pick' && mode !== 'corvo_action_pick' && (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-300">
                    🦅 <strong>Il Corvo è presente nel Reame.</strong> Puoi muoverlo prima di spostarti.
                  </p>
                  <button
                    onClick={() => { setMode('corvo_dest_pick'); setUiMsg('Clicca il luogo di destinazione per il Corvo (qualsiasi luogo del Reame).') }}
                    className="btn-secondary text-xs px-4 shrink-0"
                  >🦅 Muovi Corvo</button>
                </div>
              )}

              {/* Pannello selezione destinazione Corvo */}
              {isMyTurn && mode === 'corvo_dest_pick' && (
                <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-300">
                    🦅 Clicca un luogo di destinazione per il Corvo (qualsiasi luogo del Reame).
                  </p>
                  <button onClick={() => { setMode(null); setUiMsg(null) }} className="btn-secondary text-xs px-3">Annulla</button>
                </div>
              )}

              {/* Pannello azione Corvo dopo spostamento */}
              {isMyTurn && mode === 'corvo_action_pick' && corvoDestIdx !== null && myVillain && (() => {
                const destLocDef   = myVillain.locations[corvoDestIdx]
                const destLocState = myPlayer.board.locations[corvoDestIdx]
                const availableActions = destLocDef.actions
                  .map((a, i) => ({ ...a, i }))
                  .filter(({ type, i }) => type !== 'fate' && !destLocState.coveredActionIndices?.includes(i))
                return (
                  <div className="bg-yellow-950/40 border border-yellow-700/50 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="font-display text-yellow-300 font-bold text-sm">🦅 Corvo — Azione disponibile</h3>
                    <p className="text-xs text-yellow-400">
                      Il Corvo è in <strong>"{destLocDef.name}"</strong>. Scegli un'azione da svolgere (escluso Fato).
                    </p>
                    {availableActions.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">Nessuna azione disponibile in questo luogo.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableActions.map(action => {
                          const label = ACTION_LABELS[action.type]?.(action) ?? action.type
                          const color = ACTION_COLORS[action.type] ?? 'bg-gray-700'
                          return (
                            <button key={action.i} onClick={() => handleCorvoActionClick(action)}
                              className={`action-chip text-white border ${color} border-transparent hover:opacity-90 cursor-pointer ring-1 ring-white/10 text-[10px]`}>
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <button onClick={() => { setCorvoUsed(true); setCorvoDestIdx(null); resetMode() }} className="btn-secondary text-xs self-start">Salta Azione</button>
                  </div>
                )
              })()}

              {/* ── Banner Svanire (promemoria visibile) ── */}
              {myPlayer?.villainId === 'maleficent' && myPlayer?.svanireActive && phase === 'move' && (
                <div className="bg-indigo-950/60 border border-indigo-600/70 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="text-indigo-200 font-display font-bold text-sm">Svanire attivo</p>
                    <p className="text-indigo-400 text-xs">Puoi restare nel luogo attuale o spostarti in un nuovo luogo.</p>
                  </div>
                </div>
              )}

              {/* ── Banner Forma di Drago (promemoria visibile) ── */}
              {myPlayer?.villainId === 'maleficent' && myPlayer?.dragonFormActive && (
                <div className="bg-orange-950/60 border border-orange-600/70 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">🐉</span>
                  <div>
                    <p className="text-orange-200 font-display font-bold text-sm">Forma di Drago attiva</p>
                    <p className="text-orange-400 text-xs">Se vieni colpita da un Fato, guadagni 3 Potere. Dura fino alla fine del tuo prossimo turno.</p>
                  </div>
                </div>
              )}

              {/* ── Banner Flora (Malefica gioca a carte scoperte) ── */}
              {myPlayer?.villainId === 'maleficent' && myPlayer?.floraActive && (
                <div className="bg-emerald-950/60 border border-emerald-600/70 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <p className="text-emerald-200 font-display font-bold text-sm">Flora in campo — Carte Scoperte</p>
                    <p className="text-emerald-400 text-xs">La tua mano è visibile agli avversari finché Flora non viene sconfitta.</p>
                  </div>
                </div>
              )}

              {/* Pannello Aurora: posiziona eroe rivelato */}
              {mode === 'aurora_place_hero' && gameState.pendingFateReveal?.actorPlayerId === myPlayerId && (() => {
                const heroCard = findCardFromAll(gameState, gameState.pendingFateReveal.heroCardId)
                return (
                  <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="font-display text-rose-300 font-bold text-sm">⚡ Aurora: Eroe Rivelato</h3>
                    <p className="text-sm text-gray-300">
                      Aurora ha rivelato <strong>"{heroCard?.name || gameState.pendingFateReveal.heroCardId}"</strong> dal mazzo Fato di Malefica.
                      Clicca un luogo nella plancia di Malefica per posizionarlo.
                    </p>
                    {heroCard && <Card card={heroCard} small showEffect={false} />}
                  </div>
                )
              })()}

              <PlayerBoard
                player={myPlayer}
                isMyBoard={true}
                isMyTurn={isMyTurn}
                phase={phase}
                actionQueue={actionQueue}
                stagedLocation={stagedLocation}
                activeMode={mode}
                selectedCardId={modeData.cardId || null}
                onLocationClick={
                  isMyTurn ? handleMyLocationClick :
                  (mode === 'cond_play_ally_location' || mode === 'cond_ossessione_location') ? handleMyLocationClick :
                  undefined
                }
                onActionClick={isMyTurn && phase === 'action' ? handleActionClick : undefined}
                onHandCardClick={
                  isMyTurn ? handleHandCardClick :
                  mode === 'cond_discard_cards' ? handleConditionDiscardCard :
                  mode === 'cond_play_ally_pick' ? handleConditionAllyPicked :
                  undefined
                }
                onAllyItemClick={isMyTurn && (mode === 'move_ally_pick' || mode === 'move_ally_dest') ? handleAllyItemClick : undefined}
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

              {/* Panel: attiva — selezione carta */}
              {isMyTurn && mode === 'activate_mode' && (
                <div className="bg-teal-950/40 border border-teal-700/50 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="font-display text-teal-300 font-bold text-sm">⚡ Attiva — Scegli la carta</h3>
                  <p className="text-xs text-teal-400">Seleziona la carta che vuoi attivare.</p>
                  <div className="flex gap-2 flex-wrap">
                    {(modeData.activatable || []).map(card => (
                      <button key={card.id} onClick={() => handleActivateCard(card.id)}
                              className="btn-secondary text-xs px-3">
                        ⚡ {card.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { if (modeData.isCorvoAction) { setCorvoUsed(true); setCorvoDestIdx(null) } else exec(completeAction, modeData.actionIndex); resetMode() }}
                          className="btn-secondary text-xs px-3 self-start">Annulla</button>
                </div>
              )}

              {/* Panel: attiva — conferma effetto */}
              {isMyTurn && mode === 'activate_confirm' && (
                <div className="bg-teal-950/40 border border-teal-700/50 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="font-display text-teal-300 font-bold text-sm">⚡ Attiva — "{modeData.selectedActivateName}"</h3>
                  <p className="text-xs text-teal-200 bg-teal-900/30 rounded-lg px-3 py-2 italic">
                    {modeData.selectedActivateEffect || '(effetto non disponibile)'}
                  </p>
                  <p className="text-[11px] text-teal-500">Esegui l'effetto descritto, poi conferma.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setMode('activate_mode')} className="btn-secondary text-xs px-3">← Torna</button>
                    <button onClick={handleConfirmActivate} className="btn-primary text-xs px-4">✓ Effetto Eseguito</button>
                  </div>
                </div>
              )}

              {/* Panel: scontro */}
              {isMyTurn && mode === 'vanquish_mode' && (
                <VanquishPanel
                  myVillain={myVillain}
                  heroes={myPlayer.board.locations.flatMap((loc, i) =>
                    loc.heroes.map(id => ({ id, locName: myVillain?.locations[i]?.name || `Luogo ${i + 1}` }))
                  )}
                  allies={myPlayer.board.locations.flatMap((loc, i) =>
                    loc.allies.map(id => ({ id, locName: myVillain?.locations[i]?.name || `Luogo ${i + 1}` }))
                  )}
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
                      {!modeData.isMandatory && (
                        <button onClick={resetMode} className="btn-secondary text-xs px-3">Salta</button>
                      )}
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

          {/* ── Malefica: Principe Filippo — scelta scarto alleati ── */}
          {isMyTurn && mode === 'filippo_discard_choice' && modeData.filippoData && (
            <section className="p-4 shrink-0">
              <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-display text-red-300 font-bold text-sm">⚔️ Principe Filippo</h3>
                <p className="text-sm text-gray-300">
                  Ci sono <strong>{modeData.filippoData.allyCount}</strong> Alleato/i in questo luogo. Vuoi scartarli?
                </p>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    await exec(resolveFilippoDiscard, modeData.filippoData.targetPlayerId, modeData.filippoData.locationIndex, false)
                    resetMode()
                  }} className="btn-secondary text-xs px-4">✗ No, lascia</button>
                  <button onClick={async () => {
                    await exec(resolveFilippoDiscard, modeData.filippoData.targetPlayerId, modeData.filippoData.locationIndex, true)
                    resetMode()
                  }} className="btn-primary text-xs px-4">✓ Sì, scarta</button>
                </div>
              </div>
            </section>
          )}

          {/* ── Malefica: Re Stefano — seleziona destinazione per Malefica ── */}
          {isMyTurn && mode === 're_stefano_move' && modeData.stefanoData && (
            <section className="p-4 shrink-0">
              <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-display text-rose-300 font-bold text-sm">👑 Re Stefano — Sposta Malefica</h3>
                <p className="text-xs text-rose-400">
                  Scegli il luogo in cui spostare Malefica. Se il luogo ha Fuoco Verde, viene scartato.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const targetP = gameState.players.find(p => p.id === modeData.stefanoData.targetPlayerId)
                    const tVillain = VILLAINS[targetP?.villainId]
                    return (tVillain?.locations || []).map((loc, idx) => (
                      <button key={idx} onClick={async () => {
                        await exec(resolveReStefanoMove, modeData.stefanoData.targetPlayerId, idx)
                        resetMode()
                      }} className="btn-secondary text-xs px-3">
                        📍 {loc.name}
                      </button>
                    ))
                  })()}
                  <button onClick={resetMode} className="btn-secondary text-xs px-3 border-gray-700 text-gray-500">Salta</button>
                </div>
              </div>
            </section>
          )}

          {/* ── Malefica: Re Uberto — seleziona alleato da spostare ── */}
          {isMyTurn && mode === 're_uberto_move' && modeData.ubertoData && (
            <section className="p-4 shrink-0">
              <div className="bg-pink-950/40 border border-pink-700/50 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-display text-pink-300 font-bold text-sm">🤺 Re Uberto — Sposta Alleato</h3>
                <p className="text-xs text-pink-400">
                  Scegli un Alleato da spostare nel luogo di Re Uberto.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {modeData.ubertoData.allies.map(({ allyId, fromLocIdx, allyName }) => (
                    <button key={allyId} onClick={async () => {
                      await exec(resolveReUbertoMove, modeData.ubertoData.targetPlayerId, allyId, fromLocIdx, modeData.ubertoData.toLocIdx)
                      resetMode()
                    }} className="btn-secondary text-xs px-3">
                      ⚔️ {allyName}
                    </button>
                  ))}
                  <button onClick={resetMode} className="btn-secondary text-xs px-3 border-gray-700 text-gray-500">Salta</button>
                </div>
              </div>
            </section>
          )}

          {/* ── Malefica: C'era una Volta in un Sogno — seleziona maledizione ── */}
          {isMyTurn && mode === 'sogno_choose_curse' && modeData.sognoData && (
            <section className="p-4 shrink-0">
              <div className="bg-violet-950/40 border border-violet-700/50 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-display text-violet-300 font-bold text-sm">🌙 C'era una Volta in un Sogno</h3>
                <p className="text-xs text-violet-400">Scegli quale Maledizione scartare:</p>
                <div className="flex gap-2 flex-wrap">
                  {modeData.sognoData.validCurses.map(({ curseId, curseName, locIdx, locName }) => (
                    <button key={curseId + locIdx} onClick={async () => {
                      await exec(resolveOnceuponatime, modeData.sognoData.targetPlayerId, curseId, locIdx)
                      resetMode()
                    }} className="btn-secondary text-xs px-3">
                      ✨ {curseName} @ {locName}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Malefica: Forma di Drago — seleziona eroe da sconfiggere ── */}
          {isMyTurn && mode === 'forma_drago_defeat' && (
            <section className="p-4 shrink-0">
              <div className="bg-orange-950/40 border border-orange-700/50 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-display text-orange-300 font-bold text-sm">🐉 Forma di Drago — Sconfiggi Eroe</h3>
                <p className="text-xs text-orange-400">Scegli un Eroe con Forza effettiva ≤3 da sconfiggere:</p>
                <div className="flex gap-2 flex-wrap">
                  {myPlayer && (() => {
                    const targets = myPlayer.board.locations.flatMap((loc, li) => {
                      const hasSonno = loc.curses.some(id => id.startsWith('mal_c_son'))
                      return loc.heroes.map(hId => {
                        const hCard = findCardFromAll(gameState, hId)
                        const forzaBase = hCard?.strength || 0
                        const forzaEff = Math.max(0, forzaBase - (hasSonno ? 2 : 0))
                        return forzaEff <= 3 ? { id: hId, name: hCard?.name || hId, forzaEff, locName: myVillain?.locations[li]?.name } : null
                      }).filter(Boolean)
                    })
                    if (targets.length === 0) return <p className="text-xs text-orange-500 italic">Nessun bersaglio valido.</p>
                    return targets.map(t => (
                      <button key={t.id} onClick={async () => {
                        const res = await exec(resolveFormadiDrago, t.id)
                        if (!res?.error) {
                          await exec(completeAction, modeData.actionIndex)
                          resetMode()
                        }
                      }} className="btn-secondary text-xs px-3">
                        🐉 {t.name} (F:{t.forzaEff}) — {t.locName}
                      </button>
                    ))
                  })()}
                  <button onClick={async () => { await exec(completeAction, modeData.actionIndex); resetMode() }} className="btn-secondary text-xs px-3 border-gray-700 text-gray-500">Salta</button>
                </div>
              </div>
            </section>
          )}

          {/* ── Condizioni fuori turno: pannello attivazione ── */}
          {myConditions.length > 0 && !gameState.pendingConditionActivation && !gameState.pendingConditionEffect && (
            <section className="p-4 shrink-0">
              <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4">
                <h3 className="font-display text-rose-300 font-bold mb-1 text-sm">
                  🎴 Condizioni — turno di {currentPlayer?.name}
                </h3>
                <p className="text-[11px] text-rose-400 mb-3">
                  Se la condizione si è verificata, premi "Attiva" — l'avversario la confermerà.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {myConditions.map(card => (
                    <div key={card.id} className="flex flex-col items-center gap-1">
                      <Card card={card} small />
                      <button onClick={() => handleRequestCondition(card.id)}
                              className="btn-fate text-[10px] px-3 py-1">
                        ⚡ Attiva
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Condizione in attesa: banner per il richiedente ── */}
          {gameState.pendingConditionActivation &&
           gameState.pendingConditionActivation.playerId === myPlayerId && (
            <section className="p-4 shrink-0">
              <div className="bg-rose-950/60 border border-rose-600 rounded-xl p-3 text-center">
                <p className="text-rose-300 text-sm font-semibold">
                  ⏳ "{gameState.pendingConditionActivation.cardName}" — in attesa di conferma da {currentPlayer?.name}…
                </p>
              </div>
            </section>
          )}

          {/* ── Effetto condizione attivo (per il proprietario della condizione) ── */}
          {gameState.pendingConditionEffect && gameState.pendingConditionEffect.playerId === myPlayerId && (() => {
            const effect = gameState.pendingConditionEffect

            if (effect.type === 'discard_n_cards') return (
              <section className="p-4 shrink-0">
                <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-4">
                  <h3 className="font-display text-amber-300 font-bold mb-1 text-sm">
                    🗑️ Tirannia: scarta {effect.count - effect.discarded} carta/e
                  </h3>
                  <p className="text-xs text-amber-400">Clicca le carte nella mano per scartarle ({effect.discarded}/{effect.count}).</p>
                </div>
              </section>
            )

            if (effect.type === 'defeat_hero_le4') {
              const targets = myPlayer.board.locations.flatMap((loc, li) =>
                loc.heroes.map(hId => {
                  const hCard = findCardFromAll(gameState, hId)
                  return hCard && (hCard.strength || 0) <= 4 ? { id: hId, name: hCard.name, strength: hCard.strength, locIdx: li } : null
                }).filter(Boolean)
              )
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4">
                    <h3 className="font-display text-red-300 font-bold mb-2 text-sm">⚔️ Malignità: sconfiggi Eroe con Forza ≤4</h3>
                    {targets.length === 0 ? (
                      <><p className="text-xs text-red-400">Nessun Eroe con Forza ≤4 nel Reame.</p>
                      <button onClick={() => exec(conditionSkipEffect)} className="btn-secondary text-xs mt-2 px-3">Salta</button></>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {targets.map(t => (
                          <button key={t.id} onClick={() => handleConditionDefeatHero(t.id)} className="btn-secondary text-xs px-3">
                            ⚔️ {t.name} (F:{t.strength})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )
            }

            if (effect.type === 'discard_opponent_item') {
              const targetP = gameState.players.find(p => p.id === effect.targetPlayerId)
              const tVillain = VILLAINS[targetP?.villainId]
              const items = (targetP?.board.locations || []).flatMap((loc, li) =>
                loc.items.map(iId => {
                  const iCard = tVillain?.villainDeck.find(c => c.id === iId) || tVillain?.fateDeck.find(c => c.id === iId)
                  return { id: iId, name: iCard?.name || iId, locIdx: li }
                })
              )
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4">
                    <h3 className="font-display text-red-300 font-bold mb-2 text-sm">🗑️ Inganno: scarta Oggetto da {targetP?.name}</h3>
                    {items.length === 0 ? (
                      <><p className="text-xs text-red-400">Nessun Oggetto nel Reame di {targetP?.name}.</p>
                      <button onClick={() => exec(conditionSkipEffect)} className="btn-secondary text-xs mt-2 px-3">Salta</button></>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {items.map(it => (
                          <button key={it.id} onClick={() => handleConditionDiscardItem(it.id, effect.targetPlayerId, it.locIdx)}
                                  className="btn-secondary text-xs px-3">📦 {it.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )
            }

            if (effect.type === 'recover_from_discard') {
              const discardItems = (myPlayer.villainDiscard || []).map(id => {
                const c = myVillain?.villainDeck.find(x => x.id === id)
                return c ? { id, name: c.name } : null
              }).filter(Boolean)
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-blue-950/40 border border-blue-700/50 rounded-xl p-4">
                    <h3 className="font-display text-blue-300 font-bold mb-2 text-sm">♻️ Manipolazione: recupera dai scarti</h3>
                    {discardItems.length === 0 ? (
                      <><p className="text-xs text-blue-400">Nessuna carta negli scarti.</p>
                      <button onClick={() => exec(conditionSkipEffect)} className="btn-secondary text-xs mt-2 px-3">Salta</button></>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {discardItems.map(c => (
                          <button key={c.id} onClick={() => handleConditionRecoverCard(c.id)} className="btn-secondary text-xs px-3">🃏 {c.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )
            }

            if (effect.type === 'play_ally_free') {
              if (mode === 'cond_play_ally_location') return (
                <section className="p-4 shrink-0">
                  <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-4">
                    <p className="text-xs text-green-300">Clicca un luogo sulla tua plancia dove giocare l'Alleato.</p>
                    <button onClick={() => setMode('cond_play_ally_pick')} className="btn-secondary text-xs mt-2 px-3">← Torna</button>
                  </div>
                </section>
              )
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-4">
                    <h3 className="font-display text-green-300 font-bold mb-2 text-sm">🃏 Gioca un Alleato gratuitamente</h3>
                    <p className="text-xs text-green-400">Clicca un Alleato dalla mano per selezionarlo, poi scegli il luogo.</p>
                    <button onClick={() => exec(conditionSkipEffect)} className="btn-secondary text-xs mt-2 px-3">Salta</button>
                  </div>
                </section>
              )
            }

            if (effect.type === 'ossessione_choice') {
              const heroCard = findCardFromAll(gameState, effect.foundHeroId)
              if (mode === 'cond_ossessione_location') return (
                <section className="p-4 shrink-0">
                  <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4">
                    <p className="text-xs text-rose-300">Clicca un luogo sulla tua plancia dove giocare "{heroCard?.name}".</p>
                    <button onClick={() => setMode(null)} className="btn-secondary text-xs mt-2 px-3">← Annulla</button>
                  </div>
                </section>
              )
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4">
                    <h3 className="font-display text-rose-300 font-bold mb-2 text-sm">🔍 Ossessione: Eroe trovato</h3>
                    {heroCard && <div className="mb-2"><Card card={heroCard} small /></div>}
                    <div className="flex gap-2">
                      <button onClick={handleConditionOssessionePlay} className="btn-fate text-xs px-3">▶ Gioca nel Reame</button>
                      <button onClick={handleConditionOssessioneDiscard} className="btn-secondary text-xs px-3">🗑️ Scarta</button>
                    </div>
                  </div>
                </section>
              )
            }

            if (effect.type === 'fate_one_card') {
              const fateCard = findCardFromAll(gameState, effect.revealedCardId)
              const targetP = gameState.players.find(p => p.id === effect.targetPlayerId)
              return (
                <section className="p-4 shrink-0">
                  <div className="bg-purple-950/40 border border-purple-700/50 rounded-xl p-4">
                    <h3 className="font-display text-purple-300 font-bold mb-2 text-sm">🔮 Inganno: posiziona sul Reame di {targetP?.name}</h3>
                    {fateCard && <div className="mb-2"><Card card={fateCard} small /></div>}
                    <p className="text-xs text-purple-400">Clicca un luogo sulla plancia di {targetP?.name}.</p>
                  </div>
                </section>
              )
            }

            return null
          })()}
        </div>

        {/* ── COLONNA DESTRA: log ──────────────────────────── */}
        {logOpen && <aside className="w-72 xl:w-80 border-l border-gray-800 flex flex-col bg-gray-950/60 shrink-0">
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
        </aside>}
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
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">1. Eroe da sconfiggere (qualsiasi luogo)</p>
        <div className="flex gap-2 flex-wrap">
          {heroes.map(({ id: heroId, locName }) => {
            const card = findCard(heroId)
            const sel  = selectedHeroId === heroId
            return (
              <button key={heroId} onClick={() => onSelectHero(heroId)}
                      className={['text-xs px-3 py-1.5 rounded-lg border font-display transition-all',
                        sel ? 'bg-red-700 border-red-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-600'].join(' ')}>
                🛡️ {card?.name || heroId} (F:{card?.strength ?? '?'}) — {locName}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">2. Alleati da usare (qualsiasi luogo)</p>
        <div className="flex gap-2 flex-wrap">
          {allies.map(({ id: allyId, locName }) => {
            const card = myVillain?.villainDeck.find(c => c.id === allyId)
            const sel  = selectedAllyIds.includes(allyId)
            return (
              <button key={allyId} onClick={() => onToggleAlly(allyId)}
                      className={['text-xs px-3 py-1.5 rounded-lg border font-display transition-all',
                        sel ? 'bg-blue-700 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-600'].join(' ')}>
                ⚔️ {card?.name || allyId} (F:{card?.strength ?? '?'}) — {locName}
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
