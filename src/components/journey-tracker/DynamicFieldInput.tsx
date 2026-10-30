import type { TrackerField } from '../../types/journey-tracker'

interface Props {
  field: TrackerField
  value: unknown
  onChange: (value: unknown) => void
}

const inputClass = 'rounded-md border border-input px-3 py-2 text-sm w-full'

export default function DynamicFieldInput({ field, value, onChange }: Props) {
  switch (field.type) {
    case 'CHECKBOX':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5"
        />
      )

    case 'NUMBER':
    case 'DURATION':
      return (
        <input
          type="number"
          className={inputClass}
          value={(value as number | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      )

    case 'RATING':
      return (
        <select
          className={inputClass}
          value={(value as number | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">—</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )

    case 'SHORT_TEXT':
      return (
        <input
          type="text"
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'LONG_TEXT':
      return (
        <textarea
          className={inputClass}
          rows={3}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'SINGLE_SELECT':
      return (
        <select
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )

    case 'MULTI_SELECT': {
      const selected = Array.isArray(value) ? (value as string[]) : []
      const toggle = (opt: string) =>
        onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt])
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      )
    }

    case 'DATE':
      return (
        <input
          type="date"
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'TIME':
      return (
        <input
          type="time"
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'PHOTO':
      return <p className="text-sm text-muted-foreground">Photo attachments are coming soon.</p>

    case 'FORMULA':
      return <p className="text-sm text-muted-foreground">{value != null ? String(value) : 'Computed automatically'}</p>

    default:
      return null
  }
}
