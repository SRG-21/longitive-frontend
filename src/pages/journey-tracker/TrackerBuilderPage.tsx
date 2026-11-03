import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import FieldEditor from '../../components/journey-tracker/FieldEditor'
import TrackerTabs from '../../components/journey-tracker/TrackerTabs'
import {
  useActivateTracker,
  useAddField,
  useCreateTracker,
  useReorderFields,
  useTracker,
  useUpdateField,
  useUpdateTracker,
} from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import type { TrackerField, TrackerFieldInput, WeightLossTemplate } from '../../types/journey-tracker'

const emptyField = (): TrackerFieldInput => ({ key: '', label: '', type: 'NUMBER' })

function slugifyKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field'
}

/** First of `base`, `base_2`, `base_3`, … not already taken — keys are unique per tracker. */
function uniqueKey(base: string, taken: Set<string>) {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

/**
 * The PATCH body for an existing field: only the properties UpdateFieldDto accepts. Sending
 * the whole field (id, key, trackerId, …) is rejected by the backend's whitelist validation.
 */
function editablePatch(field: TrackerFieldInput) {
  const { label, type, unit, options, required, chartable } = field
  return {
    label,
    type,
    unit: unit ?? undefined,
    options: options ?? undefined,
    required: Boolean(required),
    chartable: Boolean(chartable),
  }
}

const SAVE_DELAY_MS = 500

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
  const [name, setName] = useState(template?.name ?? '')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fields, setFields] = useState<TrackerFieldInput[]>(template?.fields ?? [])

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

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your tracker a name')
      return
    }
    try {
      const tracker = await createTracker.mutateAsync({
        name,
        type: template?.type ?? 'custom',
        cadence: template?.cadence ?? 'DAILY',
        startDate,
        baseline: template?.baseline,
        targets: template?.targets,
        settings: template?.settings,
        fields: fields.reduce<TrackerFieldInput[]>((acc, f, idx) => {
          const key = uniqueKey(f.key || slugifyKey(f.label), new Set(acc.map((a) => a.key)))
          return [...acc, { ...f, key, sortOrder: idx }]
        }, []),
      })
      navigate(`/journey-trackers/${tracker.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create tracker'))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">New journey tracker</h1>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Name</label>
        <input
          className="rounded-md border border-input px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Start date</label>
        <input
          type="date"
          className="w-48 rounded-md border border-input px-3 py-2 text-sm"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Fields to track</h2>
          <button
            type="button"
            onClick={() => setFields((prev) => [...prev, emptyField()])}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Plus size={14} /> Add field
          </button>
        </div>
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
      </div>

      <button
        onClick={submit}
        disabled={createTracker.isPending}
        className="mt-2 w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Create & review
      </button>
    </div>
  )
}

function ExistingTrackerBuilder({ trackerId }: { trackerId: string }) {
  const { data: tracker, isLoading } = useTracker(trackerId)
  const updateTracker = useUpdateTracker(trackerId)
  const addField = useAddField(trackerId)
  const reorderFields = useReorderFields(trackerId)
  const activateTracker = useActivateTracker(trackerId)
  const [newField, setNewField] = useState<TrackerFieldInput>(emptyField())

  if (isLoading || !tracker) return <p className="text-muted-foreground">Loading…</p>

  const fields = (tracker.fields ?? []).filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  const submitNewField = async () => {
    if (!newField.label.trim()) {
      toast.error('Give the field a label')
      return
    }
    // Removed fields keep their key (and their logged values), so re-adding one with the same
    // label reuses that key and the backend restores it. Only an active field forces a new key.
    const baseKey = newField.key || slugifyKey(newField.label)
    const activeKeys = new Set(fields.map((f) => f.key))
    const restoring = (tracker.fields ?? []).some((f) => !f.isActive && f.key === baseKey)
    try {
      await addField.mutateAsync({
        ...newField,
        key: uniqueKey(baseKey, activeKeys),
        sortOrder: fields.length,
      })
      setNewField(emptyField())
      toast.success(restoring ? `Restored "${newField.label}" with its previous entries` : `Added "${newField.label}"`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add field'))
    }
  }

  const moveField = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= fields.length) return
    const reordered = [...fields]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await reorderFields.mutateAsync(reordered.map((f, i) => ({ fieldId: f.id, sortOrder: i })))
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{tracker.name}</h1>
          <p className="text-sm text-muted-foreground">Status: {tracker.status}</p>
        </div>
        {tracker.status === 'DRAFT' && (
          <button
            onClick={() => activateTracker.mutate()}
            disabled={activateTracker.isPending}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Activate
          </button>
        )}
      </div>

      {tracker.status === 'ACTIVE' && <TrackerTabs trackerId={tracker.id} />}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Name</label>
        <input
          className="rounded-md border border-input px-3 py-2 text-sm"
          defaultValue={tracker.name}
          onBlur={(e) => e.target.value !== tracker.name && updateTracker.mutate({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-foreground">Fields</h2>
        {fields.map((field, index) => (
          <ExistingFieldRow
            key={field.id}
            trackerId={trackerId}
            field={field}
            onMoveUp={() => moveField(index, -1)}
            onMoveDown={() => moveField(index, 1)}
          />
        ))}

        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <FieldEditor
            field={newField}
            onChange={setNewField}
            onRemove={() => setNewField(emptyField())}
          />
          <button
            type="button"
            onClick={submitNewField}
            disabled={addField.isPending}
            className="w-fit rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-60"
          >
            {addField.isPending ? 'Adding…' : 'Add this field'}
          </button>
        </div>
      </div>
    </div>
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
