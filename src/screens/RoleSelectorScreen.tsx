import React from 'react'
import { useGameStore } from '../store/gameStore'

export function RoleSelectorScreen() {
  const setScreen = useGameStore((state) => state.setScreen)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 anim-fade">
      <div className="glass-panel p-8 max-w-lg w-full text-center border-t-4 border-primary anim-slide">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-primary">person_search</span>
        </div>
        <h1 className="font-sora text-3xl text-primary mb-2">You are the Selector</h1>
        <p className="text-on-surface-variant mb-8">
          Think of a person. Your team will try to guess who it is.
        </p>
        <button
          onClick={() => setScreen('target-entry')}
          className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          Choose Target
        </button>
      </div>
    </div>
  )
}