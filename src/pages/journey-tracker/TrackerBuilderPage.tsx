import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import AddFieldPanel from '../../components/journey-tracker/AddFieldPanel'
import FieldEditor from '../../components/journey-tracker/FieldEditor'
import ScheduleEditor from '../../components/journey-tracker/ScheduleEditor'
import TargetsEditor, { type TargetField } from '../../components/journey-tracker/TargetsEditor'
import TrackerHeader from '../../components/journey-tracker/TrackerHeader'
import { isNumericField, resolveKeys } from '../../components/journey-tracker/fieldKeys'
import { Button, Card, Field, Input } from '../../components/ui'
import {
  useActivateTracker,
  useCreateTracker,
  useReorderFields,
  useTracker,
  useUpdateField,
  useUpdateTracker,
} from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { proposedEnd, storedDay, todayIso } from '../../lib/date'
import type { JourneyTracker, TrackerField, TrackerFieldInput, WeightLossTemplate } from '../../types/journey-tracker'

const emptyField = (): TrackerFieldInput => ({ key: '', label: '', type: 'NUMBER', cadence: 'DAILY' })

/**
 * The PATCH body for an existing field: only the properties UpdateFieldDto accepts. Sending
 * the whole field (id, key, trackerId, …) is rejected by the backend's whitelist validation.
 */
function editablePatch(field: TrackerFieldInput) {
  const { label, type, unit, options, required, chartable, cadence } = field
  return {
    label,
    type,
    unit: unit ?? undefined,
    options: options ?? undefined,
    required: Boolean(required),
    chartable: Boolean(chartable),
    cadence: cadence ?? 'DAILY',
  }
}

const SAVE_DELAY_MS = 500

function durationOf(settings: unknown): number | null {
  const days = (settings as { durationDays?: unknown } | null | undefined)?.durationDays
  return typeof days === 'number' ? days : null
}

function toTargetFields(fields: { key: string; label: string; unit?: string | null; target?: Record<string, number> | null; type: string }[]): TargetField[] {
  return fields
    .filter((f) => f.type !== 'FORMULA' && isNumericField(f) && f.label.trim())
    .map((f) => ({ key: f.key, label: f.label, unit: f.unit, goal: f.target?.goal }))
}

export default function TrackerBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const template = (location.state as { template?: WeightLossTemplate } | undefined)?.template

  if (!id) {
    return <NewTrackerForm template={template} />
  }
  return <ExistingTrackerBuilder key={id} trackerId={id} />
}

