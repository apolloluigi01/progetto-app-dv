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

// Cerca la definizione di una carta in TUTTI i mazzi di tutti i villain.
function findAnyCard(cardId) {
  for (const v of Object.values(VILLAINS)) {
    const c = v.villainDeck.find(c => c.id === cardId) || v.fateDeck.find(c => c.id === cardId)
    if (c) return c
  }
  return null
}

// Calcola la forza effettiva di un eroe considerando tutti i modificatori attivi.
// - Sonno Senza Sogni nel luogo: -2
// - Oggetti Fato assegnati (es. Spada della Verità / Polvere di Fata: +2): letti dall'effetto "+N Forza"
// - Hook: Gianni (+1 se ha Oggetti assegnati), Michele (+1 per Luogo con Eroi),
//   Wendy (+1 a tutti gli ALTRI Eroi) — questi ultimi due richiedono boardLocations.
function getHeroEffectiveStrength(heroCardId, heroCard, locationState, allCards, boardLocations = null) {
  const base = heroCard?.strength || 0
  const hasSonno = locationState.curses?.some(id => id.startsWith('mal_c_son'))
  const fateItemBonus = Object.entries(locationState.fateItemAssignments || {})
    .filter(([, hId]) => hId === heroCardId)
    .reduce((sum, [itemId]) => {
      const itemCard = allCards.find(c => c.id === itemId) || findAnyCard(itemId)
      const match = itemCard?.effect?.match(/\+(\d+) Forza/)
      return sum + (match ? parseInt(match[1]) : 0)
    }, 0)
  let bonus = 0
  // Gianni: +1 Forza se ha almeno un Oggetto assegnato
  if (heroCardId === 'fhk_gianni') {
    const hasItem = Object.values(locationState.fateItemAssignments || {}).some(hId => hId === heroCardId)
    if (hasItem) bonus += 1
  }
  if (boardLocations) {
    // Michele: +1 Forza per ogni Luogo del Reame che contiene un Eroe (incluso il suo)
    if (heroCardId === 'fhk_michele') {
      bonus += boardLocations.filter(loc => (loc.heroes?.length || 0) > 0).length
    }
    // Wendy: tutti gli ALTRI Eroi nel Reame ottengono +1 Forza
    if (heroCardId !== 'fhk_wendy' && boardLocations.some(loc => loc.heroes?.includes('fhk_wendy'))) {
      bonus += 1
    }
  }
  return Math.max(0, base - (hasSonno ? 2 : 0) + fateItemBonus + bonus)
}

// Calcola la forza effettiva di un alleato considerando i modificatori dinamici.
// - player (opzionale): serve per i buff temporanei (Signorsì Signore!: +2 fino a fine turno)
// - Oggetti villain assegnati (Sciabola +2, Scimitarra +1): letti dall'effetto "+N Forza"
function getAllyEffectiveStrength(allyId, allyCard, locationState, player = null) {
  let strength = allyCard?.strength || 0
  if (allyId.startsWith('mal_a_gra')) strength += (locationState.heroes?.length || 0)
  if (allyId.startsWith('mal_a_sin') && (locationState.curses?.length || 0) > 0) strength += 1
  // Spugna: +2 Forza se si trova alla Jolly Roger
  if (allyId === 'hk_a_spu' && locationState.id === 'jolly_roger') strength += 2
  // Oggetti villain assegnati a questo alleato (es. Sciabola)
  for (const [itemId, aId] of Object.entries(locationState.allyItemAssignments || {})) {
    if (aId === allyId) {
      const itemCard = findAnyCard(itemId)
      const match = itemCard?.effect?.match(/\+(\d+) Forza/)
      if (match) strength += parseInt(match[1])
    }
  }
  // Buff temporanei (fino a fine turno)
  if (player?.tempAllyBuffs?.[allyId]) strength += player.tempAllyBuffs[allyId]
  return Math.max(0, strength)
}

// Azioni extra concesse da Oggetti presenti in un Luogo (Capitan Uncino).
// Queste azioni non possono essere coperte dagli Eroi (stanno sulla carta, non sul Luogo).
function getItemGrantedActions(locState) {
  const granted = []
  for (const itemId of locState.items || []) {
    if (itemId.startsWith('hk_o_can')) {
      granted.push({ type: 'vanquish', fromItem: 'Cannone' })
    } else if (itemId.startsWith('hk_o_unc')) {
      granted.push({ type: 'gain_power', value: 1, fromItem: 'Uncino da Cerimonia' })
    } else if (itemId === 'hk_o_dis') {
      granted.push({ type: 'move_hero', fromItem: 'Dispositivo Ingegnoso' })
      granted.push({ type: 'move_hero', fromItem: 'Dispositivo Ingegnoso' })
    }
  }
  return granted
}

// Scarta gli oggetti villain assegnati a un alleato che lascia il gioco.
function discardAllyAttachedItems(np, allyId, locIdx) {
  const loc = np.board.locations[locIdx]
  const assignments = loc.allyItemAssignments || {}
  for (const [itemId, aId] of Object.entries(assignments)) {
    if (aId === allyId) {
      const idx = loc.items.indexOf(itemId)
      if (idx >= 0) loc.items.splice(idx, 1)
      delete loc.allyItemAssignments[itemId]
      np.villainDiscard.push(itemId)
    }
  }
}

// Verifica se una carta Fato può essere legalmente giocata sul bersaglio.
function canFateCardBePlayed(fateCard, targetPlayer) {
  if (!fateCard) return false
  if (fateCard.type === 'hero') {
    // Non giocabile se TUTTI i luoghi sono bloccati o hanno Fuoco Verde
    // (Peter Pan è gestito a parte in startFate e non passa da qui)
    const allBlocked = targetPlayer.board.locations.every(loc =>
      loc.isLocked || loc.curses?.some(id => id.startsWith('mal_c_fuo'))
    )
    return !allBlocked
  }
  if (fateCard.type === 'fate_item' && fateCard.effect?.includes('Assegna a un Eroe')) {
    return targetPlayer.board.locations.some(loc => !loc.isLocked && loc.heroes?.length > 0)
  }
  if (fateCard.type === 'fate_effect') {
    // C'era una Volta in un Sogno: serve almeno un luogo con maledizione E eroe
    if (fateCard.id?.startsWith('fmal_sogno')) {
      return targetPlayer.board.locations.some(loc =>
        loc.curses?.length > 0 && loc.heroes?.length > 0
      )
    }
    // Terribile Mal di Testa: serve almeno un Oggetto villain nel Reame di Hook
    if (fateCard.id?.startsWith('fhk_mal')) {
      return targetPlayer.board.locations.some(loc =>
        loc.items?.some(id => id.startsWith('hk_o_'))
      )
    }
    return true
  }
  return true
}

