'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeactivateButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDeactivate() {
    if (!window.confirm(`Deactivate ${agentName}? They will lose access immediately.`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/agents/deactivate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to deactivate agent')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDeactivate}
      disabled={loading}
      className="px-4 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Deactivating…' : 'Deactivate Agent'}
    </button>
  )
}
