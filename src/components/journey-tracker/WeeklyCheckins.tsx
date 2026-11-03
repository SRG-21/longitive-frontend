import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useEntries, useUpsertEntry } from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { formatDate, todayIso } from '../../lib/date'
import { Badge, Button, EmptyState, Field, Input, Loading, type BadgeTone } from '../ui'
import type { JourneyTracker, LoggingStatus, TrackerField, WeekCheckin, WeekStatus } from '../../types/journey-tracker'
import DynamicFieldInput from './DynamicFieldInput'

const statusLabel: Record<WeekStatus, { text: string; tone: BadgeTone }> = {
  logged: { text: 'Logged', tone: 'green' },
  due: { text: 'Due this week', tone: 'blue' },
  missed: { text: 'Not logged', tone: 'yellow' },
}

const range = (week: WeekCheckin) =>
  `${formatDate(week.from, { month: 'short', day: 'numeric' })} – ${formatDate(week.to, { month: 'short', day: 'numeric' })}`

export default function WeeklyCheckins({ tracker, status }: { tracker: JourneyTracker; status: LoggingStatus | undefined }) {
  const weeklyFields = (tracker.fields ?? [])
    .filter((f) => f.isActive && f.cadence === 'WEEKLY' && f.type !== 'FORMULA' && f.type !== 'PHOTO')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (!weeklyFields.length) {
    return (
      <EmptyState>
        No weekly fields yet. Tick <strong>Weekly entry</strong> on a field (like weight or waist) in{' '}
        <Link to={`/journey-trackers/${tracker.id}`} className="text-primary">
          Setup
        </Link>{' '}
        to log it here once a week.
      </EmptyState>
    )
  }
  if (!status) return <Loading />
  if (!status.weeks.length) return <EmptyState>Weekly check-ins start once the journey begins.</EmptyState>

  // Newest week first; the one in progress opens by default.
  const weeks = [...status.weeks].reverse()

  return (
    <div className="flex flex-col divide-y divide-border">
      {weeks.map((week) => (
        <WeekRow key={week.week} trackerId={tracker.id} week={week} fields={weeklyFields} defaultOpen={week.status === 'due'} />
      ))}
    </div>
  )
}

function WeekRow({ trackerId, week, fields, defaultOpen }: { trackerId: string; week: WeekCheckin; fields: TrackerField[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const label = statusLabel[week.status]

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Week {week.week}</span>
          <span className="text-sm text-muted-foreground">{range(week)}</span>
          <Badge tone={label.tone}>{label.text}</Badge>
        </div>
        <Button size="sm" variant={week.status === 'logged' ? 'outline' : 'primary'} onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : week.status === 'logged' ? 'Edit' : 'Log week'}
        </Button>
      </div>
      {open && <WeekForm trackerId={trackerId} week={week} fields={fields} onSaved={() => setOpen(false)} />}
    </div>
  )
}

/** Loads the week's entries first so the form starts from what is already logged. */
function WeekForm(props: { trackerId: string; week: WeekCheckin; fields: TrackerField[]; onSaved: () => void }) {
  const { data: entries, isLoading } = useEntries(props.trackerId, props.week.from, props.week.to)
  if (isLoading || !entries) return <Loading />

  // Weekly values may sit on any day of the week; the latest logged value for each field wins.
  const existing: Record<string, unknown> = {}
  for (const entry of entries) {
    for (const field of props.fields) {
      const value = (entry.values as Record<string, unknown>)?.[field.key]
      if (value !== undefined && value !== null && value !== '') existing[field.key] = value
    }
  }
  return <WeekFormInner {...props} existing={existing} />
}

function WeekFormInner({
  trackerId,
  week,
  fields,
  existing,
  onSaved,
}: {
  trackerId: string
  week: WeekCheckin
  fields: TrackerField[]
  existing: Record<string, unknown>
  onSaved: () => void
}) {
  const today = todayIso()
  const lastDay = week.to < today ? week.to : today
  const upsert = useUpsertEntry(trackerId)
  const [values, setValues] = useState(existing)
  const [date, setDate] = useState(week.loggedDate ?? lastDay)

  const save = async () => {
    try {
      // Only the weekly fields are sent, so this day's daily values are left alone.
      const payload = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? null]))
      await upsert.mutateAsync({ date, values: payload })
      toast.success(`Week ${week.week} saved`)
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the weekly check-in'))
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <label htmlFor={`week${week.week}-${field.id}`} className="text-sm font-medium text-foreground">
              {field.label} {field.unit ? `(${field.unit})` : ''}
            </label>
            <DynamicFieldInput id={`week${week.week}-${field.id}`} field={field} value={values[field.key]} onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))} />
          </div>
        ))}
      </div>
      <Field label="Measured on" className="max-w-xs">
        <Input type="date" value={date} min={week.from} max={lastDay} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field>
      <Button onClick={save} loading={upsert.isPending} className="w-fit">
        Save week {week.week}
      </Button>
    </div>
  )
}