// Rimuove oggetti Fato assegnati a un eroe sconfitto (li manda nel fateDiscard).
function discardAssignedFateItems(np, heroCardId, heroLocIdx) {
  const loc = np.board.locations[heroLocIdx]
  const assignments = loc.fateItemAssignments || {}
  for (const [itemId, hId] of Object.entries(assignments)) {
    if (hId === heroCardId) {
      const idx = loc.items.indexOf(itemId)
      if (idx >= 0) loc.items.splice(idx, 1)
      delete loc.fateItemAssignments[itemId]
      np.fateDiscard.push(itemId)
    }
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
        allyItemAssignments:  {}, // { [villainItemId]: allyId } (es. Sciabola, Scimitarra)
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
    pendingFateReveal: null,           // { actorPlayerId, targetPlayerId, heroCardId }
    fateDoneThisTurn: false,
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
export function checkWinCondition(state, playerId, isTurnStart = false) {
  const player = getPlayerById(state, playerId)
  if (!player) return false
  const villain = VILLAINS[player.villainId]
  if (!villain) return false

  switch (villain.winConditionId) {
    case 'curse_all_locations': {
      // Malefica vince solo all'INIZIO del turno (moveVillain), non appena piazza le maledizioni
      if (!isTurnStart) return false
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

  // Svanire: se attivo, Malefica può restare nello stesso luogo (skippa il check)
  const svanireActive = player.svanireActive === true
  if (locationIndex === player.currentLocation && !svanireActive) {
    return { error: 'Non puoi restare nel luogo in cui ti trovi già.' }
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
  // Consuma il flag Svanire se era attivo
  if (svanireActive) newPlayers[pidx].svanireActive = false
  // Reset Forma di Drago all'inizio del nuovo turno
  if (newPlayers[pidx].dragonFormActive) newPlayers[pidx].dragonFormActive = false

  // Fuoco Verde: Malefica PUÒ spostarsi nel luogo, ma la Maledizione viene scartata all'ingresso
  let fuocoVerdeLog = ''
  if (player.villainId === 'maleficent') {
    const destLocState = newPlayers[pidx].board.locations[locationIndex]
    const fvIdx = destLocState.curses.findIndex(id => id.startsWith('mal_c_fuo'))
    if (fvIdx >= 0) {
      const fvId = destLocState.curses.splice(fvIdx, 1)[0]
      newPlayers[pidx].villainDiscard.push(fvId)
      fuocoVerdeLog = ` Fuoco Verde scartato!`
    }
  }

  // Costruisce la coda delle azioni per questo turno
  const loc = villain.locations[locationIndex]
  const locState = newPlayers[pidx].board.locations[locationIndex]
  const actionQueue = loc.actions.map((a, i) => ({
    ...a,
    index: i,
    covered: locState.coveredActionIndices.includes(i),
    done: false,
  }))
  // Azioni extra concesse da Oggetti nel Luogo (Cannone, Uncino da Cerimonia,
  // Dispositivo Ingegnoso) — mai coperte dagli Eroi
  getItemGrantedActions(locState).forEach((ga, k) => {
    actionQueue.push({ ...ga, index: loc.actions.length + k, covered: false, done: false })
  })

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'action',
    actionQueue,
  }

  const locName = villain.locations[locationIndex].name
  newState = addLog(newState, `${player.name} si sposta in "${locName}".${fuocoVerdeLog}`, 'move')

  // ── Tic Tac: se Hook si sposta nel suo luogo, scarta tutta la mano ──
  if (player.villainId === 'hook') {
    const destLocState = newPlayers[pidx].board.locations[locationIndex]
    if (destLocState.heroes.includes('fhk_tictac')) {
      const discarded = newPlayers[pidx].hand
      newPlayers[pidx].villainDiscard = [...newPlayers[pidx].villainDiscard, ...discarded]
      newPlayers[pidx].hand = []
      newState = { ...newState, players: newPlayers }
      newState = addLog(newState, `⏰ Tic Tac è qui! Capitan Uncino deve scartare tutta la sua mano (${discarded.length} carte)!`, 'fate')
    }
  }

  // Check win condition all'inizio del turno (dopo move, prima delle azioni)
  if (checkWinCondition(newState, playerId, true)) {
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
export function playVillainCardToLocation(state, playerId, cardId, locationIndex, payWithMap = false) {
  return playVillainCard(state, playerId, cardId, locationIndex, payWithMap)
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

// ─── PLAYABILITY CHECK (REGOLA "PUOI") ──────────────────────
/**
 * Verifica se una carta può essere giocata dal giocatore.
 *
 * REGOLA FONDAMENTALE: se l'effetto di una carta contiene "puoi",
 * l'azione è FACOLTATIVA — il giocatore può scegliere di non eseguirla.
 * Se "puoi" è assente, l'azione è OBBLIGATORIA — se la pre-condizione
 * non è soddisfatta, la carta NON PUÒ essere giocata.
 *
 * Ritorna { canPlay: true } oppure { canPlay: false, reason: '...' }.
 * Utile anche all'UI per visualizzare le carte non giocabili (grigie).
 */
export function canPlayCard(state, playerId, cardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { canPlay: false, reason: 'Giocatore non trovato.' }
  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card = villain.villainDeck.find(c => c.id === cardId)
  if (!card)                        return { canPlay: false, reason: 'Carta non trovata nel mazzo villain.' }
  if (!player.hand.includes(cardId)) return { canPlay: false, reason: 'Carta non in mano.' }

  // ── Verifica costo (con eventuale sconto Bastone per Malefica) ──
  let bastonBonus = 0
  if (player.villainId === 'maleficent' && (card.type === 'effect' || card.type === 'curse')) {
    const curLoc = player.board.locations[player.currentLocation]
    if (curLoc.items.includes('mal_o_bas')) bastonBonus = 1
  }
  const effectiveCost = Math.max(0, (card.cost || 0) - bastonBonus)
  if (effectiveCost > player.power) {
    // Mappa dell'Isola Che Non C'è: un Oggetto può essere pagato scartando la Mappa
    const mapAvailable = card.type === 'item' && cardId !== 'hk_o_map' &&
      player.board.locations.some(l => l.items.includes('hk_o_map'))
    if (!mapAvailable) {
      return { canPlay: false, reason: `Potere insufficiente. Costo: ${effectiveCost}${bastonBonus ? ` (ridotto da ${card.cost} per il Bastone)` : ''}, disponibile: ${player.power}.` }
    }
  }

  // ── Helper: cerca la definizione di una carta Fato in tutti i mazzi ──
  function getHeroCard(heroId) {
    for (const p of state.players) {
      const v = VILLAINS[p.villainId]
      const c = v?.fateDeck.find(fc => fc.id === heroId)
      if (c) return c
    }
    return null
  }

  // ── Shorthand per le carte nel Reame ──
  const allHeroesInRealm  = player.board.locations.flatMap(loc => loc.heroes)
  const allAlliesInRealm  = player.board.locations.flatMap(loc => loc.allies)
  const allItemsInRealm   = player.board.locations.flatMap(loc => loc.items)
  const heroesInCurrentLoc = player.board.locations[player.currentLocation]?.heroes ?? []

  // ────────────────────────────────────────────────────────────
  // JAFAR
  // ────────────────────────────────────────────────────────────

  // Lampada Magica → solo nella Caverna delle Meraviglie
  if (cardId === 'jaf_o_lam') {
    const caveIdx = villain.locations.findIndex(l => l.id === 'caverna_meraviglie')
    if (player.currentLocation !== caveIdx) {
      return { canPlay: false, reason: 'La Lampada Magica può essere giocata solo nella Caverna delle Meraviglie.' }
    }
  }

  // Sacrificio Necessario → almeno 1 Alleato o Oggetto nel Reame (obbligatorio: nessun "puoi")
  if (cardId.startsWith('jaf_e_sac')) {
    if (allAlliesInRealm.length === 0 && allItemsInRealm.length === 0) {
      return { canPlay: false, reason: 'Sacrificio Necessario: devi avere almeno un Alleato o un Oggetto nel Reame da scartare.' }
    }
  }

  // Ah, Sarei un Serpente? → Eroe con Forza ≤4 nel Luogo corrente di Jafar (obbligatorio)
  if (cardId.startsWith('jaf_e_ser')) {
    const heroCardsHere = heroesInCurrentLoc.map(getHeroCard).filter(Boolean)
    if (!heroCardsHere.some(h => (h.strength || 0) <= 4)) {
      return { canPlay: false, reason: 'Ah, Sarei un Serpente?: devi avere un Eroe con Forza 4 o inferiore nel tuo Luogo corrente.' }
    }
  }

  // Ipnotizzare → almeno 1 Eroe nel Reame (obbligatorio)
  if (cardId.startsWith('jaf_e_ipn')) {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: 'Ipnotizzare: deve esserci almeno un Eroe nel Reame da ipnotizzare.' }
    }
  }

  // ────────────────────────────────────────────────────────────
  // CAPITAN UNCINO
  // ────────────────────────────────────────────────────────────

  // Signorsì Signore! → almeno 1 Alleato nel Reame (obbligatorio)
  if (cardId.startsWith('hk_e_sig')) {
    if (allAlliesInRealm.length === 0) {
      return { canPlay: false, reason: 'Signorsì Signore!: devi avere almeno un Alleato nel Reame da spostare.' }
    }
  }

  // ────────────────────────────────────────────────────────────
  // URSULA
  // ────────────────────────────────────────────────────────────

  // Flotsam / Jetsam → almeno 1 Eroe nel Reame quando viene giocato (obbligatorio)
  if (cardId === 'urs_a_flo' || cardId === 'urs_a_jet') {
    if (allHeroesInRealm.length === 0) {
      const name = cardId === 'urs_a_flo' ? 'Flotsam' : 'Jetsam'
      return { canPlay: false, reason: `${name}: deve esserci almeno un Eroe nel Reame da spostare.` }
    }
  }

  // Opportunista → almeno 1 Oggetto o Effetto nella pila degli scarti (obbligatorio)
  if (cardId.startsWith('urs_e_opp')) {
    const hasDiscardable = player.villainDiscard.some(id => {
      const c = villain.villainDeck.find(vc => vc.id === id)
      return c && (c.type === 'item' || c.type === 'effect')
    })
    if (!hasDiscardable) {
      return { canPlay: false, reason: 'Opportunista: devi avere almeno un Oggetto o Effetto nella pila degli scarti.' }
    }
  }

  // Vortice → almeno 1 Eroe nel Reame (obbligatorio)
  if (cardId.startsWith('urs_e_vor')) {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: 'Vortice: deve esserci almeno un Eroe nel Reame da spostare.' }
    }
  }

  // ────────────────────────────────────────────────────────────
  // PRINCIPE GIOVANNI
  // ────────────────────────────────────────────────────────────

  // Imprigionare → almeno 1 Eroe nel Reame (obbligatorio)
  if (cardId.startsWith('pj_e_imp')) {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: 'Imprigionare: deve esserci almeno un Eroe nel Reame da spostare.' }
    }
  }

  // Tendere una Trappola → deve poter eseguire uno Scontro (Esegui = obbligatorio, senza "puoi")
  if (cardId.startsWith('pj_e_trap')) {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: 'Tendere una Trappola: deve esserci almeno un Eroe nel Reame per eseguire lo Scontro.' }
    }
    if (allAlliesInRealm.length === 0) {
      return { canPlay: false, reason: 'Tendere una Trappola: devi avere almeno un Alleato nel Reame per eseguire lo Scontro.' }
    }
  }

  // Intimidire → deve poter eseguire uno Scontro (obbligatorio)
  if (cardId === 'pj_e_int') {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: 'Intimidire: deve esserci almeno un Eroe nel Reame per eseguire lo Scontro.' }
    }
    if (allAlliesInRealm.length === 0) {
      return { canPlay: false, reason: 'Intimidire: devi avere almeno un Alleato nel Reame per eseguire lo Scontro.' }
    }
  }

  // ────────────────────────────────────────────────────────────
  // REGINA DI CUORI
  // ────────────────────────────────────────────────────────────

  // Tagliategli la Testa! → Eroe con Forza ≤4 nel Reame (obbligatorio)
  if (cardId.startsWith('qh_e_tes')) {
    const heroCards = allHeroesInRealm.map(getHeroCard).filter(Boolean)
    if (!heroCards.some(h => (h.strength || 0) <= 4)) {
      return { canPlay: false, reason: 'Tagliategli la Testa!: devi avere un Eroe con Forza 4 o inferiore nel Reame.' }
    }
  }

  // Tirare → Archetto in ogni Luogo (condizione esplicita nell\'effetto, obbligatoria)
  if (cardId.startsWith('qh_e_tir')) {
    const hasAllWickets = player.board.locations.every(loc => loc.wickets.length > 0)
    if (!hasAllWickets) {
      return { canPlay: false, reason: 'Tirare: devi avere almeno un Archetto in ogni Luogo del Reame.' }
    }
  }

  // ────────────────────────────────────────────────────────────
  // GENERICO: Oggetti con "Assegna a un Eroe" → almeno 1 Eroe nel Reame
  // ────────────────────────────────────────────────────────────
  if (card.type === 'item' && card.effect?.includes('Assegna a un Eroe')) {
    if (allHeroesInRealm.length === 0) {
      return { canPlay: false, reason: `"${card.name}": deve esserci almeno un Eroe nel Reame a cui assegnare questo Oggetto.` }
    }
  }

  // ────────────────────────────────────────────────────────────
  // GENERICO: Oggetti con "assegnala/o a un Alleato" → almeno 1 Alleato nel Reame
  // (Sciabola di Hook, Scimitarra di Jafar, ecc.)
  // ────────────────────────────────────────────────────────────
  if (card.type === 'item' && /[Aa]ssegnal[ao] a un Alleato/.test(card.effect || '')) {
    if (allAlliesInRealm.length === 0) {
      return { canPlay: false, reason: `"${card.name}": deve esserci almeno un Alleato nel Reame a cui assegnare questo Oggetto.` }
    }
  }

  // ────────────────────────────────────────────────────────────
  // MALEFICA: Forma di Drago → almeno un Eroe con forza effettiva ≤3 nel Reame
  // ────────────────────────────────────────────────────────────
  if (cardId.startsWith('mal_e_dra')) {
    const hasValidTarget = player.board.locations.some((loc) => {
      const hasSonno = loc.curses.some(id => id.startsWith('mal_c_son'))
      return loc.heroes.some(heroId => {
        for (const p of state.players) {
          const v = VILLAINS[p.villainId]
          const heroCard = v?.fateDeck.find(c => c.id === heroId)
          if (heroCard) {
            const forzaBase = heroCard.strength || 0
            const forzaAttuale = Math.max(0, forzaBase - (hasSonno ? 2 : 0))
            return forzaAttuale <= 3
          }
        }
        return false
      })
    })
    if (!hasValidTarget) {
      return { canPlay: false, reason: 'Forma di Drago: non ci sono Eroi con Forza ≤3 (effettiva) nel Reame da sconfiggere.' }
    }
  }

  return { canPlay: true }
}

/**
 * Azione PLAY CARD (villain card): gioca una carta dalla mano.
 * Allies/Items → si posizionano nel luogo corrente (o targetLocation per curse/wicket).
 * Effects → si risolvono e vanno nello scarto.
 * Curses/Wickets → vanno nel loro luogo designato.
 */
