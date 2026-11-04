import { useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import { useDeleteTracker, useEntries } from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { Button, Input } from '../ui'

const CONFIRM_WORD = 'delete'

interface Props {
  tracker: { id: string; name: string }
  onClose: () => void
  onDeleted?: () => void
}

/** Permanent deletion of a tracker and everything logged in it, behind a typed confirmation. */
export default function DeleteTrackerDialog({ tracker, onClose, onDeleted }: Props) {
  const remove = useDeleteTracker()
  const { data: entries, isLoading } = useEntries(tracker.id)
  const [typed, setTyped] = useState('')
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD

  const submit = async () => {
    try {
      const result = await remove.mutateAsync(tracker.id)
      toast.success(`Deleted "${tracker.name}" and ${result.entries} logged ${result.entries === 1 ? 'day' : 'days'}`)
      onDeleted?.()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the tracker'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-tracker-title"
        className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={20} />
          <div className="flex flex-col gap-1">
            <h2 id="delete-tracker-title" className="font-semibold text-foreground">
              Delete "{tracker.name}"?
            </h2>
            <p className="text-sm text-muted-foreground">
              This permanently deletes the tracker, its fields and{' '}
              {isLoading ? 'all of its entries' : `${entries?.length ?? 0} logged ${entries?.length === 1 ? 'day' : 'days'}`}. It can't be
              undone. Your body composition history and other trackers aren't affected.
            </p>
          </div>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">
            Type <strong>{CONFIRM_WORD}</strong> to confirm
          </span>
          <Input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmed && submit()} />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} disabled={!confirmed} loading={remove.isPending}>
            Delete permanently
          </Button>
        </div>
      </div>
    </div>
  )
}
