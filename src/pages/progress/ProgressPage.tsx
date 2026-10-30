import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Flame, Plus, Trash2 } from 'lucide-react'
import { useDailyChecklist, useStreaks, useUpdateChecklist, useWeeklyProgress } from '../../hooks/usePlans'
import { getErrorMessage } from '../../lib/api'
import { addDays, chartDate, formatDate, todayIso } from '../../lib/date'
import { Button, Card, EmptyState, Input, Loading, PageHeader, ProgressBar, Stat } from '../../components/ui'
import type { ChecklistItem } from '../../types/health'
import RemindersCard from './RemindersCard'

function Checklist({ date }: { date: string }) {
  const { data: checklist, isLoading } = useDailyChecklist(date)
  const update = useUpdateChecklist(date)
  const [newTask, setNewTask] = useState('')

  const items = checklist?.items ?? []
  const done = items.filter((i) => i.completed).length

  const save = async (next: ChecklistItem[], successMessage?: string) => {
    try {
      await update.mutateAsync(next)
      if (successMessage) toast.success(successMessage)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update checklist'))
    }
  }

  const toggle = (idx: number) => {
    const next = items.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
    save(next, next.every((i) => i.completed) ? 'All done for the day — streak updated!' : undefined)
  }

  const addTask = () => {
    const task = newTask.trim()
    if (!task) return
    save([...items, { task, completed: false }])
    setNewTask('')
  }

  if (isLoading) return <Loading />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <ProgressBar value={items.length ? (done / items.length) * 100 : 0} />
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {done}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item, idx) => (
          <li key={`${item.task}-${idx}`} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
            <button
              type="button"
              onClick={() => toggle(idx)}
              disabled={update.isPending}
              aria-label={item.completed ? `Mark "${item.task}" not done` : `Mark "${item.task}" done`}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                item.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
              }`}
            >
              {item.completed && <Check size={12} />}
            </button>
            <span className={`flex-1 text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.task}</span>
            <button
              type="button"
              onClick={() => save(items.filter((_, i) => i !== idx))}
              className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              aria-label={`Remove "${item.task}"`}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Add a task for this day" className="flex-1" />
        <Button variant="outline" onClick={addTask} disabled={!newTask.trim()}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [date, setDate] = useState(todayIso())
  const { data: streak } = useStreaks()
  const { data: weekly } = useWeeklyProgress()
  const isToday = date === todayIso()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progress" description="Complete your daily checklist to build a streak." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Current streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame size={20} className="text-orange-500" /> {streak?.currentStreak ?? 0} days
            </span>
          }
          hint={streak?.lastCompletedDate ? `Last full day: ${formatDate(streak.lastCompletedDate)}` : undefined}
        />
        <Stat label="Longest streak" value={`${streak?.longestStreak ?? 0} days`} />
        <Stat label="Weekly average" value={weekly ? `${weekly.averageScore}%` : '—'} hint={weekly ? `${weekly.daysTracked} days tracked` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={isToday ? "Today's checklist" : formatDate(date, { dateStyle: 'full' })}
          actions={
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setDate((d) => addDays(d, -1))}>
                ←
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDate(todayIso())} disabled={isToday}>
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDate((d) => addDays(d, 1))} disabled={isToday}>
                →
              </Button>
            </div>
          }
        >
          <Checklist key={date} date={date} />
        </Card>

        <Card title="Last 7 days">
          {weekly?.dailyScores.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly.dailyScores.map((d) => ({ date: chartDate(d.date), score: d.score }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Completed']} />
                  <Bar dataKey="score" fill="#16a34a" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>Checklist completion for the past week will appear here.</EmptyState>
          )}
        </Card>
      </div>

      <RemindersCard />
    </div>
  )
}
