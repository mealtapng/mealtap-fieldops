'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [focusedPin, setFocusedPin] = useState(-1)

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = digit
    setPin(next)
    if (digit && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  function handleSubmit() {
    console.log('Phone:', `+234${phone}`)
    console.log('PIN:', pin.join(''))
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm px-8 py-10">

        {/* Logo */}
        <Image
          src="/mealtap-logo.png"
          alt="Mealtap"
          width={80}
          height={80}
          priority
          className="mb-6"
        />

        {/* Heading */}
        <h1 className="text-2xl font-bold text-forest mb-1">Welcome back</h1>
        <p className="text-sm text-muted-brand mb-8">Sign in to start your shift</p>

        {/* Phone field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold tracking-wider text-muted-brand uppercase mb-2">
            Phone Number
          </label>
          <div className="flex items-center bg-cream border border-line rounded-xl overflow-hidden">
            <span className="flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold text-forest border-r border-line whitespace-nowrap select-none">
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
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                onFocus={() => {
                  setFocusedPin(i)
                  pinRefs[i].current?.select()
                }}
                onBlur={() => setFocusedPin(-1)}
                className={[
                  'w-14 h-14 text-center text-2xl font-bold text-forest bg-cream rounded-xl outline-none transition-colors',
                  focusedPin === i
                    ? 'border-2 border-forest'
                    : 'border border-line',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Sign In button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-terra hover:bg-terra-dark active:bg-terra-dark text-white font-semibold py-4 rounded-xl shadow-lg shadow-terra/20 transition-colors mb-4"
        >
          Sign in to Field Ops →
        </button>

        {/* Helper text */}
        <p className="text-center text-xs text-muted-brand">
          Forgot PIN? Message your field lead.
        </p>

      </div>
    </main>
  )
}
