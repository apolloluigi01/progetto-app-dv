import { CARD_TYPE_COLORS, CARD_TYPE_LABELS } from '../data/villains.js'

export default function Card({
  card,
  selected   = false,
  playable   = false,
  dimmed     = false,   // carta non selezionabile in questo contesto (es. Condizione nel proprio turno)
  small      = false,
  onClick,
  showEffect = true,
}) {
  if (!card) return null

  const typeColor = CARD_TYPE_COLORS[card.type] || 'bg-gray-800 text-gray-300'
  const typeLabel = CARD_TYPE_LABELS[card.type] || card.type

  return (
    <div
      onClick={onClick}
      className={[
        'card-base flex flex-col',
        small  ? 'w-24 min-h-[6rem] p-2' : 'w-36 min-h-[10rem] p-3',
        selected  ? 'card-selected' : '',
        playable && !selected ? 'card-playable' : '',
        dimmed  ? 'opacity-40 cursor-not-allowed' : (onClick ? 'cursor-pointer' : 'cursor-default'),
      ].join(' ')}
    >
      {/* Header: tipo + costo */}
      <div className="flex items-center justify-between mb-1.5 gap-1">
        <span className={`${typeColor} text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide truncate`}>
          {typeLabel}
        </span>
        {card.cost != null && (
          <span className="text-yellow-400 font-bold font-display text-xs shrink-0">
            ⚡{card.cost}
          </span>
        )}
      </div>

      {/* Nome */}
      <p className={`font-display font-bold text-gray-100 leading-tight ${small ? 'text-[10px]' : 'text-xs'}`}>
        {card.name}
      </p>

      {/* Forza (alleati e eroi) */}
      {card.strength != null && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-red-400 text-xs">⚔️</span>
          <span className="text-red-300 font-bold text-xs font-display">{card.strength}</span>
        </div>
      )}

      {/* Effetto */}
      {showEffect && card.effect && !small && (
        <p className="mt-2 text-[10px] text-gray-400 leading-relaxed flex-1 line-clamp-4">
          {card.effect}
        </p>
      )}

      {/* Target location per maledizioni/wicket */}
      {card.targetLocation && !small && (
        <p className="mt-auto text-[9px] text-indigo-400 font-display pt-1 border-t border-gray-800 truncate">
          → {card.targetLocation.replace(/_/g, ' ')}
        </p>
      )}
    </div>
  )
}
