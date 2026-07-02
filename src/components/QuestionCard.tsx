import React from 'react'
import { Question } from '../store/gameStore'

export function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="glass-panel p-4 border-l-4 border-primary">
      <p className="text-sm text-on-surface">
        <span className="text-primary font-bold">{question.askerName}:</span> {question.text}
      </p>
      <p className="text-sm mt-1">
        <span className="text-on-surface-variant">Answer: </span>
        <span className={`font-bold ${
          question.answer === 'Yes' ? 'text-secondary-container' :
          question.answer === 'No' ? 'text-error' :
          'text-on-surface-variant'
        }`}>
          {question.answer}
        </span>
      </p>
    </div>
  )
}