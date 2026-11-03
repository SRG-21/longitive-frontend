import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAddField } from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { Button } from '../ui'
import type { JourneyTracker, TrackerFieldInput } from '../../types/journey-tracker'
import FieldEditor from './FieldEditor'
import { slugifyKey, uniqueKey } from './fieldKeys'

interface Props {
  tracker: JourneyTracker
  /** Starting values for the new field, e.g. { chartable: true } from the chart page. */
  defaults?: Partial<TrackerFieldInput>
}

/**
 * Adds a field to a saved tracker. Fields only describe what to record: entries keep their
 * values under each field's key, so adding a field never touches what was already logged —
 * it simply has no value for the days before it existed.
 */
export default function AddFieldPanel({ tracker, defaults }: Props) {
  const addField = useAddField(tracker.id)
  const blank = (): TrackerFieldInput => ({ key: '', label: '', type: 'NUMBER', cadence: 'DAILY', ...defaults })
  const [field, setField] = useState<TrackerFieldInput>(blank)

  const all = tracker.fields ?? []
  const activeCount = all.filter((f) => f.isActive).length

  const submit = async () => {
    if (!field.label.trim()) {
      toast.error('Give the field a label')
      return
    }
    // Removed fields keep their key (and their logged values), so re-adding one with the same
    // label reuses that key and the backend restores it. Only an active field forces a new key.
    const baseKey = field.key || slugifyKey(field.label)
    const activeKeys = new Set(all.filter((f) => f.isActive).map((f) => f.key))
    const restoring = all.some((f) => !f.isActive && f.key === baseKey)
    try {
      await addField.mutateAsync({ ...field, key: uniqueKey(baseKey, activeKeys), sortOrder: activeCount })
      setField(blank())
      toast.success(restoring ? `Restored "${field.label}" with its previous entries` : `Added "${field.label}"`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add field'))
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
      <FieldEditor field={field} onChange={setField} onRemove={() => setField(blank())} />
      <Button size="sm" variant="outline" onClick={submit} loading={addField.isPending} className="w-fit">
        {addField.isPending ? 'Adding…' : 'Add this field'}
      </Button>
    </div>
  )
}
