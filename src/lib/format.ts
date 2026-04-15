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
