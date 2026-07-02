import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { searchWikipedia, WikiResult } from '../utils/wikiApi'

export function GuessInputScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const submitGuess = useGameStore((state) => state.submitGuess)
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<WikiResult[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const results = await searchWikipedia(text)
        setSuggestions(results)
      } catch (err) {
        console.error('Guess search failed:', err)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [text])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await submitGuess(text.trim())
      setScreen('guesser')
    } catch (err) {
      console.error('Failed to submit guess:', err)
      setError('Could not submit your guess. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectSuggestion = async (name: string) => {
    setText(name)
    setSubmitting(true)
    setError('')
    try {
      await submitGuess(name)
      setScreen('guesser')
    } catch (err) {
      console.error('Failed to submit guess:', err)
      setError('Could not submit your guess. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center px-6 py-3 max-w-2xl mx-auto">
          <button onClick={() => setScreen('guesser')} className="text-on-surface-variant hover:text-primary mr-4">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-sora font-bold text-primary">Submit Guess</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-8 px-4 max-w-2xl mx-auto w-full">
        <div className="glass-panel p-8 w-full border-t-2 border-primary anim-slide">
          <h1 className="font-sora text-2xl text-primary mb-2">Who is it?</h1>
          <p className="text-on-surface-variant mb-6">Type a name or pick from suggestions</p>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter name..."
            className="w-full bg-black/20 border-b border-outline-variant focus:border-primary py-3 px-3 text-on-surface outline-none text-lg mb-4"
            autoFocus
          />

          {loading && (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
              <div className="typing-indicator"><span></span><span></span><span></span></div>
              Searching...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={`${s.source || 'wiki'}-${s.title}`}
                  onClick={() => selectSuggestion(s.title)}
                  disabled={submitting}
                  className="w-full text-left glass-panel p-3 hover:bg-white/5 transition-all flex items-center gap-3"
                >
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface">{s.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{s.description}</p>
                    <p className="text-[10px] uppercase tracking-wider text-primary mt-1">
                      {s.source === 'fandom' ? 'Fandom' : 'Wikipedia'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">send</span>
            {submitting ? 'Submitting...' : 'Submit Guess'}
          </button>
        </div>
      </main>
    </div>
  )
}
