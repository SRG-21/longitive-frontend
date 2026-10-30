import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sparkles } from 'lucide-react'
import {
  useCreateExerciseLog,
  useExerciseLogs,
  useExercisePlan,
  useExerciseStats,
  useGenerateExercisePlan,
  type ExerciseLogInput,
} from '../../hooks/usePlans'
import { getErrorMessage } from '../../lib/api'
import { daysAgoIso, formatDate, formatDateTime, todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import AiContent from '../../components/AiContent'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, MedicalDisclaimer, PageHeader, Select, Stat } from '../../components/ui'

const EXERCISE_TYPES = ['Walking', 'Running', 'Cycling', 'Swimming', 'Strength', 'Yoga', 'HIIT', 'Pilates', 'Sports', 'Other']
const INTENSITIES = ['low', 'moderate', 'high']

function LogForm() {
  const create = useCreateExerciseLog()
  const { register, handleSubmit, reset } = useForm<ExerciseLogInput>({
    defaultValues: { date: todayIso(), exerciseType: 'Walking', intensity: 'moderate' },
  })

  const onSubmit = async (values: ExerciseLogInput) => {
    try {
      await create.mutateAsync(compact(values))
      toast.success('Workout logged')
      reset({ date: todayIso(), exerciseType: values.exerciseType, intensity: values.intensity })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not log workout'))
    }
  }

  return (
    <Card title="Log a workout">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" max={todayIso()} {...register('date', { required: true })} />
        </Field>
        <Field label="Type">
          <Select {...register('exerciseType', { required: true })}>
            {EXERCISE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Duration (min)">
          <Input type="number" min={1} step={1} {...register('duration', optionalNumber)} />
        </Field>
        <Field label="Intensity">
          <Select {...register('intensity')}>
            {INTENSITIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Avg heart rate (bpm)">
          <Input type="number" step={1} {...register('heartRateAvg', optionalNumber)} />
        </Field>
        <Field label="Notes">
          <Input {...register('notes')} />
        </Field>
        <Button type="submit" loading={create.isPending} className="col-span-2 w-fit">
          Save workout
        </Button>
      </form>
    </Card>
  )
}

function PlanCard() {
  const { data: plan, isLoading } = useExercisePlan()
  const generate = useGenerateExercisePlan()
  const [goal, setGoal] = useState('general fitness')
  const [equipmentLevel, setEquipment] = useState('minimal')

  const onGenerate = async () => {
    try {
      await generate.mutateAsync({ goal, equipmentLevel })
      toast.success('New exercise plan ready')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not generate a plan'))
    }
  }

  return (
    <Card title="Weekly exercise plan">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Goal">
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. fat loss, strength, mobility" />
          </Field>
          <Field label="Equipment">
            <Select value={equipmentLevel} onChange={(e) => setEquipment(e.target.value)}>
              <option value="none">None (bodyweight)</option>
              <option value="minimal">Minimal (bands, dumbbells)</option>
              <option value="full gym">Full gym</option>
            </Select>
          </Field>
          <Button onClick={onGenerate} loading={generate.isPending}>
            <Sparkles size={14} /> {plan ? 'Regenerate plan' : 'Generate plan'}
          </Button>
        </div>
        {generate.isPending && <p className="text-sm text-muted-foreground">Building a plan from your profile, conditions and latest measurements… this can take up to a minute.</p>}
        {isLoading ? (
          <Loading />
        ) : plan ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {plan.goal && <Badge tone="green">{plan.goal}</Badge>}
              {plan.equipmentLevel && <Badge>{plan.equipmentLevel}</Badge>}
              <span>Created {formatDateTime(plan.createdAt)}</span>
            </div>
            <div className="max-h-[32rem] overflow-y-auto rounded-md border border-border p-3">
              <AiContent content={plan.weeklySchedule} />
            </div>
            <MedicalDisclaimer />
          </div>
        ) : (
          <EmptyState>No active plan. Generate one tailored to your goal and equipment.</EmptyState>
        )}
      </div>
    </Card>
  )
}

export default function ExercisePage() {
  const { data: stats } = useExerciseStats()
  const { data: logs, isLoading } = useExerciseLogs(daysAgoIso(30))

  const byType = useMemo(() => Object.entries(stats?.byType ?? {}).map(([type, count]) => ({ type, count })), [stats])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Exercise" description="Log workouts and follow an AI-generated weekly plan." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sessions (30d)" value={stats?.totalSessions ?? '—'} hint="Aim for 4+ per week" />
        <Stat label="Active minutes (30d)" value={stats?.totalMinutes ?? '—'} />
        <Stat label="Avg heart rate" value={stats?.avgHeartRate ? `${Math.round(stats.avgHeartRate)} bpm` : '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LogForm />
        <Card title="Sessions by type (30d)">
          {byType.length ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Sessions" fill="#16a34a" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No workouts in the last 30 days.</EmptyState>
          )}
        </Card>
      </div>

      <PlanCard />

      <Card title="Recent workouts">
        {isLoading ? (
          <Loading />
        ) : logs?.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium text-foreground">{log.exerciseType}</span>
                  <span className="text-muted-foreground"> · {formatDate(log.date)}</span>
                </span>
                <span className="text-muted-foreground">
                  {log.duration ? `${log.duration} min` : '—'}
                  {log.intensity && ` · ${log.intensity}`}
                  {log.heartRateAvg && ` · ${log.heartRateAvg} bpm`}
                </span>
                {log.notes && <span className="w-full text-xs text-muted-foreground">{log.notes}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No workouts logged yet.</EmptyState>
        )}
      </Card>
    </div>
  )
}
