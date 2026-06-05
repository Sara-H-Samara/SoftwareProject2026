import { useState } from 'react'
import { startLiveSession, endLiveSession, LiveSessionDto } from '@/api/live.api'

interface Props {
  onSessionStart: (session: LiveSessionDto) => void
  onSessionEnd: () => void
  activeSession: LiveSessionDto | null
}

export function ArtistLivePanel({ onSessionStart, onSessionEnd, activeSession }: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    maxVisitors: 50,
    durationMinutes: 60,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (!form.title.trim()) return setError('Title is required')
    setLoading(true)
    setError(null)
    try {
      const session = await startLiveSession(form)
      onSessionStart(session)
    } catch {
      setError('Failed to start session. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnd = async () => {
    if (!activeSession) return
    setLoading(true)
    try {
      await endLiveSession(activeSession.id)
      onSessionEnd()
    } catch {
      setError('Failed to end session.')
    } finally {
      setLoading(false)
    }
  }

  // ── Active session view ───────────────────────────────────────────────────
  if (activeSession) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">Live</span>
          </div>
          <button
            onClick={handleEnd}
            disabled={loading}
            className="px-4 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {loading ? 'Ending...' : 'End Session'}
          </button>
        </div>

        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
          {activeSession.title}
        </h3>
        {activeSession.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {activeSession.description}
          </p>
        )}

        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Max visitors: {activeSession.maxVisitors}</span>
          {activeSession.endsAt && (
            <span>
               Ends: {new Date(activeSession.endsAt + 'Z').toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }

  // ── Start session form ────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
        Start a Live Session
      </h3>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Session title *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Max visitors
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.maxVisitors}
              onChange={e => setForm(f => ({ ...f, maxVisitors: +e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={480}
              value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm disabled:opacity-50 transition"
        >
          {loading ? 'Starting...' : '🔴 Go Live'}
        </button>
      </div>
    </div>
  )
}