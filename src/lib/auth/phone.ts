/**
 * Normalised phone number in two formats.
 * e164   — E.164 with leading + as stored in public.users.phone  e.g. +2348099001234
 * digits — digits only, used as the synthetic auth email prefix   e.g. 2348099001234
 */
export type NormalizedPhone = {
  e164: string
  digits: string
}

/**
 * Normalise a Nigerian phone number to E.164 format.
 *
 * Accepts:
 *   08099001234     → +2348099001234   (leading 0 replaced with 234)
 *   2348099001234   → +2348099001234   (already has country code, no +)
 *   +2348099001234  → +2348099001234   (already E.164)
 *   8099001234      → +2348099001234   (10-digit starting with 7/8/9)
 *
 * Throws if the result is not exactly 13 digits or doesn't start with 234.
 */
export function normalizePhone(input: string): NormalizedPhone {
  const stripped = input.replace(/\D/g, '')

  let digits: string

  if (stripped.startsWith('0')) {
    // 080... → 2348...
    digits = '234' + stripped.slice(1)
  } else if (stripped.startsWith('234')) {
    // Already has country code
    digits = stripped
  } else if (stripped.length === 10 && /^[789]/.test(stripped)) {
    // 10-digit local number starting with 7, 8, or 9
    digits = '234' + stripped
  } else {
    throw new Error(`Cannot normalise phone number: "${input}"`)
  }

  if (digits.length !== 13) {
    throw new Error(
      `Normalised number must be 13 digits (got ${digits.length}): "${digits}"`
    )
  }

  if (!digits.startsWith('234')) {
    throw new Error(`Normalised number must start with 234: "${digits}"`)
  }

  return { e164: '+' + digits, digits }
}
