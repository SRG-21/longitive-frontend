// The backend stores calendar dates (log dates, report dates, checklist days) as UTC midnight
// (`new Date('2026-10-30')`), so they must be formatted in UTC or they shift a day west of Greenwich.

/** Today's local calendar date as YYYY-MM-DD. */
export function todayIso(): string {
  return toIsoDate(new Date())
}

/** A local Date as YYYY-MM-DD (no timezone conversion). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Shifts a YYYY-MM-DD string by whole days. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return toIsoDate(new Date(y, m - 1, d + days))
}

/** Formats a stored calendar date (UTC midnight) for display. */
export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC', ...options })
}

/** Formats a real timestamp (createdAt, bedtime, …) in the viewer's timezone. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** Short axis label for a stored calendar date. */
export function chartDate(value: string): string {
  return formatDate(value, { month: 'short', day: 'numeric' })
}

export function daysAgoIso(days: number): string {
  return addDays(todayIso(), -days)
}
