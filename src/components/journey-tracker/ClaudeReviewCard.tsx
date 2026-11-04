import { useState } from 'react'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import { useJourneyReviews, useRequestReview } from '../../hooks/useClaude'
import { getErrorMessage } from '../../lib/api'
import { formatDate, formatDateTime, todayIso } from '../../lib/date'
import { Badge, Button, Card, EmptyState, Loading, MedicalDisclaimer, Select } from '../ui'
import type { JourneyReview } from '../../types/claude'

const period = (r: JourneyReview) =>
  `${formatDate(r.periodStart, { month: 'short', day: 'numeric' })} – ${formatDate(r.periodEnd, { month: 'short', day: 'numeric' })}`

/** Claude's reviews of this tracker: the weekly ones and any asked for with "Review now". */
export default function ClaudeReviewCard({ trackerId }: { trackerId: string }) {
  const { data, isLoading } = useJourneyReviews(trackerId)
  const request = useRequestReview(trackerId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const reviews = data?.reviews ?? []
  const review = reviews.find((r) => r.id === selectedId) ?? reviews[0]

  const ask = async () => {
    try {
      const created = await request.mutateAsync(todayIso())
      setSelectedId(created.id)
      toast.success('Claude reviewed your journey')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Claude could not review your journey right now'))
    }
  }

  return (
    <Card
      title="Claude's review"
      actions={
        data?.configured && (
          <Button size="sm" onClick={ask} loading={request.isPending}>
            <Sparkles size={14} /> {request.isPending ? 'Claude is reading your journey…' : 'Review now'}
          </Button>
        )
      }
    >
      {isLoading ? (
        <Loading />
      ) : !data?.configured ? (
        <p className="text-sm text-muted-foreground">Claude reviews aren't set up on this server yet.</p>
      ) : !review ? (
        <EmptyState>
          Claude reviews each week when it finishes. Press <strong>Review now</strong> for a review of the week so far.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={review.kind === 'weekly' ? 'green' : 'blue'}>{review.kind === 'weekly' ? 'Weekly' : 'On request'}</Badge>
              <span className="text-xs text-muted-foreground">
                {period(review)} · written {formatDateTime(review.createdAt)}
              </span>
            </div>
            {reviews.length > 1 && (
              <Select value={review.id} onChange={(e) => setSelectedId(e.target.value)} aria-label="Earlier reviews" className="w-auto text-xs">
                {reviews.map((r) => (
                  <option key={r.id} value={r.id}>
                    {period(r)} ({r.kind === 'weekly' ? 'weekly' : 'on request'})
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground">{review.headline}</h3>
            <p className="mt-1 text-foreground">{review.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {review.wins.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Going well</div>
                <ul className="list-disc space-y-1 pl-5 text-foreground">
                  {review.wins.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.concerns.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Worth a look</div>
                <ul className="list-disc space-y-1 pl-5 text-foreground">
                  {review.concerns.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {review.suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">For the coming week</div>
              {review.suggestions.map((s, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="font-medium text-foreground">{s.title}</div>
                  <div className="text-foreground">{s.detail}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Why: {s.why}</div>
                </div>
              ))}
            </div>
          )}
          <MedicalDisclaimer />
        </div>
      )}
    </Card>
  )
}
