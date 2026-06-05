// ============================================================
// Disney Villainous — Game Engine
// Tutta la logica di gioco vive qui.
// Le funzioni sono PURE: ricevono uno state, restituiscono il nuovo state.
// Il componente useGame chiama queste funzioni e aggiorna Supabase.
// ============================================================

import { VILLAINS, findCard, findLocation } from '../data/villains.js'

// ─── UTILITY ────────────────────────────────────────────────

export function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Potere iniziale per ordine di turno (0-indexed), valido da 2 a 6 giocatori
const STARTING_POWER_TABLE = [0, 1, 2, 2, 3, 3]

function addLog(state, message, type = 'info') {
  const entry = { id: generateId(), message, type, ts: Date.now() }
  return {
    ...state,
    log: [...(state.log || []).slice(-49), entry], // max 50 righe log
  }
}

// Ricalcola coveredActionIndices in base agli Eroi presenti in un luogo.
// I luoghi con 4 azioni hanno top-row (indici 0,1) coperta dagli Eroi.
// I luoghi con <4 azioni (es. Prigione) non hanno top-row e gli Eroi non coprono nulla.
function updateCoveredActions(playerData, locationIndex, villain) {
  const loc    = playerData.board.locations[locationIndex]
  const locDef = villain.locations[locationIndex]
  if (locDef.actions.length >= 4) {
    if (loc.heroes.length > 0) {
      if (!loc.coveredActionIndices.includes(0)) loc.coveredActionIndices.push(0)
      if (!loc.coveredActionIndices.includes(1)) loc.coveredActionIndices.push(1)
    } else {
      loc.coveredActionIndices = loc.coveredActionIndices.filter(i => i !== 0 && i !== 1)
    }
  }
}

// ─── INIZIALIZZAZIONE ────────────────────────────────────────

/**
 * Crea lo state iniziale di gioco dopo la selezione dei villain.
 * Viene chiamato dall'host quando tutti i giocatori sono pronti.
 */
export function initializeGame(players) {
  // players = [{ id, sessionId, name, villainId, isHost }]
  const initializedPlayers = players.map((p, index) => {
    const villain = VILLAINS[p.villainId]
    if (!villain) throw new Error(`Villain sconosciuto: ${p.villainId}`)

    // Costruisce i deck shuffled con gli id delle carte
    const villainDeckIds = shuffle(villain.villainDeck.map(c => c.id))
    const fateDeckIds    = shuffle(villain.fateDeck.map(c => c.id))

    // Board iniziale: tutti i luoghi vuoti
    const board = {
      locations: villain.locations.map(loc => ({
        id: loc.id,
        allies:               [],
        items:                [],
        heroes:               [],
        curses:               [],
        wickets:              [],
        coveredActionIndices: [],
        fateItemAssignments:  {}, // { [fateItemId]: heroId }
        isLocked: loc.locked === true,
      }))
    }

    // Dealer: mano iniziale
    const hand = villainDeckIds.slice(0, villain.handSize)
    const remainingDeck = villainDeckIds.slice(villain.handSize)

    return {
      id:              p.id,
      sessionId:       p.sessionId,
      name:            p.name,
      villainId:       p.villainId,
      isHost:          p.isHost,
      power:           STARTING_POWER_TABLE[index] ?? 0,
      currentLocation: 0,
      lastLocation:    -1,
      hand,
      villainDeck:     remainingDeck,
      fateDeck:        fateDeckIds,
      villainDiscard:  [],
      fateDiscard:     [],
      hasWon:          false,
      board,
    }
  })

  const state = {
    status:           'playing',
    currentPlayerIndex: 0,
    phase:            'move',          // move | action | fate_choice | end_turn
    actionQueue:      [],              // azioni rimaste da fare nel turno corrente
    pendingFate:      null,            // { targetPlayerId, cards: [id, id] }
    pendingInteraction: null,          // per effetti card-specifici
    log:              [],
    winnerId:         null,
    players:          initializedPlayers,
  }

  return addLog(state, 'La partita ha inizio! Che vinca il più cattivo!', 'system')
}

// ─── GETTERS ────────────────────────────────────────────────

export function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIndex]
}

export function getPlayerById(state, playerId) {
  return state.players.find(p => p.id === playerId)
}

export function getPlayerIndex(state, playerId) {
  return state.players.findIndex(p => p.id === playerId)
}

export function getOpponents(state, playerId) {
  return state.players.filter(p => p.id !== playerId)
}

export function getLocationState(player, locationIndex) {
  return player.board.locations[locationIndex]
}

// Tutte le carte (villain + fate) come oggetti, non solo id
export function getCardObjects(player, cardIds) {
  const villain = VILLAINS[player.villainId]
  if (!villain) return []
  const allCards = [...villain.villainDeck, ...villain.fateDeck]
  return cardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean)
}

