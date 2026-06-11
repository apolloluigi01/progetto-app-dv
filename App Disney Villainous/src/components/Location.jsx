import { VILLAINS, ACTION_LABELS, ACTION_COLORS } from '../data/villains.js'

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
  isActive,
  isStaged,
  isBlocked,
  isLocked,
  highlightMovable,   // evidenzia il luogo perché ha alleati/oggetti spostabili
  actionQueue,
  isMyBoard,
  selectedCardId,     // id carta attualmente selezionata per spostamento
  onClick,
  onActionClick,
  onAllyItemClick,    // callback(cardId) — clicca su alleato/oggetto per spostarlo
}) {
  const allCards = [...villain.villainDeck, ...villain.fateDeck]
  const findCard = (id) => allCards.find(c => c.id === id)

  const borderClass = isLocked
    ? 'border-gray-800 bg-gray-950/50 opacity-50 cursor-not-allowed'
    : isActive
      ? 'border-green-500/70 bg-green-950/20'
      : isStaged
        ? 'border-yellow-400 bg-yellow-950/30 shadow-yellow-400/20 shadow-md'
        : isVillainHere
          ? 'border-yellow-600/50 bg-yellow-950/10'
          : isBlocked
            ? 'border-gray-800 opacity-40 cursor-not-allowed'
            : highlightMovable
              ? 'border-blue-600/50 bg-blue-950/10 cursor-pointer'
              : onClick
                ? 'border-gray-700 hover:border-gray-500 cursor-pointer hover:bg-gray-800/40'
                : 'border-gray-800'

  return (
    <div
      onClick={!isBlocked && !isLocked ? onClick : undefined}
      className={`location-tile flex flex-col gap-2 transition-all duration-150 ${borderClass}`}
    >
      {/* ── Nome luogo ── */}
      <div className="flex items-center justify-between gap-1">
        <h3 className="font-display text-xs font-bold text-gray-200 leading-tight">
          {locationDef.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {isLocked && (
            <span className="text-[9px] text-gray-500 font-display bg-gray-900/80
                             border border-gray-700/50 px-1 rounded" title="Luogo bloccato">
              🔒
            </span>
          )}
          {isStaged && (
            <span className="text-[9px] text-yellow-400 font-display bg-yellow-950/60
                             border border-yellow-700/50 px-1 rounded">
              Selezionato
            </span>
          )}
          {highlightMovable && !isStaged && (
            <span className="text-[9px] text-blue-400 font-display bg-blue-950/60
                             border border-blue-700/50 px-1 rounded">
              Seleziona
            </span>
          )}
          {isVillainHere && (
            <span className="text-base leading-none" title="Il tuo villain è qui">
              {VILLAIN_EMOJI[villain.id]}
            </span>
          )}
        </div>
      </div>

      {/* ── Chip azioni ── */}
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
              onClick={(e) => { e.stopPropagation(); onActionClick?.(i, action) }}
              disabled={covered || done || !isActive || !onActionClick}
              title={
                covered ? 'Azione coperta da un Eroe' :
                done    ? 'Completata' :
                isActive ? `Esegui: ${label}` : label
              }
              className={[
                'action-chip text-white border transition-all text-[10px]',
                covered
                  ? 'opacity-30 line-through cursor-not-allowed bg-gray-800 border-gray-700'
                  : done
                    ? `opacity-50 cursor-default ${color} border-transparent`
                    : isActive && onActionClick
                      ? `${color} border-transparent hover:opacity-90 cursor-pointer ring-1 ring-white/10`
                      : `${color} border-transparent opacity-70`,
              ].join(' ')}
            >
              {covered ? '🔒 ' : done ? '✓ ' : ''}
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Contenuto luogo ── */}
      <div className="flex flex-wrap gap-1 mt-0.5 min-h-[1rem]">

        {locationState.curses?.map(id => {
          const card    = findCard(id)
          const clickable = !!onAllyItemClick && villain.id === 'maleficent'
          const isSel   = selectedCardId === id
          return (
            <span key={id}
                  onClick={clickable ? (e) => { e.stopPropagation(); onAllyItemClick?.(id) } : undefined}
                  className={[
                    'text-[9px] px-1.5 py-0.5 rounded border transition-all',
                    isSel
                      ? 'bg-indigo-600 border-indigo-400 text-white ring-1 ring-indigo-300'
                      : 'bg-indigo-900/60 border-indigo-700/50 text-indigo-300',
                    clickable ? 'cursor-pointer hover:border-indigo-400' : '',
                  ].join(' ')}
                  title={card?.effect || id}>
              🌑 {card?.name || id}
            </span>
          )
        })}

        {locationState.wickets?.map(id => {
          const card = findCard(id)
          return (
            <span key={id}
                  className="text-[9px] bg-red-900/60 border border-red-700/50 text-red-300
                             px-1.5 py-0.5 rounded"
                  title={card?.effect || id}>
              ⬤ {card?.name || id}
            </span>
          )
        })}

        {locationState.allies?.map(id => {
          const card    = findCard(id)
          const isSel   = selectedCardId === id
          const clickable = !!onAllyItemClick
          return (
            <span key={id}
                  onClick={clickable ? (e) => { e.stopPropagation(); onAllyItemClick?.(id) } : undefined}
                  className={[
                    'text-[9px] px-1.5 py-0.5 rounded border transition-all',
                    isSel
                      ? 'bg-blue-600 border-blue-400 text-white ring-1 ring-blue-300'
                      : 'bg-blue-900/60 border-blue-700/50 text-blue-300',
                    clickable ? 'cursor-pointer hover:border-blue-400' : '',
                  ].join(' ')}
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              ⚔️ {card?.name || id} ({card?.strength ?? '?'})
            </span>
          )
        })}

        {locationState.items?.map(id => {
          const card    = findCard(id)
          const isSel   = selectedCardId === id
          const clickable = !!onAllyItemClick
          return (
            <span key={id}
                  onClick={clickable ? (e) => { e.stopPropagation(); onAllyItemClick?.(id) } : undefined}
                  className={[
                    'text-[9px] px-1.5 py-0.5 rounded border transition-all',
                    isSel
                      ? 'bg-amber-600 border-amber-400 text-white ring-1 ring-amber-300'
                      : 'bg-amber-900/60 border-amber-700/50 text-amber-300',
                    clickable ? 'cursor-pointer hover:border-amber-400' : '',
                  ].join(' ')}
                  title={card?.effect || id}>
              📦 {card?.name || id}
            </span>
          )
        })}

        {locationState.heroes?.map(id => {
          const card = findCard(id)
          // Mostra eventuali oggetti fato assegnati a questo eroe
          const assignments = locationState.fateItemAssignments || {}
          const assignedItems = Object.entries(assignments)
            .filter(([, heroId]) => heroId === id)
            .map(([itemId]) => findCard(itemId)?.name || itemId)
          return (
            <span key={id}
                  className="text-[9px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-300
                             px-1.5 py-0.5 rounded"
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              🛡️ {card?.name || id} ({card?.strength ?? '?'})
              {assignedItems.length > 0 && (
                <span className="text-amber-400"> [+{assignedItems.join(', ')}]</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
