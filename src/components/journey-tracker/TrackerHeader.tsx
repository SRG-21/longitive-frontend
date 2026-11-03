import type { ReactNode } from 'react'
import { journeyProgress, formatDate, storedDay, todayIso } from '../../lib/date'
import { Badge } from '../ui'
import type { JourneyTracker } from '../../types/journey-tracker'
import TrackerTabs from './TrackerTabs'

/** "Started 1 Nov 2026 · Proposed end 29 Jan 2027 · Day 3 of 90 · 87 days left" */
export function ScheduleSummary({ tracker }: { tracker: JourneyTracker }) {
  const start = storedDay(tracker.startDate)
  const end = tracker.endDate ? storedDay(tracker.endDate) : null
  const progress = journeyProgress(start, end, todayIso())

  let where: string
  if (!progress.started) where = `Starts in ${progress.daysUntilStart} day${progress.daysUntilStart === 1 ? '' : 's'}`
  else if (progress.finished) where = 'Proposed end date reached'
  else if (progress.totalDays) where = `Day ${progress.dayNumber} of ${progress.totalDays} · ${progress.daysLeft} days left`
  else where = `Day ${progress.dayNumber}`

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>
        <span className="font-medium text-foreground">{progress.started ? 'Started' : 'Starts'}</span>{' '}
        {formatDate(start, { dateStyle: 'medium' })}
      </span>
      <span>
        <span className="font-medium text-foreground">Proposed end</span>{' '}
        {end ? formatDate(end, { dateStyle: 'medium' }) : 'not set'}
      </span>
      <Badge tone={progress.finished ? 'yellow' : progress.started ? 'green' : 'blue'}>{where}</Badge>
    </p>
  )
}

interface Props {
  tracker: JourneyTracker | undefined
  trackerId: string
  /** Tabs are for active trackers; a draft is still being set up. */
  showTabs?: boolean
  actions?: ReactNode
}

export default function TrackerHeader({ tracker, trackerId, showTabs = true, actions }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">{tracker?.name ?? '…'}</h1>
          {tracker && <ScheduleSummary tracker={tracker} />}
        </div>
        {actions}
      </div>
      {showTabs && <TrackerTabs trackerId={trackerId} />}
    </div>
  )
}
