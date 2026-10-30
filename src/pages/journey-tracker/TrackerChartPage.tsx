import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import TrackerTabs from '../../components/journey-tracker/TrackerTabs'
import { useChartData, useTracker } from '../../hooks/useJourneyTracker'

export default function TrackerChartPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tracker } = useTracker(id)
  const { data: chart } = useChartData(id)
  const [visibleKeys, setVisibleKeys] = useState<string[] | null>(null)

  const chartRows = useMemo(() => {
    if (!chart) return []
    return chart.dates.map((date, idx) => {
      const row: Record<string, unknown> = { date: new Date(date).toLocaleDateString() }
      chart.series.forEach((s) => (row[s.key] = s.values[idx]))
      row.weightRollingAverage = chart.weightRollingAverage[idx]
      return row
    })
  }, [chart])

  if (!id) return null

  const series = chart?.series ?? []
  const visible = visibleKeys ?? series.map((s) => s.key)

  const toggle = (key: string) =>
    setVisibleKeys((prev) => {
      const current = prev ?? series.map((s) => s.key)
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">{tracker?.name}</h1>
      <TrackerTabs trackerId={id} />

      <div className="flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => toggle(s.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              visible.includes(s.key) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="h-96 rounded-md border border-border p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {series
              .filter((s) => visible.includes(s.key))
              .map((s, idx) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={`hsl(${idx * 70}, 70%, 45%)`} dot={false} />
              ))}
            {visible.includes('weight') && (
              <Line type="monotone" dataKey="weightRollingAverage" name="Weight (7-day avg)" stroke="#16a34a" strokeDasharray="4 2" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {chartRows.length === 0 && <p className="text-muted-foreground">No chartable data yet — log a few daily entries first.</p>}
    </div>
  )
}
