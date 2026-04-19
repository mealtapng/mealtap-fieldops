'use client'

import { useState } from 'react'
import type { Step2Data } from '@/lib/capture-state'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step2Data | null
  onContinue: (data: Step2Data) => void
}

// ── Delivery method config ────────────────────────────────────────────────────

const DELIVERY_OPTIONS: { value: string; label: string }[] = [
  { value: 'calls',     label: 'Phone calls' },
  { value: 'whatsapp',  label: 'WhatsApp'    },
  { value: 'chowdeck',  label: 'Chowdeck'   },
  { value: 'glovo',     label: 'Glovo'       },
  { value: 'bolt',      label: 'Bolt Food'   },
  { value: 'other',     label: 'Other'       },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2 px-1">
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
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  hint?: string
  required?: boolean
  touched?: boolean
  prefix?: string
}

function TextInput({
  label, value, onChange, type = 'text', placeholder, hint, required, touched, prefix,
}: TextInputProps) {
  const invalid = required && touched && value.trim().length === 0
  return (
    <div className="px-4 py-3.5">
      <label className="block text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-1.5">
        {label}{required && <span className="text-terra ml-0.5">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {prefix && (
          <span className="text-sm font-semibold text-muted-brand flex-shrink-0">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={type === 'number' ? 'numeric' : undefined}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-brand/60
            focus:outline-none focus:ring-2 focus:border-terra transition-colors
            ${invalid
              ? 'border-red-400 focus:ring-red-200'
              : 'border-line focus:ring-terra/30'
            }`}
        />
      </div>
      {hint && <p className="text-[11px] text-muted-brand mt-1">{hint}</p>}
      {invalid && <p className="text-[11px] text-red-500 mt-1">This field is required</p>}
    </div>
  )
}

interface TriToggleProps {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}

function TriToggle({ label, value, onChange }: TriToggleProps) {
  const options: { v: boolean | null; label: string }[] = [
    { v: true,  label: 'Yes'     },
    { v: false, label: 'No'      },
    { v: null,  label: 'Unknown' },
  ]
  return (
    <div className="px-4 py-3.5">
      <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2">
        {label}
      </p>
      <div className="flex gap-2">
        {options.map(opt => {
          const active = value === opt.v
          let activeClass = 'bg-line text-ink border-line'
          if (active) {
            if (opt.v === true)  activeClass = 'bg-forest text-white border-forest'
            if (opt.v === false) activeClass = 'bg-terra text-white border-terra'
            if (opt.v === null)  activeClass = 'bg-ink text-white border-ink'
          }
          return (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => onChange(opt.v)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors
                ${active ? activeClass : 'bg-cream text-muted-brand border-line'}`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DeliveryChipsProps {
  value: string
  onChange: (v: string) => void
}

function DeliveryChips({ value, onChange }: DeliveryChipsProps) {
  return (
    <div className="px-4 pb-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2">
        Platform
      </p>
      <div className="flex flex-wrap gap-2">
        {DELIVERY_OPTIONS.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors
                ${active
                  ? 'bg-forest-light border-forest text-forest'
                  : 'bg-white border-line text-muted-brand'
                }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaptureStep2Details({ initialData: initial, onContinue }: Props) {
  const [name,            setName]           = useState(initial?.name ?? '')
  const [ownerName,       setOwnerName]      = useState(initial?.ownerName ?? '')
  const [ownerPhone,      setOwnerPhone]     = useState(initial?.ownerPhone ?? '')
  const [cuisineType,     setCuisineType]    = useState(initial?.cuisineType ?? '')
  const [avgPrice,        setAvgPrice]       = useState(initial?.avgPrice != null ? String(initial.avgPrice) : '')
  const [dailyVolume,     setDailyVolume]    = useState(initial?.dailyOrderVolume != null ? String(initial.dailyOrderVolume) : '')
  const [delivers,        setDelivers]       = useState<boolean | null>(initial?.currentlyDelivers ?? null)
  const [deliveryMethod,  setDeliveryMethod] = useState(initial?.deliveryMethod && initial.deliveryMethod !== 'none' ? initial.deliveryMethod : 'calls')
  const [hasSmartphone,   setHasSmartphone]  = useState<boolean | null>(initial?.hasSmartphone ?? null)
  const [hasBankAccount,  setHasBankAccount] = useState<boolean | null>(initial?.hasBankAccount ?? null)
  const [hasPOS,          setHasPOS]         = useState<boolean | null>(initial?.hasPOS ?? null)
  const [nameTouched,     setNameTouched]    = useState(false)

  function handleDeliversChange(v: boolean | null) {
    setDelivers(v)
    // Reset delivery method when toggling off
    if (v !== true) setDeliveryMethod('calls')
  }

  const canContinue = name.trim().length > 0

  function handleContinue() {
    setNameTouched(true)
    if (!canContinue) return
    onContinue({
      name:              name.trim(),
      ownerName:         ownerName.trim(),
      ownerPhone:        ownerPhone.trim(),
      cuisineType:       cuisineType.trim(),
      avgPrice:          avgPrice !== '' ? Number(avgPrice) : null,
      dailyOrderVolume:  dailyVolume !== '' ? Number(dailyVolume) : null,
      currentlyDelivers: delivers,
      deliveryMethod:    delivers === true ? deliveryMethod : 'none',
      hasSmartphone,
      hasBankAccount,
      hasPOS,
    })
  }

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
              value={name}
              onChange={v => { setName(v); setNameTouched(true) }}
              placeholder="e.g. Mama's Kitchen"
              required
              touched={nameTouched}
            />
            <TextInput
              label="Cuisine type"
              value={cuisineType}
              onChange={setCuisineType}
              placeholder="e.g. Nigerian, Suya, Shawarma"
            />
          </FormCard>
        </div>

        {/* Owner */}
        <div>
          <SectionHeader title="Owner" />
          <FormCard>
            <TextInput
              label="Owner name"
              value={ownerName}
              onChange={setOwnerName}
              placeholder="Full name (optional)"
            />
            <TextInput
              label="Owner phone"
              value={ownerPhone}
              onChange={setOwnerPhone}
              type="tel"
              placeholder="+234…"
            />
          </FormCard>
        </div>

        {/* Pricing & volume */}
        <div>
          <SectionHeader title="Pricing & Volume" />
          <FormCard>
            <TextInput
              label="Avg meal price"
              value={avgPrice}
              onChange={v => setAvgPrice(v.replace(/\D/g, ''))}
              type="number"
              placeholder="0"
              prefix="₦"
              hint="Typical main dish price"
            />
            <TextInput
              label="Daily orders (est.)"
              value={dailyVolume}
              onChange={v => setDailyVolume(v.replace(/\D/g, ''))}
              type="number"
              placeholder="0"
              hint="Estimated orders per day"
            />
          </FormCard>
        </div>

        {/* Delivery */}
        <div>
          <SectionHeader title="Delivery" />
          <FormCard>
            <TriToggle
              label="Currently delivers?"
              value={delivers}
              onChange={handleDeliversChange}
            />
            {delivers === true && (
              <DeliveryChips
                value={deliveryMethod}
                onChange={setDeliveryMethod}
              />
            )}
          </FormCard>
        </div>

        {/* Digital readiness */}
        <div>
          <SectionHeader title="Digital Readiness" />
          <FormCard>
            <TriToggle label="Has smartphone?"    value={hasSmartphone}  onChange={setHasSmartphone}  />
            <TriToggle label="Has bank account?"  value={hasBankAccount} onChange={setHasBankAccount} />
            <TriToggle label="Has POS machine?"   value={hasPOS}         onChange={setHasPOS}         />
          </FormCard>
        </div>

      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          onClick={handleContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canContinue
              ? 'bg-terra text-white shadow-lg shadow-terra/25 active:bg-terra-dark'
              : 'bg-line text-muted-brand cursor-not-allowed'
          }`}
        >
          Continue to photos →
        </button>
        {!canContinue && nameTouched && (
          <p className="text-[11px] text-center text-red-500 mt-1.5">
            Restaurant name is required
          </p>
        )}
      </div>
    </div>
  )
}