// ─── WIN CONDITION CHECK ─────────────────────────────────────

/**
 * Verifica la condizione di vittoria per un giocatore.
 * Viene chiamato all'INIZIO del turno del giocatore (dopo move, prima delle azioni).
 * Ritorna true se il giocatore ha vinto.
 */
export function checkWinCondition(state, playerId) {
  const player = getPlayerById(state, playerId)
  if (!player) return false
  const villain = VILLAINS[player.villainId]
  if (!villain) return false

  switch (villain.winConditionId) {
    case 'curse_all_locations': {
      // Malefica: almeno 1 Maledizione in ognuno dei 4 luoghi
      return player.board.locations.every(loc => loc.curses.length > 0)
    }
    case 'lamp_and_genie': {
      // Jafar: Lampada Magica nel Palazzo del Sultano E Genio Soggiogato
      const sultanLoc = player.board.locations.find(l => l.id === 'palazzo_sultano')
      if (!sultanLoc) return false
      const hasLamp   = sultanLoc.items.includes('jaf_o_lam')
      const genieSub  = player.genieSubjugated === true
      return hasLamp && genieSub
    }
    case 'defeat_peter_pan': {
      // Uncino: Peter Pan sconfitto alla Jolly Roger (panDefeated = true)
      return player.panDefeated === true
    }
    case 'trident_and_crown': {
      // Ursula: Corona E Tridente al Covo di Ursula
      const covoLoc = player.board.locations.find(l => l.id === 'covo_ursula')
      if (!covoLoc) return false
      return covoLoc.items.includes('urs_o_cor') && covoLoc.items.includes('urs_o_tri')
    }
    case 'twenty_power': {
      // Principe Giovanni: ≥ 20 Potere
      return player.power >= 20
    }
    case 'wicket_all_locations': {
      // Regina di Cuori: vince solo tramite la carta "Tirare" con successo
      return player.queenWon === true
    }
    default:
      return false
  }
}

// ─── AZIONI DI TURNO ────────────────────────────────────────

/**
 * Fase MOVE: sposta il villain in un nuovo luogo.
 * Non puoi restare nello stesso luogo del turno precedente
 * (tranne al primo turno dove lastLocation = -1).
 */
export function moveVillain(state, playerId, locationIndex) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]

  // Validazione: non puoi restare fermo
  if (locationIndex === player.lastLocation) {
    return { error: 'Non puoi tornare nello stesso luogo del turno precedente.' }
  }
  if (locationIndex < 0 || locationIndex >= villain.locations.length) {
    return { error: 'Luogo non valido.' }
  }
  // Validazione: luogo bloccato — sblocca prima giocando la carta richiesta
  if (player.board.locations[locationIndex].isLocked) {
    const locDef = villain.locations[locationIndex]
    return { error: `"${locDef.name}" è bloccato. Sblocca questo luogo giocando la carta richiesta.` }
  }
  if (state.phase !== 'move') {
    return { error: 'Non è il momento di muoversi.' }
  }

  const newPlayers = deepClone(state.players)
  newPlayers[pidx].lastLocation    = newPlayers[pidx].currentLocation
  newPlayers[pidx].currentLocation = locationIndex

  // Costruisce la coda delle azioni per questo turno
  const loc = villain.locations[locationIndex]
  const locState = newPlayers[pidx].board.locations[locationIndex]
  const actionQueue = loc.actions.map((a, i) => ({
    ...a,
    index: i,
    covered: locState.coveredActionIndices.includes(i),
    done: false,
  }))

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'action',
    actionQueue,
  }

  const locName = villain.locations[locationIndex].name
  newState = addLog(newState, `${player.name} si sposta in "${locName}".`, 'move')

  // Check win condition all'inizio del turno (dopo move, prima delle azioni)
  if (checkWinCondition(newState, playerId)) {
    newState = {
      ...newState,
      status: 'game_over',
      winnerId: playerId,
    }
    newState = addLog(newState, `🏆 ${player.name} ha vinto!`, 'win')
  }

  return newState
}

/**
 * Segna un'azione come completata (o saltata).
 * La fine del turno NON scatta automaticamente: il giocatore deve dichiararla
 * premendo "Fine Turno". Questo permette di attivare Condizioni prima della fine.
 */
export function completeAction(state, playerId, actionIndex) {
  if (state.currentPlayerIndex !== getPlayerIndex(state, playerId)) {
    return { error: 'Non è il tuo turno.' }
  }

  const newQueue = state.actionQueue.map(a =>
    a.index === actionIndex ? { ...a, done: true } : a
  )

  return { ...state, actionQueue: newQueue }
}

/**
 * Gioca una carta villain in un luogo specifico (usato per Alleati/Oggetti
 * che il giocatore vuole piazzare in un luogo a scelta).
 * Richiama playVillainCard con overrideLocationIndex.
 */