export function playVillainCard(state, playerId, cardId, overrideLocationIndex = null, payWithMap = false) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }

  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card = villain.villainDeck.find(c => c.id === cardId)
  if (!card) return { error: 'Carta non trovata nel mazzo villain.' }

  // Verifica giocabilità: costo, carta in mano, effetti obbligatori (regola "puoi")
  const playability = canPlayCard(state, playerId, cardId)
  if (!playability.canPlay) return { error: playability.reason }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]

  // Bastone (Malefica): riduce costo di Effetti e Maledizioni di 1 se presente nel luogo corrente
  let bastonBonus = 0
  if (player.villainId === 'maleficent' && (card.type === 'effect' || card.type === 'curse')) {
    const curLoc = player.board.locations[player.currentLocation]
    if (curLoc.items.includes('mal_o_bas')) bastonBonus = 1
  }
  const effectiveCost = Math.max(0, (card.cost || 0) - bastonBonus)

  // Spada della Verità: se nel luogo di destinazione c'è una Spada e almeno un Eroe, costo +2
  let spadaBonus = 0
  if (card.type === 'curse' && player.villainId === 'maleficent') {
    // targetLocIdx non è ancora definito qui, usiamo il luogo calcolato provvisoriamente
    const tentativeLocIdx = overrideLocationIndex ?? np.currentLocation
    const tentativeLoc = np.board.locations[tentativeLocIdx]
    if (tentativeLoc) {
      const hasSpadaWithHero = tentativeLoc.items.some(id => id.startsWith('fmal_spada')) &&
        tentativeLoc.heroes.length > 0
      if (hasSpadaWithHero) spadaBonus = 2
    }
  }
  let finalCost = Math.max(0, effectiveCost + spadaBonus)

  // ── Mappa dell'Isola Che Non C'è: paga un Oggetto scartando la Mappa ──
  let mapPaymentLog = ''
  if (payWithMap) {
    if (card.type !== 'item' || cardId === 'hk_o_map') {
      return { error: 'La Mappa può pagare solo il costo di un altro Oggetto.' }
    }
    let mapFound = false
    for (const l of np.board.locations) {
      const mIdx = l.items.indexOf('hk_o_map')
      if (mIdx >= 0) {
        l.items.splice(mIdx, 1)
        np.villainDiscard.push('hk_o_map')
        mapFound = true
        break
      }
    }
    if (!mapFound) return { error: 'La Mappa dell\'Isola Che Non C\'è non è nel tuo Reame.' }
    finalCost = 0
    mapPaymentLog = ' (costo pagato scartando la Mappa)'
  }

  if (finalCost > player.power) {
    return { error: `Potere insufficiente. Costo: ${finalCost}. Disponibile: ${player.power}.` }
  }
  // Paga il costo (già verificato in canPlayCard, integrato con Spada)
  np.power -= finalCost

  // Rimuovi dalla mano
  np.hand = np.hand.filter(id => id !== cardId)

  // Determina dove va la carta.
  // Se l'UI ha passato una scelta esplicita, la rispettiamo sempre.
  // Il targetLocation della carta è usato solo come fallback quando
  // non viene fornita nessuna scelta dalla UI.
  let targetLocIdx = overrideLocationIndex ?? np.currentLocation

  if (overrideLocationIndex === null) {
    if (card.type === 'curse' && card.targetLocation) {
      const tLocIdx = villain.locations.findIndex(l => l.id === card.targetLocation)
      if (tLocIdx >= 0) targetLocIdx = tLocIdx
    }
    if (card.type === 'wicket' && card.targetLocation) {
      const tLocIdx = villain.locations.findIndex(l => l.id === card.targetLocation)
      if (tLocIdx >= 0) targetLocIdx = tLocIdx
    }
  }

  const loc = np.board.locations[targetLocIdx]

  // Regola generale: non si possono giocare carte in un Luogo bloccato
  if (loc.isLocked && ['ally', 'item', 'curse', 'wicket'].includes(card.type)) {
    return { error: `"${villain.locations[targetLocIdx].name}" è bloccato: non puoi giocare carte qui.` }
  }

  switch (card.type) {
    case 'ally':
      loc.allies.push(cardId)
      break
    case 'item':
      loc.items.push(cardId)
      break
    case 'curse': {
      // Serena impedisce di giocare Maledizioni nel suo luogo
      const hasSerena = loc.heroes.some(id => id === 'fmal_serena')
      if (hasSerena) {
        return { error: 'Serena è in questo luogo: non è possibile giocare Maledizioni qui.' }
      }
      loc.curses.push(cardId)
      break
    }
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

  // ── Malefica: Sonno Senza Sogni → scarta se un Alleato viene GIOCATO qui (non mosso)
  if (player.villainId === 'maleficent' && card.type === 'ally') {
    const targetLoc = np.board.locations[targetLocIdx]
    const sonniInLoc = targetLoc.curses.filter(id => id.startsWith('mal_c_son'))
    if (sonniInLoc.length > 0) {
      const toDiscard = sonniInLoc[0]
      targetLoc.curses = targetLoc.curses.filter(id => id !== toDiscard)
      np.villainDiscard.push(toDiscard)
      specialLogs.push(`⚠️ Alleato giocato in un luogo con Sonno Senza Sogni: "${toDiscard}" viene scartata!`)
    }
  }

  // ── Malefica: Svanire → segna che al prossimo turno non deve muoversi
  if (cardId === 'mal_e_sva_1' || cardId === 'mal_e_sva_2' || cardId === 'mal_e_sva_3') {
    np.svanireActive = true
    specialLogs.push(`Svanire: al prossimo turno Malefica non è obbligata a spostarsi.`)
  }

  // ── Malefica: Forma di Drago → segna il flag per guadagnare 3 Potere per ogni Fato subito
  if (cardId === 'mal_e_dra_1' || cardId === 'mal_e_dra_2' || cardId === 'mal_e_dra_3') {
    np.dragonFormActive = true
    specialLogs.push(`Forma di Drago attiva: guadagnerai 3 Potere per ogni azione Fato subita fino al tuo prossimo turno.`)
  }

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

  // Ursula: Tridente → trova Re Tritone (mazzo, scarto o già in campo) e lo posiziona qui
  if (cardId === 'urs_o_tri') {
    const tritoneId = 'furs_tritone'
    let tritoneFound = false

    // 1. Cerca nel mazzo Fato
    const deckIdx = np.fateDeck.indexOf(tritoneId)
    if (deckIdx >= 0) {
      np.fateDeck.splice(deckIdx, 1)
      np.board.locations[targetLocIdx].heroes.push(tritoneId)
      updateCoveredActions(np, targetLocIdx, villain)
      specialLogs.push(`Re Tritone trovato nel mazzo Fato e posizionato al ${villain.locations[targetLocIdx].name}!`)
      tritoneFound = true
    }

    // 2. Cerca nello scarto Fato
    if (!tritoneFound) {
      const discardIdx = np.fateDiscard.indexOf(tritoneId)
      if (discardIdx >= 0) {
        np.fateDiscard.splice(discardIdx, 1)
        np.board.locations[targetLocIdx].heroes.push(tritoneId)
        updateCoveredActions(np, targetLocIdx, villain)
        specialLogs.push(`Re Tritone trovato nello scarto Fato e posizionato al ${villain.locations[targetLocIdx].name}!`)
        tritoneFound = true
      }
    }

    // 3. Già in campo → spostalo al luogo del Tridente e scarta i suoi oggetti assegnati
    if (!tritoneFound) {
      for (let li = 0; li < np.board.locations.length; li++) {
        const heroIdx = np.board.locations[li].heroes.indexOf(tritoneId)
        if (heroIdx >= 0) {
          np.board.locations[li].heroes.splice(heroIdx, 1)
          updateCoveredActions(np, li, villain)
          // Scarta tutti gli Oggetti Fato assegnati a Tritone in quel luogo
          const assignments = np.board.locations[li].fateItemAssignments || {}
          for (const [itemId, assignedHeroId] of Object.entries(assignments)) {
            if (assignedHeroId === tritoneId) {
              const itemIdx = np.board.locations[li].items.indexOf(itemId)
              if (itemIdx >= 0) np.board.locations[li].items.splice(itemIdx, 1)
              delete np.board.locations[li].fateItemAssignments[itemId]
              np.fateDiscard.push(itemId)
            }
          }
          np.board.locations[targetLocIdx].heroes.push(tritoneId)
          updateCoveredActions(np, targetLocIdx, villain)
          specialLogs.push(`Re Tritone era in campo ed è stato spostato al ${villain.locations[targetLocIdx].name}! Tutti i suoi oggetti assegnati sono stati scartati.`)
          tritoneFound = true
          break
        }
      }
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

  // ── Hook: variabili per interazioni pendenti ──
  let pendingInteractionOut = null
  let pendingFateRevealOut  = null

  // Hook: Degno Avversario → +2 Potere, rivela dal proprio mazzo Fato finché non trovi un Eroe
  if (cardId.startsWith('hk_e_deg')) {
    np.power += 2
    specialLogs.push(`Degno Avversario: +2 Potere (tot: ${np.power}).`)

    const revealedNonHero = []
    let foundHeroId = null
    let safety = np.fateDeck.length + np.fateDiscard.length
    while (safety-- > 0) {
      if (np.fateDeck.length === 0) {
        if (np.fateDiscard.length === 0) break
        np.fateDeck = shuffle([...np.fateDiscard])
        np.fateDiscard = []
      }
      const revealedId = np.fateDeck.shift()
      const fc = villain.fateDeck.find(c => c.id === revealedId)
      if (fc?.type === 'hero') { foundHeroId = revealedId; break }
      revealedNonHero.push(revealedId)
    }
    np.fateDiscard.push(...revealedNonHero)
    if (revealedNonHero.length > 0) {
      const names = revealedNonHero.map(id => villain.fateDeck.find(c => c.id === id)?.name || id).join(', ')
      specialLogs.push(`Degno Avversario: scartate ${revealedNonHero.length} carte non-Eroe (${names}).`)
    }
    if (foundHeroId === 'fhk_peter') {
      // Peter Pan rivelato → va IMMEDIATAMENTE all'Albero dell'Impiccato, anche se bloccato
      const treeIdx = np.board.locations.findIndex(l => l.id === 'albero_impiccato')
      np.board.locations[treeIdx].heroes.push('fhk_peter')
      updateCoveredActions(np, treeIdx, villain)
      specialLogs.push(`⚡ Peter Pan rivelato! Va immediatamente all'Albero dell'Impiccato (anche se bloccato).`)
    } else if (foundHeroId) {
      const heroName = villain.fateDeck.find(c => c.id === foundHeroId)?.name || foundHeroId
      pendingFateRevealOut = { actorPlayerId: playerId, targetPlayerId: playerId, heroCardId: foundHeroId }
      specialLogs.push(`Degno Avversario: rivelato "${heroName}"! Scegli dove giocarlo nel tuo Reame.`)
    } else {
      specialLogs.push(`Degno Avversario: nessun Eroe trovato nel mazzo Fato.`)
    }
  }

  // Hook: Spaventare → guarda le prime 2 carte del proprio mazzo Fato
  if (cardId.startsWith('hk_e_spa')) {
    if (np.fateDeck.length < 2 && np.fateDiscard.length > 0) {
      np.fateDeck = [...np.fateDeck, ...shuffle([...np.fateDiscard])]
      np.fateDiscard = []
    }
    const top = np.fateDeck.slice(0, Math.min(2, np.fateDeck.length))
    if (top.length === 0) {
      specialLogs.push(`Spaventare: il mazzo Fato è vuoto, nessuna carta da guardare.`)
    } else {
      pendingInteractionOut = { type: 'spaventare', playerId, cards: top }
      specialLogs.push(`Spaventare: guardi le prime ${top.length} carte del tuo mazzo Fato. Scartale entrambe o rimettile in cima.`)
    }
  }

  // Hook: Signorsì Signore! → muovi un Alleato in un Luogo adiacente sbloccato (+2 Forza fino a fine turno)
  if (cardId.startsWith('hk_e_sig')) {
    pendingInteractionOut = { type: 'signorsi', playerId }
    specialLogs.push(`Signorsì Signore!: scegli un Alleato da muovere in un Luogo adiacente sbloccato (+2 Forza fino a fine turno).`)
  }

  // Hook: Mr. Starkey → puoi muovere un Eroe dal suo Luogo a un Luogo adiacente sbloccato
  if (cardId === 'hk_a_sta') {
    const starkeyLoc = np.board.locations[targetLocIdx]
    if ((starkeyLoc.heroes?.length || 0) > 0) {
      specialLogs.push(`Mr. Starkey: puoi muovere un Eroe dal suo Luogo a un Luogo adiacente sbloccato.`)
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

  // ── Oggetto che concede azioni giocato nel Luogo corrente durante il turno:
  //    le nuove azioni diventano subito disponibili nella coda azioni
  let newActionQueue = state.actionQueue
  if (card.type === 'item' && targetLocIdx === np.currentLocation && state.phase === 'action') {
    const grantedByThisCard = getItemGrantedActions({ items: [cardId] })
    if (grantedByThisCard.length > 0) {
      const baseIdx = Math.max(-1, ...state.actionQueue.map(a => a.index)) + 1
      newActionQueue = [
        ...state.actionQueue,
        ...grantedByThisCard.map((ga, k) => ({ ...ga, index: baseIdx + k, covered: false, done: false })),
      ]
      specialLogs.push(`"${card.name}": nuova azione disponibile in questo Luogo da subito.`)
    }
  }

  let newState = {
    ...state,
    players: newPlayers,
    actionQueue: newActionQueue,
    pendingInteraction: pendingInteractionOut || state.pendingInteraction,
    pendingFateReveal: pendingFateRevealOut || state.pendingFateReveal,
  }
  const locName = villain.locations[targetLocIdx].name
  let costDesc = `costo ${finalCost}${mapPaymentLog}`
  if (bastonBonus > 0) costDesc += ` (${card.cost}-1 Bastone)`
  if (spadaBonus > 0) costDesc += ` (+2 Spada della Verità)`
  newState = addLog(newState, `${player.name} gioca "${card.name}" in "${locName}" (${costDesc}).`, 'action')

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

  // Regola generale: non si possono spostare carte in un Luogo bloccato
  if (to.isLocked) {
    return { error: 'Il luogo di destinazione è bloccato.' }
  }

  // Trova e sposta la carta
  const categories = ['allies', 'items', 'curses', 'wickets']
  let moved = false
  let movedCat = null
  for (const cat of categories) {
    const idx = from[cat].indexOf(cardId)
    if (idx >= 0) {
      from[cat].splice(idx, 1)
      to[cat].push(cardId)
      moved = true
      movedCat = cat
      break
    }
  }
  if (!moved) return { error: 'Carta non trovata nel luogo specificato.' }

  // Alleato spostato: gli oggetti assegnati (es. Sciabola) lo seguono
  if (movedCat === 'allies') {
    for (const [itemId, aId] of Object.entries(from.allyItemAssignments || {})) {
      if (aId === cardId) {
        const iIdx = from.items.indexOf(itemId)
        if (iIdx >= 0) from.items.splice(iIdx, 1)
        delete from.allyItemAssignments[itemId]
        to.items.push(itemId)
        if (!to.allyItemAssignments) to.allyItemAssignments = {}
        to.allyItemAssignments[itemId] = cardId
      }
    }
  }
  // Oggetto assegnato spostato da solo: si stacca dall'alleato
  if (movedCat === 'items' && from.allyItemAssignments?.[cardId]) {
    delete from.allyItemAssignments[cardId]
  }

  const fromName = villain.locations[fromLocationIndex].name
  const toName   = villain.locations[toLocationIndex].name
  const card = findCard(state.players[pidx].villainId, cardId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} sposta "${card?.name || cardId}" da "${fromName}" a "${toName}".`, 'action')
  return newState
}

/**
 * Muove il Corvo (mal_a_cor) durante la fase 'move', prima che Malefica si sposti.
 * Il Corvo può muoversi in QUALSIASI luogo del Reame (non solo adiacente).
 */
export function moveCorvoAlly(state, playerId, toLocIdx) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato' }
  const player = state.players[pidx]
  if (player.villainId !== 'maleficent') return { error: 'Solo Malefica può muovere il Corvo.' }
  if (state.phase !== 'move') return { error: 'Il Corvo può muoversi solo prima che Malefica si sposti.' }
  if (toLocIdx < 0 || toLocIdx >= player.board.locations.length) return { error: 'Luogo di destinazione non valido.' }

  let fromLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].allies.includes('mal_a_cor')) { fromLocIdx = i; break }
  }
  if (fromLocIdx < 0) return { error: 'Il Corvo non è presente nel Reame.' }
  if (fromLocIdx === toLocIdx) return { error: 'Scegli un luogo diverso da quello attuale del Corvo.' }

  const villain = VILLAINS[player.villainId]
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const from = np.board.locations[fromLocIdx]
  const to   = np.board.locations[toLocIdx]

  const idx = from.allies.indexOf('mal_a_cor')
  if (idx < 0) return { error: 'Il Corvo non trovato nel luogo di partenza.' }
  from.allies.splice(idx, 1)
  to.allies.push('mal_a_cor')

  const fromName = villain.locations[fromLocIdx].name
  const toName   = villain.locations[toLocIdx].name

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} sposta il Corvo da "${fromName}" a "${toName}".`, 'action')
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

  // Cerca l'Eroe in qualsiasi luogo del Reame
  let heroLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].heroes.includes(heroCardId)) {
      heroLocIdx = i
      break
    }
  }
  if (heroLocIdx < 0) {
    return { error: 'L\'Eroe non è presente nel tuo Reame.' }
  }

  // Trova il luogo di ogni alleato usato
  const allyLocOf = {}
  for (const allyId of allyCardIds) {
    for (let i = 0; i < player.board.locations.length; i++) {
      if (player.board.locations[i].allies.includes(allyId)) { allyLocOf[allyId] = i; break }
    }
  }

  // Verifica posizione alleati: stesso luogo dell'Eroe,
  // OPPURE Banda d'Arrembaggio in un Luogo adiacente (se il Luogo dell'Eroe è sbloccato)
  for (const allyId of allyCardIds) {
    const aLocIdx = allyLocOf[allyId]
    if (aLocIdx === undefined) {
      return { error: 'Alleato non trovato nel Reame.' }
    }
    if (aLocIdx === heroLocIdx) continue
    const isBanda = allyId.startsWith('hk_a_ban')
    if (isBanda && Math.abs(aLocIdx - heroLocIdx) === 1 && !player.board.locations[heroLocIdx].isLocked) continue
    const locName = villain.locations[heroLocIdx].name
    return { error: `Lo Scontro può avvenire solo tra Alleati ed Eroi nello stesso luogo (eccezione: la Banda d'Arrembaggio può colpire un Luogo adiacente sbloccato). L'Alleato non può raggiungere "${locName}".` }
  }

  // Calcola forza totale alleati (con modificatori dinamici, ognuno dal proprio Luogo)
  const totalAllyStrength = allyCardIds.reduce((sum, allyId) => {
    const ally = villain.villainDeck.find(c => c.id === allyId)
    const aLocState = player.board.locations[allyLocOf[allyId]]
    return sum + getAllyEffectiveStrength(allyId, ally, aLocState, player)
  }, 0)

  // Forza dell'Eroe: cerca in tutti i mazzi Fato di tutti i giocatori
  let heroCard = null
  for (const p of state.players) {
    const v = VILLAINS[p.villainId]
    heroCard = v?.fateDeck.find(c => c.id === heroCardId)
    if (heroCard) break
  }

  // Forza effettiva eroe (considera Sonno Senza Sogni e oggetti Fato assegnati)
  const allCards = state.players.flatMap(p => {
    const v = VILLAINS[p.villainId]
    return v ? [...v.villainDeck, ...v.fateDeck] : []
  })
  const heroStrength = getHeroEffectiveStrength(heroCardId, heroCard, player.board.locations[heroLocIdx], allCards, player.board.locations)

  if (totalAllyStrength < heroStrength) {
    return {
      error: `Forza insufficiente. Alleati: ${totalAllyStrength}, Eroe (effettiva): ${heroStrength}.`
    }
  }

  // Guardie (Malefica): richiedono almeno 2 Alleati per lo Scontro
  if (heroCard?.name === 'Guardie' && player.villainId === 'maleficent') {
    if (allyCardIds.length < 2) {
      return { error: 'Le Guardie richiedono almeno 2 Alleati per essere sconfitte con lo Scontro.' }
    }
  }

  // I Bimbi Sperduti (Hook): richiedono almeno 2 Alleati per lo Scontro
  if (heroCardId.startsWith('fhk_bimbi') && allyCardIds.length < 2) {
    return { error: 'I Bimbi Sperduti richiedono almeno 2 Alleati per essere sconfitti con lo Scontro.' }
  }

  // Schernire (Hook): gli Eroi con Schernire vanno sconfitti PRIMA degli altri
  if (player.villainId === 'hook') {
    const heroHasTaunt = Object.entries(player.board.locations[heroLocIdx].fateItemAssignments || {})
      .some(([iId, hId]) => hId === heroCardId && iId.startsWith('fhk_sch'))
    if (!heroHasTaunt) {
      const tauntedHeroExists = player.board.locations.some(loc =>
        Object.entries(loc.fateItemAssignments || {}).some(([iId, hId]) =>
          iId.startsWith('fhk_sch') && loc.heroes.includes(hId)
        )
      )
      if (tauntedHeroExists) {
        return { error: 'Schernire: devi sconfiggere prima gli Eroi con Schernire assegnato.' }
      }
    }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const nloc = np.board.locations[heroLocIdx]

  // ── Malefica: Arcolaio → guadagna Potere = forza EFFETTIVA dell'Eroe - 1
  // (calcolato PRIMA della rimozione dell'eroe, per leggere modificatori del luogo)
  let arcolaioLog = ''
  if (player.villainId === 'maleficent') {
    const arcolaioPresente = nloc.items.includes('mal_o_arc')
    if (arcolaioPresente) {
      const forzaAttuale = heroStrength // già calcolata con tutti i modificatori
      const potereGuadagnato = Math.max(0, forzaAttuale - 1)
      np.power += potereGuadagnato
      arcolaioLog = `Arcolaio: "${heroCard?.name}" forza effettiva ${forzaAttuale} → +${potereGuadagnato} Potere (tot: ${np.power}).`
    }
  }

  // Rimuovi oggetti Fato assegnati all'Eroe sconfitto
  discardAssignedFateItems(np, heroCardId, heroLocIdx)

  // Rimuovi l'Eroe dal luogo
  nloc.heroes = nloc.heroes.filter(id => id !== heroCardId)
  np.fateDiscard.push(heroCardId)

  // Rimuovi e scarta gli Alleati usati per lo Scontro (ognuno dal proprio Luogo,
  // la Banda d'Arrembaggio può trovarsi in un Luogo adiacente) + oggetti assegnati
  const discardedAllyNames = []
  for (const allyId of allyCardIds) {
    const aLocIdx = allyLocOf[allyId]
    const aLoc = np.board.locations[aLocIdx]
    discardAllyAttachedItems(np, allyId, aLocIdx)
    const idx = aLoc.allies.indexOf(allyId)
    if (idx >= 0) aLoc.allies.splice(idx, 1)
    np.villainDiscard.push(allyId)
    const allyCard = villain.villainDeck.find(c => c.id === allyId)
    discardedAllyNames.push(allyCard?.name || allyId)
  }

  // Ricalcola copertura azioni
  updateCoveredActions(newPlayers[pidx], heroLocIdx, villain)

  let newState = { ...state, players: newPlayers }
  const locName = villain.locations[heroLocIdx].name
  newState = addLog(
    newState,
    `${player.name} sconfigge "${heroCard?.name || heroCardId}" in "${locName}" (forza alleati: ${totalAllyStrength} vs ${heroStrength}). Alleati scartati: ${discardedAllyNames.join(', ')}.`,
    'action'
  )

  if (arcolaioLog) newState = addLog(newState, arcolaioLog, 'action')

  // Flora sconfitta → reset carte scoperte
  if (heroCardId === 'fmal_flora' && player.villainId === 'maleficent') {
    newPlayers[pidx].floraActive = false
    newState = { ...newState, players: newPlayers }
    newState = addLog(newState, `Flora sconfitta: Malefica torna a giocare a carte coperte.`, 'action')
  }

  // Caso speciale: Peter Pan sconfitto sulla Jolly Roger (index 0)
  if (heroCardId === 'fhk_peter' && heroLocIdx === 0) {
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

  // Pesca la prima carta
  const firstCard = target.fateDeck.splice(0, 1)
  if (firstCard.length === 0) return { error: 'Il mazzo Fato dell\'avversario è vuoto.' }

  // Se il mazzo era arrivato a 1 carta, mischia gli scarti e pesca la seconda
  if (target.fateDeck.length === 0 && target.fateDiscard.length > 0) {
    target.fateDeck   = shuffle([...target.fateDiscard])
    target.fateDiscard = []
  }
  const secondCard = target.fateDeck.splice(0, 1)
  const drawn = [...firstCard, ...secondCard]

  const actor  = getPlayerById(state, playerId)
  const targetP = getPlayerById(state, targetPlayerId)

  // ── Controllo fato nullo / carte non giocabili ──────────────
  const unplayableIds = []
  {
    const targetVillain = VILLAINS[target.villainId]
    const fateCard1 = targetVillain?.fateDeck.find(c => c.id === drawn[0])
    const fateCard2 = drawn[1] ? targetVillain?.fateDeck.find(c => c.id === drawn[1]) : null
    const can1 = canFateCardBePlayed(fateCard1, target)
    const can2 = fateCard2 ? canFateCardBePlayed(fateCard2, target) : false

    if (!can1 && !can2) {
      // Fato nullo: nessuna carta è giocabile → scarta tutto, niente scelta
      target.fateDiscard.push(...drawn)
      newPlayers[tidx] = target
      let voidState = { ...state, players: newPlayers, fateDoneThisTurn: true }
      voidState = addLog(voidState, `${actor?.name} usa Fato contro ${targetP?.name}! (pescate ${drawn.length} carte)`, 'fate')
      const n1 = fateCard1?.name || drawn[0]
      const n2 = fateCard2?.name || drawn[1] || ''
      voidState = addLog(voidState,
        `⚠️ Fato a vuoto! "${n1}"${fateCard2 ? ` e "${n2}"` : ''} non possono essere giocate (condizioni non soddisfatte). Entrambe scartate.`,
        'fate')
      return voidState
    } else if (!can1 && can2) {
      // Prima carta non giocabile: visibile ma non selezionabile
      unplayableIds.push(drawn[0])
    } else if (can1 && fateCard2 && !can2) {
      // Seconda carta non giocabile: visibile ma non selezionabile
      unplayableIds.push(drawn[1])
    }
    newPlayers[tidx] = target
  }

  // ── Meccanismo speciale Peter Pan ────────────────────────────
  // Se Peter Pan viene rivelato tra le carte pescate, deve essere
  // immediatamente giocato all'Albero dell'Impiccato (indice 3),
  // anche se bloccato. L'altra carta viene scartata.
  if (target.villainId === 'hook' && drawn.includes('fhk_peter')) {
    const otherCard   = drawn.find(id => id !== 'fhk_peter')
    const hangmanIdx  = 3  // L'Albero dell'Impiccato
    const hookVillain = VILLAINS['hook']

    target.board.locations[hangmanIdx].heroes.push('fhk_peter')
    updateCoveredActions(target, hangmanIdx, hookVillain)
    if (otherCard) target.fateDiscard.push(otherCard)

    let newState = {
      ...state,
      players: newPlayers,
      fateDoneThisTurn: true,
      // Resta in fase 'action', non si va a fate_choice
    }
    newState = addLog(newState, `${actor?.name} usa Fato contro ${targetP?.name}!`, 'fate')
    newState = addLog(newState, `⚡ Peter Pan rivelato! Va immediatamente all'Albero dell'Impiccato (anche se bloccato). Le altre carte vengono scartate.`, 'fate')
    return newState
  }

  // ── Malefica: Forma di Drago → guadagna 3 Potere se il flag è attivo sul bersaglio
  if (target.villainId === 'maleficent' && target.dragonFormActive) {
    target.power = (target.power || 0) + 3
    newPlayers[tidx] = target
  }

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'fate_choice',
    fateDoneThisTurn: true,
    pendingFate: {
      actingPlayerId: playerId,
      targetPlayerId,
      cards: drawn,
      unplayableIds,
    },
  }

  newState = addLog(
    newState,
    `${actor?.name} usa Fato contro ${targetP?.name}! (pescate ${drawn.length} carte)`,
    'fate'
  )
  if (unplayableIds.length > 0) {
    const tVillain = VILLAINS[target.villainId]
    const unplayableNames = unplayableIds.map(id => tVillain?.fateDeck.find(c => c.id === id)?.name || id).join(', ')
    newState = addLog(newState, `⚠️ "${unplayableNames}" non può essere giocata (condizioni non soddisfatte) — verrà scartata automaticamente.`, 'fate')
  }
  if (target.villainId === 'maleficent' && target.dragonFormActive) {
    newState = addLog(newState, `🐉 Forma di Drago: Malefica guadagna 3 Potere (tot: ${target.power})!`, 'fate')
  }
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

  const villain = VILLAINS[target.villainId]

  // ── Regola generale: niente carte Fato in un Luogo bloccato (eccezione: Peter Pan)
  if (loc.isLocked && cardId !== 'fhk_peter' && fateCard.type !== 'fate_effect') {
    return { error: `Il luogo è bloccato: non è possibile giocare carte qui.` }
  }

  // ── Validazione restrizioni di luogo per gli Eroi
  if (fateCard.type === 'hero') {
    // Fuoco Verde: nessun Eroe può essere giocato qui
    const hasFuocoVerde = loc.curses?.some(id => id.startsWith('mal_c_fuo'))
    if (hasFuocoVerde) {
      return { error: 'Fuoco Verde: nessun Eroe può essere giocato in questo luogo.' }
    }
    // Foresta di Rovi: solo Eroi con Forza ≥4 possono essere giocati qui
    const hasForestaDiRovi = loc.curses?.some(id => id.startsWith('mal_c_roi'))
    if (hasForestaDiRovi && (fateCard.strength || 0) < 4) {
      return { error: `Foresta di Rovi: solo Eroi con Forza ≥4 possono essere giocati qui. ${fateCard.name} ha Forza ${fateCard.strength || 0}.` }
    }
    // Peter Pan: deve essere giocato all'Albero dell'Impiccato
    if (cardId === 'fhk_peter' && target.villainId === 'hook') {
      const alberoIdx = villain?.locations.findIndex(l => l.id === 'albero_impiccato') ?? -1
      if (alberoIdx >= 0 && locationIndex !== alberoIdx) {
        return { error: `Peter Pan deve essere giocato all'Albero dell'Impiccato.` }
      }
    }
  }

  // Fate item con "Assegna a un Eroe": la location scelta deve avere almeno 1 Eroe
  if (fateCard.type === 'fate_item' && fateCard.effect?.includes('Assegna a un Eroe')) {
    if (loc.heroes.length === 0) {
      return { error: `"${fateCard.name}" deve essere assegnato a un Eroe: non ci sono Eroi in questo Luogo. Scegli un Luogo che abbia almeno un Eroe.` }
    }
  }

  switch (fateCard.type) {
    case 'hero':
      loc.heroes.push(cardId)
      break
    case 'fate_item':
      loc.items.push(cardId)
      break
    case 'fate_effect':
      target.fateDiscard.push(cardId)
      break
  }

  // Aggiorna copertura top-row se è stato aggiunto un Eroe
  if (fateCard.type === 'hero' && villain) {
    updateCoveredActions(target, locationIndex, villain)
  }

  const locName = villain?.locations[locationIndex]?.name || '?'
  const fateLogs = []

  // ── Malefica: auto-scarto Foresta di Rovi quando Eroe Forza ≥4 viene giocato lì
  if (fateCard.type === 'hero' && target.villainId === 'maleficent' && (fateCard.strength || 0) >= 4) {
    const forestaIdx = loc.curses.findIndex(id => id.startsWith('mal_c_roi'))
    if (forestaIdx >= 0) {
      const discarded = loc.curses.splice(forestaIdx, 1)[0]
      target.fateDiscard.push(discarded)
      fateLogs.push(`${fateCard.name} (Forza ${fateCard.strength}) scarta la Foresta di Rovi in "${locName}"!`)
    }
  }

  // ── Hook: Trilli → puoi scartare un Alleato dal suo Luogo (scelta gestita dalla UI)
  if (cardId === 'fhk_trilli' && target.villainId === 'hook') {
    const trilliLoc = target.board.locations[locationIndex]
    if ((trilliLoc.allies?.length || 0) > 0) {
      fateLogs.push(`Trilli: ci sono ${trilliLoc.allies.length} Alleato/i in questo Luogo. Puoi scartarne uno.`)
    }
  }

  // ── Malefica: Re Stefano → sposta Malefica (manuale)
  if (cardId === 'fmal_stefano' && target.villainId === 'maleficent') {
    fateLogs.push(`Re Stefano: scegli un luogo dove spostare Malefica. Se ha Fuoco Verde, quella Maledizione verrà scartata.`)
  }

  // ── Malefica: Principe Filippo → può scartare tutti gli Alleati nel suo luogo di arrivo
  if (cardId === 'fmal_filippo' && target.villainId === 'maleficent') {
    const filippoLoc = target.board.locations[locationIndex]
    if (filippoLoc.allies.length > 0) {
      // "può" → pending interaction per chiedere conferma
      // La rimozione effettiva avviene in resolveFilippoDiscard
      fateLogs.push(`Principe Filippo: ci sono ${filippoLoc.allies.length} Alleato/i in questo luogo. Scegli se scartarli.`)
    }
  }

  // ── Malefica: Fauna → scarta un Sonno Senza Sogni nel luogo in cui viene giocata (obbligatorio)
  if (cardId === 'fmal_fauna' && target.villainId === 'maleficent') {
    const faunaLoc = target.board.locations[locationIndex]
    const sonnoIdx = faunaLoc.curses.findIndex(id => id.startsWith('mal_c_son'))
    if (sonnoIdx >= 0) {
      const discarded = faunaLoc.curses.splice(sonnoIdx, 1)[0]
      target.fateDiscard.push(discarded)
      fateLogs.push(`Fauna scarta il Sonno Senza Sogni in "${locName}"!`)
    } else {
      fateLogs.push(`Fauna: nessun Sonno Senza Sogni in "${locName}".`)
    }
  }

  // ── Malefica: Aurora → rivela prima carta del mazzo Fato; se Eroe → piazzarlo
  let pendingFateReveal = null
  if (cardId === 'fmal_aurora' && target.villainId === 'maleficent') {
    if (target.fateDeck.length === 0 && target.fateDiscard.length > 0) {
      target.fateDeck   = shuffle([...target.fateDiscard])
      target.fateDiscard = []
    }
    if (target.fateDeck.length > 0) {
      const revealedId   = target.fateDeck[0]
      const malFateDefs  = VILLAINS['maleficent'].fateDeck
      const revealedCard = malFateDefs.find(c => c.id === revealedId)
      if (revealedCard?.type === 'hero') {
        target.fateDeck.splice(0, 1)
        pendingFateReveal = {
          actorPlayerId: state.players[state.currentPlayerIndex].id,
          targetPlayerId: target.id,
          heroCardId: revealedId,
        }
        fateLogs.push(`Aurora: rivelato "${revealedCard.name}" (Eroe)! Scegliere dove posizionarlo nel Reame di Malefica.`)
      } else {
        fateLogs.push(`Aurora: rivelato "${revealedCard?.name || revealedId}" — non è un Eroe, rimesso in cima al mazzo Fato.`)
      }
    } else {
      fateLogs.push(`Aurora: il mazzo Fato di Malefica è esaurito, nessuna carta da rivelare.`)
    }
  }

  // ── Malefica: Flora → Malefica gioca a carte scoperte finché Flora è in campo
  if (cardId === 'fmal_flora' && target.villainId === 'maleficent') {
    target.floraActive = true
    fateLogs.push(`Flora: Malefica gioca a carte scoperte finché Flora non viene sconfitta!`)
  }

  // ── Malefica: Re Uberto → puoi spostare un Alleato da un luogo adiacente nel suo luogo
  if (cardId === 'fmal_uberto' && target.villainId === 'maleficent') {
    const adjacentIndices = [locationIndex - 1, locationIndex + 1].filter(
      i => i >= 0 && i < target.board.locations.length
    )
    const alliesInAdjacentLocs = adjacentIndices.flatMap(adjIdx =>
      target.board.locations[adjIdx].allies.map(allyId => ({ allyId, fromLocIdx: adjIdx }))
    )
    if (alliesInAdjacentLocs.length > 0) {
      fateLogs.push(`Re Uberto: puoi spostare un Alleato da un luogo adiacente in "${locName}". Scegli quale.`)
    } else {
      fateLogs.push(`Re Uberto: nessun Alleato nei luoghi adiacenti da spostare.`)
    }
  }

  // ── Malefica: C'era una Volta in un Sogno → scarta una Maledizione da luogo con Eroe
  if ((cardId === 'fmal_sogno_1' || cardId === 'fmal_sogno_2') && target.villainId === 'maleficent') {
    // Trova tutti i luoghi con almeno una maledizione E almeno un eroe
    const validLocs = target.board.locations.reduce((acc, loc, idx) => {
      if (loc.curses.length > 0 && loc.heroes.length > 0) {
        loc.curses.forEach(cId => acc.push({ curseId: cId, locIdx: idx }))
      }
      return acc
    }, [])
    if (validLocs.length === 0) {
      fateLogs.push(`C'era una Volta in un Sogno: carta non utilizzabile — nessuna Maledizione in luoghi con Eroi.`)
    } else if (validLocs.length === 1) {
      // Solo un bersaglio: scarta automaticamente
      const { curseId, locIdx } = validLocs[0]
      const loc2 = target.board.locations[locIdx]
      loc2.curses = loc2.curses.filter(id => id !== curseId)
      target.villainDiscard.push(curseId)
      const malCard = villain?.villainDeck.find(c => c.id === curseId)
      fateLogs.push(`C'era una Volta in un Sogno: "${malCard?.name || curseId}" scartata da "${villain?.locations[locIdx]?.name || locIdx}"!`)
    } else {
      // Più bersagli: il giocatore deve scegliere
      fateLogs.push(`C'era una Volta in un Sogno: scegli quale Maledizione scartare (più luoghi con Eroi e Maledizioni presenti).`)
    }
  }

  let newState = {
    ...state,
    players: newPlayers,
    phase: 'action',
    pendingInteraction: null,
    pendingFateReveal: pendingFateReveal || null,
  }

  newState = addLog(
    newState,
    `"${fateCard.name}" posizionato in "${locName}" di ${target.name}.`,
    'fate'
  )
  for (const msg of fateLogs) {
    newState = addLog(newState, msg, 'fate')
  }
  return newState
}

/**
 * Posiziona l'Eroe rivelato dall'effetto di Aurora nel Reame di Malefica.
 */
export function placeRevealedHero(state, actorPlayerId, locationIndex) {
  const rev = state.pendingFateReveal
  if (!rev) return { error: 'Nessun Eroe rivelato da posizionare.' }
  if (rev.actorPlayerId !== actorPlayerId) return { error: 'Non sei il giocatore che ha attivato Aurora.' }
  const stateCleared = { ...state, pendingFateReveal: null }
  return placeFateCard(stateCleared, rev.heroCardId, rev.targetPlayerId, locationIndex)
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

// ─── CONDIZIONI (SISTEMA CONFERMA AVVERSARIO) ────────────────

/**
 * Il giocatore (non in turno) propone l'attivazione di una sua Condizione.
 * L'avversario (giocatore in turno) dovrà confermare con respondConditionActivation.
 */
export function requestConditionActivation(state, playerId, cardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  if (state.currentPlayerIndex === pidx) {
    return { error: 'Le Condizioni si attivano solo durante il turno avversario.' }
  }
  const player  = state.players[pidx]
  const villain = VILLAINS[player.villainId]
  const card    = villain.villainDeck.find(c => c.id === cardId)
  if (!card || card.type !== 'condition') return { error: 'Carta non è una Condizione.' }
  if (!player.hand.includes(cardId))      return { error: 'Carta non in mano.' }
  if (state.pendingConditionActivation)   return { error: 'C\'è già una condizione in attesa di conferma.' }

  let newState = { ...state, pendingConditionActivation: { playerId, cardId, cardName: card.name } }
  newState = addLog(newState, `${player.name} vuole attivare "${card.name}". Avversario deve confermare.`, 'condition')
  return newState
}

/**
 * Il giocatore in turno conferma o nega la condizione.
 * approved=true → effetto eseguito; approved=false → carta resta in mano.
 */
export function respondConditionActivation(state, responderId, approved) {
  const pending = state.pendingConditionActivation
  if (!pending) return { error: 'Nessuna condizione in attesa di conferma.' }
  const currentPlayerId = state.players[state.currentPlayerIndex].id
  if (responderId !== currentPlayerId) return { error: 'Solo il giocatore di turno può rispondere.' }

  if (!approved) {
    let newState = { ...state, pendingConditionActivation: null }
    newState = addLog(newState, `"${pending.cardName}": condizione negata dall'avversario. Resta in mano.`, 'condition')
    return newState
  }

  const newPlayers = deepClone(state.players)
  const pidx = newPlayers.findIndex(p => p.id === pending.playerId)
  const np = newPlayers[pidx]
  np.hand = np.hand.filter(id => id !== pending.cardId)
  np.villainDiscard.push(pending.cardId)

  const tidx = newPlayers.findIndex(p => p.id === state.players[state.currentPlayerIndex].id)
  const turnPlayer = newPlayers[tidx]
  const turnPlayerId = turnPlayer.id

  let newState = { ...state, players: newPlayers, pendingConditionActivation: null }
  let condEffect = null
  const cid = pending.cardId

  if (cid.startsWith('mal_k_tir')) {
    if (np.villainDeck.length < 3 && np.villainDiscard.length > 0) { np.villainDeck = [...np.villainDeck, ...shuffle([...np.villainDiscard])]; np.villainDiscard = [] }
    const drawn = np.villainDeck.splice(0, Math.min(3, np.villainDeck.length))
    np.hand = [...np.hand, ...drawn]
    condEffect = { type: 'discard_n_cards', playerId: pending.playerId, count: 2, discarded: 0 }
    newState = addLog(newState, `Tirannia: ${np.name} pesca ${drawn.length} carte. Deve scartarne 2.`, 'condition')
  } else if (cid.startsWith('mal_k_mal')) {
    condEffect = { type: 'defeat_hero_le4', playerId: pending.playerId }
    newState = addLog(newState, `Malignità: ${np.name} può sconfiggere un Eroe con Forza ≤4 nel suo Reame.`, 'condition')
  } else if (cid.startsWith('jaf_k_ing')) {
    condEffect = { type: 'discard_opponent_item', playerId: pending.playerId, targetPlayerId: turnPlayerId }
    newState = addLog(newState, `Inganno: ${np.name} può scartare un Oggetto dal Reame di ${turnPlayer.name}.`, 'condition')
  } else if (cid.startsWith('jaf_k_man')) {
    condEffect = { type: 'recover_from_discard', playerId: pending.playerId }
    newState = addLog(newState, `Manipolazione: ${np.name} può recuperare una carta dai propri scarti.`, 'condition')
  } else if (cid.startsWith('hk_k_ast')) {
    condEffect = { type: 'play_ally_free', playerId: pending.playerId }
    newState = addLog(newState, `Astuzia: ${np.name} può giocare un Alleato gratuitamente.`, 'condition')
  } else if (cid.startsWith('hk_k_oss')) {
    const hkVillain = VILLAINS[np.villainId]
    // Ricicla gli scarti se il mazzo Fato è esaurito
    if (np.fateDeck.length === 0 && np.fateDiscard.length > 0) {
      np.fateDeck = shuffle([...np.fateDiscard])
      np.fateDiscard = []
    }
    const discardedNonHero = []
    let foundHeroId = null
    for (const fid of np.fateDeck) {
      const fc = hkVillain.fateDeck.find(c => c.id === fid)
      if (fc?.type === 'hero') { foundHeroId = fid; break }
      discardedNonHero.push(fid)
    }
    np.fateDeck = np.fateDeck.filter(id => !discardedNonHero.includes(id) && id !== foundHeroId)
    np.fateDiscard = [...np.fateDiscard, ...discardedNonHero]
    if (foundHeroId === 'fhk_peter') {
      // Peter Pan rivelato → DEVE essere giocato immediatamente all'Albero dell'Impiccato
      const treeIdx = np.board.locations.findIndex(l => l.id === 'albero_impiccato')
      np.board.locations[treeIdx].heroes.push('fhk_peter')
      updateCoveredActions(np, treeIdx, hkVillain)
      newState = addLog(newState, `⚡ Ossessione: Peter Pan rivelato! Va immediatamente all'Albero dell'Impiccato (anche se bloccato).`, 'condition')
    } else if (foundHeroId) {
      condEffect = { type: 'ossessione_choice', playerId: pending.playerId, foundHeroId }
      const heroName = hkVillain.fateDeck.find(c => c.id === foundHeroId)?.name || foundHeroId
      newState = addLog(newState, `Ossessione: trovato "${heroName}". Scegli se giocarlo o scartarlo.`, 'condition')
    } else {
      newState = addLog(newState, `Ossessione: nessun Eroe trovato nel mazzo Fato.`, 'condition')
    }
  } else if (cid.startsWith('urs_k_arr')) {
    if (np.villainDeck.length < 3) { np.villainDeck = [...np.villainDeck, ...shuffle([...np.villainDiscard])]; np.villainDiscard = [] }
    const drawn = np.villainDeck.splice(0, Math.min(3, np.villainDeck.length))
    np.hand = [...np.hand, ...drawn]
    newState = addLog(newState, `Arroganza: ${np.name} pesca ${drawn.length} carte.`, 'condition')
  } else if (cid.startsWith('urs_k_ing')) {
    // Rivela la prima carta del mazzo Fato dell'avversario
    if (turnPlayer.fateDeck.length === 0) { turnPlayer.fateDeck = shuffle([...turnPlayer.fateDiscard]); turnPlayer.fateDiscard = [] }
    if (turnPlayer.fateDeck.length > 0) {
      const revealedCardId = turnPlayer.fateDeck.shift()
      condEffect = { type: 'fate_one_card', playerId: pending.playerId, targetPlayerId: turnPlayerId, revealedCardId }
      const fc = findFateCard(state, revealedCardId)
      newState = addLog(newState, `Inganno: rivelata "${fc?.name || revealedCardId}" dal mazzo Fato di ${turnPlayer.name}.`, 'condition')
    } else {
      newState = addLog(newState, `Inganno: mazzo Fato di ${turnPlayer.name} esaurito. Nessun effetto.`, 'condition')
    }
  } else if (cid.startsWith('pj_k_cod')) {
    condEffect = { type: 'play_ally_free', playerId: pending.playerId }
    newState = addLog(newState, `Codardia: ${np.name} può giocare un Alleato gratuitamente.`, 'condition')
  } else if (cid.startsWith('pj_k_avi')) {
    const gain = Math.min(turnPlayer.power || 0, 6)
    np.power = (np.power || 0) + gain
    newState = addLog(newState, `Avidità: ${np.name} guadagna ${gain} Potere (uguale a ${turnPlayer.name}).`, 'condition')
  } else if (cid.startsWith('qh_k_fur')) {
    np.power = (np.power || 0) + 3
    newState = addLog(newState, `Furia: ${np.name} guadagna 3 Potere.`, 'condition')
  } else if (cid.startsWith('qh_k_pro')) {
    const allyCount = turnPlayer.board.locations.reduce((sum, loc) => sum + loc.allies.length, 0)
    np.power = (np.power || 0) + allyCount
    newState = addLog(newState, `Processo: ${np.name} guadagna ${allyCount} Potere (${allyCount} Alleati di ${turnPlayer.name}).`, 'condition')
  }

  if (condEffect) newState = { ...newState, pendingConditionEffect: condEffect }
  newState = addLog(newState, `"${pending.cardName}" attivata da ${np.name}!`, 'condition')
  return newState
}

/** Risolve: scarta una carta dalla mano (Tirannia — scarta 3). */
export function conditionDiscardCard(state, playerId, cardId) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'discard_n_cards') return { error: 'Nessun effetto "scarta N carte" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore che deve scartare.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  if (!np.hand.includes(cardId)) return { error: 'Carta non in mano.' }
  np.hand = np.hand.filter(id => id !== cardId)
  np.villainDiscard.push(cardId)
  const newDiscarded = effect.discarded + 1
  const newEffect = newDiscarded >= effect.count ? null : { ...effect, discarded: newDiscarded }
  const villain = VILLAINS[np.villainId]
  const card = villain.villainDeck.find(c => c.id === cardId)
  let newState = { ...state, players: newPlayers, pendingConditionEffect: newEffect }
  newState = addLog(newState, `${np.name} scarta "${card?.name || cardId}" (${newDiscarded}/${effect.count}).`, 'action')
  return newState
}

/** Risolve: sconfiggi un Eroe con Forza ≤4 (Malignità). */
export function conditionDefeatHero(state, playerId, heroCardId) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'defeat_hero_le4') return { error: 'Nessun effetto "sconfiggi eroe" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  let heroLocIdx = -1
  for (let i = 0; i < np.board.locations.length; i++) {
    if (np.board.locations[i].heroes.includes(heroCardId)) { heroLocIdx = i; break }
  }
  if (heroLocIdx < 0) return { error: 'Eroe non trovato nel Reame.' }
  const villain = VILLAINS[np.villainId]
  const heroCard = villain.fateDeck.find(c => c.id === heroCardId)
  if ((heroCard?.strength || 0) > 4) return { error: 'L\'Eroe ha Forza > 4: Malignità può sconfiggere solo Eroi con Forza ≤4.' }
  // Rimuovi oggetti Fato assegnati all'Eroe
  discardAssignedFateItems(np, heroCardId, heroLocIdx)
  np.board.locations[heroLocIdx].heroes = np.board.locations[heroLocIdx].heroes.filter(id => id !== heroCardId)
  np.fateDiscard.push(heroCardId)
  updateCoveredActions(np, heroLocIdx, villain)
  // Flora sconfitta tramite Malignità → reset carte scoperte
  if (heroCardId === 'fmal_flora' && np.villainId === 'maleficent') {
    np.floraActive = false
  }
  let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
  newState = addLog(newState, `Malignità: "${heroCard?.name}" (Forza ${heroCard?.strength}) sconfitto!`, 'condition')
  return newState
}

