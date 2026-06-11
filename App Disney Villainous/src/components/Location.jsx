import { useState } from 'react'
import { VILLAINS, ACTION_LABELS, ACTION_COLORS, CARD_TYPE_COLORS, CARD_TYPE_LABELS } from '../data/villains.js'

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
  const [detailCard, setDetailCard] = useState(null)

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
    <>
    {detailCard && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setDetailCard(null)}
      >
        <div
          className="bg-gray-900 border border-gray-600 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <span className={`${CARD_TYPE_COLORS[detailCard.type] || 'bg-gray-800 text-gray-300'} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide`}>
                {CARD_TYPE_LABELS[detailCard.type] || detailCard.type}
              </span>
              <h2 className="font-display font-bold text-white text-lg mt-1.5 leading-tight">{detailCard.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                {detailCard.cost != null && <span className="text-yellow-400">⚡ Costo: <strong>{detailCard.cost}</strong></span>}
                {detailCard.strength != null && <span className="text-red-400">⚔️ Forza: <strong>{detailCard.strength}</strong></span>}
              </div>
            </div>
            <button onClick={() => setDetailCard(null)} className="text-gray-500 hover:text-gray-200 text-xl leading-none shrink-0 transition-colors">✕</button>
          </div>
          {detailCard.effect ? (
            <div className="bg-gray-800/60 rounded-xl px-4 py-3 mb-3">
              <p className="text-[10px] text-gray-500 font-display uppercase tracking-wider mb-1.5">Effetto</p>
              <p className="text-sm text-gray-200 leading-relaxed">{detailCard.effect}</p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm italic mb-3">Nessun effetto testuale.</p>
          )}
          {detailCard.targetLocation && (
            <p className="text-xs text-indigo-400 mb-3">→ Luogo: <strong>{detailCard.targetLocation.replace(/_/g, ' ')}</strong></p>
          )}
          <button onClick={() => setDetailCard(null)} className="w-full btn-secondary text-sm py-2">Chiudi</button>
        </div>
      </div>
    )}
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
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
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
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
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
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
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
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
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
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
              {assignedItems.length > 0 && (
                <span className="text-amber-400"> [+{assignedItems.join(', ')}]</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
    </>
  )
}
