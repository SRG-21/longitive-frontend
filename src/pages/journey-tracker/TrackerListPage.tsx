import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTemplatePreview, useTrackers } from '../../hooks/useJourneyTracker'
import { formatDate, journeyProgress, storedDay, todayIso } from '../../lib/date'

export default function TrackerListPage() {
  const { data: trackers, isLoading } = useTrackers()
  const templatePreview = useTemplatePreview()
  const navigate = useNavigate()

  const startFromTemplate = async () => {
    try {
      const template = await templatePreview.mutateAsync()
      navigate('/journey-trackers/new', { state: { template } })
    } catch {
      toast.error('Could not generate the weight-loss template')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Journey Trackers</h1>
        <div className="flex gap-2">
          <button
            onClick={startFromTemplate}
            disabled={templatePreview.isPending}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Start weight-loss journey
          </button>
          <button
            onClick={() => navigate('/journey-trackers/new')}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Blank tracker
          </button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && trackers?.length === 0 && (
        <p className="text-muted-foreground">
          No trackers yet. Start from the weight-loss template or build a blank one from scratch.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trackers?.map((tracker) => (
          <button
            key={tracker.id}
            onClick={() => navigate(`/journey-trackers/${tracker.id}/daily`)}
            className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left hover:shadow-sm"
          >
            <span className="font-medium text-foreground">{tracker.name}</span>
            <TrackerCardMeta status={tracker.status} start={storedDay(tracker.startDate)} end={tracker.endDate ? storedDay(tracker.endDate) : null} />
          </button>
        ))}
      </div>
    </div>
  )
}

function TrackerCardMeta({ status, start, end }: { status: string; start: string; end: string | null }) {
  const progress = journeyProgress(start, end, todayIso())
  const where = !progress.started
    ? `starts ${formatDate(start, { dateStyle: 'medium' })}`
    : progress.finished
      ? 'proposed end reached'
      : progress.totalDays
        ? `day ${progress.dayNumber} of ${progress.totalDays}`
        : `day ${progress.dayNumber}`
  return (
    <>
      <span className="text-xs text-muted-foreground">
        {status} · {where}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDate(start, { dateStyle: 'medium' })} → {end ? formatDate(end, { dateStyle: 'medium' }) : 'no end date'}
      </span>
    </>
  )
}
