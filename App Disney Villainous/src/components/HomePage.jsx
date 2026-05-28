import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Sfondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-950/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">

        {/* Logo / Titolo */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl mb-2">🦹</div>
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text
                         bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-700
                         drop-shadow-[0_2px_24px_rgba(234,179,8,0.25)]">
            DISNEY
          </h1>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[0.2em] text-gray-300">
            VILLAINOUS
          </h2>
          <p className="text-gray-500 text-sm tracking-widest uppercase mt-1">
            Digital Edition — Multiplayer
          </p>
        </div>

        {/* Bottoni principali */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button
            onClick={() => navigate('/lobby')}
            className="btn-primary flex-1 text-base py-4 font-display tracking-wider
                       shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]"
          >
            ⚔️ Gioca
          </button>
          <button
            onClick={() => navigate('/regolamento')}
            className="btn-secondary flex-1 text-base py-4 font-display tracking-wider"
          >
            📖 Regolamento
          </button>
        </div>

        {/* Villain showcase */}
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          {[
            { emoji: '🧙‍♀️', name: 'Malefica',    color: 'text-purple-400' },
            { emoji: '🐍', name: 'Jafar',         color: 'text-red-400'    },
            { emoji: '🏴‍☠️', name: 'Capitan Uncino', color: 'text-blue-400' },
            { emoji: '🐙', name: 'Ursula',         color: 'text-indigo-400' },
            { emoji: '👑', name: 'Principe Giovanni', color: 'text-yellow-400' },
            { emoji: '🃏', name: 'Regina di Cuori', color: 'text-rose-400'  },
          ].map(v => (
            <div key={v.name} className="flex flex-col items-center gap-1 text-center w-16">
              <span className="text-2xl">{v.emoji}</span>
              <span className={`text-[10px] font-display ${v.color} leading-tight`}>{v.name}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-700 text-xs mt-4">
          Basato sul gioco da tavolo Disney Villainous © Ravensburger / Wonder Forge
        </p>
      </div>
    </div>
  )
}
