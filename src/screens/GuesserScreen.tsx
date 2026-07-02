import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { TimerRing } from '../components/TimerRing'
import { SmartSuggestion } from '../components/SmartSuggestion'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins} min`
  return `${mins} min ${secs}s`
}

export function GuesserScreen() {
  const room = useGameStore((state) => state.room)
  const isHost = useGameStore((state) => state.isHost)
  const setScreen = useGameStore((state) => state.setScreen)
  const askQuestion = useGameStore((state) => state.askQuestion)
  const leaveRoom = useGameStore((state) => state.leaveRoom)
  const endGame = useGameStore((state) => state.endGame)
  const [questionText, setQuestionText] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (!room || room.gameMode !== 'timer') return

    const duration = room.timerSeconds
    const updateRemaining = () => {
      const elapsed = room.roundStartedAt ? Math.floor((Date.now() - room.roundStartedAt) / 1000) : 0
      setRemainingSeconds(Math.max(0, duration - elapsed))
    }

    updateRemaining()
    const interval = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(interval)
  }, [room?.roundStartedAt, room?.timerSeconds, room?.gameMode])

  if (!room) return null

  const questions = Object.values(room.questions || {})
  const qCount = questions.length
  const qLimit = room.qLimit
  const isQuestionLimitMode = room.gameMode === 'qlimit'
  const durationSeconds = room.timerSeconds
  const timerExpired = room.gameMode === 'timer' && Boolean(room.roundStartedAt) && remainingSeconds === 0
  const questionLimitReached = isQuestionLimitMode && qCount >= qLimit
  const roundInputClosed = timerExpired || questionLimitReached
  const target = room.target

  const handleAsk = async () => {
    if (!questionText.trim()) return
    if (roundInputClosed) return
    await askQuestion(questionText.trim())
    setQuestionText('')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-6 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary-container">psychology</span>
            <span className="font-sora font-bold text-secondary-container">Guesser</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-on-surface-variant">Round {room.currentRound}/{room.totalRounds}</span>
            {isQuestionLimitMode && (
              <span className="px-3 py-1 bg-secondary-container/10 rounded-full text-secondary-container font-bold">
                {qCount}/{qLimit} questions
              </span>
            )}
            <button onClick={() => setShowHelp(true)} className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button onClick={leaveRoom} className="text-on-surface-variant hover:text-error">
              <span className="material-symbols-outlined">logout</span>
            </button>
            {isHost && (
              <button onClick={endGame} className="text-error hover:brightness-125">
                <span className="material-symbols-outlined">stop_circle</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
        {room.gameMode === 'timer' && (
          <div className="glass-panel p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">Time remaining</p>
              <p className="font-sora text-xl text-primary">{formatDuration(room.timerSeconds)} round</p>
            </div>
            <TimerRing durationSeconds={durationSeconds} remainingSeconds={remainingSeconds} />
          </div>
        )}

        {roundInputClosed && (
          <div className="glass-panel p-5 mb-6 border border-tertiary/40 text-center">
            <p className="font-sora text-lg text-tertiary">
              {timerExpired ? 'Time is up' : 'Question limit reached'}
            </p>
            <p className="text-sm text-on-surface-variant mb-4">
              Submit your final guess. The selector only wins if no one gets it right and they choose not to extend the round.
            </p>
            <button
              onClick={() => setScreen('guess-input')}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary rounded-xl font-bold"
            >
              Submit Final Guess
            </button>
          </div>
        )}

        {/* Question History */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="font-sora text-lg text-on-surface mb-4">Question History</h3>
          {questions.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No questions yet. Be the first to ask!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q) => (
                <div key={q.id} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div>
                      <span className="text-xs text-on-surface-variant">{q.askerName}: </span>
                      <span className="text-sm text-on-surface">{q.text}</span>
                    </div>
                    {q.answer !== '...' && (
                      <SmartSuggestion question={q.text} facts={target?.referenceFacts} referenceExtract={target?.referenceExtract}>
                        {(suggestion, loading) => {
                          if (loading) return null
                          const conflicts = suggestion.answer !== 'Unknown' && suggestion.answer !== q.answer
                          const agrees = suggestion.answer !== 'Unknown' && suggestion.answer === q.answer

                          if (conflicts) {
                            return (
                              <div className="mt-2 bg-error/10 border border-error/30 rounded-lg p-2">
                                <p className="text-xs text-error uppercase tracking-wider font-bold">
                                  Fact assistant flags this answer
                                </p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  Suggested answer: {suggestion.answer}. {suggestion.reason}
                                </p>
                              </div>
                            )
                          }

                          if (agrees) {
                            return (
                              <div className="mt-2 bg-secondary-container/10 border border-secondary-container/30 rounded-lg p-2">
                                <p className="text-xs text-secondary-container uppercase tracking-wider font-bold">
                                  Fact assistant agrees
                                </p>
                              </div>
                            )
                          }

                          return null
                        }}
                      </SmartSuggestion>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    q.answer === 'Yes' ? 'bg-secondary-container/20 text-secondary-container' :
                    q.answer === 'No' ? 'bg-error/20 text-error' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {q.answer}
                  </span>
                </div>
              ))}
            </div>
          )}
          {isQuestionLimitMode && (
            <p className="text-xs text-on-surface-variant mt-3">
              {qCount} / {qLimit} questions asked
            </p>
          )}
        </div>

        {/* Ask Question */}
        <div className="glass-panel p-6 mb-6">
          <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-3">
            Ask a Yes/No Question
          </label>
          <div className="flex gap-3">
            <input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAsk()
                }
              }}
              placeholder="Are they alive?"
              className="flex-1 bg-black/20 border-b border-outline-variant focus:border-secondary-container py-3 px-3 text-on-surface outline-none"
              maxLength={120}
            />
            <button
              onClick={handleAsk}
              disabled={!questionText.trim() || roundInputClosed}
              className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </div>

        {/* I Know Who */}
        <button
          onClick={() => setScreen('guess-input')}
          className="w-full py-4 bg-primary text-on-primary rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">lightbulb</span>
          {roundInputClosed ? 'Submit Final Guess' : 'I Know Who'}
        </button>

        {showHelp && (
          <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
            <div className="glass-panel p-6 max-w-md w-full border-t-2 border-primary">
              <h2 className="font-sora text-xl text-primary mb-3">Guesser help</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Ask yes/no questions to narrow down the target. Use "I Know Who" when you are ready to guess.
                Public targets are selected from Wikipedia so the selector can check facts.
              </p>
              <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