export function playVillainCardToLocation(state, playerId, cardId, locationIndex) {
  return playVillainCard(state, playerId, cardId, locationIndex)
}

/**
 * Azione GAIN POWER: guadagna Potere.
 */
export function gainPower(state, playerId, amount) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const newPlayers = deepClone(state.players)
  newPlayers[pidx].power = Math.max(0, newPlayers[pidx].power + amount)

  let newState = { ...state, players: newPlayers }
  const p = newPlayers[pidx]
  newState = addLog(newState, `${p.name} guadagna ${amount} Potere (tot: ${p.power}).`, 'action')
  return newState
}

/**
 * Azione REMOVE POWER: rimuove Potere da un giocatore.
 */
export function removePower(state, targetPlayerId, amount) {
  const pidx = getPlayerIndex(state, targetPlayerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const newPlayers = deepClone(state.players)
  newPlayers[pidx].power = Math.max(0, newPlayers[pidx].power - amount)

  let newState = { ...state, players: newPlayers }
  const p = newPlayers[pidx]
  newState = addLog(newState, `${p.name} perde ${amount} Potere (tot: ${p.power}).`, 'action')
  return newState
}

/**
 * Azione PLAY CARD (villain card): gioca una carta dalla mano.
 * Allies/Items → si posizionano nel luogo corrente (o targetLocation per curse/wicket).
 * Effects → si risolvono e vanno nello scarto.
 * Curses/Wickets → vanno nel loro luogo designato.
 */
export function playVillainCard(state, playerId, cardId, overrideLocationIndex = null) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card = villain.villainDeck.find(c => c.id === cardId)
  if (!card) return { error: 'Carta non trovata nel mazzo villain.' }

  if (!player.hand.includes(cardId)) return { error: 'Carta non in mano.' }

  // Verifica costo
  if ((card.cost || 0) > player.power) {
    return { error: `Potere insufficiente. Costo: ${card.cost}, disponibile: ${player.power}.` }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]

  // Paga il costo
  np.power -= (card.cost || 0)

  // Rimuovi dalla mano
  np.hand = np.hand.filter(id => id !== cardId)

  // Determina dove va la carta
  let targetLocIdx = overrideLocationIndex ?? np.currentLocation

  if (card.type === 'curse' && card.targetLocation) {
    const tLocIdx = villain.locations.findIndex(l => l.id === card.targetLocation)
    if (tLocIdx >= 0) targetLocIdx = tLocIdx
  }
  if (card.type === 'wicket' && card.targetLocation) {
    const tLocIdx = villain.locations.findIndex(l => l.id === card.targetLocation)
    if (tLocIdx >= 0) targetLocIdx = tLocIdx
  }

  const loc = np.board.locations[targetLocIdx]

  switch (card.type) {
    case 'ally':
      loc.allies.push(cardId)
      break
    case 'item':
      loc.items.push(cardId)
      break
    case 'curse':
      loc.curses.push(cardId)
      break
    case 'wicket':
      loc.wickets.push(cardId)
      break
    case 'effect':
      // Effetti: vanno in scarto, la risoluzione è manuale/UI
      np.villainDiscard.push(cardId)
      break
    default:
      np.villainDiscard.push(cardId)
  }

  // Sblocca il luogo bloccato se questa carta è la unlockCard di quel luogo
  // Trasformazione di Ursula usa logica toggle separata — esclusa qui
  const isTrasformazione = cardId === 'urs_e_tra_1' || cardId === 'urs_e_tra_2' || cardId === 'urs_e_tra_3'
  villain.locations.forEach((locDef, li) => {
    if (locDef.locked && locDef.unlockCard === cardId && !isTrasformazione) {
      np.board.locations[li].isLocked = false
    }
  })

  // ── Effetti speciali per carte specifiche ──────────────────
  const specialLogs = []
  let specialGameOver = false
  let specialWinnerId = null

  // Jafar: Lampada Magica → trova il Genio nel mazzo Fato e lo posiziona qui
  if (cardId === 'jaf_o_lam') {
    const genieId = 'fjaf_genio'
    const fateIdx = np.fateDeck.indexOf(genieId)
    if (fateIdx >= 0) {
      np.fateDeck.splice(fateIdx, 1)
      np.board.locations[targetLocIdx].heroes.push(genieId)
      updateCoveredActions(np, targetLocIdx, villain)
      specialLogs.push(`Il Genio emerge dalla Lampada Magica!`)
    }
  }

  // Ursula: Tridente → trova Re Tritone nel mazzo Fato e lo posiziona qui
  if (cardId === 'urs_o_tri') {
    const tritoneId = 'furs_tritone'
    const fateIdx = np.fateDeck.indexOf(tritoneId)
    if (fateIdx >= 0) {
      np.fateDeck.splice(fateIdx, 1)
      np.board.locations[targetLocIdx].heroes.push(tritoneId)
      updateCoveredActions(np, targetLocIdx, villain)
      specialLogs.push(`Re Tritone appare al ${villain.locations[targetLocIdx].name}!`)
    }
  }

  // Ursula: Trasformazione → alterna il lucchetto tra Palazzo e Covo
  if (isTrasformazione) {
    const palazzoIdx = np.board.locations.findIndex(l => l.id === 'palazzo_eric')
    const covoIdx    = np.board.locations.findIndex(l => l.id === 'covo_ursula')
    if (palazzoIdx >= 0 && covoIdx >= 0) {
      const wasLocked = np.board.locations[palazzoIdx].isLocked
      np.board.locations[palazzoIdx].isLocked = !wasLocked
      np.board.locations[covoIdx].isLocked    = wasLocked
      specialLogs.push(wasLocked
        ? `🔓 Il Palazzo si sblocca — il Covo si blocca.`
        : `🔓 Il Covo si sblocca — il Palazzo si blocca.`
      )
    }
  }

  // Regina di Cuori: Tirare → rivela 5 carte dal mazzo, vince se costo totale ≥ 8
  if (cardId === 'qh_e_tir_1' || cardId === 'qh_e_tir_2' || cardId === 'qh_e_tir_3') {
    const hasAllWickets = np.board.locations.every(loc => loc.wickets.length > 0)
    if (!hasAllWickets) {
      specialLogs.push(`Tirare fallito: mancano Archetti in tutti i luoghi!`)
    } else {
      const count    = Math.min(5, np.villainDeck.length)
      const revealed = np.villainDeck.splice(0, count)
      const totalCost = revealed.reduce((sum, id) => {
        const c = villain.villainDeck.find(x => x.id === id)
        return sum + (c?.cost ?? 0)
      }, 0)
      const names = revealed.map(id => villain.villainDeck.find(c => c.id === id)?.name || id).join(', ')
      specialLogs.push(`Tirare: [${names}] — costo totale: ${totalCost}.`)
      if (totalCost >= 8) {
        np.queenWon = true
        specialGameOver = true
        specialWinnerId = playerId
        specialLogs.push(`🏆 Tirare riuscito! La Regina di Cuori ha vinto!`)
      } else {
        np.villainDeck = [...np.villainDeck, ...revealed]
        specialLogs.push(`Tirare fallito (${totalCost} < 8). Le carte tornano in fondo al mazzo.`)
      }
    }
  }

  let newState = { ...state, players: newPlayers }
  const locName = villain.locations[targetLocIdx].name
  newState = addLog(newState, `${player.name} gioca "${card.name}" in "${locName}".`, 'action')

  for (const msg of specialLogs) {
    newState = addLog(newState, msg, 'action')
  }

  // Logga sblocchi (esclusa Trasformazione già loggata sopra)
  villain.locations.forEach((locDef, li) => {
    if (locDef.locked && locDef.unlockCard === cardId && !isTrasformazione) {
      newState = addLog(newState, `🔓 "${locDef.name}" sbloccato!`, 'action')
    }
  })

  // Game over da Tirare o da normale win check
  if (specialGameOver) {
    newState = { ...newState, status: 'game_over', winnerId: specialWinnerId }
  } else if (checkWinCondition(newState, playerId)) {
    newState = {
      ...newState,
      status: 'game_over',
      winnerId: playerId,
    }
    newState = addLog(newState, `🏆 ${player.name} ha vinto!`, 'win')
  }

  return newState
}

