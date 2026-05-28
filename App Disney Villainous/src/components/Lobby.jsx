import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame.js'

export default function Lobby() {
  const navigate = useNavigate()
  const [mode, setMode]         = useState(null)        // 'create' | 'join'
  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [localError, setLocalError] = useState(null)
  const [creating, setCreating] = useState(false)

  // useGame senza roomCode: lo usiamo solo per createGame
  const { createGame } = useGame(null)

  async function handleCreate() {
    if (!playerName.trim()) { setLocalError('Inserisci il tuo nome.'); return }
    setCreating(true)
    setLocalError(null)
    const result = await createGame(playerName.trim())
    setCreating(false)
    if (result?.error) { setLocalError(result.error); return }
    navigate(`/game/${result.roomCode}`)
  }

  async function handleJoin() {
    if (!playerName.trim()) { setLocalError('Inserisci il tuo nome.'); return }
    if (!joinCode.trim())   { setLocalError('Inserisci il codice stanza.'); return }
    navigate(`/game/${joinCode.trim().toUpperCase()}?join=1&name=${encodeURIComponent(playerName.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Titolo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="text-gray-600 text-xs hover:text-gray-400 mb-4 block mx-auto">
            ← Torna alla Home
          </button>
          <h1 className="font-display text-3xl font-bold text-yellow-400">Lobby</h1>
          <p className="text-gray-500 text-sm mt-1">Crea una nuova partita o unisciti a una esistente</p>
        </div>

        {/* Scelta modalità */}
        {!mode && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setMode('create')} className="btn-primary py-4 text-base">
              🎮 Crea Partita
            </button>
            <button onClick={() => setMode('join')} className="btn-secondary py-4 text-base">
              🔗 Unisciti a una Partita
            </button>
          </div>
        )}

        {/* Form Crea */}
        {mode === 'create' && (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setMode(null); setLocalError(null) }}
                    className="text-gray-500 text-xs hover:text-gray-300 text-left">← Indietro</button>
            <div>
              <label className="text-gray-400 text-xs font-display tracking-wider uppercase block mb-1">
                Il tuo nome
              </label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100
                           focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="Es. Luigi"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                maxLength={24}
              />
            </div>
            {localError && <p className="text-red-400 text-sm">{localError}</p>}
            <button onClick={handleCreate} disabled={creating} className="btn-primary py-4">
              {creating ? 'Creando...' : '🎮 Crea Partita'}
            </button>
          </div>
        )}

        {/* Form Join */}
        {mode === 'join' && (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setMode(null); setLocalError(null) }}
                    className="text-gray-500 text-xs hover:text-gray-300 text-left">← Indietro</button>
            <div>
              <label className="text-gray-400 text-xs font-display tracking-wider uppercase block mb-1">
                Il tuo nome
              </label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100
                           focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="Es. Mario"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={24}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-display tracking-wider uppercase block mb-1">
                Codice Stanza
              </label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100
                           focus:outline-none focus:border-yellow-500 transition-colors uppercase tracking-widest text-lg"
                placeholder="XXXXXX"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
              />
            </div>
            {localError && <p className="text-red-400 text-sm">{localError}</p>}
            <button onClick={handleJoin} className="btn-primary py-4">
              🔗 Entra
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
