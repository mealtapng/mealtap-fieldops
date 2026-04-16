/**
 * Mealtap Field Ops — Capture Wizard State
 *
 * TypeScript types for the 4-step restaurant capture flow.
 * State lives in capture/page.tsx via useState and is passed
 * down as props. No React context needed for a linear wizard.
 */

// ── Step 1: GPS location lock ─────────────────────────────────────────────────

export interface Step1Data {
  lat: number
  lng: number
  accuracy: number
  address: string
  lockedAt: string // ISO 8601 timestamp
}

// ── Step 2: Restaurant details ────────────────────────────────────────────────

export interface Step2Data {
  name: string
  ownerName: string
  ownerPhone: string
  cuisineType: string
  avgPrice: number | null
  dailyOrderVolume: number | null
  currentlyDelivers: boolean | null
  deliveryMethod: string
  hasSmartphone: boolean | null
  hasBankAccount: boolean | null
  hasPOS: boolean | null
}

// ── Step 3: Photos ────────────────────────────────────────────────────────────

export interface Step3Data {
  storefrontPhoto: File | null
  menuPhoto: File | null
  dishPhoto: File | null
}

// ── Step 4: Qualification ─────────────────────────────────────────────────────

export interface Step4Data {
  ownerReaction: number | null // 1-5
  tag: 'hot' | 'warm' | 'cold' | 'not_a_fit' | null
  notes: string
}

// ── Combined wizard state ─────────────────────────────────────────────────────

export interface CaptureWizardState {
  step1: Step1Data | null
  step2: Step2Data | null
  step3: Step3Data | null
  step4: Step4Data | null
}

export const EMPTY_CAPTURE_STATE: CaptureWizardState = {
  step1: null,
  step2: null,
  step3: null,
  step4: null,
}

// ── Step metadata ─────────────────────────────────────────────────────────────

export const STEP_TITLES: Record<number, string> = {
  1: 'Pin the location',
  2: 'Restaurant details',
  3: 'Photos',
  4: 'Qualification',
}

export const TOTAL_STEPS = 4
