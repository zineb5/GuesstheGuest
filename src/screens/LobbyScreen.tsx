import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export function LobbyScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const room = useGameStore((state) => state.room)
  const roomCode = useGameStore((state) => state.roomCode)
  const isHost = useGameStore((state) => state.isHost)
  const playerId = useGameStore((state) => state.playerId)
  const startGame = useGameStore((state) => state.startGame)
  const leaveRoom = useGameStore((state) => state.leaveRoom)
  const endGame = useGameStore((state) => state.endGame)
  const [copied, setCopied] = useState(false)

  const players = room ? Object.values(room.players) : []
  const playerCount = players.length
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = () => {
    copyText(roomCode)
  }

  const copyInviteLink = () => {
    copyText(shareUrl)
  }

  const handleStart = async () => {
    if (playerCount < 2) {
      alert('Need at least 2 players to start!')
      return
    }
    await startGame()
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <p className="text-on-surface-variant">Loading room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">fingerprint</span>
            <span className="font-sora text-xl font-extrabold text-primary">{room.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="text-xs text-secondary-container font-bold">{playerCount} joined</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h2 className="font-sora text-2xl text-on-surface">Game Lobby</h2>
              <p className="text-on-surface-variant mt-1">
                {isHost ? 'Share the room code with your agents' : 'Waiting for host to start...'}
              </p>
            </div>

            <div className="glass-panel p-6 border-2 border-primary/30">
              <div className="text-center">
                <p className="text-xs text-primary uppercase tracking-widest font-bold mb-3">Room Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-sora text-5xl md:text-6xl text-primary tracking-[0.2em] font-bold">
                    {roomCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-3 bg-primary/10 border border-primary/30 rounded-xl hover:bg-primary/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-3">
                  {copied ? 'Copied!' : 'Click to copy room code'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`glass-panel p-4 border-t-2 ${
                    player.isHost ? 'border-primary' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${
                      player.isHost ? 'bg-primary/20 border-2 border-primary' : 'bg-surface-container border border-white/20'
                    }`}>
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined ${player.isHost ? 'text-primary' : 'text-on-surface-variant'}`}>
                          person
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-on-surface">
                        {player.name}
                        {player.id === playerId && (
                          <span className="text-xs text-primary ml-2">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-secondary-container">
                        {player.isHost ? 'HOST' : 'Connected'}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-secondary-container' : 'bg-error'} animate-pulse`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">link</span>
                <span className="text-sm text-primary uppercase tracking-wider font-bold">Share Link</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface-container-lowest rounded-lg px-4 py-3 text-sm text-on-surface-variant truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 border-t-2 border-primary">
              <h3 className="font-sora text-lg text-primary mb-4">Mission Config</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Mode</span>
                  <span className="font-bold">
                    {room.gameMode === 'timer' ? `Timer (${formatDuration(room.timerSeconds)})` : `Q Limit (${room.qLimit})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Players</span>
                  <span className="font-bold">{playerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rounds</span>
                  <span className="font-bold">{room.totalRounds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status</span>
                  <span className="font-bold text-secondary-container capitalize">{room.status}</span>
                </div>
              </div>
            </div>

            {isHost ? (
              <button
                onClick={handleStart}
                disabled={playerCount < 2}
                className={`w-full py-4 rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 transition-all ${
                  playerCount >= 2
                    ? 'bg-primary text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20'
                    : 'bg-primary/30 text-on-primary/50 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                {playerCount < 2 ? 'Waiting for one more player' : 'Start Game'}
              </button>
            ) : (
              <div className="glass-panel p-4 text-center">
                <div className="typing-indicator justify-center mb-2">
                  <span></span><span></span><span></span>
                </div>
                <p className="text-sm text-on-surface-variant">Waiting for host...</p>
              </div>
            )}

            <button
              onClick={leaveRoom}
              className="w-full bg-transparent border border-error/30 text-error/70 py-3 rounded-xl text-sm font-semibold hover:bg-error/10 transition-all"
            >
              {isHost ? 'Close Room' : 'Leave Room'}
            </button>
            {isHost && (
              <button
                onClick={endGame}
                className="w-full bg-error/10 border border-error/30 text-error py-3 rounded-xl text-sm font-semibold hover:bg-error/20 transition-all"
              >
                End Game
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
