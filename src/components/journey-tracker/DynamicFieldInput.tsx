import type { TrackerField } from '../../types/journey-tracker'

interface Props {
  field: TrackerField
  value: unknown
  onChange: (value: unknown) => void
  /** Put on the control so a <label htmlFor> can point at it. */
  id?: string
}

const inputClass = 'rounded-md border border-input px-3 py-2 text-sm w-full'

export default function DynamicFieldInput({ field, value, onChange, id }: Props) {
  switch (field.type) {
    case 'CHECKBOX':
      return (
        <input
          id={id}
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
          id={id}
          type="number"
          className={inputClass}
          value={(value as number | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      )

    case 'RATING':
      return (
        <select
          id={id}
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
          id={id}
          type="text"
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'LONG_TEXT':
      return (
        <textarea
          id={id}
          className={inputClass}
          rows={3}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'SINGLE_SELECT':
      return (
        <select
          id={id}
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
          id={id}
          type="date"
          className={inputClass}
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'TIME':
      return (
        <input
          id={id}
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
