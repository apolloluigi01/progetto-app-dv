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
  stagedLocation,     // indice luogo selezionato ma non ancora confermato (solo plancia mia)
  selectedCardId,
  onLocationClick,    // callback(idx) — Game.jsx gestisce setStagedLocation
  onActionClick,
  onHandCardClick,
}) {
  const villain = VILLAINS[player.villainId]
  if (!villain) return null

  const allCards = [...villain.villainDeck, ...villain.fateDeck]
  const findCard = (id) => allCards.find(c => c.id === id)

  // Le azioni sono attive solo se: è la mia plancia, è il mio turno, siamo in fase action
  const isActive = isMyBoard && isMyTurn && phase === 'action'

  return (
    <div className={[
      'rounded-2xl border-2 p-4 flex flex-col gap-4',
      isMyBoard
        ? 'border-yellow-600/40 bg-gray-900/60'
        : 'border-gray-800 bg-gray-900/30',
    ].join(' ')}>

      {/* ── Header: villain + stats ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{VILLAIN_EMOJI[player.villainId]}</span>
          <div>
            <p className="font-display font-bold text-sm text-gray-100">{player.name}</p>
            <p className="text-xs text-gray-500 italic">{villain.name}</p>
          </div>
          {isMyBoard && (
            <span className="text-[10px] bg-yellow-950 text-yellow-400 border border-yellow-700
                             px-2 py-0.5 rounded-full font-display">
              Tu
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="power-badge">⚡ {player.power}</span>
          <div className="text-gray-600 text-xs text-right hidden sm:block">
            <div>🃏 {player.hand?.length ?? 0} mano</div>
            <div>📚 {player.villainDeck?.length ?? 0} mazzo</div>
          </div>
        </div>
      </div>

      {/* ── Obiettivo ── */}
      <div className="text-[10px] text-gray-500 bg-gray-950/50 rounded-lg px-3 py-1.5 border border-gray-800">
        <span className="text-gray-600">Obiettivo: </span>
        <span className="text-gray-400">{villain.winCondition}</span>
      </div>

      {/* ── Plancia: 4 luoghi ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {villain.locations.map((locDef, i) => {
          const locState      = player.board.locations[i]
          const isVillainHere = player.currentLocation === i
          const isLocActive   = isActive && isVillainHere
          const isStaged      = isMyBoard && stagedLocation === i
          const isBlocked     = isMyBoard && isMyTurn && phase === 'move' && i === player.lastLocation

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
              actionQueue={isLocActive ? actionQueue : []}
              isMyBoard={isMyBoard}
              onClick={
                // clickabile solo se: mia plancia + mio turno + fase move + non bloccato
                isMyBoard && isMyTurn && phase === 'move' && !isBlocked
                  ? () => onLocationClick?.(i)
                  : undefined
              }
              onActionClick={isLocActive ? onActionClick : undefined}
            />
          )
        })}
      </div>

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

                const canPlay = isMyTurn && phase === 'action' &&
                                actionQueue?.some(a => a.type === 'play_card' && !a.done && !a.covered)
                const isSel   = selectedCardId === cardId

                return (
                  <Card
                    key={cardId}
                    card={card}
                    selected={isSel}
                    playable={canPlay && !isSel}
                    onClick={() => onHandCardClick?.(cardId)}
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
