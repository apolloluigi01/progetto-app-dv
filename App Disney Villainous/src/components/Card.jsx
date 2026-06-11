import { useState } from 'react'
import { CARD_TYPE_COLORS, CARD_TYPE_LABELS } from '../data/villains.js'

export default function Card({
  card,
  selected   = false,
  playable   = false,
  dimmed     = false,
  small      = false,
  onClick,
  showEffect = true,
}) {
  const [showDetail, setShowDetail] = useState(false)

  if (!card) return null

  const typeColor = CARD_TYPE_COLORS[card.type] || 'bg-gray-800 text-gray-300'
  const typeLabel = CARD_TYPE_LABELS[card.type] || card.type

  return (
    <>
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
        {/* Header: tipo + costo + pulsante info */}
        <div className="flex items-center justify-between mb-1.5 gap-1">
          <span className={`${typeColor} text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide truncate`}>
            {typeLabel}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {card.cost != null && (
              <span className="text-yellow-400 font-bold font-display text-xs">⚡{card.cost}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true) }}
              className="ml-0.5 text-[9px] text-gray-600 hover:text-blue-300 w-3.5 h-3.5 rounded-full border border-gray-700 hover:border-blue-600 flex items-center justify-center leading-none transition-colors shrink-0"
              title="Mostra effetto completo"
            >i</button>
          </div>
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

        {/* Effetto (troncato) */}
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

      {/* Modale dettaglio carta */}
      {showDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-gray-900 border border-gray-600 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <span className={`${typeColor} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide`}>
                  {typeLabel}
                </span>
                <h2 className="font-display font-bold text-white text-lg mt-1.5 leading-tight">{card.name}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                  {card.cost != null && (
                    <span className="text-yellow-400">⚡ Costo: <strong>{card.cost}</strong></span>
                  )}
                  {card.strength != null && (
                    <span className="text-red-400">⚔️ Forza: <strong>{card.strength}</strong></span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-200 text-xl leading-none shrink-0 transition-colors"
              >✕</button>
            </div>

            {/* Effetto completo */}
            {card.effect ? (
              <div className="bg-gray-800/60 rounded-xl px-4 py-3 mb-3">
                <p className="text-[10px] text-gray-500 font-display uppercase tracking-wider mb-1.5">Effetto</p>
                <p className="text-sm text-gray-200 leading-relaxed">{card.effect}</p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic mb-3">Nessun effetto testuale.</p>
            )}

            {/* Luogo target */}
            {card.targetLocation && (
              <p className="text-xs text-indigo-400 mb-3">
                → Luogo: <strong>{card.targetLocation.replace(/_/g, ' ')}</strong>
              </p>
            )}

            <button
              onClick={() => setShowDetail(false)}
              className="w-full btn-secondary text-sm py-2"
            >Chiudi</button>
          </div>
        </div>
      )}
    </>
  )
}
