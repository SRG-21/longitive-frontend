import { useParams } from 'react-router-dom'
import TrackerTabs from '../../components/journey-tracker/TrackerTabs'
import { useTracker, useWeeklyReview } from '../../hooks/useJourneyTracker'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold text-foreground">{value}</span>
    </div>
  )
}

export default function TrackerWeeklyReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tracker } = useTracker(id)
  const { data: review, isLoading } = useWeeklyReview(id)

  if (!id) return null

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">{tracker?.name}</h1>
      <TrackerTabs trackerId={id} />

      {isLoading || !review ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Average weight (7d)" value={review.averageWeight != null ? `${review.averageWeight} kg` : '—'} />
          <StatCard
            label="Change from baseline"
            value={review.changeFromBaseline != null ? `${review.changeFromBaseline > 0 ? '+' : ''}${review.changeFromBaseline} kg` : '—'}
          />
          <StatCard label="Completed habits" value={`${review.completedHabitsPercentage}%`} />
          <StatCard label="Days tracked / missed" value={`${review.daysTracked} / ${review.missedDays}`} />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        A missed day isn't a failure — this view is here to help you spot trends, not to shame a gap.
      </p>
    </div>
  )
}
