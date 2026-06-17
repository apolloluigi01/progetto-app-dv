import { useState } from 'react'
import { VILLAINS } from '../data/villains.js'
import Location from './Location.jsx'
import Card from './Card.jsx'

const VILLAIN_EMOJI = {
  maleficent:      '🧙‍♀️',
  jafar:           '🐍',
  hook:            '🏴‍☠️',
  ursula:          '🐙',
  prince_john:     '👑',
  queen_of_hearts: '🃏',
}

export default function PlayerBoard({
  player,
  isMyBoard,
  isMyTurn,
  phase,
  actionQueue,
  stagedLocation,
  activeMode,         // modalità UI corrente passata da Game.jsx
  selectedCardId,     // carta evidenziata (per spostamento o scarto in attesa conferma)
  onLocationClick,
  onActionClick,
  onHandCardClick,
  onAllyItemClick,    // callback(cardId, fromLocIdx) — attivo in move_ally_pick
}) {
  const villain = VILLAINS[player.villainId]
  if (!villain) return null

  const allCards = [...villain.villainDeck, ...villain.fateDeck]
  const findCard = (id) => allCards.find(c => c.id === id)

  const [discardOpen, setDiscardOpen] = useState(null) // null | 'villain' | 'fate'

  const isActive = isMyBoard && isMyTurn && phase === 'action'

  function isLocClickable(i, locState) {
    if (!onLocationClick) return false
    if (locState.isLocked) return false
    if (!isMyBoard) return true // plancia avversario: fate_resolve o condition fate
    // Corvo: può muoversi in QUALSIASI luogo (anche quello di Malefica) — check prima di 'move'
    if (activeMode === 'corvo_dest_pick') return true
    // Queste modalità richiedono click su luogo anche durante la fase di move (azioni Corvo)
    if (activeMode === 'play_ally_location' || activeMode === 'move_ally_dest') return true
    // Condizioni: selezione luogo per alleato gratuito o Ossessione
    if (activeMode === 'cond_play_ally_location' || activeMode === 'cond_ossessione_location') return true
    if (phase === 'move') return i !== player.currentLocation || player.svanireActive === true
    return false
  }

  return (
    <div className={[
      'rounded-2xl border-2 p-4 flex flex-col gap-4',
      isMyBoard ? 'border-yellow-600/40 bg-gray-900/60' : 'border-gray-800 bg-gray-900/30',
    ].join(' ')}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{VILLAIN_EMOJI[player.villainId]}</span>
          <div>
            <p className="font-display font-bold text-sm text-gray-100">{player.name}</p>
            <p className="text-xs text-gray-500 italic">{villain.name}</p>
          </div>
          {isMyBoard && (
            <span className="text-[10px] bg-yellow-950 text-yellow-400 border border-yellow-700
                             px-2 py-0.5 rounded-full font-display">Tu</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="power-badge">⚡ {player.power}</span>
          <div className="text-gray-600 text-xs text-right hidden sm:block">
            <div>🃏 {player.hand?.length ?? 0} mano</div>
            <div>📚 {player.villainDeck?.length ?? 0} mazzo</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setDiscardOpen(d => d === 'villain' ? null : 'villain')}
              className="text-[10px] px-2 py-0.5 rounded border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500"
              title="Pila scarti Villain"
            >
              🗑️V {player.villainDiscard?.length ?? 0}
            </button>
            <button
              onClick={() => setDiscardOpen(d => d === 'fate' ? null : 'fate')}
              className="text-[10px] px-2 py-0.5 rounded border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500"
              title="Pila scarti Fato"
            >
              🗑️F {player.fateDiscard?.length ?? 0}
            </button>
          </div>
        </div>
      </div>

      {/* ── Obiettivo ── */}
      <div className="text-[10px] text-gray-500 bg-gray-950/50 rounded-lg px-3 py-1.5 border border-gray-800">
        <span className="text-gray-600">Obiettivo: </span>
        <span className="text-gray-400">{villain.winCondition}</span>
      </div>

      {/* ── Luoghi ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {villain.locations.map((locDef, i) => {
          const locState      = player.board.locations[i]
          const isVillainHere = player.currentLocation === i
          const isLocActive   = isActive && isVillainHere
          const isStaged      = isMyBoard && stagedLocation === i
          const isBlocked     = isMyBoard && isMyTurn && phase === 'move' && i === player.currentLocation && activeMode !== 'corvo_dest_pick' && player.svanireActive !== true
          const isLocked      = locState.isLocked === true
          const clickable     = isLocClickable(i, locState)

          // In move_ally_pick: evidenzia luoghi con alleati/oggetti
          const highlightMovable = isMyBoard && activeMode === 'move_ally_pick' &&
            (locState.allies.length > 0 || locState.items.length > 0 ||
             (villain.id === 'maleficent' && locState.curses.length > 0))

          return (
            <Location
              key={locDef.id}
              villain={villain}
              locationDef={locDef}
              locationState={locState}
              isVillainHere={isVillainHere}
              isActive={isLocActive}
              isStaged={isStaged}
              isBlocked={isBlocked}
              isLocked={isLocked}
              highlightMovable={highlightMovable}
              actionQueue={isLocActive ? actionQueue : []}
              isMyBoard={isMyBoard}
              selectedCardId={selectedCardId}
              onClick={clickable ? () => onLocationClick?.(i) : undefined}
              onActionClick={isLocActive ? onActionClick : undefined}
              onAllyItemClick={onAllyItemClick ? (cardId) => onAllyItemClick(cardId, i) : undefined}
            />
          )
        })}
      </div>

      {/* ── Pile degli scarti (visualizzazione) ── */}
      {discardOpen && (() => {
        const isVillain = discardOpen === 'villain'
        const pile = isVillain ? (player.villainDiscard || []) : (player.fateDiscard || [])
        const title = isVillain ? 'Scarti Villain' : 'Scarti Fato'
        return (
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-display text-gray-400 uppercase tracking-wider">
                🗑️ {title} — {player.name} ({pile.length} carte)
              </p>
              <button onClick={() => setDiscardOpen(null)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
            </div>
            {pile.length === 0 ? (
              <p className="text-gray-600 text-xs italic">Pila vuota.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[...pile].reverse().map((cardId, idx) => {
                  const card = findCard(cardId)
                  if (!card) return <span key={idx} className="text-gray-600 text-xs">{cardId}</span>
                  return <Card key={idx} card={card} small showEffect={false} />
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Mano (solo sulla propria plancia) ── */}
      {isMyBoard && (
        <div>
          <p className="text-xs text-gray-600 font-display uppercase tracking-wider mb-2">
            La tua mano ({player.hand?.length ?? 0} carte)
          </p>
          {player.hand?.length === 0 ? (
            <p className="text-gray-700 text-xs italic">Nessuna carta in mano.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {player.hand?.map(cardId => {
                const card = findCard(cardId)
                if (!card) return null

                const isCondition = card.type === 'condition'

                // Condizioni non giocabili in play_card; carte OK in discard_mode
                // Durante il turno avversario: condizioni scartabili tramite effetto condizione
                const isClickableMyTurn = isMyTurn && (activeMode === 'play_card' || activeMode === 'discard_mode')
                  && (activeMode !== 'play_card' || !isCondition)
                const isClickableCondEffect =
                  !isMyTurn && (
                    (activeMode === 'cond_discard_cards') ||
                    (activeMode === 'cond_play_ally_pick' && card.type === 'ally')
                  )
                const effectivelyClickable = isClickableMyTurn || isClickableCondEffect

                const isSel = selectedCardId === cardId

                return (
                  <Card
                    key={cardId}
                    card={card}
                    selected={isSel}
                    playable={effectivelyClickable && !isSel}
                    dimmed={isCondition && isMyTurn && activeMode !== 'discard_mode'}
                    onClick={effectivelyClickable ? () => onHandCardClick?.(cardId) : undefined}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
