import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export function CreateScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const createRoom = useGameStore((state) => state.createRoom)
  const [gameName, setGameName] = useState('Friday Night Deduction')
  const [mode, setMode] = useState<'timer' | 'qlimit'>('timer')
  const [timerLimit, setTimerLimit] = useState(180)
  const [questionLimit, setQuestionLimit] = useState(30)
  const [creating, setCreating] = useState(false)
  const [createdCode, setCreatedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const code = await createRoom(gameName, mode, mode === 'timer' ? timerLimit : questionLimit)
      setCreatedCode(code)
    } catch (err: any) {
      console.error('Failed to create room:', err)
      alert(err?.message || 'Failed to create room. Check Firebase connection.')
    }
    setCreating(false)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-lg w-full text-center border-t-2 border-primary anim-slide">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">check_circle</span>
          </div>
          <h1 className="font-sora text-2xl text-primary mb-2">Room Created!</h1>
          <p className="text-on-surface-variant mb-6">Share this code with your agents</p>

          <div className="bg-surface-container p-6 rounded-xl mb-6">
            <p className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-sora text-4xl text-primary tracking-[0.2em] font-bold">{createdCode}</span>
              <button onClick={copyCode} className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-primary">{copied ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setScreen('lobby')}
            className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">login</span>
            Enter Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">
          <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-sora font-bold">Back</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 pb-8 px-4">
        <div className="glass-panel p-8 max-w-xl w-full border-t-2 border-primary anim-slide">
          <h1 className="font-sora text-2xl text-primary mb-1">Create Room</h1>
          <p className="text-on-surface-variant mb-6">Configure your intelligence network</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-2">Room Name</label>
              <input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full bg-black/20 border-b border-outline-variant focus:border-primary py-3 px-3 text-on-surface outline-none"
                placeholder="e.g. Friday Night Deduction"
              />
            </div>

            <div>
              <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-2">Game Mode</label>
              <div className="flex gap-2">
                <button
                    onClick={() => setMode('timer')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    mode === 'timer' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">schedule</span>
                  Timer
                </button>
                <button
                    onClick={() => setMode('qlimit')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    mode === 'qlimit' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">help_outline</span>
                  Question Limit
                </button>
              </div>
            </div>

            <div className="p-4 bg-surface-container-highest/30 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-on-surface font-bold">
                    {mode === 'timer' ? 'Time per Round' : 'Max Questions'}
                  </span>
                  <span className="text-xs text-on-surface-variant block">
                    {mode === 'timer' ? 'Seconds' : 'Shared pool'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => mode === 'timer'
                      ? setTimerLimit(Math.max(30, timerLimit - 30))
                      : setQuestionLimit(Math.max(5, questionLimit - 5))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-sora text-xl text-primary w-20 text-center">
                    {mode === 'timer' ? formatDuration(timerLimit) : questionLimit}
                  </span>
                  <button
                    onClick={() => mode === 'timer'
                      ? setTimerLimit(Math.min(600, timerLimit + 30))
                      : setQuestionLimit(Math.min(100, questionLimit + 5))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_circle</span>
                  Create Room
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
