import { Link } from 'react-router-dom'
import { Activity, Bot, ClipboardCheck, Flame, FlaskConical, Moon, Scale } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAnalyticsDashboard, useSleepScore } from '../../hooks/useHealthData'
import { useDailyChecklist, useExerciseStats } from '../../hooks/usePlans'
import { Badge, Card, EmptyState, Loading, PageHeader, ProgressBar, Stat } from '../../components/ui'
import { formatDate, todayIso } from '../../lib/date'
import { statusTone } from '../lab-reports/labStatus'

const breakdownLabels: Record<string, string> = {
  bmi: 'BMI',
  sleep: 'Sleep',
  exercise: 'Exercise',
  adherence: 'Plan adherence',
  mood: 'Mood',
}

const quickLinks = [
  { to: '/progress', label: "Today's checklist", icon: ClipboardCheck },
  { to: '/sleep', label: 'Log sleep & mood', icon: Moon },
  { to: '/body-composition', label: 'Add measurement', icon: Scale },
  { to: '/lab-reports', label: 'Upload lab report', icon: FlaskConical },
  { to: '/exercise', label: 'Log a workout', icon: Activity },
  { to: '/ai/chat', label: 'Ask the health assistant', icon: Bot },
]

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useAnalyticsDashboard()
  const { data: sleepScore } = useSleepScore()
  const { data: exercise } = useExerciseStats()
  const today = todayIso()
  const { data: checklist } = useDailyChecklist(today)

  const items = checklist?.items ?? []
  const done = items.filter((i) => i.completed).length
  const latest = data?.latestBodyComp

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome${user ? `, ${user.name}` : ''}`} description="Your longevity snapshot across every tracked area." />

      {isLoading && <Loading />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Health score" value={data ? `${data.healthScore.overall}/100` : '—'} hint="Last 7 days" />
        <Stat
          label="Streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame size={20} className="text-orange-500" />
              {data?.streak?.currentStreak ?? 0} days
            </span>
          }
          hint={`Longest: ${data?.streak?.longestStreak ?? 0} days`}
        />
        <Stat label="Sleep score" value={sleepScore ? sleepScore.score : '—'} hint={sleepScore ? `${sleepScore.avgDuration}h avg · quality ${sleepScore.avgQuality}/10` : undefined} />
        <Stat label="Workouts (30d)" value={exercise?.totalSessions ?? '—'} hint={exercise ? `${exercise.totalMinutes} min total` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Score breakdown" className="lg:col-span-2">
          {data && Object.keys(data.healthScore.breakdown).length > 0 ? (
            <div className="flex flex-col gap-3">
              {Object.entries(data.healthScore.breakdown).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{breakdownLabels[key] ?? key}</span>
                    <span className="font-medium text-foreground">{Math.round(value ?? 0)}</span>
                  </div>
                  <ProgressBar value={value ?? 0} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Log sleep, mood, workouts and measurements to build your health score.</EmptyState>
          )}
        </Card>

        <Card title="Today" actions={<Link to="/progress" className="text-xs font-medium text-primary">Open checklist</Link>}>
          {items.length ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                {done} of {items.length} tasks done
              </div>
              <ProgressBar value={(done / items.length) * 100} />
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {items.slice(0, 6).map((item, idx) => (
                  <li key={`${item.task}-${idx}`} className={item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                    {item.task}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Loading />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Latest body composition" actions={<Link to="/body-composition" className="text-xs font-medium text-primary">View history</Link>}>
          {latest ? (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ['Weight', latest.weight, 'kg'],
                ['BMI', latest.bmi, ''],
                ['Body fat', latest.bodyFat, '%'],
                ['Muscle mass', latest.muscleMass, 'kg'],
                ['Visceral fat', latest.visceralFat, ''],
                ['Metabolic age', latest.metabolicAge, 'yrs'],
              ].map(([label, value, unit]) => (
                <div key={label as string}>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="font-medium text-foreground">{value != null ? `${value} ${unit}` : '—'}</div>
                </div>
              ))}
              <div className="col-span-full text-xs text-muted-foreground">Measured {formatDate(latest.date)}</div>
            </div>
          ) : (
            <EmptyState>No measurements yet.</EmptyState>
          )}
        </Card>

        <Card title="Recent lab reports" actions={<Link to="/lab-reports" className="text-xs font-medium text-primary">All reports</Link>}>
          {data?.recentLabReports.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {data.recentLabReports.map((report) => {
                const flagged = report.results.filter((r) => r.status !== 'NORMAL')
                return (
                  <li key={report.id}>
                    <Link to={`/lab-reports/${report.id}`} className="flex items-center justify-between gap-2 py-2 text-sm hover:text-primary">
                      <span>
                        {formatDate(report.reportDate)} · {report.labName || report.reportType || 'Lab report'}
                      </span>
                      <span className="flex gap-1">
                        {flagged.length ? (
                          flagged.slice(0, 2).map((r) => (
                            <Badge key={r.id} tone={statusTone(r.status)}>
                              {r.testName} {r.status.toLowerCase()}
                            </Badge>
                          ))
                        ) : (
                          <Badge tone="green">{report.results.length} normal</Badge>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState>No lab reports yet.</EmptyState>
          )}
        </Card>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-medium text-foreground hover:shadow-sm">
            <Icon size={16} className="text-primary" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