/**
 * Azione DRAW: pesca carte fino alla dimensione mano.
 * (Chiamata alla fine del turno)
 */
export function drawCards(state, playerId, count = null) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const villain = VILLAINS[np.villainId]
  const toDraw = count ?? Math.max(0, villain.handSize - np.hand.length)

  if (toDraw === 0) return { ...state, players: newPlayers }

  // Se il mazzo è esaurito, rimescola lo scarto
  if (np.villainDeck.length < toDraw) {
    const recycled = shuffle([...np.villainDiscard])
    np.villainDeck = [...np.villainDeck, ...recycled]
    np.villainDiscard = []
  }

  const drawn = np.villainDeck.splice(0, toDraw)
  np.hand = [...np.hand, ...drawn]

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} pesca ${drawn.length} carta/e.`, 'action')
  return newState
}

/**
 * Azione DISCARD: scarta una carta dalla mano.
 */
export function discardCard(state, playerId, cardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  if (!np.hand.includes(cardId)) return { error: 'Carta non in mano.' }

  np.hand = np.hand.filter(id => id !== cardId)
  np.villainDiscard.push(cardId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} scarta una carta.`, 'action')
  return newState
}

/**
 * Azione MOVE ALLY/ITEM: sposta un alleato o oggetto a un luogo adiacente.
 */