/** Risolve: scarta un Oggetto dal Reame avversario (Jafar Inganno). */
export function conditionDiscardOpponentItem(state, playerId, itemCardId, targetPlayerId, locationIndex) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'discard_opponent_item') return { error: 'Nessun effetto "scarta oggetto avversario" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }
  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]
  const loc = target.board.locations[locationIndex]
  if (!loc) return { error: 'Luogo non trovato.' }
  if (!loc.items.includes(itemCardId)) return { error: 'Oggetto non in questo luogo.' }
  loc.items = loc.items.filter(id => id !== itemCardId)
  // Rimuovi eventuali assegnazioni di questo oggetto agli Eroi
  if (loc.fateItemAssignments) {
    for (const heroId of Object.keys(loc.fateItemAssignments)) {
      if (loc.fateItemAssignments[heroId] === itemCardId) delete loc.fateItemAssignments[heroId]
    }
  }
  target.villainDiscard.push(itemCardId)
  const villain = VILLAINS[target.villainId]
  const itemCard = villain?.villainDeck.find(c => c.id === itemCardId) || villain?.fateDeck.find(c => c.id === itemCardId)
  let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
  newState = addLog(newState, `Inganno: "${itemCard?.name || itemCardId}" scartato dal Reame di ${target.name}.`, 'condition')
  return newState
}

