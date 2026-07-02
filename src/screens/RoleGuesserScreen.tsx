import React from 'react'
import { useGameStore } from '../store/gameStore'

export function RoleGuesserScreen() {
  const setScreen = useGameStore((state) => state.setScreen)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 anim-fade">
      <div className="glass-panel p-8 max-w-lg w-full text-center border-t-4 border-secondary-container anim-slide">
        <div className="w-20 h-20 rounded-full bg-secondary-container/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-secondary-container">psychology</span>
        </div>
        <h1 className="font-sora text-3xl text-secondary-container mb-2">You are a Guesser</h1>
        <p className="text-on-surface-variant mb-8">
          Ask yes/no questions to figure out who the selector is thinking of.
        </p>
        <button
          onClick={() => setScreen('guesser')}
          className="w-full py-4 bg-secondary-container text-on-secondary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-secondary transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          Enter Game
        </button>
      </div>
    </div>
  )
}