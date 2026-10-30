import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DynamicFieldInput from '../../components/journey-tracker/DynamicFieldInput'
import TrackerTabs from '../../components/journey-tracker/TrackerTabs'
import { useEntry, useTracker, useUpsertEntry } from '../../hooks/useJourneyTracker'
import type { TrackerEntry, TrackerField } from '../../types/journey-tracker'

function shiftDate(date: string, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function TrackerDailyPage() {
  const { id, date: dateParam } = useParams<{ id: string; date?: string }>()
  const navigate = useNavigate()
  const date = dateParam ?? new Date().toISOString().slice(0, 10)

  const { data: tracker, isLoading: trackerLoading } = useTracker(id)
  const { data: entry, isLoading: entryLoading } = useEntry(id, date)

  if (!id) return null
  if (trackerLoading || !tracker) return <p className="text-muted-foreground">Loading…</p>

  const fields = (tracker.fields ?? [])
    .filter((f) => f.isActive && f.type !== 'FORMULA')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">{tracker.name}</h1>
      <TrackerTabs trackerId={id} />

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => navigate(`/journey-trackers/${id}/daily/${shiftDate(date, -1)}`)} className="rounded p-1 hover:bg-accent">
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => navigate(`/journey-trackers/${id}/daily/${e.target.value}`)}
          className="rounded-md border border-input px-3 py-2 text-sm"
        />
        <button onClick={() => navigate(`/journey-trackers/${id}/daily/${shiftDate(date, 1)}`)} className="rounded p-1 hover:bg-accent">
          <ChevronRight size={18} />
        </button>
      </div>

      {entryLoading ? (
        <p className="text-muted-foreground">Loading entry…</p>
      ) : (
        <DailyEntryForm key={`${id}-${date}`} trackerId={id} date={date} fields={fields} entry={entry ?? null} />
      )}
    </div>
  )
}

function DailyEntryForm({
  trackerId,
  date,
  fields,
  entry,
}: {
  trackerId: string
  date: string
  fields: TrackerField[]
  entry: TrackerEntry | null
}) {
  const upsertEntry = useUpsertEntry(trackerId)
  const [values, setValues] = useState<Record<string, unknown>>(entry?.values ?? {})
  const [remark, setRemark] = useState(entry?.remark ?? '')

  const save = async () => {
    try {
      await upsertEntry.mutateAsync({ date, values, remark })
      toast.success('Saved')
    } catch {
      toast.error('Could not save entry')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            {field.label} {field.unit ? `(${field.unit})` : ''}
          </label>
          <DynamicFieldInput
            field={field}
            value={values[field.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Remark</label>
        <textarea
          className="rounded-md border border-input px-3 py-2 text-sm"
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        disabled={upsertEntry.isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Save check-in
      </button>
    </div>
  )
}
