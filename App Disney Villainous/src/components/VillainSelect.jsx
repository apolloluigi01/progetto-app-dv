import { VILLAIN_LIST } from '../data/villains.js'

const VILLAIN_EMOJI = {
  maleficent:     '🧙‍♀️',
  jafar:          '🐍',
  hook:           '🏴‍☠️',
  ursula:         '🐙',
  prince_john:    '👑',
  queen_of_hearts:'🃏',
}

export default function VillainSelect({ gameState, myPlayerId, isHost, onSelect, onStart, error }) {
  const takenVillains = gameState.players
    .filter(p => p.id !== myPlayerId && p.villainId)
    .map(p => p.villainId)

  const myPlayer = gameState.players.find(p => p.id === myPlayerId)
  const myVillain = myPlayer?.villainId || null
  const allReady  = gameState.players.length >= 2 && gameState.players.every(p => p.isReady)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-10 px-4">
      <h1 className="font-display text-3xl font-bold text-yellow-400 mb-2">Scegli il tuo Cattivo</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ogni villain ha obiettivo e strategia unici — scegli bene.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
        {VILLAIN_LIST.map(villain => {
          const isTaken   = takenVillains.includes(villain.id)
          const isMine    = myVillain === villain.id
          const disabled  = isTaken && !isMine

          return (
            <button
              key={villain.id}
              disabled={disabled}
              onClick={() => !disabled && onSelect(villain.id)}
              className={[
                'relative rounded-xl border-2 p-4 text-left transition-all duration-150',
                'hover:scale-[1.02] active:scale-100',
                isMine    ? 'border-yellow-400 bg-yellow-950/30 shadow-yellow-400/20 shadow-lg' :
                isTaken   ? 'border-gray-800 bg-gray-900/30 opacity-40 cursor-not-allowed' :
                            'border-gray-700 bg-gray-900/60 hover:border-gray-500',
              ].join(' ')}
              style={isMine ? { borderColor: villain.colorLight } : {}}
            >
              {/* Badge scelto */}
              {isMine && (
                <span className="absolute top-2 right-2 text-xs font-display text-yellow-400 bg-yellow-950 px-2 py-0.5 rounded-full border border-yellow-700">
                  Selezionato
                </span>
              )}
              {isTaken && !isMine && (
                <span className="absolute top-2 right-2 text-xs font-display text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700">
                  Occupato
                </span>
              )}

              <div className="flex items-start gap-3">
                <span className="text-3xl">{VILLAIN_EMOJI[villain.id]}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-sm text-gray-100">{villain.name}</h2>
                  <p className="text-xs text-gray-500 italic">{villain.movie}</p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">
                    {villain.winCondition}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                <span>⚡ Potere iniziale: <strong className="text-yellow-400">{villain.startingPower}</strong></span>
                <span>🃏 Mano: <strong className="text-blue-400">{villain.handSize}</strong></span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Stato giocatori */}
      <div className="mt-8 w-full max-w-4xl">
        <h3 className="font-display text-sm text-gray-500 uppercase tracking-wider mb-3">Giocatori in lobby</h3>
        <div className="flex flex-wrap gap-2">
          {gameState.players.map(p => (
            <div key={p.id}
                 className={[
                   'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border',
                   p.id === myPlayerId
                     ? 'border-yellow-600/50 bg-yellow-950/30 text-yellow-300'
                     : 'border-gray-700 bg-gray-900 text-gray-400',
                 ].join(' ')}>
              <span>{p.villainId ? VILLAIN_EMOJI[p.villainId] : '❓'}</span>
              <span>{p.name}</span>
              {p.isReady && <span className="text-green-400 text-xs">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

      {/* Avvia partita (solo host) */}
      {isHost && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {!allReady && (
            <p className="text-gray-600 text-xs">
              In attesa che tutti i giocatori scelgano un villain…
            </p>
          )}
          <button
            onClick={onStart}
            disabled={!allReady}
            className="btn-primary px-10 py-3 text-base"
          >
            ⚔️ Avvia Partita
          </button>
        </div>
      )}
      {!isHost && (
        <p className="mt-6 text-gray-600 text-sm">
          In attesa che l'host avvii la partita…
        </p>
      )}
    </div>
  )
}
