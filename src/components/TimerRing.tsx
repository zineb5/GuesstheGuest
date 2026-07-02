import React from 'react'

export function TimerRing({ durationSeconds, remainingSeconds }: { durationSeconds: number; remainingSeconds: number }) {
  const pct = durationSeconds > 0
    ? Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100))
    : 0

  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-surface-container-highest"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="text-primary transition-all duration-1000"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${pct}, 100`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-on-surface">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}