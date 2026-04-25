'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import logoSrc from '../../../../public/Logo.PNG'

export default function LoginPage() {
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
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

  useEffect(() => {
    const timers = maskTimers.current
    return () => { timers.forEach(t => { if (t) clearTimeout(t) }) }
  }, [])

  const displayPin = pin.map((d, i) => d ? (pinVisible[i] ? d : '•') : '')

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = digit
    setPin(next)

    if (digit) {
      setPinVisible(prev => { const v = [...prev]; v[index] = true; return v })
      if (maskTimers.current[index]) clearTimeout(maskTimers.current[index]!)
      maskTimers.current[index] = setTimeout(() => {
        setPinVisible(prev => { const v = [...prev]; v[index] = false; return v })
      }, 150)
      if (index < 3) pinRefs[index + 1].current?.focus()
    } else {
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, pin: pin.join('') }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
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
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(160deg, #1F3F1B 0%, #2D5A27 45%, #1F3F1B 100%)',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at 60% 20%, rgba(200,98,42,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(45,90,39,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Tagline above card */}
        <div className="text-center mb-6">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Field Operations Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-8 pt-8 pb-10"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 16px 48px rgba(45,90,39,0.25)',
          }}
        >
          {/* Logo */}
          <div className="mb-4">
            <Image
              src={logoSrc}
              alt="Mealtap"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <h1
            className="text-xl font-bold mb-1"
            style={{ color: '#2D5A27' }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B6B6B' }}>
            Sign in to start your shift
          </p>

          {/* Phone field */}
          <div className="mb-6">
            <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#6B6B6B' }}>
              Phone Number
            </label>
            <div
              className="flex items-center rounded-2xl overflow-hidden border"
              style={{ borderColor: '#E5E5E0', background: '#F5F5F0' }}
            >
              <span
                className="flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold border-r whitespace-nowrap select-none"
                style={{ color: '#2D5A27', borderColor: '#E5E5E0' }}
              >
                🇳🇬 +234
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="8012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-3.5 text-sm outline-none min-w-0 bg-transparent"
                style={{ color: '#1A1A1A' }}
              />
            </div>
          </div>

          {/* PIN field */}
          <div className="mb-8">
            <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#4a6b4c' }}>
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
                  className="w-14 h-14 text-center text-2xl font-bold rounded-2xl outline-none transition-all"
                  style={{
                    background: '#F5F5F0',
                    color: '#2D5A27',
                    border: focusedPin === i
                      ? '2px solid #2D5A27'
                      : '1px solid #E5E5E0',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sign In button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold py-4 rounded-full text-white transition-all disabled:opacity-60"
            style={{
              background: '#C8622A',
              boxShadow: '0 4px 20px rgba(200,98,42,0.35)',
              fontSize: '15px',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in to Field Ops →'}
          </button>

          {error && (
            <p className="text-center text-xs text-red-600 font-medium mt-3">
              {error}
            </p>
          )}

          <p className="text-center text-xs mt-4" style={{ color: '#6B6B6B' }}>
            Forgot PIN? Message your field lead.
          </p>
        </div>
      </div>
    </main>
  )
}