/** Risolve: recupera una carta dagli scarti (Jafar Manipolazione). */
export function conditionRecoverCard(state, playerId, cardId) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'recover_from_discard') return { error: 'Nessun effetto "recupera carta" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  if (!np.villainDiscard.includes(cardId)) return { error: 'Carta non nella pila degli scarti.' }
  np.villainDiscard = np.villainDiscard.filter(id => id !== cardId)
  np.hand.push(cardId)
  const villain = VILLAINS[np.villainId]
  const card = villain.villainDeck.find(c => c.id === cardId)
  let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
  newState = addLog(newState, `Manipolazione: "${card?.name || cardId}" recuperato dagli scarti di ${np.name}.`, 'condition')
  return newState
}

/** Risolve: gioca un Alleato gratuitamente (Astuzia/Codardia). */
export function conditionPlayAllyFree(state, playerId, allyCardId, locationIndex) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'play_ally_free') return { error: 'Nessun effetto "gioca alleato gratis" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const villain = VILLAINS[np.villainId]
  const card = villain.villainDeck.find(c => c.id === allyCardId)
  if (!card || card.type !== 'ally') return { error: 'La carta non è un Alleato.' }
  if (!np.hand.includes(allyCardId)) return { error: 'Alleato non in mano.' }
  const loc = np.board.locations[locationIndex]
  if (!loc) return { error: 'Luogo non trovato.' }
  np.hand = np.hand.filter(id => id !== allyCardId)
  loc.allies.push(allyCardId)
  const locName = villain.locations[locationIndex]?.name || '?'
  let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
  newState = addLog(newState, `${np.name} gioca "${card.name}" gratuitamente in "${locName}".`, 'condition')
  return newState
}

