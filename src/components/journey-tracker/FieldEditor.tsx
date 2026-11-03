import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { TrackerFieldInput, TrackerFieldType } from '../../types/journey-tracker'

const FIELD_TYPES: TrackerFieldType[] = [
  'CHECKBOX',
  'NUMBER',
  'SHORT_TEXT',
  'LONG_TEXT',
  'RATING',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'DATE',
  'TIME',
  'DURATION',
  'PHOTO',
  'FORMULA',
]

interface Props {
  field: TrackerFieldInput
  onChange: (field: TrackerFieldInput) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function FieldEditor({ field, onChange, onRemove, onMoveUp, onMoveDown }: Props) {
  const showOptions = field.type === 'SINGLE_SELECT' || field.type === 'MULTI_SELECT'

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-input px-2 py-1 text-sm"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Field label"
        />
        <select
          className="rounded-md border border-input px-2 py-1 text-sm"
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as TrackerFieldType })}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
        <input
          className="w-20 rounded-md border border-input px-2 py-1 text-sm"
          value={field.unit ?? ''}
          onChange={(e) => onChange({ ...field, unit: e.target.value })}
          placeholder="unit"
        />
        <button type="button" onClick={onMoveUp} className="rounded p-1 hover:bg-accent" title="Move up">
          <ArrowUp size={16} />
        </button>
        <button type="button" onClick={onMoveDown} className="rounded p-1 hover:bg-accent" title="Move down">
          <ArrowDown size={16} />
        </button>
        <button type="button" onClick={onRemove} className="rounded p-1 text-destructive hover:bg-accent" title="Remove">
          <Trash2 size={16} />
        </button>
      </div>

      {showOptions && (
        <input
          className="rounded-md border border-input px-2 py-1 text-sm"
          value={(field.options ?? []).join(', ')}
          onChange={(e) =>
            onChange({ ...field, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="Comma-separated options"
        />
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={Boolean(field.required)}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
          />
          Required
        </label>
        <label
          className="flex items-center gap-1"
          title="Weekly fields are logged once a week in the Weekly review tab instead of in the daily check-in"
        >
          <input
            type="checkbox"
            checked={field.cadence === 'WEEKLY'}
            onChange={(e) => onChange({ ...field, cadence: e.target.checked ? 'WEEKLY' : 'DAILY' })}
          />
          Weekly entry
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={Boolean(field.chartable)}
            onChange={(e) => onChange({ ...field, chartable: e.target.checked })}
          />
          Show in chart
        </label>
      </div>
    </div>
  )
}
