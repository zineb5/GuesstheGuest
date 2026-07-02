import React from 'react'
import { useGameStore } from '../store/gameStore'

export function RevealScreen() {
  const room = useGameStore((state) => state.room)
  const nextRound = useGameStore((state) => state.nextRound)
  const setScreen = useGameStore((state) => state.setScreen)

  if (!room) return null

  const guesses = Object.values(room.guesses || {})
  const correctGuesses = guesses.filter(g => g.correct)
  const winner = correctGuesses.find(g => g.isFirst)
  const target = room.target

  const handleNext = async () => {
    await nextRound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-lg w-full text-center border-t-4 border-primary anim-slide">
        <h1 className="font-sora text-3xl text-primary mb-2">Round {room.currentRound} Over</h1>

        {target && (
          <div className="my-6">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-2">The target was</p>
            <h2 className="text-2xl font-bold text-on-surface mb-1">{target.name}</h2>
            <p className="text-sm text-primary">{target.category}</p>
          </div>
        )}

        {winner ? (
          <div className="bg-secondary-container/10 border border-secondary-container/30 rounded-xl p-4 mb-6">
            <p className="text-secondary-container font-bold text-lg">
              Winner: {winner.playerName} (+{winner.isFirst ? 2 : 1} pts)
            </p>
          </div>
        ) : (
          <div className="bg-tertiary/10 border border-tertiary/30 rounded-xl p-4 mb-6">
            <p className="text-tertiary font-bold text-lg">No one guessed correctly!</p>
            <p className="text-sm text-on-surface-variant">Selector gets +1 point</p>
          </div>
        )}

        <div className="text-left mb-6">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2">All Guesses</p>
          <div className="space-y-2">
            {guesses.map((g) => (
              <div key={g.id} className={`flex justify-between items-center p-3 rounded-lg ${
                g.correct ? 'bg-secondary-container/10 border border-secondary-container/20' : 'bg-error/5 border border-error/10'
              }`}>
                <span className="text-sm text-on-surface">{g.playerName}: "{g.text}"</span>
                <span className={`text-xs font-bold ${g.correct ? 'text-secondary-container' : 'text-error'}`}>
                  {g.correct ? 'Correct' : 'Wrong'}
                </span>
              </div>
            ))}
            {guesses.length === 0 && <p className="text-sm text-on-surface-variant">No guesses submitted</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 py-4 btn-primary text-on-primary-container rounded-xl font-sora font-bold"
          >
            {room.currentRound >= room.totalRounds ? 'Final Scores' : 'Next Round'}
          </button>
          <button
            onClick={() => setScreen('home')}
            className="px-4 py-4 border border-outline-variant text-on-surface-variant rounded-xl hover:bg-white/5"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}