/** Risolve Ossessione: gioca o scarta l'Eroe trovato. */
export function conditionOssessioneResolve(state, playerId, playHero, locationIndex) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'ossessione_choice') return { error: 'Nessun effetto Ossessione in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const villain = VILLAINS[np.villainId]
  const heroCard = villain.fateDeck.find(c => c.id === effect.foundHeroId)
  if (playHero) {
    if (locationIndex === undefined || locationIndex === null) return { error: 'Scegli un luogo dove giocare l\'Eroe.' }
    const loc = np.board.locations[locationIndex]
    if (!loc) return { error: 'Luogo non trovato.' }
    if (loc.isLocked) return { error: 'Il luogo è bloccato: non è possibile giocare l\'Eroe qui.' }
    loc.heroes.push(effect.foundHeroId)
    updateCoveredActions(np, locationIndex, villain)
    const locName = villain.locations[locationIndex]?.name || '?'
    let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
    newState = addLog(newState, `Ossessione: "${heroCard?.name}" giocato in "${locName}".`, 'condition')
    return newState
  } else {
    np.fateDiscard.push(effect.foundHeroId)
    let newState = { ...state, players: newPlayers, pendingConditionEffect: null }
    newState = addLog(newState, `Ossessione: "${heroCard?.name}" scartato.`, 'condition')
    return newState
  }
}