export function moveAllyOrItem(state, playerId, cardId, fromLocationIndex, toLocationIndex) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const villain = VILLAINS[state.players[pidx].villainId]
  const maxIdx  = villain.locations.length - 1

  // Validazione adiacenza (solo 1 step, oppure qualsiasi con certi effetti)
  if (Math.abs(fromLocationIndex - toLocationIndex) !== 1) {
    return { error: 'Puoi spostare solo in un luogo adiacente.' }
  }
  if (toLocationIndex < 0 || toLocationIndex > maxIdx) {
    return { error: 'Luogo di destinazione non valido.' }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const from = np.board.locations[fromLocationIndex]
  const to   = np.board.locations[toLocationIndex]

  // Trova e sposta la carta
  const categories = ['allies', 'items', 'curses', 'wickets']
  let moved = false
  for (const cat of categories) {
    const idx = from[cat].indexOf(cardId)
    if (idx >= 0) {
      from[cat].splice(idx, 1)
      to[cat].push(cardId)
      moved = true
      break
    }
  }
  if (!moved) return { error: 'Carta non trovata nel luogo specificato.' }

  const fromName = villain.locations[fromLocationIndex].name
  const toName   = villain.locations[toLocationIndex].name
  const card = findCard(state.players[pidx].villainId, cardId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} sposta "${card?.name || cardId}" da "${fromName}" a "${toName}".`, 'action')
  return newState
}

// ─── AZIONE VANQUISH ─────────────────────────────────────────

/**
 * Sconfiggi un Eroe usando Alleati nel tuo luogo corrente.
 * Regola: forza totale degli alleati usati ≥ forza dell'Eroe.
 * Gli alleati usati non vengono rimossi (rimangono in gioco).
 * ECCEZIONE Peter Pan: deve avvenire sulla Jolly Roger per vincere.
 */
export function vanquish(state, playerId, heroCardId, allyCardIds) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const locIdx = player.currentLocation
  const loc = player.board.locations[locIdx]

  // Verifica che l'Eroe sia nel luogo corrente
  if (!loc.heroes.includes(heroCardId)) {
    return { error: 'L\'Eroe non è nel tuo luogo corrente.' }
  }

  // Verifica che tutti gli alleati siano nel luogo corrente
  for (const allyId of allyCardIds) {
    if (!loc.allies.includes(allyId)) {
      return { error: `L\'Alleato ${allyId} non è nel tuo luogo corrente.` }
    }
  }

  // Calcola forza totale alleati
  const totalAllyStrength = allyCardIds.reduce((sum, allyId) => {
    const ally = villain.villainDeck.find(c => c.id === allyId)
    return sum + (ally?.strength || 0)
  }, 0)

  // Forza dell'Eroe: cerca in tutti i mazzi Fato di tutti i giocatori
  let heroCard = null
  for (const p of state.players) {
    const v = VILLAINS[p.villainId]
    heroCard = v?.fateDeck.find(c => c.id === heroCardId)
    if (heroCard) break
  }
  const heroStrength = heroCard?.strength || 0

  if (totalAllyStrength < heroStrength) {
    return {
      error: `Forza insufficiente. Alleati: ${totalAllyStrength}, Eroe: ${heroStrength}.`
    }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const nloc = np.board.locations[locIdx]

  // Rimuovi l'Eroe dal luogo
  nloc.heroes = nloc.heroes.filter(id => id !== heroCardId)
  np.fateDiscard.push(heroCardId)

  // Ricalcola copertura azioni: se non ci sono più Eroi, il top-row torna disponibile
  updateCoveredActions(newPlayers[pidx], locIdx, villain)

  let newState = { ...state, players: newPlayers }
  const locName = villain.locations[locIdx].name
  newState = addLog(
    newState,
    `${player.name} sconfigge "${heroCard?.name || heroCardId}" in "${locName}" (forza alleati: ${totalAllyStrength} vs ${heroStrength}).`,
    'action'
  )

  // Caso speciale: Peter Pan sconfitto sulla Jolly Roger (index 0)
  if (heroCardId === 'fhk_peter' && locIdx === 0) {
    newPlayers[pidx].panDefeated = true
    if (checkWinCondition({ ...newState, players: newPlayers }, playerId)) {
      newState = {
        ...newState,
        players: newPlayers,
        status: 'game_over',
        winnerId: playerId,
      }
      newState = addLog(newState, `🏆 ${player.name} ha sconfitto Peter Pan! Vittoria!`, 'win')
    }
  }

  return newState
}

// ─── AZIONE FATE ─────────────────────────────────────────────

/**
 * Avvia la Fate action: pesca 2 carte dal mazzo Fato dell'avversario scelto.
 * Mette lo state in fase 'fate_choice' con le 2 carte disponibili.
 */
