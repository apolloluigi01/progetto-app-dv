import { VILLAINS, ACTION_LABELS, ACTION_COLORS, CARD_TYPE_LABELS } from '../data/villains.js'

const VILLAIN_EMOJI = {
  maleficent:      '🧙‍♀️',
  jafar:           '🐍',
  hook:            '🏴‍☠️',
  ursula:          '🐙',
  prince_john:     '👑',
  queen_of_hearts: '🃏',
}

export default function Location({
  villain,
  locationDef,
  locationState,
  isVillainHere,
  isActive,       // true se il villain è qui E è il tuo turno (puoi eseguire azioni)
  actionQueue,    // array di azioni con { done, covered, index, type, value }
  isMyBoard,
  onClick,        // click sul luogo (per spostamento)
  onActionClick,  // click su un'azione (per eseguirla)
  onCardInLocationClick: onCardClick,    // click su una carta nel luogo
}) {
  const allCards = [
    ...villain.villainDeck,
    ...villain.fateDeck,
  ]
  const findCard = (id) => allCards.find(c => c.id === id)

  return (
    <div
      onClick={onClick}
      className={[
        'location-tile flex flex-col gap-2',
        isVillainHere ? 'location-villain-here' : '',
        isActive       ? 'location-active cursor-default' : onClick ? 'cursor-pointer hover:border-gray-500' : '',
      ].join(' ')}
    >
      {/* Nome luogo + villain indicator */}
      <div className="flex items-center justify-between gap-1">
        <h3 className="font-display text-xs font-bold text-gray-200 leading-tight">
          {locationDef.name}
        </h3>
        {isVillainHere && (
          <span className="text-lg leading-none" title="Il tuo villain è qui">
            {VILLAIN_EMOJI[villain.id]}
          </span>
        )}
      </div>

      {/* Azioni */}
      <div className="flex flex-wrap gap-1">
        {locationDef.actions.map((action, i) => {
          const qAction  = actionQueue?.find(a => a.index === i)
          const covered  = locationState.coveredActionIndices?.includes(i)
          const done     = qAction?.done || false
          const label    = ACTION_LABELS[action.type]?.(action) ?? action.type
          const color    = ACTION_COLORS[action.type] ?? 'bg-gray-700'

          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                onActionClick?.(i, action)
              }}
              disabled={covered || done || !isActive || !onActionClick}
              className={[
                'action-chip text-white border transition-all text-[10px]',
                covered ? 'opacity-30 line-through cursor-not-allowed bg-gray-800 border-gray-700' :
                done    ? 'opacity-50 cursor-default ' + color + ' border-transparent' :
                isActive && onActionClick ? color + ' border-transparent hover:opacity-90 cursor-pointer' :
                color + ' border-transparent opacity-70',
              ].join(' ')}
              title={covered ? 'Azione coperta da un Eroe' : done ? 'Azione completata' : label}
            >
              {covered && '🔒 '}
              {done && '✓ '}
              {label}
            </button>
          )
        })}
      </div>

      {/* Contenuto luogo: curse, wicket, allies, items, heroes */}
      <div className="flex flex-wrap gap-1 mt-1">
        {locationState.curses?.map(id => {
          const card = findCard(id)
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onCardClick?.(id) }}
                  className="text-[9px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300
                             px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-800/60"
                  title={card?.effect || id}>
              🌑 {card?.name || id}
            </span>
          )
        })}

        {locationState.wickets?.map(id => {
          const card = findCard(id)
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onCardClick?.(id) }}
                  className="text-[9px] bg-red-900/60 border border-red-700/50 text-red-300
                             px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-800/60"
                  title={card?.effect || id}>
              ⬤ {card?.name || id}
            </span>
          )
        })}

        {locationState.allies?.map(id => {
          const card = findCard(id)
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onCardClick?.(id) }}
                  className="text-[9px] bg-blue-900/60 border border-blue-700/50 text-blue-300
                             px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-800/60"
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              ⚔️ {card?.name || id} ({card?.strength ?? '?'})
            </span>
          )
        })}

        {locationState.items?.map(id => {
          const card = findCard(id)
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onCardClick?.(id) }}
                  className="text-[9px] bg-amber-900/60 border border-amber-700/50 text-amber-300
                             px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-800/60"
                  title={card?.effect || id}>
              📦 {card?.name || id}
            </span>
          )
        })}

        {locationState.heroes?.map(id => {
          const card = findCard(id)
          return (
            <span key={id} onClick={(e) => { e.stopPropagation(); onCardClick?.(id) }}
                  className="text-[9px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-300
                             px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-800/60"
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              🛡️ {card?.name || id} ({card?.strength ?? '?'})
            </span>
          )
        })}
      </div>
    </div>
  )
}
