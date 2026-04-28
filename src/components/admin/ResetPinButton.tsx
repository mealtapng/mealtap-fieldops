'use client'

import { useState } from 'react'

interface Props {
  agentId:   string
  agentName: string
}

export function ResetPinButton({ agentId, agentName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [newPin,     setNewPin]     = useState<string | null>(null)
  const [error,      setError]      = useState('')

  async function doReset() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/admin/agents/reset-pin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to reset PIN'); return }
      setNewPin(data.pin)
      setConfirming(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function dismiss() { setNewPin(null); setError('') }

  return (
    <>
      <button
        onClick={() => { setConfirming(true); setError('') }}
        className="px-4 py-2 rounded-xl text-sm font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
      >
        Reset PIN
      </button>

      {/* Confirm modal */}
      {confirming && !newPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-ink mb-1">Reset PIN</h2>
            <p className="text-sm text-muted mb-5">
              Generate a new random PIN for <span className="font-semibold text-ink">{agentName}</span>.
              Their current PIN will stop working immediately.
            </p>
            {error && <p className="text-xs text-red-500 font-medium mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirming(false); setError('') }}
                className="flex-1 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={doReset}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 bg-amber-600 hover:bg-amber-700"
              >
                {loading ? 'Resetting…' : 'Reset PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New PIN reveal modal */}
      {newPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-forest-light flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ink mb-1">PIN reset</h2>
            <p className="text-sm text-muted mb-5">
              Share this new PIN with <span className="font-semibold text-ink">{agentName}</span>.
              It will not be shown again.
            </p>
            <div className="bg-cream rounded-2xl px-6 py-4 mb-5 tracking-[0.4em] text-3xl font-bold text-ink font-mono">
              {newPin}
            </div>
            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
              style={{ background: '#2D5A27' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
