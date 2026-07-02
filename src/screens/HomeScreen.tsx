import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function HomeScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const setPlayerName = useGameStore((state) => state.setPlayerName)
  const [name, setName] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('room')
    if (code) {
      setJoinCode(code.toUpperCase().slice(0, 6))
      setShowJoin(true)
    }
  }, [])

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Enter your agent name')
      return
    }
    setPlayerName(name.trim())
    setScreen('create')
  }

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Enter your agent name')
      return
    }
    if (!joinCode.trim() || joinCode.length !== 6) {
      setError('Enter a valid 6-character room code')
      return
    }

    setPlayerName(name.trim())
    const joinRoom = useGameStore.getState().joinRoom
    const success = await joinRoom(joinCode.trim().toUpperCase(), name.trim())

    if (!success) {
      setError('Room not found or game already started')
    }
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <header className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto pt-8 w-full">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">fingerprint</span>
          <span className="font-sora text-xl font-extrabold text-primary">GuesstheGuest</span>
        </div>
        <span className="text-xs text-on-surface-variant">v2.0 — Multiplayer</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="mb-8 text-center">
          <h1 className="font-sora text-4xl md:text-5xl text-on-surface mb-4">
            Guess the person<br />
            <span className="text-primary">before time runs out</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg mx-auto">
            One player chooses a person. Everyone else asks questions and tries to guess who it is.
          </p>
        </div>

        <div className="glass-panel p-8 max-w-md w-full">
          <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-2">
            Agent Name
          </label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            className="w-full bg-black/20 border-b-2 border-white/10 focus:border-primary transition-all py-3 px-4 text-on-surface placeholder:text-on-surface-variant/30 outline-none rounded-t-lg mb-6"
            placeholder="Enter your name..."
            maxLength={20}
          />

          {error && (
            <div className="flex items-center gap-2 text-error text-sm mb-4">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {!showJoin ? (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Create Room
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="w-full py-4 border border-primary text-primary rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 hover:bg-primary/10 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">login</span>
                Join Room
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-[fadeIn_0.3s_ease]">
              <label className="text-sm text-primary uppercase tracking-wider font-bold block">
                Room Code
              </label>
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                className="w-full bg-black/20 border-b-2 border-white/10 focus:border-primary transition-all py-3 px-4 text-on-surface placeholder:text-on-surface-variant/30 outline-none rounded-t-lg text-center font-sora text-xl tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">login</span>
                Join Game
              </button>
              <button
                onClick={() => { setShowJoin(false); setError('') }}
                className="w-full py-3 text-on-surface-variant text-sm hover:text-primary transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
