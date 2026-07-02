import React, { useEffect, useState } from 'react'
import { suggestAnswer, FactSuggestion, WikiFacts } from '../utils/wikiApi'

interface SmartSuggestionProps {
  question: string
  facts?: WikiFacts
  referenceExtract?: string
  targetName?: string
  children: (suggestion: FactSuggestion, loading: boolean) => React.ReactNode
}

export function SmartSuggestion({ question, facts, referenceExtract, targetName, children }: SmartSuggestionProps) {
  const [state, setState] = useState<{ suggestion: FactSuggestion; loading: boolean }>({
    suggestion: { answer: 'Unknown', reason: 'Checking facts…' },
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    setState({ suggestion: { answer: 'Unknown', reason: 'Checking facts…' }, loading: true })

    suggestAnswer(question, facts, referenceExtract, targetName).then((suggestion) => {
      if (cancelled) return
      setState({ suggestion, loading: false })
    })

    return () => {
      cancelled = true
    }
  }, [question, facts, referenceExtract, targetName])

  return <>{children(state.suggestion, state.loading)}</>
}
