'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  // pinVisible[i] = true means the digit is briefly shown before masking
  const [pinVisible, setPinVisible] = useState([false, false, false, false])
  const [focusedPin, setFocusedPin] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const maskTimers = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null, null])

  // Clean up any pending mask timers on unmount
  useEffect(() => {
    const timers = maskTimers.current
    return () => { timers.forEach(t => { if (t) clearTimeout(t) }) }
  }, [])

  // Display value: show digit briefly, then replace with bullet
  const displayPin = pin.map((d, i) => d ? (pinVisible[i] ? d : '•') : '')

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = digit
    setPin(next)

    if (digit) {
      // Flash the digit for 150ms then mask it
      setPinVisible(prev => { const v = [...prev]; v[index] = true; return v })
      if (maskTimers.current[index]) clearTimeout(maskTimers.current[index]!)
      maskTimers.current[index] = setTimeout(() => {
        setPinVisible(prev => { const v = [...prev]; v[index] = false; return v })
      }, 150)
      if (index < 3) pinRefs[index + 1].current?.focus()
    } else {
      // Digit cleared — mask immediately
      if (maskTimers.current[index]) clearTimeout(maskTimers.current[index]!)
      setPinVisible(prev => { const v = [...prev]; v[index] = false; return v })
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: pin.join('') }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        // Don't clear PIN on rate-limit errors — the credentials may be correct,
        // the user just needs to wait. Clear only for auth/validation failures.
        if (res.status !== 429) {
          setPin(['', '', '', ''])
          pinRefs[0].current?.focus()
        }
        return
      }

      if (data.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
      setPin(['', '', '', ''])
      pinRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

        {/* Logo */}
        <div className="mb-6 flex items-center gap-0.5">
          <span className="text-3xl font-bold text-brand">Power</span>
          <span className="text-3xl font-bold text-success">Chat</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-brand mb-1">Welcome back</h1>
        <p className="text-sm text-muted-brand mb-8">Sign in to start your shift</p>

        {/* Phone field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold tracking-wider text-muted-brand uppercase mb-2">
            Phone Number
          </label>
          <div className="flex items-center bg-cream border border-line rounded-xl overflow-hidden">
            <span className="flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold text-brand border-r border-line whitespace-nowrap select-none">
              🇳🇬 +234
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="8012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-cream px-3 py-3.5 text-sm text-ink placeholder:text-muted-brand/50 outline-none min-w-0"
            />
          </div>
        </div>

        {/* PIN field */}
        <div className="mb-8">
          <label className="block text-xs font-semibold tracking-wider text-muted-brand uppercase mb-3">
            4-Digit PIN
          </label>
          <div className="flex justify-center gap-3">
            {displayPin.map((displayed, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={displayed}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                onFocus={() => {
                  setFocusedPin(i)
                  pinRefs[i].current?.select()
                }}
                onBlur={() => setFocusedPin(-1)}
                className={[
                  'w-14 h-14 text-center text-2xl font-bold text-brand bg-cream rounded-xl outline-none transition-colors',
                  focusedPin === i
                    ? 'border-2 border-brand'
                    : 'border border-line',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Sign In button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-success hover:bg-success-dark active:bg-success-dark disabled:opacity-60 text-white font-semibold py-4 rounded-xl shadow-lg shadow-success/20 transition-colors mb-3"
        >
          {loading ? 'Signing in…' : 'Sign in to Field Ops →'}
        </button>

        {/* Error message */}
        {error && (
          <p className="text-center text-xs text-red-600 font-medium mb-3">
            {error}
          </p>
        )}

        {/* Helper text */}
        <p className="text-center text-xs text-muted-brand">
          Forgot PIN? Message your field lead.
        </p>

      </div>
    </main>
  )
}
