import { useEffect, useRef } from 'react'

const LOG_COLORS = {
  system: 'text-gray-500',
  info:   'text-gray-400',
  move:   'text-blue-400',
  action: 'text-green-400',
  fate:   'text-purple-400',
  win:    'text-yellow-300 font-bold',
}

export default function GameLog({ log = [] }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log.length])

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 h-48 overflow-y-auto flex flex-col gap-0.5">
      <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest mb-1 sticky top-0 bg-gray-950">
        Log di Gioco
      </p>
      {log.length === 0 && (
        <p className="text-gray-700 text-xs italic">Il log è vuoto.</p>
      )}
      {log.map(entry => (
        <p key={entry.id} className={`text-[11px] ${LOG_COLORS[entry.type] || 'text-gray-400'}`}>
          {entry.message}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
