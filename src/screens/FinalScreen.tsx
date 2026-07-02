import React from 'react'
import { useGameStore } from '../store/gameStore'

export function FinalScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const room = useGameStore((state) => state.room)

  if (!room) return null

  const players = Object.values(room.players || {}).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.correct - a.correct
  })
  const winner = players[0]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-2xl w-full border-t-4 border-primary">
        <div className="text-center mb-8">
          <p className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Final scores</p>
          <h1 className="font-sora text-3xl text-on-surface mb-2">{winner ? `${winner.name} wins` : 'Game over'}</h1>
          <p className="text-on-surface-variant">{room.name}</p>
        </div>

        <div className="space-y-3 mb-8">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`p-4 rounded-xl border flex items-center gap-4 ${
                index === 0 ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-low border-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-sora font-bold ${
                index === 0 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface truncate">{player.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {player.correct} correct, {player.wrong} wrong, {player.selectorWins} selector wins
                </p>
              </div>
              <div className="text-right">
                <p className="font-sora text-2xl text-primary font-bold">{player.score}</p>
                <p className="text-xs text-on-surface-variant">pts</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setScreen('home')}
            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
