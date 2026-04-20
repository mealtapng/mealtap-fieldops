'use client'

import { useState } from 'react'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-success font-semibold disabled:opacity-60 transition-opacity"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
