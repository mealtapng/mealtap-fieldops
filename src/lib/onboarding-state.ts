/**
 * PowerChat Field Ops — Onboarding Wizard State
 *
 * TypeScript types for the 4-step customer onboarding flow.
 * State lives in onboard/page.tsx via useState and is passed
 * down as props. No React context needed for a linear wizard.
 */

type ConversionStatus = 'converted' | 'pending' | 'failed'

// ── Step 1: GPS location lock ─────────────────────────────────────────────────

export interface Step1Data {
  lat: number
  lng: number
  accuracy: number
  address: string
  lockedAt: string // ISO 8601 timestamp
}

// ── Step 2: Customer details ──────────────────────────────────────────────────

export interface Step2Data {
  userPhone: string
  userName: string
  meterNumber: string
  discoArea: string
}

// Dropdown options for Nigerian electricity distribution companies
export const DISCO_OPTIONS = [
  { value: 'Ikeja Electric (IE)',             label: 'Ikeja Electric (IE)' },
  { value: 'Eko Electricity (EKEDC)',          label: 'Eko Electricity (EKEDC)' },
  { value: 'Abuja Electricity (AEDC)',         label: 'Abuja Electricity (AEDC)' },
  { value: 'Ibadan Electricity (IBEDC)',       label: 'Ibadan Electricity (IBEDC)' },
  { value: 'Port Harcourt Electricity (PHED)', label: 'Port Harcourt Electricity (PHED)' },
  { value: 'Enugu Electricity (EEDC)',         label: 'Enugu Electricity (EEDC)' },
  { value: 'Kano Electricity (KEDCO)',         label: 'Kano Electricity (KEDCO)' },
  { value: 'Kaduna Electricity (KAEDCO)',      label: 'Kaduna Electricity (KAEDCO)' },
  { value: 'Jos Electricity (JED)',            label: 'Jos Electricity (JED)' },
  { value: 'Yola Electricity (YEDC)',          label: 'Yola Electricity (YEDC)' },
  { value: 'Benin Electricity (BEDC)',         label: 'Benin Electricity (BEDC)' },
] as const

export type DiscoOption = typeof DISCO_OPTIONS[number]['value']

// ── Step 3: Conversion checklist ──────────────────────────────────────────────

export interface Step3Data {
  checklistSavedNumber: boolean
  checklistSentHi: boolean
  checklistEnteredCode: boolean
  checklistPurchasedToken: boolean
  tokenAmountPurchased: number | null
}

// ── Step 4: Outcome ───────────────────────────────────────────────────────────

export interface Step4Data {
  conversionStatus: ConversionStatus | null
  notes: string
}

// ── Combined wizard state ─────────────────────────────────────────────────────

export interface OnboardingWizardState {
  step1: Step1Data | null
  step2: Step2Data | null
  step3: Step3Data | null
  step4: Step4Data | null
}

export const EMPTY_ONBOARDING_STATE: OnboardingWizardState = {
  step1: null,
  step2: null,
  step3: null,
  step4: null,
}

// ── Step metadata ─────────────────────────────────────────────────────────────

export const STEP_TITLES: Record<number, string> = {
  1: 'Pin the location',
  2: 'Customer details',
  3: 'Conversion checklist',
  4: 'Outcome',
}

export const TOTAL_STEPS = 4
