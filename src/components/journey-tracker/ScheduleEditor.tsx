import { daysBetween, proposedEnd } from '../../lib/date'
import { Badge, Button, Field, Input } from '../ui'

const PRESET_DAYS = [30, 60, 90, 180]

interface Props {
  start: string
  end: string
  onChange: (next: { start: string; end: string }) => void
  /** Length (in days) the tracker template suggests; the end date follows the start while it matches. */
  proposedDays?: number | null
}

export default function ScheduleEditor({ start, end, onChange, proposedDays }: Props) {
  const followsProposal = !!proposedDays && !!end && end === proposedEnd(start, proposedDays)

  const changeStart = (next: string) => {
    if (!next) return
    if (followsProposal) onChange({ start: next, end: proposedEnd(next, proposedDays!) })
    else onChange({ start: next, end: end && end < next ? '' : end })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date" hint="Day 1 of the journey. Nothing can be logged before this date.">
          <Input type="date" value={start} onChange={(e) => changeStart(e.target.value)} required />
        </Field>
        <Field label="Proposed end date" hint={end ? `${daysBetween(start, end) + 1} days in total` : 'Optional — leave empty for an open-ended journey'}>
          <Input type="date" value={end} min={start} onChange={(e) => onChange({ start, end: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Journey length</span>
        {PRESET_DAYS.map((days) => (
          <Button key={days} size="sm" variant={end === proposedEnd(start, days) ? 'primary' : 'outline'} onClick={() => onChange({ start, end: proposedEnd(start, days) })}>
            {days} days
          </Button>
        ))}
        {end && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ start, end: '' })}>
            No end date
          </Button>
        )}
        {followsProposal && <Badge tone="blue">Proposed from the {proposedDays}-day plan</Badge>}
      </div>
    </div>
  )
}
