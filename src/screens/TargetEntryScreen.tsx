import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { searchWikipedia, WikiResult, fetchFandomInfobox, fetchWikipediaInfobox, InfoboxData } from '../utils/wikiApi'

export function TargetEntryScreen() {
  const setScreen = useGameStore((state) => state.setScreen)
  const submitTarget = useGameStore((state) => state.submitTarget)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Celebrity / Public Figure')
  const [selectedResult, setSelectedResult] = useState<WikiResult | null>(null)
  const [suggestions, setSuggestions] = useState<WikiResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'Celebrity / Public Figure',
    'Fictional Character',
    'Historical Figure',
    'Yourself',
    'Family Member',
    'Friend / Acquaintance',
  ]

  const isPersonal = ['Yourself', 'Family Member', 'Friend / Acquaintance'].includes(category)

  useEffect(() => {
    if (isPersonal || name.trim().length < 2 || selectedResult?.title === name) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const results = await searchWikipedia(name, category)
      setSuggestions(results)
      setSearching(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [name, isPersonal, selectedResult])

  const handleConfirm = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const infobox = selectedResult?.facts?.infobox
      const infoboxAliases = infobox
        ? [
            infobox.alias,
            infobox.aliases,
            infobox.nicknames,
            infobox.name,
          ].filter(Boolean).flatMap((a) => a!.split(/\n|\*|,|\//).map(s => s.trim()).filter(Boolean))
        : []
      const baseAliases = selectedResult?.aliases || [name.trim()]
      const uniqueAliases = Array.from(new Set([...baseAliases, ...infoboxAliases]))

      const isFictional = category === 'Fictional Character'
        ? true
        : category === 'Celebrity / Public Figure' || category === 'Historical Figure'
          ? false
          : selectedResult?.facts?.isFictional

      await submitTarget({
        name: name.trim(),
        canonicalName: selectedResult?.canonicalName || name.trim(),
        aliases: uniqueAliases,
        category,
        source: selectedResult?.source || (selectedResult ? 'wikipedia' : 'manual'),
        facts: [],
        ...(selectedResult?.imageUrl ? { imageUrl: selectedResult.imageUrl } : {}),
        ...(selectedResult?.extract ? { referenceExtract: selectedResult.extract } : {}),
        ...(selectedResult?.pageUrl ? { referenceUrl: selectedResult.pageUrl } : {}),
        ...(selectedResult?.facts ? {
          referenceFacts: {
            occupations: selectedResult.facts.occupations || [],
            nationalities: selectedResult.facts.nationalities || [],
            ...(selectedResult.facts.alive !== undefined ? { alive: selectedResult.facts.alive } : {}),
            ...(selectedResult.facts.gender ? { gender: selectedResult.facts.gender } : {}),
            ...(selectedResult.facts.birthPlace ? { birthPlace: selectedResult.facts.birthPlace } : {}),
            ...(isFictional !== undefined ? { isFictional } : {}),
            ...(selectedResult.facts.infobox ? { infobox: selectedResult.facts.infobox } : {}),
          }
        } : {}),
      })
      setScreen('target-confirm')
    } catch (err) {
      console.error('Failed to save target:', err)
      const message = err instanceof Error ? err.message : 'Check the room connection and try again.'
      setError(`Could not save the target. ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center px-8 py-3 max-w-7xl mx-auto">
          <span className="font-sora text-xl font-extrabold text-primary">Select Target</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center pt-20 pb-8 px-4">
        <div className="glass-panel p-8 max-w-xl w-full border-t-2 border-primary anim-slide">
          <h1 className="font-sora text-2xl text-primary mb-1">Who are you thinking of?</h1>
          <p className="text-on-surface-variant mb-6">
            Pick a person or character. Objects, places, concepts, and animals are filtered out.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-2">Category</label>
              <select 
                value={category} 
                onChange={(e) => {
                  setCategory(e.target.value)
                  setSelectedResult(null)
                  setSuggestions([])
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-3 text-on-surface outline-none"
              >
                {categories.map(c => <option key={c} value={c} className="bg-surface text-on-surface">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-primary uppercase tracking-wider font-bold block mb-2">Target Name</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSelectedResult(null)
                }}
                className="w-full bg-black/20 border-b border-outline-variant focus:border-primary py-3 px-3 text-on-surface outline-none"
                placeholder={isPersonal ? 'Enter the name...' : 'Search a public figure or character...'}
              />
            </div>

            {searching && (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
                Searching...
              </div>
            )}

            {!isPersonal && suggestions.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((result) => (
                  <button
                    key={result.title}
                    onClick={async () => {
                      setLoading(true)
                      let enriched = result
                      let infobox: InfoboxData | undefined
                      try {
                        if (result.source === 'fandom' && result.pageUrl) {
                          const wikiMatch = result.pageUrl.match(/https:\/\/([^\.]+)\.fandom\.com\/wiki\//)
                          const wiki = wikiMatch ? wikiMatch[1] : undefined
                          if (wiki) infobox = await fetchFandomInfobox(wiki, result.title)
                        } else if (result.source === 'wikipedia') {
                          infobox = await fetchWikipediaInfobox(result.title)
                        }
                        if (infobox) {
                          enriched = {
                            ...result,
                            facts: {
                              occupations: result.facts?.occupations || [],
                              nationalities: result.facts?.nationalities || [],
                              ...(result.facts?.alive !== undefined ? { alive: result.facts.alive } : {}),
                              ...(result.facts?.gender ? { gender: result.facts.gender } : {}),
                              ...(result.facts?.birthPlace ? { birthPlace: result.facts.birthPlace } : {}),
                              ...(result.facts?.isFictional !== undefined ? { isFictional: result.facts.isFictional } : {}),
                              infobox,
                            },
                          }
                        }
                      } catch {
                        // enrichment is best-effort
                      }

                      setSelectedResult(enriched)
                      setName(enriched.title)
                      setSuggestions([])
                      setLoading(false)
                    }}
                    className="w-full text-left bg-surface-container-low border border-white/10 rounded-lg p-3 hover:border-primary/60 transition-all flex items-center gap-3"
                  >
                    {result.imageUrl ? (
                      <img src={result.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-surface" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">person</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">{result.title}</p>
                      <p className="text-sm text-on-surface-variant truncate">{result.description || 'Wikipedia result'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isPersonal && name.trim().length >= 2 && !searching && suggestions.length === 0 && !selectedResult && (
              <p className="text-sm text-on-surface-variant">
                No person or character match yet. Try a more specific name.
              </p>
            )}

            {selectedResult && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-3">
                {selectedResult.imageUrl && <img src={selectedResult.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <p className="text-sm font-bold text-primary">
                    Selected from {selectedResult.source === 'fandom' ? 'Fandom' : 'Wikipedia'}
                  </p>
                  <p className="text-sm text-on-surface">{selectedResult.title}</p>
                  {selectedResult.aliases && selectedResult.aliases.length > 1 && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Also accepts: {selectedResult.aliases.slice(1, 4).join(', ')}
                    </p>
                  )}

                </div>
              </div>
            )}

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!name.trim() || loading || (!isPersonal && !selectedResult)}
              className="w-full py-4 btn-primary text-on-primary-container rounded-xl font-sora text-lg font-bold flex items-center justify-center gap-3 neon-glow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Target'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
