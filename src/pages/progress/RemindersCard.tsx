import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, Trash2 } from 'lucide-react'
import { useCreateReminder, useDeleteReminder, useReminders, useUpdateReminder } from '../../hooks/usePlans'
import { getErrorMessage } from '../../lib/api'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, Select } from '../../components/ui'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const REMINDER_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'meal', label: 'Meal' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'custom', label: 'Other' },
]

/** Builds a 5-field cron expression ("m h * * dow") from a time and a set of weekdays. */
function toCron(time: string, days: number[]): string {
  const [h, m] = time.split(':').map(Number)
  const dow = days.length === 0 || days.length === 7 ? '*' : [...days].sort().join(',')
  return `${m} ${h} * * ${dow}`
}

/** Human-readable form of the crons this UI creates; anything else is shown verbatim. */
function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5 || parts[2] !== '*' || parts[3] !== '*' || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return cron
  const time = `${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')}`
  if (parts[4] === '*') return `Every day at ${time}`
  const days = parts[4].split(',').map((d) => DAYS[Number(d) % 7])
  if (days.some((d) => !d)) return cron
  return `${days.join(', ')} at ${time}`
}

export default function RemindersCard() {
  const { data: reminders, isLoading } = useReminders()
  const create = useCreateReminder()
  const update = useUpdateReminder()
  const remove = useDeleteReminder()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('medication')
  const [message, setMessage] = useState('')
  const [time, setTime] = useState('08:00')
  const [days, setDays] = useState<number[]>([])

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const onCreate = async () => {
    if (!title.trim()) {
      toast.error('Give the reminder a title')
      return
    }
    try {
      await create.mutateAsync({ type, title: title.trim(), message: message.trim() || undefined, cronExpression: toCron(time, days) })
      toast.success('Reminder created')
      setTitle('')
      setMessage('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create reminder'))
    }
  }

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action
    } catch (err) {
      toast.error(getErrorMessage(err, failure))
    }
  }

  return (
    <Card title="Reminders">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Take vitamin D" />
            </Field>
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Message (optional)">
            <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Time">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </Field>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Days</span>
              <div className="flex gap-1">
                {DAYS.map((label, d) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`h-9 w-10 rounded-md border text-xs font-medium ${
                      days.includes(d) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{time ? describeCron(toCron(time, days)) : 'Pick a time'} · no days selected means every day</p>
          <Button onClick={onCreate} loading={create.isPending} disabled={!time} className="w-fit">
            <Bell size={14} /> Add reminder
          </Button>
        </div>

        <div>
          {isLoading ? (
            <Loading />
          ) : reminders?.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${r.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{r.title}</span>
                      <Badge>{r.type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {describeCron(r.cronExpression)}
                      {r.message && ` · ${r.message}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => run(update.mutateAsync({ id: r.id, dto: { isActive: !r.isActive } }), 'Could not update reminder')}>
                      {r.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${r.title}`} onClick={() => run(remove.mutateAsync(r.id), 'Could not delete reminder')}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No reminders yet.</EmptyState>
          )}
        </div>
      </div>
    </Card>
  )
}
