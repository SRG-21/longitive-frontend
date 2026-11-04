import { Link, useParams } from 'react-router-dom'
import TrackerHeader from '../../components/journey-tracker/TrackerHeader'
import WeeklyCheckins from '../../components/journey-tracker/WeeklyCheckins'
import ClaudeReviewCard from '../../components/journey-tracker/ClaudeReviewCard'
import { Card, Loading, ProgressBar, Stat } from '../../components/ui'
import { useLoggingStatus, useTracker, useWeeklyReview } from '../../hooks/useJourneyTracker'
import { formatDate, todayIso } from '../../lib/date'

export default function TrackerWeeklyReviewPage() {
  const { id } = useParams<{ id: string }>()
  const today = todayIso()
  const { data: tracker } = useTracker(id)
  const { data: review, isLoading } = useWeeklyReview(id, today)
  const { data: status } = useLoggingStatus(id, today)

  if (!id) return null

  const weightKey = (tracker?.settings as { syncWeightFieldKey?: string } | null | undefined)?.syncWeightFieldKey || 'weight'
  const unit = tracker?.fields?.find((f) => f.key === weightKey)?.unit ?? 'kg'
  const signed = (n: number) => `${n > 0 ? '+' : ''}${n} ${unit}`

  return (
    <div className="flex flex-col gap-6">
      <TrackerHeader tracker={tracker} trackerId={id} />

      {isLoading || !review ? (
        <Loading />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Latest weight"
            value={review.latestWeight != null ? `${review.latestWeight} ${unit}` : '—'}
            hint={review.latestWeightDate ? `Logged ${formatDate(review.latestWeightDate, { month: 'short', day: 'numeric' })}` : 'Not logged yet'}
          />
          <Stat
            label="Change from start"
            value={review.changeFromBaseline != null ? signed(review.changeFromBaseline) : '—'}
            hint={review.baselineWeight != null ? `Started at ${review.baselineWeight} ${unit}` : 'Set a starting value in Setup'}
          />
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress to target</div>
            <div className="text-2xl font-semibold text-foreground">{review.progressToTarget != null ? `${review.progressToTarget}%` : '—'}</div>
            {review.progressToTarget != null && <ProgressBar value={review.progressToTarget} />}
            <div className="text-xs text-muted-foreground">
              {review.targetWeight != null ? `Target ${review.targetWeight} ${unit}` : (
                <>
                  No target yet —{' '}
                  <Link to={`/journey-trackers/${id}`} className="text-primary">
                    set one in Setup
                  </Link>
                </>
              )}
            </div>
          </div>
          <Stat label="Habits completed" value={`${review.completedHabitsPercentage}%`} hint="Required daily fields, last 7 days" />
        </div>
      )}

      <ClaudeReviewCard trackerId={id} />

      <Card title="Last 7 days">
        {review ? (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-foreground">
              Logged {review.daysTracked} {review.daysTracked === 1 ? 'day' : 'days'}, missed {review.missedDays}.
            </p>
            {review.missedDates.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Fill in a missed day:</span>
                {review.missedDates.map((day) => (
                  <Link
                    key={day}
                    to={`/journey-trackers/${id}/daily/${day}`}
                    className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {formatDate(day, { month: 'short', day: 'numeric' })}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nothing missed in this window.</p>
            )}
            <p className="text-xs text-muted-foreground">
              A missed day isn't a failure — this view is here to help you spot trends, not to shame a gap.
            </p>
          </div>
        ) : (
          <Loading />
        )}
      </Card>

      <Card title="Weekly check-ins">{tracker ? <WeeklyCheckins tracker={tracker} status={status} /> : <Loading />}</Card>
    </div>
  )
}