function NewTrackerForm({ template }: { template?: WeightLossTemplate }) {
  const navigate = useNavigate()
  const createTracker = useCreateTracker()
  const proposedDays = durationOf(template?.settings)
  const [name, setName] = useState(template?.name ?? '')
  const [schedule, setSchedule] = useState(() => {
    const start = todayIso()
    return { start, end: proposedDays ? proposedEnd(start, proposedDays) : '' }
  })
  const [fields, setFields] = useState<TrackerFieldInput[]>(template?.fields ?? [])
  const [numbers, setNumbers] = useState({ baseline: template?.baseline ?? {}, targets: template?.targets ?? {} })

  const updateField = (index: number, field: TrackerFieldInput) =>
    setFields((prev) => prev.map((f, i) => (i === index ? field : f)))
  const removeField = (index: number) => setFields((prev) => prev.filter((_, i) => i !== index))
  const moveField = (index: number, dir: -1 | 1) =>
    setFields((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  // Targets are keyed by field key, so show them for the keys the fields will be saved with.
  const resolved = resolveKeys(fields.filter((f) => f.label.trim()))
  const targetFields = toTargetFields(resolved)

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your tracker a name')
      return
    }
    const keys = new Set(targetFields.map((f) => f.key))
    const only = (record: Record<string, number>) => Object.fromEntries(Object.entries(record).filter(([k]) => keys.has(k)))
    try {
      const tracker = await createTracker.mutateAsync({
        name,
        type: template?.type ?? 'custom',
        cadence: template?.cadence ?? 'DAILY',
        startDate: schedule.start,
        endDate: schedule.end || undefined,
        baseline: only(numbers.baseline),
        targets: only(numbers.targets),
        settings: template?.settings,
        fields: resolveKeys(fields),
      })
      navigate(`/journey-trackers/${tracker.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create tracker'))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">New journey tracker</h1>

      <Card title="Basics">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </Card>

      <Card title="Schedule">
        <ScheduleEditor start={schedule.start} end={schedule.end} onChange={setSchedule} proposedDays={proposedDays} />
      </Card>

      <Card title="Starting point & targets">
        <TargetsEditor fields={targetFields} baseline={numbers.baseline} targets={numbers.targets} onChange={setNumbers} />
      </Card>

      <Card
        title="Fields to track"
        actions={
          <Button size="sm" variant="outline" onClick={() => setFields((prev) => [...prev, emptyField()])}>
            <Plus size={14} /> Add field
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <FieldEditor
              key={index}
              field={field}
              onChange={(f) => updateField(index, f)}
              onRemove={() => removeField(index)}
              onMoveUp={() => moveField(index, -1)}
              onMoveDown={() => moveField(index, 1)}
            />
          ))}
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No fields yet — add at least one.</p>}
          <p className="text-xs text-muted-foreground">
            Tick <strong>Weekly entry</strong> on fields you only log once a week (like weight or waist); they're filled in under the
            Weekly review tab instead of the daily check-in.
          </p>
        </div>
      </Card>

      <Button onClick={submit} loading={createTracker.isPending} className="w-fit">
        Create & review
      </Button>
    </div>
  )
}

function ExistingTrackerBuilder({ trackerId }: { trackerId: string }) {
  const { data: tracker, isLoading } = useTracker(trackerId)
  const updateTracker = useUpdateTracker(trackerId)
  const reorderFields = useReorderFields(trackerId)
  const activateTracker = useActivateTracker(trackerId)

  if (isLoading || !tracker) return <p className="text-muted-foreground">Loading…</p>

  const fields = (tracker.fields ?? []).filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  const moveField = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= fields.length) return
    const reordered = [...fields]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await reorderFields.mutateAsync(reordered.map((f, i) => ({ fieldId: f.id, sortOrder: i })))
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <TrackerHeader
        tracker={tracker}
        trackerId={trackerId}
        showTabs={tracker.status === 'ACTIVE'}
        actions={
          tracker.status === 'DRAFT' && (
            <Button onClick={() => activateTracker.mutate()} loading={activateTracker.isPending}>
              Activate
            </Button>
          )
        }
      />
      {tracker.status === 'DRAFT' && <p className="text-sm text-muted-foreground">Status: DRAFT — activate it when the setup looks right.</p>}

      <Card title="Name">
        <Input
          defaultValue={tracker.name}
          onBlur={(e) => e.target.value.trim() && e.target.value !== tracker.name && updateTracker.mutate({ name: e.target.value })}
        />
      </Card>

      <ScheduleCard tracker={tracker} />
      <TargetsCard tracker={tracker} />

      <Card title="Fields">
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <ExistingFieldRow
              key={field.id}
              trackerId={trackerId}
              field={field}
              onMoveUp={() => moveField(index, -1)}
              onMoveDown={() => moveField(index, 1)}
            />
          ))}
          <AddFieldPanel tracker={tracker} />
        </div>
      </Card>
    </div>
  )
}

function ScheduleCard({ tracker }: { tracker: JourneyTracker }) {
  const updateTracker = useUpdateTracker(tracker.id)
  const saved = { start: storedDay(tracker.startDate), end: tracker.endDate ? storedDay(tracker.endDate) : '' }
  const [schedule, setSchedule] = useState(saved)
  const dirty = schedule.start !== saved.start || schedule.end !== saved.end

  const save = async () => {
    try {
      await updateTracker.mutateAsync({ startDate: schedule.start, endDate: schedule.end || null })
      toast.success('Schedule saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the schedule'))
    }
  }

  return (
    <Card title="Schedule">
      <div className="flex flex-col gap-3">
        <ScheduleEditor start={schedule.start} end={schedule.end} onChange={setSchedule} proposedDays={durationOf(tracker.settings)} />
        <div className="flex items-center gap-2">
          <Button onClick={save} loading={updateTracker.isPending} disabled={!dirty}>
            Save schedule
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setSchedule(saved)}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function TargetsCard({ tracker }: { tracker: JourneyTracker }) {
  const updateTracker = useUpdateTracker(tracker.id)
  const original = { baseline: tracker.baseline ?? {}, targets: tracker.targets ?? {} }
  const [numbers, setNumbers] = useState(original)
  const targetFields = toTargetFields((tracker.fields ?? []).filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder))
  const dirty = JSON.stringify(numbers) !== JSON.stringify(original)

  // Values for fields that aren't listed here (removed fields) are kept as they were.
  const merge = (stored: Record<string, number>, edited: Record<string, number>) => {
    const next = { ...stored }
    for (const f of targetFields) {
      if (edited[f.key] != null) next[f.key] = edited[f.key]
      else delete next[f.key]
    }
    return next
  }

  const save = async () => {
    try {
      await updateTracker.mutateAsync({
        baseline: merge(original.baseline, numbers.baseline),
        targets: merge(original.targets, numbers.targets),
      })
      toast.success('Targets saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save targets'))
    }
  }

  return (
    <Card title="Starting point & targets">
      <div className="flex flex-col gap-3">
        <TargetsEditor fields={targetFields} baseline={numbers.baseline} targets={numbers.targets} onChange={setNumbers} />
        <Button onClick={save} loading={updateTracker.isPending} disabled={!dirty} className="w-fit">
          Save targets
        </Button>
      </div>
    </Card>
  )
}

/**
 * Edits one saved field. Keystrokes update a local draft immediately and are saved after a
 * short pause, so the inputs stay responsive and a failed save is reported instead of the
 * typed text silently snapping back to the server value.
 */
function ExistingFieldRow({
  trackerId,
  field,
  onMoveUp,
  onMoveDown,
}: {
  trackerId: string
  field: TrackerField
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const updateField = useUpdateField(trackerId)
  const [draft, setDraft] = useState<TrackerFieldInput>(field)
  const pending = useRef<{ timer: number; value: TrackerFieldInput } | null>(null)
  const { mutate } = updateField

  const save = (value: TrackerFieldInput) => {
    pending.current = null
    if (!value.label.trim()) return
    mutate(
      { fieldId: field.id, dto: editablePatch(value) },
      {
        onError: (err) => {
          toast.error(getErrorMessage(err, `Could not save "${value.label}"`))
          setDraft(field)
        },
      },
    )
  }

  const onChange = (next: TrackerFieldInput) => {
    setDraft(next)
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = { value: next, timer: window.setTimeout(() => save(next), SAVE_DELAY_MS) }
  }

  // Flush an edit that's still waiting on the debounce if the row unmounts (e.g. navigating away).
  useEffect(
    () => () => {
      if (!pending.current) return
      window.clearTimeout(pending.current.timer)
      const { value } = pending.current
      if (value.label.trim()) mutate({ fieldId: field.id, dto: editablePatch(value) })
    },
    [field.id, mutate],
  )

  const remove = () => {
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = null
    mutate(
      { fieldId: field.id, dto: { isActive: false } },
      { onError: (err) => toast.error(getErrorMessage(err, `Could not remove "${field.label}"`)) },
    )
  }

  return <FieldEditor field={draft} onChange={onChange} onRemove={remove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
}
