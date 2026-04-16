/**
 * Formatting helpers for the agent dashboard and other views.
 * Pure functions — no side effects, no imports.
 */

/**
 * Returns a human-readable relative time string.
 *
 * Examples:
 *   < 1 min  → "just now"
 *   < 1 hr   → "23 min ago"
 *   < 24 hr  → "2 hrs ago"
 *   < 48 hr  → "Yesterday"
 *   otherwise → "Mon 14 Apr"
 */
export function timeAgo(date: Date | string): string {
  const d     = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const mins   = Math.floor(diffMs / 60_000)
  const hours  = Math.floor(diffMs / 3_600_000)

  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min ago`
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  if (hours < 48) return 'Yesterday'

  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Formats a number as a Nigerian Naira string.
 *
 * Example: 4900 → "₦4,900"
 */
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

/**
 * Returns a formatted day label for a date.
 *
 * Example: "Friday · April 15"
 */
export function dayLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month   = date.toLocaleDateString('en-US', { month: 'long' })
  const day     = date.getDate()
  return `${weekday} · ${month} ${day}`
}

/**
 * Formats a Nigerian phone number for display.
 *
 * Example: "+2348039606540" → "+234 803 960 6540"
 * Falls back to the raw string for non-standard formats.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length === 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return phone
}

/**
 * Formats an ISO date string for display.
 *
 * Example: "1999-03-14" → "14 March 1999"
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
