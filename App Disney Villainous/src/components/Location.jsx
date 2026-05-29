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
  isVillainHere,  // il villain è attualmente posizionato qui
  isActive,       // è il mio turno + sono qui + fase action
  isStaged,       // luogo selezionato ma non ancora confermato (fase move)
  isBlocked,      // luogo dell'ultimo turno — non selezionabile
  isLocked,       // luogo bloccato — richiede unlockCard per accedere
  actionQueue,
  isMyBoard,
  onClick,
  onActionClick,
}) {
  const allCards = [...villain.villainDeck, ...villain.fateDeck]
  const findCard = (id) => allCards.find(c => c.id === id)

  // Classe bordo in base allo stato del luogo
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
                             border border-gray-700/50 px-1 rounded"
                  title="Sblocca giocando la carta richiesta">
              🔒
            </span>
          )}
          {isStaged && (
            <span className="text-[9px] text-yellow-400 font-display bg-yellow-950/60
                             border border-yellow-700/50 px-1 rounded">
              Selezionato
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
          const card = findCard(id)
          return (
            <span key={id}
                  className="text-[9px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-300
                             px-1.5 py-0.5 rounded"
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
          const card = findCard(id)
          return (
            <span key={id}
                  className="text-[9px] bg-blue-900/60 border border-blue-700/50 text-blue-300
                             px-1.5 py-0.5 rounded"
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              ⚔️ {card?.name || id} ({card?.strength ?? '?'})
            </span>
          )
        })}

        {locationState.items?.map(id => {
          const card = findCard(id)
          return (
            <span key={id}
                  className="text-[9px] bg-amber-900/60 border border-amber-700/50 text-amber-300
                             px-1.5 py-0.5 rounded"
                  title={card?.effect || id}>
              📦 {card?.name || id}
            </span>
          )
        })}

        {locationState.heroes?.map(id => {
          const card = findCard(id)
          return (
            <span key={id}
                  className="text-[9px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-300
                             px-1.5 py-0.5 rounded"
                  title={`Forza: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              🛡️ {card?.name || id} ({card?.strength ?? '?'})
            </span>
          )
        })}
      </div>
    </div>
  )
}
