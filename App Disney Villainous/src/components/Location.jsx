import { useState } from 'react'
import { VILLAINS, ACTION_LABELS, ACTION_COLORS, CARD_TYPE_COLORS, CARD_TYPE_LABELS } from '../data/villains.js'
import { getHeroEffectiveStrength, getAllyEffectiveStrength } from '../engine/gameEngine.js'

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
  player,             // giocatore proprietario della plancia (per buff/modificatori globali)
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
        {/* Azioni extra concesse da Oggetti nel Luogo (Cannone, Uncino da Cerimonia, Dispositivo) */}
        {(actionQueue || []).filter(a => a.index >= locationDef.actions.length).map(a => {
          const label = ACTION_LABELS[a.type]?.(a) ?? a.type
          const color = ACTION_COLORS[a.type] ?? 'bg-gray-700'
          return (
            <button
              key={`extra-${a.index}`}
              onClick={(e) => { e.stopPropagation(); onActionClick?.(a.index, a) }}
              disabled={a.done || !isActive || !onActionClick}
              title={a.done ? 'Completata' : `${label} (da "${a.fromItem}")`}
              className={[
                'action-chip text-white border transition-all text-[10px]',
                a.done
                  ? `opacity-50 cursor-default ${color} border-transparent`
                  : isActive && onActionClick
                    ? `${color} border-amber-400/60 hover:opacity-90 cursor-pointer ring-1 ring-amber-300/30`
                    : `${color} border-amber-400/40 opacity-70`,
              ].join(' ')}
            >
              {a.done ? '✓ ' : '📦 '}
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
          // Forza effettiva con modificatori dinamici
          const effStrength = card ? getAllyEffectiveStrength(id, card, locationState, player) : null
          const mods = []
          if (card && id.startsWith('mal_a_gra') && locationState.heroes?.length > 0)
            mods.push(`+${locationState.heroes.length} eroi`)
          if (card && id.startsWith('mal_a_sin') && locationState.curses?.length > 0)
            mods.push('+1 malediz.')
          if (card && id === 'hk_a_spu' && locationState.id === 'jolly_roger')
            mods.push('+2 Jolly Roger')
          if (card && player?.tempAllyBuffs?.[id])
            mods.push(`+${player.tempAllyBuffs[id]} fino a fine turno`)
          const attachedAllyItems = Object.entries(locationState.allyItemAssignments || {})
            .filter(([, aId]) => aId === id)
          for (const [itemId] of attachedAllyItems) {
            const itemCard = findCard(itemId)
            const match = itemCard?.effect?.match(/\+(\d+) Forza/)
            if (match) mods.push(`+${match[1]} ${itemCard.name}`)
          }
          const strengthLabel = effStrength !== null
            ? `${effStrength}${mods.length ? ` [${mods.join(', ')}]` : ''}`
            : '?'
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
                  title={`Forza base: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              ⚔️ {card?.name || id} ({strengthLabel})
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
              {/* Oggetti villain assegnati a questo alleato (es. Sciabola) */}
              {attachedAllyItems.map(([itemId]) => {
                const itemCard = findCard(itemId)
                return (
                  <span key={itemId} className="ml-1 text-amber-300 text-[8px] bg-amber-900/50 border border-amber-700/50 rounded px-1">
                    📦 {itemCard?.name || itemId}
                  </span>
                )
              })}
            </span>
          )
        })}

        {/* Oggetti villain (amber) e oggetti fato NON assegnati (teal) */}
        {locationState.items?.map(id => {
          const card    = findCard(id)
          const isSel   = selectedCardId === id
          const clickable = !!onAllyItemClick
          // Verifica se è un oggetto fato (nella fateDeck) o oggetto villain
          const isFateItem = card?.type === 'fate_item'
          // Se è un oggetto fato già assegnato a un eroe: non mostrarlo qui (appare sull'eroe)
          const assignments = locationState.fateItemAssignments || {}
          const isAssigned = isFateItem && Object.keys(assignments).includes(id)
          if (isAssigned) return null
          // Se è un oggetto villain assegnato a un alleato (es. Sciabola): appare sull'alleato
          if (Object.keys(locationState.allyItemAssignments || {}).includes(id)) return null
          return (
            <span key={id}
                  onClick={clickable ? (e) => { e.stopPropagation(); onAllyItemClick?.(id) } : undefined}
                  className={[
                    'text-[9px] px-1.5 py-0.5 rounded border transition-all',
                    isFateItem
                      ? isSel
                        ? 'bg-cyan-600 border-cyan-400 text-white ring-1 ring-cyan-300'
                        : 'bg-cyan-900/60 border-cyan-600/60 text-cyan-200'
                      : isSel
                        ? 'bg-amber-600 border-amber-400 text-white ring-1 ring-amber-300'
                        : 'bg-amber-900/60 border-amber-700/50 text-amber-300',
                    clickable ? 'cursor-pointer hover:border-amber-400' : '',
                  ].join(' ')}
                  title={`${isFateItem ? '🔮 Oggetto Fato (non assegnato) — ' : ''}${card?.effect || id}`}>
              {isFateItem ? '🔮' : '📦'} {card?.name || id}
              {isFateItem && <span className="ml-0.5 text-cyan-500 text-[8px]"> (Fato)</span>}
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
            </span>
          )
        })}

        {locationState.heroes?.map(id => {
          const card = findCard(id)
          const assignments = locationState.fateItemAssignments || {}
          // Calcola forza effettiva e modificatori
          const allCardsFlat = [...villain.villainDeck, ...villain.fateDeck]
          const boardLocations = player?.board?.locations || null
          const effStrength = card ? getHeroEffectiveStrength(id, card, locationState, allCardsFlat, boardLocations) : null
          const mods = []
          if (locationState.curses?.some(cid => cid.startsWith('mal_c_son'))) mods.push('-2 Sonno')
          if (id === 'fhk_gianni' && Object.values(locationState.fateItemAssignments || {}).includes(id)) mods.push('+1 Oggetto')
          if (id === 'fhk_michele' && boardLocations) {
            const n = boardLocations.filter(l => (l.heroes?.length || 0) > 0).length
            if (n > 0) mods.push(`+${n} Luoghi con Eroi`)
          }
          if (id !== 'fhk_wendy' && boardLocations?.some(l => l.heroes?.includes('fhk_wendy'))) mods.push('+1 Wendy')
          const assignedEntries = Object.entries(assignments).filter(([, hId]) => hId === id)
          for (const [itemId] of assignedEntries) {
            const itemCard = allCardsFlat.find(c => c.id === itemId)
            if (itemCard) {
              const match = itemCard.effect?.match(/\+(\d+) Forza/)
              if (match) mods.push(`+${match[1]} ${itemCard.name}`)
            }
          }
          const strengthLabel = effStrength !== null
            ? `${effStrength}${mods.length ? ` [${mods.join(', ')}]` : ''}`
            : '?'
          return (
            <span key={id}
                  className="text-[9px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-300
                             px-1.5 py-0.5 rounded"
                  title={`Forza base: ${card?.strength ?? '?'} | ${card?.effect || ''}`}>
              🛡️ {card?.name || id} ({strengthLabel})
              {card && <span onClick={(e) => { e.stopPropagation(); setDetailCard(card) }} className="ml-0.5 text-[7px] text-gray-600 hover:text-blue-400 cursor-pointer border border-gray-700/60 rounded-full w-3 h-3 inline-flex items-center justify-center hover:border-blue-500/60 leading-none shrink-0 transition-colors">i</span>}
              {/* Oggetti Fato assegnati a questo eroe */}
              {assignedEntries.map(([itemId]) => {
                const itemCard = allCardsFlat.find(c => c.id === itemId)
                return (
                  <span key={itemId} className="ml-1 text-cyan-300 text-[8px] bg-cyan-900/50 border border-cyan-700/50 rounded px-1">
                    🔮 {itemCard?.name || itemId}
                  </span>
                )
              })}
            </span>
          )
        })}
      </div>
    </div>
    </>
  )
}
