import type { LeadTag, CuisineType, DeliveryMethod } from './types/database'

// ── Step 1: GPS location lock ─────────────────────────────────────────────────

export interface Step1Data {
  lat:      number
  lng:      number
  accuracy: number
  address:  string
  lockedAt: string
}

// ── Step 2: Restaurant details ────────────────────────────────────────────────

export interface Step2Data {
  restaurantName:            string
  ownerName:                 string
  ownerPhone:                string
  cuisineType:               CuisineType | ''
  avgMealPriceNaira:         number | null
  dailyOrderVolumeEstimate:  number | null
  currentlyDelivers:         boolean
  deliveryMethod:            DeliveryMethod | ''
  hasSmartphone:             boolean
  hasBankAccount:            boolean
  hasPOS:                    boolean
}

export const CUISINE_OPTIONS: CuisineType[] = [
  'Local', 'Continental', 'Fast Food', 'Snacks', 'Drinks', 'Mixed',
]

export const DELIVERY_OPTIONS: DeliveryMethod[] = [
  'None', 'Calls', 'WhatsApp', 'Chowdeck', 'Glovo', 'Bolt', 'Other',
]

// ── Step 3: Photos ────────────────────────────────────────────────────────────

export interface Step3Data {
  storefrontPath: string | null
  menuPath:       string | null
  dishPath:       string | null
  ownerPath:      string | null
}

// ── Step 4: Tag & notes ───────────────────────────────────────────────────────

export interface Step4Data {
  ownerReaction: number
  tag:           LeadTag | null
  notes:         string
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

export const STEP_TITLES: Record<number, string> = {
  1: 'Pin the location',
  2: 'Restaurant details',
  3: 'Photos',
  4: 'Tag & notes',
}

export const TOTAL_STEPS = 4
