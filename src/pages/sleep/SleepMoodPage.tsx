import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCreateMoodLog, useCreateSleepLog, useMoodLogs, useSleepLogs, useSleepScore } from '../../hooks/useHealthData'
import { getErrorMessage } from '../../lib/api'
import { addDays, chartDate, daysAgoIso, formatDate, formatTime, todayIso } from '../../lib/date'
import { Button, Card, EmptyState, Field, Input, PageHeader, RatingInput, Stat, Textarea } from '../../components/ui'

/** Combines a calendar date and HH:mm into a local-time ISO timestamp. */
function localDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString()
}

/** Bedtime belongs to the evening before the wake-up date when it's later in the clock than the wake time. */
function sleepWindow(wakeDate: string, bedtime: string, wakeTime: string) {
  const bedDate = bedtime > wakeTime ? addDays(wakeDate, -1) : wakeDate
  const start = new Date(`${bedDate}T${bedtime}`)
  const end = new Date(`${wakeDate}T${wakeTime}`)
  return {
    bedtime: localDateTime(bedDate, bedtime),
    wakeTime: localDateTime(wakeDate, wakeTime),
    duration: Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 10) / 10,
  }
}

function SleepForm() {
  const create = useCreateSleepLog()
  const [date, setDate] = useState(todayIso())
  const [bedtime, setBedtime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [quality, setQuality] = useState<number>()
  const [notes, setNotes] = useState('')

  const sleepTimes = bedtime && wakeTime ? sleepWindow(date, bedtime, wakeTime) : undefined

  const submit = async () => {
    try {
      await create.mutateAsync({ date, ...sleepTimes, quality, notes: notes || undefined })
      toast.success('Sleep logged')
      setQuality(undefined)
      setNotes('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not log sleep'))
    }
  }

  return (
    <Card title="Log sleep">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Woke up on">
            <Input type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Bedtime">
            <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </Field>
          <Field label="Wake time">
            <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </Field>
        </div>
        {sleepTimes && <p className="text-sm text-muted-foreground">Duration: {sleepTimes.duration} hours</p>}
        <Field label="Quality (1–10)">
          <RatingInput value={quality} onChange={setQuality} />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Woke up at night, late caffeine…" />
        </Field>
        <Button onClick={submit} loading={create.isPending} className="w-fit">
          Save sleep log
        </Button>
      </div>
    </Card>
  )
}

function MoodForm() {
  const create = useCreateMoodLog()
  const [date, setDate] = useState(todayIso())
  const [mood, setMood] = useState<number>()
  const [energy, setEnergy] = useState<number>()
  const [stressLevel, setStress] = useState<number>()
  const [notes, setNotes] = useState('')

  const submit = async () => {
    if (!mood && !energy && !stressLevel) {
      toast.error('Rate at least one of mood, energy or stress')
      return
    }
    try {
      await create.mutateAsync({ date, mood, energy, stressLevel, notes: notes || undefined })
      toast.success('Mood logged')
      setMood(undefined)
      setEnergy(undefined)
      setStress(undefined)
      setNotes('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not log mood'))
    }
  }

  return (
    <Card title="Log mood">
      <div className="flex flex-col gap-3">
        <Field label="Date" className="max-w-xs">
          <Input type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Mood">
          <RatingInput value={mood} onChange={setMood} />
        </Field>
        <Field label="Energy">
          <RatingInput value={energy} onChange={setEnergy} />
        </Field>
        <Field label="Stress">
          <RatingInput value={stressLevel} onChange={setStress} />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button onClick={submit} loading={create.isPending} className="w-fit">
          Save mood log
        </Button>
      </div>
    </Card>
  )
}

export default function SleepMoodPage() {
  const from = daysAgoIso(30)
  const { data: score } = useSleepScore()
  const { data: sleepLogs } = useSleepLogs(from)
  const { data: moodLogs } = useMoodLogs(from)

  const sleepRows = useMemo(
    () => [...(sleepLogs ?? [])].reverse().map((l) => ({ date: chartDate(l.date), duration: l.duration, quality: l.quality })),
    [sleepLogs],
  )
  const moodRows = useMemo(
    () => [...(moodLogs ?? [])].reverse().map((l) => ({ date: chartDate(l.date), mood: l.mood, energy: l.energy, stress: l.stressLevel })),
    [moodLogs],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sleep & mood" description="Daily sleep and wellbeing logs feed your health score." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sleep score (7d)" value={score?.score ?? '—'} />
        <Stat label="Avg duration" value={score ? `${score.avgDuration} h` : '—'} hint="Target 7–9 hours" />
        <Stat label="Avg quality" value={score ? `${score.avgQuality}/10` : '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SleepForm />
        <MoodForm />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sleep — last 30 days">
          {sleepRows.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sleepRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis yAxisId="h" fontSize={12} />
                  <YAxis yAxisId="q" orientation="right" domain={[0, 10]} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="h" dataKey="duration" name="Hours" fill="#93c5fd" maxBarSize={32} />
                  <Line yAxisId="q" type="monotone" dataKey="quality" name="Quality" stroke="#16a34a" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No sleep logged in the last 30 days.</EmptyState>
          )}
        </Card>
        <Card title="Mood — last 30 days">
          {moodRows.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 10]} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="energy" name="Energy" stroke="#0ea5e9" strokeWidth={2} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No mood logged in the last 30 days.</EmptyState>
          )}
        </Card>
      </div>

      <Card title="Recent sleep logs">
        {sleepLogs?.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {sleepLogs.slice(0, 10).map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium text-foreground">{formatDate(log.date)}</span>
                <span className="text-muted-foreground">
                  {formatTime(log.bedtime)} → {formatTime(log.wakeTime)} · {log.duration ?? '—'} h · quality {log.quality ?? '—'}/10
                </span>
                {log.notes && <span className="w-full text-xs text-muted-foreground">{log.notes}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No sleep logs yet.</EmptyState>
        )}
      </Card>
    </div>
  )
}
