import bcrypt from 'bcryptjs'

const BCRYPT_COST = 10

/** Returns true only if pin is exactly 4 ASCII digits. */
export function validatePinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

/** Hash a 4-digit PIN with bcrypt. Use when creating or changing a PIN. */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_COST)
}

/** Compare a plain PIN against a stored bcrypt hash. */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