export function startFate(state, playerId, targetPlayerId) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Avversario non trovato' }

  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]

  // Ricicla se esaurito
  if (target.fateDeck.length === 0 && target.fateDiscard.length > 0) {
    target.fateDeck   = shuffle([...target.fateDiscard])
    target.fateDiscard = []
  }

  const drawn = target.fateDeck.splice(0, 2)
  if (drawn.length === 0) return { error: 'Il mazzo Fato dell\'avversario è vuoto.' }

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'fate_choice',
    pendingFate: {
      actingPlayerId: playerId,
      targetPlayerId,
      cards: drawn,
    },
  }

  const actor = getPlayerById(state, playerId)
  const targetP = getPlayerById(state, targetPlayerId)
  newState = addLog(
    newState,
    `${actor?.name} usa Fato contro ${targetP?.name}! (pescate ${drawn.length} carte)`,
    'fate'
  )
  return newState
}

/**
 * Risolve la scelta Fate: gioca una carta, restituisce l'altra allo scarto.
 */
export function resolveFate(state, chosenCardId) {
  const { pendingFate } = state
  if (!pendingFate) return { error: 'Nessuna azione Fato in corso.' }

  const { actingPlayerId, targetPlayerId, cards } = pendingFate
  const discardedId = cards.find(id => id !== chosenCardId)
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore non trovato.' }

  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]

  // Restituisce la carta non scelta allo scarto Fato
  if (discardedId) target.fateDiscard.push(discardedId)

  // La carta scelta viene "giocata" sul regno del target
  // → tipo hero: va in un luogo del regno target (luogo scelto dall'attore in UI)
  // → tipo fate_effect / fate_item: risoluzione immediata
  // Per ora mettiamo la carta in pendingInteraction per la UI
  let newState = {
    ...state,
    players: newPlayers,
    phase: 'fate_resolve',
    pendingFate: null,
    pendingInteraction: {
      type: 'place_fate_card',
      cardId: chosenCardId,
      targetPlayerId,
      actingPlayerId,
    },
  }

  const actor = getPlayerById(state, actingPlayerId)
  const fateCard = findFateCard(state, chosenCardId)
  newState = addLog(
    newState,
    `${actor?.name} gioca "${fateCard?.name || chosenCardId}" dal Fato.`,
    'fate'
  )
  return newState
}

/**
 * Posiziona una carta Fato (hero) su un luogo del regno del target.
 */
export function placeFateCard(state, cardId, targetPlayerId, locationIndex) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore non trovato.' }

  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]
  const loc = target.board.locations[locationIndex]

  const fateCard = findFateCard(state, cardId)
  if (!fateCard) return { error: 'Carta Fato non trovata.' }

  switch (fateCard.type) {
    case 'hero':
      loc.heroes.push(cardId)
      // La copertura top-row viene aggiornata automaticamente dopo lo switch
      break
    case 'fate_item':
      loc.items.push(cardId)
      break
    case 'fate_effect':
      // Gli effetti Fato si risolvono e vanno allo scarto — gestiti dalla UI
      target.fateDiscard.push(cardId)
      break
  }

  const villain = VILLAINS[target.villainId]

  // Aggiorna copertura top-row se è stato aggiunto un Eroe
  if (fateCard.type === 'hero' && villain) {
    updateCoveredActions(target, locationIndex, villain)
  }

  const locName = villain?.locations[locationIndex]?.name || '?'

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'action',
    pendingInteraction: null,
  }

  newState = addLog(
    newState,
    `"${fateCard.name}" posizionato in "${locName}" di ${target.name}.`,
    'fate'
  )
  return newState
}

function findFateCard(state, cardId) {
  for (const p of state.players) {
    const v = VILLAINS[p.villainId]
    const card = v?.fateDeck.find(c => c.id === cardId)
    if (card) return card
  }
  return null
}

// ─── ASSEGNAZIONE OGGETTI FATO ───────────────────────────────

/**
 * Assegna un oggetto Fato (fate_item) a un Eroe nello stesso luogo.
 * L'assegnazione è memorizzata in board.locations[loc].fateItemAssignments.
 */
export function assignFateItem(state, targetPlayerId, itemCardId, heroCardId) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore non trovato.' }

  const target  = state.players[tidx]
  const villain = VILLAINS[target.villainId]

  // Trova in quale luogo si trova l'item
  let itemLocIdx = -1
  for (let i = 0; i < target.board.locations.length; i++) {
    if (target.board.locations[i].items.includes(itemCardId)) { itemLocIdx = i; break }
  }
  if (itemLocIdx < 0) return { error: 'Oggetto Fato non trovato nella plancia.' }

  const loc = target.board.locations[itemLocIdx]
  if (!loc.heroes.includes(heroCardId)) {
    return { error: 'L\'Eroe non si trova nello stesso luogo dell\'Oggetto.' }
  }

  const newPlayers = deepClone(state.players)
  const nLoc = newPlayers[tidx].board.locations[itemLocIdx]
  if (!nLoc.fateItemAssignments) nLoc.fateItemAssignments = {}
  nLoc.fateItemAssignments[itemCardId] = heroCardId

  const itemCard = villain.fateDeck.find(c => c.id === itemCardId)
  const heroCard = villain.fateDeck.find(c => c.id === heroCardId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(
    newState,
    `"${itemCard?.name || itemCardId}" assegnato a "${heroCard?.name || heroCardId}".`,
    'action'
  )
  return newState
}