/** Risolve Inganno Ursula: posiziona la carta Fato rivelata. */
export function conditionFateOneCard(state, playerId, locationIndex) {
  const effect = state.pendingConditionEffect
  if (!effect || effect.type !== 'fate_one_card') return { error: 'Nessun effetto "fato singolo" in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const result = placeFateCard(state, effect.revealedCardId, effect.targetPlayerId, locationIndex)
  if (result?.error) return result
  return { ...result, pendingConditionEffect: null }
}

/** Salta/chiude l'effetto condizione corrente. */
export function conditionSkipEffect(state, playerId) {
  const effect = state.pendingConditionEffect
  if (!effect) return { error: 'Nessun effetto condizione in corso.' }
  if (effect.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const player = getPlayerById(state, playerId)
  let newState = { ...state, pendingConditionEffect: null }
  newState = addLog(newState, `Effetto condizione saltato da ${player?.name || playerId}.`, 'condition')
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
  if (state.fateDoneThisTurn) return { error: 'Non si può richiedere annullamento se si è svolto un Fato.' }
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

  // Resetta conditionsTriggered e buff temporanei (es. Signorsì Signore!) per tutti i giocatori
  const resetPlayers = newState.players.map(p => ({ ...p, conditionsTriggered: [], tempAllyBuffs: {} }))
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
    pendingConditionActivation: null,
    pendingConditionEffect: null,
    pendingFateReveal: null,
    fateDoneThisTurn: false,
    undoRequest: null,
    undoSnapshot: null,
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

// ─── NUOVE FUNZIONI MALEFICA ─────────────────────────────────

/**
 * Risolve l'effetto "puoi" del Principe Filippo: scarta o meno gli Alleati nel suo luogo.
 */
export function resolveFilippoDiscard(state, actingPlayerId, targetPlayerId, locationIndex, doDiscard) {
  if (!doDiscard) {
    let newState = addLog(state, `Principe Filippo: gli Alleati rimangono in campo.`, 'fate')
    return newState
  }
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore non trovato.' }
  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]
  const loc = target.board.locations[locationIndex]
  if (!loc) return { error: 'Luogo non valido.' }
  const villain = VILLAINS[target.villainId]
  const locName = villain?.locations[locationIndex]?.name || '?'
  if (loc.allies.length === 0) {
    return addLog({ ...state, players: newPlayers }, `Principe Filippo: nessun Alleato da scartare in "${locName}".`, 'fate')
  }
  const discarded = [...loc.allies]
  loc.allies = []
  target.fateDiscard.push(...discarded)
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Principe Filippo scarta ${discarded.length} Alleato/i da "${locName}"!`, 'fate')
  return newState
}

/**
 * Re Stefano forza Malefica in un nuovo luogo (ignora Fuoco Verde, lo scarta).
 * Chiamata dall'attore Fato dopo aver scelto la destinazione.
 */
export function resolveReStefanoMove(state, actingPlayerId, targetPlayerId, destinationIndex) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }
  const target = state.players[tidx]
  if (target.villainId !== 'maleficent') return { error: 'Re Stefano si applica solo a Malefica.' }
  const villain = VILLAINS[target.villainId]
  if (destinationIndex < 0 || destinationIndex >= villain.locations.length) return { error: 'Luogo non valido.' }

  const newPlayers = deepClone(state.players)
  const nt = newPlayers[tidx]
  const destLoc = nt.board.locations[destinationIndex]
  const destName = villain.locations[destinationIndex].name

  // Sposta Malefica al nuovo luogo
  nt.lastLocation = nt.currentLocation
  nt.currentLocation = destinationIndex

  // Se nel luogo di destinazione c'è Fuoco Verde → scartalo
  const fvIdx = destLoc.curses.findIndex(id => id.startsWith('mal_c_fuo'))
  let fvLog = ''
  if (fvIdx >= 0) {
    const fvId = destLoc.curses.splice(fvIdx, 1)[0]
    nt.villainDiscard.push(fvId)
    fvLog = ` Fuoco Verde scartato da "${destName}"!`
  }

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Re Stefano sposta Malefica in "${destName}".${fvLog}`, 'fate')
  return newState
}

/**
 * Risolve l'effetto di Re Uberto: sposta un Alleato da un luogo adiacente al suo luogo.
 */
export function resolveReUbertoMove(state, actingPlayerId, targetPlayerId, allyId, fromLocIdx, toLocIdx) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }
  const target = state.players[tidx]
  if (target.villainId !== 'maleficent') return { error: 'Re Uberto si applica solo a Malefica.' }
  if (Math.abs(fromLocIdx - toLocIdx) !== 1) return { error: 'L\'Alleato deve essere in un luogo adiacente.' }

  const villain = VILLAINS[target.villainId]
  const newPlayers = deepClone(state.players)
  const nt = newPlayers[tidx]
  const from = nt.board.locations[fromLocIdx]
  const to   = nt.board.locations[toLocIdx]

  const idx = from.allies.indexOf(allyId)
  if (idx < 0) return { error: 'Alleato non trovato nel luogo indicato.' }
  from.allies.splice(idx, 1)
  to.allies.push(allyId)

  const fromName = villain.locations[fromLocIdx].name
  const toName   = villain.locations[toLocIdx].name
  const allyCard = villain.villainDeck.find(c => c.id === allyId)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Re Uberto sposta "${allyCard?.name || allyId}" da "${fromName}" a "${toName}".`, 'fate')
  return newState
}

/**
 * Risolve C'era una Volta in un Sogno: scarta la maledizione scelta.
 */
export function resolveOnceuponatime(state, actingPlayerId, targetPlayerId, curseId, locIdx) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }
  const target = state.players[tidx]
  if (target.villainId !== 'maleficent') return { error: 'Effetto applicabile solo a Malefica.' }

  const loc = target.board.locations[locIdx]
  if (!loc) return { error: 'Luogo non trovato.' }
  if (!loc.curses.includes(curseId)) return { error: 'Maledizione non trovata nel luogo indicato.' }
  if (loc.heroes.length === 0) return { error: 'Non ci sono Eroi in questo luogo.' }

  const villain = VILLAINS[target.villainId]
  const newPlayers = deepClone(state.players)
  const nt = newPlayers[tidx]
  nt.board.locations[locIdx].curses = nt.board.locations[locIdx].curses.filter(id => id !== curseId)
  nt.villainDiscard.push(curseId)

  const malCard = villain.villainDeck.find(c => c.id === curseId)
  const locName = villain.locations[locIdx].name
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `C'era una Volta in un Sogno: "${malCard?.name || curseId}" scartata da "${locName}"!`, 'fate')
  return newState
}

/**
 * Forma di Drago: sconfigge un Eroe con Forza effettiva ≤3.
 * Considera Sonno Senza Sogni (-2 forza).
 * Arcolaio: guadagna Potere = forza attuale eroe - 1.
 */
