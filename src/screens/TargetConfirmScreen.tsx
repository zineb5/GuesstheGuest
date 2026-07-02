import React from 'react'
import { useGameStore } from '../store/gameStore'

export function TargetConfirmScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const startRoundTimer = useGameStore((state) => state.startRoundTimer)
  const room = useGameStore((state) => state.room)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 anim-fade">
      <div className="glass-panel p-8 max-w-lg w-full text-center border-t-2 border-primary anim-slide">
        <h1 className="font-sora text-2xl text-primary mb-4">Target Confirmed</h1>
        <div className="bg-surface-container p-4 rounded-xl mb-6">
          <p className="text-sm text-on-surface-variant uppercase tracking-wider">Target</p>
          <p className="text-xl font-bold text-on-surface">{room?.target?.name}</p>
          <p className="text-sm text-primary mt-1">{room?.target?.category}</p>
        </div>
        <p className="text-on-surface-variant mb-6">
          Wait for guessers to figure it out. Answer their questions honestly!
        </p>
        <button
          onClick={async () => {
            await startRoundTimer()
            setScreen('selector')
          }}
          className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold"
        >
          Start Answering
        </button>
      </div>
    </div>
  )
}