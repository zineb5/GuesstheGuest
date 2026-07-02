import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { TimerRing } from '../components/TimerRing'
import { FactSuggestion } from '../utils/wikiApi'
import { SmartSuggestion } from '../components/SmartSuggestion'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins} min`
  return `${mins} min ${secs}s`
}

export function SelectorScreen() {
  const room = useGameStore((state) => state.room)
  const isHost = useGameStore((state) => state.isHost)
  const answerQuestion = useGameStore((state) => state.answerQuestion)
  const confirmGuess = useGameStore((state) => state.confirmGuess)
  const endRoundNoWinner = useGameStore((state) => state.endRoundNoWinner)
  const extendRound = useGameStore((state) => state.extendRound)
  const endGame = useGameStore((state) => state.endGame)
  const leaveRoom = useGameStore((state) => state.leaveRoom)
  const [activeTab, setActiveTab] = useState<'questions' | 'guesses'>('questions')
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
  const guesses = Object.values(room.guesses || {})
  const pendingGuesses = guesses.filter(g => g.status === 'pending')
  const target = room.target
  const isQuestionLimitMode = room.gameMode === 'qlimit'
  const durationSeconds = room.timerSeconds
  const roundLimitReached = isQuestionLimitMode
    ? Object.keys(room.questions || {}).length >= room.qLimit
    : Boolean(room.roundStartedAt) && remainingSeconds === 0

  const unanswered = questions.filter(q => q.answer === '...')
  const answered = questions.filter(q => q.answer !== '...')

  const renderAnswerButton = (questionId: string, answer: 'Yes' | 'No' | 'Unknown', suggestion: FactSuggestion) => {
    const conflicts = suggestion.answer !== 'Unknown' && suggestion.answer !== answer
    const agrees = suggestion.answer === answer

    return (
      <button
        key={answer}
        onClick={() => answerQuestion(questionId, answer)}
        title={suggestion.reason}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
          answer === 'Yes' ? 'bg-secondary-container text-on-secondary-container hover:brightness-110 border-secondary-container/40' :
          answer === 'No' ? 'bg-error/20 text-error hover:bg-error/30 border-error/30' :
          'bg-surface-container text-on-surface-variant hover:bg-white/10 border-white/10'
        } ${conflicts ? 'ring-2 ring-tertiary' : agrees ? 'ring-1 ring-secondary-container/60' : ''}`}
      >
        {answer}
        {conflicts && <span className="ml-2 text-tertiary">!</span>}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">shield</span>
            <span className="font-sora font-bold text-primary">Selector</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-on-surface-variant">Round {room.currentRound}/{room.totalRounds}</span>
            {isQuestionLimitMode && (
              <span className="px-3 py-1 bg-primary/10 rounded-full text-primary font-bold">
                {Object.keys(room.questions || {}).length}/{room.qLimit} questions
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

        {/* Target Card */}
        <div className="glass-panel p-6 mb-6 border-t-2 border-primary">
          <p className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Target</p>
          <div className="flex items-center gap-4">
            {target?.imageUrl && (
              <img src={target.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            )}
            <div>
              <h2 className="text-xl font-bold text-on-surface">{target?.name}</h2>
              <p className="text-sm text-on-surface-variant">{target?.category}</p>
            </div>
          </div>
        </div>

        {target?.referenceExtract && (
          <div className="glass-panel p-5 mb-6 border-l-4 border-secondary-container">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs text-secondary-container uppercase tracking-widest font-bold">Wiki reference</p>
              {target.referenceUrl && (
                <a href={target.referenceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  Open source
                </a>
              )}
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4">
              {target.referenceExtract}
            </p>
          </div>
        )}

        {roundLimitReached && (
          <div className="glass-panel p-5 mb-6 border border-tertiary/40">
            <p className="font-sora text-lg text-tertiary mb-2">
              {room.gameMode === 'timer' ? 'Time is up' : 'Question limit reached'}
            </p>
            <p className="text-sm text-on-surface-variant mb-4">
              Decide whether the selector wins this round or give guessers one more chance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={endRoundNoWinner} className="py-3 bg-tertiary text-on-tertiary-container rounded-xl font-bold">
                Admit selector victory
              </button>
              <button onClick={extendRound} className="py-3 border border-primary text-primary rounded-xl font-bold hover:bg-primary/10">
                {room.gameMode === 'timer' ? 'Add 1 minute' : 'Add 5 questions'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'questions' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            Questions ({unanswered.length})
          </button>
          <button
            onClick={() => setActiveTab('guesses')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'guesses' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            Guesses ({pendingGuesses.length})
          </button>
        </div>

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {unanswered.length === 0 && answered.length === 0 && (
              <div className="glass-panel p-8 text-center text-on-surface-variant">
                Waiting for questions...
              </div>
            )}

            {unanswered.map((q) => (
              <div key={q.id} className="glass-panel p-4 border-l-4 border-secondary-container">
                <p className="text-sm text-on-surface mb-3">
                  <span className="text-secondary-container font-bold">{q.askerName}:</span> {q.text}
                </p>
                <SmartSuggestion question={q.text} facts={target?.referenceFacts} referenceExtract={target?.referenceExtract}>
                  {(suggestion, loading) => (
                    <>
                      <div className="flex gap-2">
                        {(['Yes', 'No', 'Unknown'] as const).map((ans) => renderAnswerButton(q.id, ans, suggestion))}
                      </div>
                      {loading ? (
                        <div className="mt-3 bg-surface-container-low border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Fact assistant is checkingâ€¦</p>
                        </div>
                      ) : suggestion.answer !== 'Unknown' ? (
                        <div className="mt-3 bg-tertiary/10 border border-tertiary/30 rounded-lg p-3">
                          <p className="text-xs text-tertiary uppercase tracking-wider font-bold">Fact assistant suggests {suggestion.answer}</p>
                          <p className="text-sm text-on-surface-variant mt-1">{suggestion.reason}</p>
                        </div>
                      ) : target?.referenceExtract ? (
                        <div className="mt-3 bg-surface-container-low border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Fact assistant is unsure</p>
                          <p className="text-sm text-on-surface-variant mt-1">{suggestion.reason}</p>
                        </div>
                      ) : null}
                    </>
                  )}
                </SmartSuggestion>
              </div>
            ))}

            {answered.map((q) => (
              <div key={q.id} className="glass-panel p-4 border-l-4 border-primary/30">
                <p className="text-sm text-on-surface">
                  <span className="text-primary font-bold">{q.askerName}:</span> {q.text}
                </p>
                <p className="text-sm mt-1">
                  <span className="text-on-surface-variant">Answer: </span>
                  <span className={`font-bold ${q.answer === 'Yes' ? 'text-secondary-container' : q.answer === 'No' ? 'text-error' : 'text-on-surface-variant'}`}>
                    {q.answer}
                  </span>
                </p>
                <SmartSuggestion question={q.text} facts={target?.referenceFacts} referenceExtract={target?.referenceExtract}>
                  {(suggestion, loading) => {
                    if (loading) return null
                    const conflicts = suggestion.answer !== 'Unknown' && suggestion.answer !== q.answer
                    const agrees = suggestion.answer !== 'Unknown' && suggestion.answer === q.answer

                    if (conflicts) {
                      return (
                        <div className="mt-3 bg-error/10 border border-error/30 rounded-lg p-3">
                          <p className="text-xs text-error uppercase tracking-wider font-bold">
                            Possible lie or mistake
                          </p>
                          <p className="text-sm text-on-surface-variant mt-1">
                            Fact assistant suggests {suggestion.answer}. {suggestion.reason}
                          </p>
                        </div>
                      )
                    }

                    if (agrees) {
                      return (
                        <div className="mt-3 bg-secondary-container/10 border border-secondary-container/30 rounded-lg p-3">
                          <p className="text-xs text-secondary-container uppercase tracking-wider font-bold">
                            Fact assistant agrees
                          </p>
                          <p className="text-sm text-on-surface-variant mt-1">{suggestion.reason}</p>
                        </div>
                      )
                    }

                    return null
                  }}
                </SmartSuggestion>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guesses' && (
          <div className="space-y-3">
            {pendingGuesses.length === 0 && (
              <div className="glass-panel p-8 text-center text-on-surface-variant">
                No pending guesses
              </div>
            )}
            {pendingGuesses.map((g) => (
              <div key={g.id} className="glass-panel p-4 border-l-4 border-tertiary">
                <p className="text-sm text-on-surface mb-3">
                  <span className="text-tertiary font-bold">{g.playerName}</span> guessed: "{g.text}"
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmGuess(g.id, true)}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-secondary-container text-on-secondary-container hover:brightness-110"
                  >
                    Correct
                  </button>
                  <button
                    onClick={() => confirmGuess(g.id, false)}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-error/20 text-error hover:bg-error/30"
                  >
                    Wrong
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* End Round Button (if question limit reached) */}
        {showHelp && (
          <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
            <div className="glass-panel p-6 max-w-md w-full border-t-2 border-primary">
              <h2 className="font-sora text-xl text-primary mb-3">Selector help</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Answer yes/no questions honestly. Use the wiki reference as a fact check for public targets.
                If the round limit is reached, either take the selector point or extend the round.
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