export function resolveFormadiDrago(state, playerId, heroCardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const player = state.players[pidx]
  if (player.villainId !== 'maleficent') return { error: 'Effetto solo per Malefica.' }
  const villain = VILLAINS[player.villainId]

  let heroLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].heroes.includes(heroCardId)) { heroLocIdx = i; break }
  }
  if (heroLocIdx < 0) return { error: 'Eroe non trovato nel Reame.' }

  const heroLoc = player.board.locations[heroLocIdx]
  let heroCard = null
  for (const p of state.players) {
    const v = VILLAINS[p.villainId]
    heroCard = v?.fateDeck.find(c => c.id === heroCardId)
    if (heroCard) break
  }
  const allCards = state.players.flatMap(p => {
    const v = VILLAINS[p.villainId]
    return v ? [...v.villainDeck, ...v.fateDeck] : []
  })
  const forzaAttuale = getHeroEffectiveStrength(heroCardId, heroCard, heroLoc, allCards)

  if (forzaAttuale > 3) {
    return { error: `Forma di Drago può sconfiggere solo Eroi con Forza effettiva ≤3. Forza attuale di "${heroCard?.name}": ${forzaAttuale}.` }
  }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]

  // Rimuovi oggetti Fato assegnati all'Eroe prima di rimuoverlo
  discardAssignedFateItems(np, heroCardId, heroLocIdx)

  np.board.locations[heroLocIdx].heroes = np.board.locations[heroLocIdx].heroes.filter(id => id !== heroCardId)
  np.fateDiscard.push(heroCardId)
  updateCoveredActions(np, heroLocIdx, villain)

  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Forma di Drago: "${heroCard?.name || heroCardId}" (forza effettiva ${forzaAttuale}) sconfitto!`, 'action')

  // Arcolaio: se presente nel luogo dove era l'eroe
  const arcolaioPresente = heroLoc.items.includes('mal_o_arc')
  if (arcolaioPresente) {
    const potereGuadagnato = Math.max(0, forzaAttuale - 1)
    np.power += potereGuadagnato
    newState = { ...newState, players: newPlayers }
    newState = addLog(newState, `Arcolaio: guadagni ${potereGuadagnato} Potere (forza effettiva ${forzaAttuale} - 1, tot: ${np.power}).`, 'action')
  }

  // Flora sconfitta → reset carte scoperte
  if (heroCardId === 'fmal_flora') {
    newPlayers[pidx].floraActive = false
    newState = { ...newState, players: newPlayers }
    newState = addLog(newState, `Flora sconfitta: Malefica torna a giocare a carte coperte.`, 'action')
  }

  return newState
}

// ─── NUOVE FUNZIONI CAPITAN UNCINO ───────────────────────────

/**
 * Risolve Spaventare: scarta le 2 carte guardate oppure rimettile in cima
 * nell'ordine scelto (topCardId sarà la prima carta a essere pescata).
 */
export function resolveSpaventare(state, playerId, discardBoth, topCardId = null) {
  const pi = state.pendingInteraction
  if (!pi || pi.type !== 'spaventare') return { error: 'Nessun effetto Spaventare in corso.' }
  if (pi.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const villain = VILLAINS[np.villainId]
  const cards = pi.cards

  // Rimuovi le carte guardate dalla cima del mazzo
  np.fateDeck = np.fateDeck.filter(id => !cards.includes(id))

  let msg
  if (discardBoth) {
    np.fateDiscard.push(...cards)
    const names = cards.map(id => villain.fateDeck.find(c => c.id === id)?.name || id).join(', ')
    msg = `Spaventare: ${np.name} scarta entrambe le carte guardate (${names}).`
  } else {
    let ordered = cards
    if (cards.length === 2 && topCardId && cards.includes(topCardId)) {
      ordered = [topCardId, cards.find(id => id !== topCardId)]
    }
    np.fateDeck = [...ordered, ...np.fateDeck]
    msg = `Spaventare: ${np.name} rimette le carte in cima al mazzo Fato nell'ordine scelto.`
  }

  let newState = { ...state, players: newPlayers, pendingInteraction: null }
  newState = addLog(newState, msg, 'action')
  return newState
}

/**
 * Risolve Signorsì Signore!: muove un Alleato in un Luogo adiacente sbloccato
 * e gli assegna +2 Forza fino alla fine del turno.
 */
export function resolveSignorsi(state, playerId, allyId, toLocIdx) {
  const pi = state.pendingInteraction
  if (!pi || pi.type !== 'signorsi') return { error: 'Nessun effetto Signorsì Signore! in corso.' }
  if (pi.playerId !== playerId) return { error: 'Non sei il giocatore dell\'effetto.' }
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }

  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]

  let fromLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].allies.includes(allyId)) { fromLocIdx = i; break }
  }
  if (fromLocIdx < 0) return { error: 'Alleato non trovato nel Reame.' }
  if (Math.abs(fromLocIdx - toLocIdx) !== 1) return { error: 'Devi scegliere un Luogo adiacente.' }
  if (player.board.locations[toLocIdx].isLocked) return { error: 'Il Luogo di destinazione è bloccato.' }

  // Sposta (con eventuali oggetti assegnati al seguito)
  const moved = moveAllyOrItem(state, playerId, allyId, fromLocIdx, toLocIdx)
  if (moved?.error) return moved

  const newPlayers = deepClone(moved.players)
  const np = newPlayers[pidx]
  np.tempAllyBuffs = { ...(np.tempAllyBuffs || {}), [allyId]: ((np.tempAllyBuffs || {})[allyId] || 0) + 2 }

  const allyCard = villain.villainDeck.find(c => c.id === allyId)
  let newState = { ...moved, players: newPlayers, pendingInteraction: null }
  newState = addLog(newState, `Signorsì Signore!: "${allyCard?.name || allyId}" ottiene +2 Forza fino alla fine del turno.`, 'action')
  return newState
}

/**
 * Muove un Eroe del PROPRIO Reame in un Luogo adiacente sbloccato.
 * Usato dall'azione "Muovi un Eroe" e da Mr. Starkey.
 * Gli oggetti Fato assegnati all'Eroe lo seguono.
 */
export function moveHero(state, playerId, heroCardId, toLocIdx) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]

  let fromLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].heroes.includes(heroCardId)) { fromLocIdx = i; break }
  }
  if (fromLocIdx < 0) return { error: 'Eroe non trovato nel Reame.' }
  if (toLocIdx < 0 || toLocIdx >= player.board.locations.length) return { error: 'Luogo non valido.' }
  if (Math.abs(fromLocIdx - toLocIdx) !== 1) return { error: 'Puoi muovere un Eroe solo in un Luogo adiacente.' }
  if (player.board.locations[toLocIdx].isLocked) return { error: 'Il Luogo di destinazione è bloccato.' }
  // Fuoco Verde non impedisce il movimento (solo il giocare), nessun check qui

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]
  const from = np.board.locations[fromLocIdx]
  const to   = np.board.locations[toLocIdx]

  from.heroes = from.heroes.filter(id => id !== heroCardId)
  to.heroes.push(heroCardId)

  // Oggetti Fato assegnati seguono l'Eroe
  for (const [itemId, hId] of Object.entries(from.fateItemAssignments || {})) {
    if (hId === heroCardId) {
      const iIdx = from.items.indexOf(itemId)
      if (iIdx >= 0) from.items.splice(iIdx, 1)
      delete from.fateItemAssignments[itemId]
      to.items.push(itemId)
      if (!to.fateItemAssignments) to.fateItemAssignments = {}
      to.fateItemAssignments[itemId] = heroCardId
    }
  }

  updateCoveredActions(np, fromLocIdx, villain)
  updateCoveredActions(np, toLocIdx, villain)

  const heroCard = findAnyCard(heroCardId)
  const fromName = villain.locations[fromLocIdx].name
  const toName   = villain.locations[toLocIdx].name
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `${np.name} muove l'Eroe "${heroCard?.name || heroCardId}" da "${fromName}" a "${toName}".`, 'action')
  return newState
}

/**
 * Assegna un Oggetto villain a un Alleato (Sciabola, Scimitarra...).
 * Se l'Alleato è in un altro Luogo, l'Oggetto lo raggiunge.
 */
export function assignAllyItem(state, playerId, itemCardId, allyCardId) {
  const pidx = getPlayerIndex(state, playerId)
  if (pidx < 0) return { error: 'Giocatore non trovato.' }
  const player = state.players[pidx]
  const villain = VILLAINS[player.villainId]

  let itemLocIdx = -1, allyLocIdx = -1
  for (let i = 0; i < player.board.locations.length; i++) {
    if (player.board.locations[i].items.includes(itemCardId)) itemLocIdx = i
    if (player.board.locations[i].allies.includes(allyCardId)) allyLocIdx = i
  }
  if (itemLocIdx < 0) return { error: 'Oggetto non trovato nel Reame.' }
  if (allyLocIdx < 0)  return { error: 'Alleato non trovato nel Reame.' }

  const newPlayers = deepClone(state.players)
  const np = newPlayers[pidx]

  // Se in luoghi diversi, l'oggetto raggiunge l'alleato
  if (itemLocIdx !== allyLocIdx) {
    const fromLoc = np.board.locations[itemLocIdx]
    const iIdx = fromLoc.items.indexOf(itemCardId)
    if (iIdx >= 0) fromLoc.items.splice(iIdx, 1)
    np.board.locations[allyLocIdx].items.push(itemCardId)
  }
  const loc = np.board.locations[allyLocIdx]
  if (!loc.allyItemAssignments) loc.allyItemAssignments = {}
  loc.allyItemAssignments[itemCardId] = allyCardId

  const itemCard = villain.villainDeck.find(c => c.id === itemCardId)
  const allyCard = villain.villainDeck.find(c => c.id === allyCardId)
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `"${itemCard?.name || itemCardId}" assegnato a "${allyCard?.name || allyCardId}".`, 'action')
  return newState
}

/**
 * Risolve Trilli: scarta (o no) un Alleato dal Luogo di Trilli.
 * allyId = null → nessuno scartato ("puoi").
 */
export function resolveTrilliDiscard(state, actingPlayerId, targetPlayerId, locationIndex, allyId = null) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }

  if (!allyId) {
    return addLog(state, `Trilli: nessun Alleato scartato.`, 'fate')
  }

  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]
  const loc = target.board.locations[locationIndex]
  if (!loc || !loc.allies.includes(allyId)) return { error: 'Alleato non trovato nel Luogo di Trilli.' }

  discardAllyAttachedItems(target, allyId, locationIndex)
  loc.allies = loc.allies.filter(id => id !== allyId)
  target.villainDiscard.push(allyId)

  const villain = VILLAINS[target.villainId]
  const allyCard = villain.villainDeck.find(c => c.id === allyId)
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Trilli: "${allyCard?.name || allyId}" scartato dal suo Luogo!`, 'fate')
  return newState
}

/**
 * Risolve Terribile Mal di Testa: scarta un Oggetto villain dal Reame di Hook.
 */
export function resolveMalDiTesta(state, actingPlayerId, targetPlayerId, itemId, locationIndex) {
  const tidx = getPlayerIndex(state, targetPlayerId)
  if (tidx < 0) return { error: 'Giocatore target non trovato.' }

  const newPlayers = deepClone(state.players)
  const target = newPlayers[tidx]
  const loc = target.board.locations[locationIndex]
  if (!loc || !loc.items.includes(itemId)) return { error: 'Oggetto non trovato nel Luogo indicato.' }
  if (!itemId.startsWith('hk_o_')) return { error: 'Terribile Mal di Testa può scartare solo Oggetti di Capitan Uncino.' }

  loc.items = loc.items.filter(id => id !== itemId)
  if (loc.allyItemAssignments?.[itemId]) delete loc.allyItemAssignments[itemId]
  target.villainDiscard.push(itemId)

  const villain = VILLAINS[target.villainId]
  const itemCard = villain.villainDeck.find(c => c.id === itemId)
  let newState = { ...state, players: newPlayers }
  newState = addLog(newState, `Terribile Mal di Testa: "${itemCard?.name || itemId}" scartato dal Reame di ${target.name}!`, 'fate')
  return newState
}

// ─── EXPORT UTILS ────────────────────────────────────────────

export { getHeroEffectiveStrength, getAllyEffectiveStrength }

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
  canPlayCard,
  playVillainCard,
  playVillainCardToLocation,
  drawCards,
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
  endTurn,
  resolveFilippoDiscard,
  resolveReStefanoMove,
  resolveReUbertoMove,
  resolveOnceuponatime,
  resolveFormadiDrago,
  resolveSpaventare,
  resolveSignorsi,
  moveHero,
  assignAllyItem,
  resolveTrilliDiscard,
  resolveMalDiTesta,
}