// ─── CONDIZIONI ─────────────────────────────────────────────

/**
 * Gioca una carta Condizione dalla mano durante il turno di un avversario.
 * Il giocatore deve dichiarare esplicitamente che il trigger si è verificato
 * (il sistema non può verificarlo automaticamente — testo libero sulle carte).
 * La condizione si resetta (non giocabile) a ogni fine turno: viene rimossa
 * da conditionsTriggered quando il turno passa al giocatore successivo.
 */
export function declareConditionTrigger(state, playerId, cardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  if (state.currentPlayerIndex === pidx) {
    return { error: 'Le Condizioni si dichiarano solo durante il turno avversario.' }
  }
  const player  = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card    = villain.villainDeck.find(c => c.id === cardId)
  if (!card || card.type !== 'condition') return { error: 'Carta non è una Condizione.' }
  if (!player.hand.includes(cardId))      return { error: 'Carta non in mano.' }

  // Aggiunge la carta alla lista "trigger verificati in questo turno"
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  if (!np.conditionsTriggered) np.conditionsTriggered = []
  if (!np.conditionsTriggered.includes(cardId)) np.conditionsTriggered.push(cardId)

  let newState = { ...state, players: newPlayers }
  const card2 = villain.villainDeck.find(c => c.id === cardId)
  newState = addLog(newState, `${player.name} dichiara la Condizione "${card2?.name}" come attivata.`, 'action')
  return newState
}

