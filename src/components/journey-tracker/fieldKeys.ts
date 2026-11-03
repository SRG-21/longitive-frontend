import type { TrackerFieldInput } from '../../types/journey-tracker'

export function slugifyKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field'
}

/** First of `base`, `base_2`, `base_3`, … not already taken — keys are unique per tracker. */
export function uniqueKey(base: string, taken: Set<string>) {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

/** Gives every field a unique key (derived from its label when it has none) and its sort order. */
export function resolveKeys<T extends TrackerFieldInput>(fields: T[]): T[] {
  return fields.reduce<T[]>((acc, f, idx) => {
    const key = uniqueKey(f.key || slugifyKey(f.label), new Set(acc.map((a) => a.key)))
    return [...acc, { ...f, key, sortOrder: idx }]
  }, [])
}

/** Field types whose values are numbers, so they can have a starting value and a target. */
export const NUMERIC_TYPES = ['NUMBER', 'DURATION'] as const

export function isNumericField(field: { type: string }) {
  return (NUMERIC_TYPES as readonly string[]).includes(field.type)
}
