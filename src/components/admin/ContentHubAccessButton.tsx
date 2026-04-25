'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  agentId:     string
  agentName:   string
  currentRole: string
}

export function ContentHubAccessButton({ agentId, agentName, currentRole }: Props) {
  const router  = useRouter()
  const hasAccess = currentRole === 'content_manager'
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function toggle() {
    const newRole = hasAccess ? 'agent' : 'content_manager'
    const confirmMsg = hasAccess
      ? `Remove Content Hub access from ${agentName}? Their role will revert to Agent.`
      : `Grant Content Hub access to ${agentName}? Their role will change to Content Manager.`

    if (!confirm(confirmMsg)) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/agents/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, role: newRole }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to update role')
      return
    }

    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            {hasAccess ? '✅ Content Hub access enabled' : 'No Content Hub access'}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {hasAccess
              ? 'This user can manage content weeks, upload assets, and use the message board.'
              : 'Grant access to let this person manage content for PowerChat social channels.'}
          </p>
        </div>
      </div>

      {hasAccess ? (
        <button
          onClick={toggle}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Removing…' : 'Revoke Content Hub access'}
        </button>
      ) : (
        <button
          onClick={toggle}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: '#1B5E20' }}
        >
          {loading ? 'Granting…' : 'Grant Content Hub access'}
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