export function playCondition(state, playerId, cardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  if (state.currentPlayerIndex === pidx) {
    return { error: 'Le Condizioni si giocano solo durante il turno avversario.' }
  }
  const player  = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card    = villain.villainDeck.find(c => c.id === cardId)
  if (!card || card.type !== 'condition') return { error: 'Carta non è una Condizione.' }
  if (!player.hand.includes(cardId))      return { error: 'Carta non in mano.' }

  // Può essere giocata solo se il trigger è stato dichiarato in questo turno
  if (!player.conditionsTriggered?.includes(cardId)) {
    return { error: 'Devi prima dichiarare che il trigger si è verificato.' }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  np.hand = np.hand.filter(id => id !== cardId)
  np.villainDiscard.push(cardId)
  np.conditionsTriggered = (np.conditionsTriggered || []).filter(id => id !== cardId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${player.name} attiva la Condizione "${card.name}"!`, 'action')
  return newState
}

// ─── UNDO (ANNULLA ULTIMA GIOCATA) ──────────────────────────

/**
 * Il giocatore richiede di annullare l'ultima giocata.
 * Richiede l'approvazione di tutti gli altri giocatori.
 */
export function requestUndo(state, playerId) {
  const player = getPlayerById(state, playerId)
  if (!player) return { error: 'Giocatore non trovato.' }
  if (!state.undoSnapshot) return { error: 'Nessuna giocata da annullare.' }
  if (state.undoRequest)   return { error: 'Richiesta di annullamento già in corso.' }

  const others = state.players.filter(p => p.id !== playerId)
  let newState = {
    ...state,
    undoRequest: {
      requestingPlayerId:   playerId,
      requestingPlayerName: player.name,
      approvals: [],
      denials:   [],
      required:  others.length,
    },
  }
  newState = addLog(newState, `${player.name} chiede di annullare l'ultima giocata.`, 'system')
  return newState
}

/**
 * Un altro giocatore risponde alla richiesta di undo.
 * Se tutti approvano → ripristina lo snapshot.
 * Se anche uno solo nega → cancella la richiesta.
 */
export function respondUndo(state, playerId, approved) {
  if (!state.undoRequest) return { error: 'Nessuna richiesta di annullamento in corso.' }
  const { requestingPlayerId } = state.undoRequest
  if (playerId === requestingPlayerId) {
    return { error: 'Non puoi rispondere alla tua stessa richiesta.' }
  }

  const responder = getPlayerById(state, playerId)
  const newRequest = deepClone(state.undoRequest)

  if (approved) {
    if (!newRequest.approvals.includes(playerId)) newRequest.approvals.push(playerId)
  } else {
    if (!newRequest.denials.includes(playerId)) newRequest.denials.push(playerId)
  }

  if (newRequest.denials.length > 0) {
    let newState = { ...state, undoRequest: null }
    newState = addLog(newState, `${responder?.name} ha rifiutato l'annullamento.`, 'system')
    return newState
  }

  if (newRequest.approvals.length >= newRequest.required) {
    const snapshot = state.undoSnapshot
    if (!snapshot) return { error: 'Snapshot non disponibile.' }
    const requester = getPlayerById(state, requestingPlayerId)
    // Ripristina lo snapshot: rimuove i campi meta per evitare ricorsioni
    let restoredState = { ...snapshot, undoRequest: null, undoSnapshot: null }
    restoredState = addLog(restoredState, `✅ Ultima giocata di ${requester?.name} annullata.`, 'system')
    return restoredState
  }

  return { ...state, undoRequest: newRequest }
}

// ─── FINE TURNO ─────────────────────────────────────────────

/**
 * Termina il turno corrente:
 * 1. Pesca carte fino alla dimensione mano
 * 2. Passa al giocatore successivo
 * 3. Imposta phase = 'move'
 */
export function endTurn(state) {
  const currentPlayer = getCurrentPlayer(state)

  // Pesca
  let newState = drawCards(state, currentPlayer.id)

  // Resetta conditionsTriggered per tutti i giocatori (le condizioni non giocate si azzerano)
  const resetPlayers = newState.players.map(p => ({
    ...p,
    conditionsTriggered: [],
  }))
  newState = { ...newState, players: resetPlayers }

  // Passa al prossimo giocatore
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  newState = {
    ...newState,
    currentPlayerIndex: nextIndex,
    phase: 'move',
    actionQueue: [],
    pendingFate: null,
    pendingInteraction: null,
    undoRequest: null,
    undoSnapshot: null, // resetta snapshot a ogni cambio di turno
  }

  const nextPlayer = newState.players[nextIndex]
  newState = addLog(newState, `Turno di ${nextPlayer.name}.`, 'system')

  // Verifica condizione di vittoria all'INIZIO del turno del prossimo giocatore
  if (checkWinCondition(newState, nextPlayer.id)) {
    newState = {
      ...newState,
      status: 'game_over',
      winnerId: nextPlayer.id,
    }
    newState = addLog(newState, `🏆 ${nextPlayer.name} ha vinto!`, 'win')
  }

  return newState
}

// ─── SETUP LOBBY / VILLAIN SELECT ────────────────────────────

/**
 * Crea lo state iniziale della lobby (prima della selezione villain).
 */
export function createLobbyState(hostPlayer) {
  return {
    status: 'lobby',
    players: [hostPlayer],
    log: [],
    currentPlayerIndex: 0,
    phase: null,
    actionQueue: [],
    pendingFate: null,
    pendingInteraction: null,
    winnerId: null,
  }
}

/**
 * Aggiunge un giocatore alla lobby.
 */
export function joinLobby(state, newPlayer) {
  if (state.players.length >= 6) {
    return { error: 'Lobby piena (max 6 giocatori).' }
  }
  const already = state.players.find(p => p.sessionId === newPlayer.sessionId)
  if (already) return state // già dentro

  const newState = {
    ...state,
    players: [...state.players, newPlayer],
  }
  return addLog(newState, `${newPlayer.name} si è unito alla partita.`, 'system')
}

/**
 * Il giocatore seleziona il villain.
 */
export function selectVillain(state, playerId, villainId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }

  // Villain già preso?
  const taken = state.players.some(p => p.id !== playerId && p.villainId === villainId)
  if (taken) return { error: 'Villain già scelto da un altro giocatore.' }

  const newPlayers = deepClone(state.players)
  newPlayers[pidx].villainId = villainId
  newPlayers[pidx].isReady   = true

  const villain = VILLAINS[villainId]
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${newPlayers[pidx].name} sceglie ${villain?.name || villainId}.`, 'system')
  return newState
}

/**
 * L'host avvia la partita (tutti devono aver scelto un villain).
 */
export function startGame(state) {
  const notReady = state.players.filter(p => !p.villainId || !p.isReady)
  if (notReady.length > 0) {
    return { error: 'Non tutti i giocatori hanno scelto un villain.' }
  }
  if (state.players.length < 2) {
    return { error: 'Servono almeno 2 giocatori.' }
  }

  return initializeGame(state.players)
}

// ─── EXPORT UTILS ────────────────────────────────────────────

export default {
  generateRoomCode,
  generateId,
  initializeGame,
  createLobbyState,
  joinLobby,
  selectVillain,
  startGame,
  getCurrentPlayer,
  getPlayerById,
  getPlayerIndex,
  getOpponents,
  getLocationState,
  getCardObjects,
  checkWinCondition,
  moveVillain,
  completeAction,
  gainPower,
  removePower,
  playVillainCard,
  playVillainCardToLocation,
  drawCards,
  discardCard,
  moveAllyOrItem,
  vanquish,
  startFate,
  resolveFate,
  placeFateCard,
  assignFateItem,
  declareConditionTrigger,
  playCondition,
  requestUndo,
  respondUndo,
  endTurn,
}
