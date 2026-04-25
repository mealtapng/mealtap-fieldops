'use client'

import { useState } from 'react'
import { CUISINE_OPTIONS, DELIVERY_OPTIONS } from '@/lib/capture-state'
import type { Step2Data } from '@/lib/capture-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step2Data | null
  onContinue:  (data: Step2Data) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-muted uppercase mb-2 px-1">
      {title}
    </p>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-line">
      {children}
    </div>
  )
}

interface TextInputProps {
  label:        string
  value:        string
  onChange:     (v: string) => void
  type?:        string
  inputMode?:   React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  hint?:        string
  required?:    boolean
  touched?:     boolean
  maxLength?:   number
}

function TextInput({
  label, value, onChange, type = 'text', inputMode, placeholder, hint, required, touched, maxLength,
}: TextInputProps) {
  const invalid = required && touched && value.trim().length === 0
  return (
    <div className="px-4 py-3.5">
      <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
        {label}{required && <span className="text-terra ml-0.5">*</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60
          focus:outline-none focus:ring-2 focus:border-forest transition-colors
          ${invalid
            ? 'border-red-400 focus:ring-red-200'
            : 'border-line focus:ring-forest/30'
          }`}
      />
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
      {invalid && <p className="text-[11px] text-red-500 mt-1">This field is required</p>}
    </div>
  )
}

interface ToggleRowProps {
  label:       string
  checked:     boolean
  onChange:    (v: boolean) => void
  description?: string
}

function ToggleRow({ label, checked, onChange, description }: ToggleRowProps) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="text-[11px] text-muted">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-forest' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaptureStep2Details({ initialData: initial, onContinue }: Props) {
  const [restaurantName, setRestaurantName] = useState(initial?.restaurantName ?? '')
  const [ownerName,      setOwnerName]      = useState(initial?.ownerName      ?? '')
  const [ownerPhone,     setOwnerPhone]     = useState(initial?.ownerPhone     ?? '')
  const [cuisineType,    setCuisineType]    = useState<string>(initial?.cuisineType ?? '')
  const [avgPrice,       setAvgPrice]       = useState(
    initial?.avgMealPriceNaira != null ? String(initial.avgMealPriceNaira) : ''
  )
  const [volume,         setVolume]         = useState(
    initial?.dailyOrderVolumeEstimate != null ? String(initial.dailyOrderVolumeEstimate) : ''
  )
  const [delivers,       setDelivers]       = useState(initial?.currentlyDelivers ?? false)
  const [deliveryMethod, setDeliveryMethod] = useState<string>(initial?.deliveryMethod ?? '')
  const [hasSmart,       setHasSmart]       = useState(initial?.hasSmartphone  ?? false)
  const [hasBank,        setHasBank]        = useState(initial?.hasBankAccount  ?? false)
  const [hasPOS,         setHasPOS]         = useState(initial?.hasPOS          ?? false)

  const [nameTouched,  setNameTouched]  = useState(false)
  const [ownerTouched, setOwnerTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const canContinue =
    restaurantName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    ownerPhone.trim().length >= 10

  function handleContinue() {
    setNameTouched(true)
    setOwnerTouched(true)
    setPhoneTouched(true)
    if (!canContinue) return
    onContinue({
      restaurantName:           restaurantName.trim(),
      ownerName:                ownerName.trim(),
      ownerPhone:               ownerPhone.trim(),
      cuisineType:              cuisineType as Step2Data['cuisineType'],
      avgMealPriceNaira:        avgPrice ? Number(avgPrice) : null,
      dailyOrderVolumeEstimate: volume ? Number(volume) : null,
      currentlyDelivers:        delivers,
      deliveryMethod:           delivers ? deliveryMethod as Step2Data['deliveryMethod'] : '',
      hasSmartphone:            hasSmart,
      hasBankAccount:           hasBank,
      hasPOS,
    })
  }

  const phoneInvalid = phoneTouched && ownerPhone.trim().length < 10

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-4 pb-4">

        {/* Restaurant */}
        <div>
          <SectionHeader title="Restaurant" />
          <FormCard>
            <TextInput
              label="Restaurant name"
              value={restaurantName}
              onChange={v => { setRestaurantName(v); setNameTouched(true) }}
              placeholder="e.g. Mama Nkechi's Kitchen"
              required
              touched={nameTouched}
            />
            <TextInput
              label="Owner / manager name"
              value={ownerName}
              onChange={v => { setOwnerName(v); setOwnerTouched(true) }}
              placeholder="Full name"
              required
              touched={ownerTouched}
            />

            {/* Owner phone with +234 prefix */}
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                Owner phone<span className="text-terra ml-0.5">*</span>
              </label>
              <div className={`flex items-center gap-0 rounded-xl border overflow-hidden
                focus-within:ring-2 focus-within:ring-forest/30 focus-within:border-forest transition-colors
                ${phoneInvalid ? 'border-red-400' : 'border-line'}`}>
                <span className="px-3 py-2.5 text-sm font-semibold text-ink bg-cream border-r border-line flex-shrink-0">
                  🇳🇬 +234
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={ownerPhone}
                  onChange={e => { setOwnerPhone(e.target.value); setPhoneTouched(true) }}
                  placeholder="08XX XXX XXXX"
                  maxLength={15}
                  className="flex-1 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none bg-white"
                />
              </div>
              {phoneInvalid && (
                <p className="text-[11px] text-red-500 mt-1">Enter a valid Nigerian phone number</p>
              )}
            </div>

            {/* Cuisine type */}
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                Cuisine type
              </label>
              <select
                value={cuisineType}
                onChange={e => setCuisineType(e.target.value)}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink bg-white
                  focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors appearance-none"
              >
                <option value="">Select cuisine…</option>
                {CUISINE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </FormCard>
        </div>

        {/* Volume & price */}
        <div>
          <SectionHeader title="Business snapshot" />
          <FormCard>
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                Average meal price (₦)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={avgPrice}
                onChange={e => setAvgPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1500"
                min={0}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60
                  focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
              />
            </div>
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                Daily order volume (estimate)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={volume}
                onChange={e => setVolume(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 50"
                min={0}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60
                  focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
              />
            </div>
          </FormCard>
        </div>

        {/* Delivery */}
        <div>
          <SectionHeader title="Delivery" />
          <FormCard>
            <ToggleRow
              label="Currently delivers"
              checked={delivers}
              onChange={setDelivers}
              description="Restaurant already does deliveries"
            />
            {delivers && (
              <div className="px-4 py-3.5">
                <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1.5">
                  Delivery method
                </label>
                <select
                  value={deliveryMethod}
                  onChange={e => setDeliveryMethod(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink bg-white
                    focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors appearance-none"
                >
                  <option value="">Select method…</option>
                  {DELIVERY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </FormCard>
        </div>

        {/* Tech & finance */}
        <div>
          <SectionHeader title="Tech & finance" />
          <FormCard>
            <ToggleRow
              label="Has smartphone"
              checked={hasSmart}
              onChange={setHasSmart}
              description="Owner uses a smartphone"
            />
            <ToggleRow
              label="Has bank account"
              checked={hasBank}
              onChange={setHasBank}
              description="Business has a bank account"
            />
            <ToggleRow
              label="Has POS terminal"
              checked={hasPOS}
              onChange={setHasPOS}
              description="Business accepts card payments"
            />
          </FormCard>
        </div>

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canContinue
              ? 'bg-forest text-white shadow-lg shadow-forest/25 active:bg-forest-dark'
              : 'bg-line text-muted cursor-not-allowed'
          }`}
        >
          Continue to photos →
        </button>
        {!canContinue && (nameTouched || ownerTouched || phoneTouched) && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Restaurant name, owner name, and phone are required
          </p>
        )}
      </div>
    </div>
  )
}
