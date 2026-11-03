import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import DynamicFieldInput from '../../components/journey-tracker/DynamicFieldInput'
import TrackerHeader from '../../components/journey-tracker/TrackerHeader'
import { Button } from '../../components/ui'
import { useEntry, useLoggingStatus, useTracker, useUpsertEntry } from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { addDays, formatDate, storedDay, todayIso } from '../../lib/date'
import type { LoggingStatus, TrackerEntry, TrackerField } from '../../types/journey-tracker'

const VISIBLE_MISSED = 7

export default function TrackerDailyPage() {
  const { id, date: dateParam } = useParams<{ id: string; date?: string }>()
  const navigate = useNavigate()
  const today = todayIso()

  const { data: tracker, isLoading: trackerLoading } = useTracker(id)
  const { data: status } = useLoggingStatus(id, today)

  const start = tracker ? storedDay(tracker.startDate) : undefined
  // With no date in the URL, open today — or the first day if the journey hasn't begun yet.
  const date = dateParam ?? (start && today < start ? start : today)
  const beforeStart = !!start && date < start
  const { data: entry, isLoading: entryLoading } = useEntry(id, beforeStart ? undefined : date)

  if (!id) return null
  if (trackerLoading || !tracker || !start) return <p className="text-muted-foreground">Loading…</p>
  // A link or typed URL for a day before the journey started lands on its first day instead.
  if (beforeStart) return <Navigate to={`/journey-trackers/${id}/daily/${start}`} replace />

  const goTo = (next: string) => {
    if (next < start) {
      toast.error(`This journey starts on ${formatDate(start, { dateStyle: 'medium' })} — pick that day or later`)
      return
    }
    navigate(`/journey-trackers/${id}/daily/${next}`)
  }

  const activeFields = (tracker.fields ?? []).filter((f) => f.isActive && f.type !== 'FORMULA').sort((a, b) => a.sortOrder - b.sortOrder)
  const dailyFields = activeFields.filter((f) => f.cadence !== 'WEEKLY')
  const weeklyFields = activeFields.filter((f) => f.cadence === 'WEEKLY')

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <TrackerHeader tracker={tracker} trackerId={id} />

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => goTo(addDays(date, -1))}
          disabled={date <= start}
          aria-label="Previous day"
          className="rounded p-1 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          min={start}
          aria-label="Entry date"
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="rounded-md border border-input px-3 py-2 text-sm"
        />
        <button onClick={() => goTo(addDays(date, 1))} aria-label="Next day" className="rounded p-1 hover:bg-accent">
          <ChevronRight size={18} />
        </button>
      </div>

      <LoggingBanner status={status} date={date} start={start} onPick={goTo} />

      {weeklyFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {weeklyFields.map((f) => f.label).join(', ')} {weeklyFields.length === 1 ? 'is a weekly field' : 'are weekly fields'} — log
          {weeklyFields.length === 1 ? ' it' : ' them'} under{' '}
          <Link to={`/journey-trackers/${id}/weekly-review`} className="text-primary">
            Weekly review
          </Link>
          .
        </p>
      )}

      {entryLoading ? (
        <p className="text-muted-foreground">Loading entry…</p>
      ) : (
        <DailyEntryForm key={`${id}-${date}`} trackerId={id} date={date} fields={dailyFields} entry={entry ?? null} />
      )}
    </div>
  )
}

/** Today's status and the days that were skipped, each one a shortcut to fill it in afterwards. */
function LoggingBanner({
  status,
  date,
  start,
  onPick,
}: {
  status: LoggingStatus | undefined
  date: string
  start: string
  onPick: (day: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const today = todayIso()
  if (!status) return null

  if (!status.started) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        <CalendarClock size={16} /> This journey starts on {formatDate(start, { dateStyle: 'long' })}.
      </p>
    )
  }

  const missed = [...status.missedDays].reverse() // most recent first
  const shown = showAll ? missed : missed.slice(0, VISIBLE_MISSED)
  const needsToday = !status.loggedToday && (!status.endDate || today <= status.endDate)

  return (
    <div className="flex flex-col gap-2">
      {needsToday && date !== today && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
          <span className="text-foreground">Today isn't logged yet.</span>
          <Button size="sm" onClick={() => onPick(today)}>
            Log today
          </Button>
        </div>
      )}
      {needsToday && date === today && <p className="text-xs text-muted-foreground">Today isn't logged yet — fill in what you can and save.</p>}

      {missed.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="font-medium">
            {missed.length} missed {missed.length === 1 ? 'day' : 'days'}
          </div>
          <p className="mt-0.5 text-xs">A missed day isn't a failure. Tap one to fill in what you remember.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shown.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => onPick(day)}
                aria-current={day === date ? 'date' : undefined}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  day === date ? 'border-amber-700 bg-amber-700 text-white' : 'border-amber-300 bg-white hover:bg-amber-100'
                }`}
              >
                {formatDate(day, { month: 'short', day: 'numeric' })}
              </button>
            ))}
            {missed.length > VISIBLE_MISSED && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="px-1 text-xs font-medium underline">
                {showAll ? 'Show fewer' : `Show all ${missed.length}`}
              </button>
            )}
          </div>
        </div>
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
      // Only this form's fields are sent (null clears one); weekly and removed fields keep
      // whatever was stored for this day.
      const payload = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? null]))
      await upsertEntry.mutateAsync({ date, values: payload, remark })
      toast.success('Saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save entry'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">There are no daily fields yet. Add one under the Setup tab.</p>
      )}
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1">
          <label htmlFor={`daily-${field.id}`} className="text-sm font-medium text-foreground">
            {field.label} {field.unit ? `(${field.unit})` : ''}
          </label>
          <DynamicFieldInput
            id={`daily-${field.id}`}
            field={field}
            value={values[field.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label htmlFor="daily-remark" className="text-sm font-medium text-foreground">
          Remark
        </label>
        <textarea
          id="daily-remark"
          className="rounded-md border border-input px-3 py-2 text-sm"
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

      <Button onClick={save} loading={upsertEntry.isPending} className="w-fit">
        Save check-in
      </Button>
    </div>
  )
}
