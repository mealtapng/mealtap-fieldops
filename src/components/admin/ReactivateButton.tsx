'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReactivateButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReactivate() {
    if (!window.confirm(`Reactivate ${agentName}? They will regain login access immediately.`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/agents/reactivate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to reactivate agent')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={loading}
      className="px-4 py-2.5 rounded-xl border border-forest/30 text-sm font-semibold text-forest hover:bg-forest/5 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Reactivating…' : 'Reactivate Agent'}
    </button>
  )
}
