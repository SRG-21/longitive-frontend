import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Settings2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AddFieldPanel from '../../components/journey-tracker/AddFieldPanel'
import { isTargetField } from '../../components/journey-tracker/fieldKeys'
import TrackerHeader from '../../components/journey-tracker/TrackerHeader'
import { Badge, Button, Card, EmptyState, Loading } from '../../components/ui'
import { useChartData, useTracker, useUpdateField } from '../../hooks/useJourneyTracker'
import { getErrorMessage } from '../../lib/api'
import { chartDate } from '../../lib/date'
import type { ChartData, JourneyTracker, TrackerField } from '../../types/journey-tracker'

// Types whose values are numbers on a line chart.
const CHARTABLE_TYPES = ['NUMBER', 'DURATION', 'RATING', 'FORMULA']

export default function TrackerChartPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tracker } = useTracker(id)
  const { data: chart, isLoading } = useChartData(id)
  const [setupOpen, setSetupOpen] = useState(false)

  if (!id) return null

  const series = chart?.series ?? []

  return (
    <div className="flex flex-col gap-4">
      <TrackerHeader tracker={tracker} trackerId={id} />

      <Card
        title="Chart setup"
        actions={
          <Button size="sm" variant="outline" onClick={() => setSetupOpen((v) => !v)} aria-expanded={setupOpen}>
            <Settings2 size={14} /> {setupOpen ? 'Hide setup' : 'Choose fields'}
          </Button>
        }
      >
        {tracker && setupOpen ? (
          <ChartSetup tracker={tracker} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Showing {series.length ? series.map((s) => s.label).join(', ') : 'no fields yet'}. Choose which fields are charted, or add new
            ones — what you've already logged is never changed by this.
          </p>
        )}
      </Card>

      {isLoading || !tracker || !chart ? (
        <Loading />
      ) : series.length === 0 ? (
        <EmptyState>Nothing is charted yet. Open the setup above and tick a field to chart.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {series.map((s) => (
            <SeriesChart key={s.key} tracker={tracker} chart={chart} series={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChartSetup({ tracker }: { tracker: JourneyTracker }) {
  const updateField = useUpdateField(tracker.id)
  // A tick shows immediately and is dropped once the save settles (the saved value then takes over).
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const fields = (tracker.fields ?? [])
    .filter((f) => f.isActive && CHARTABLE_TYPES.includes(f.type))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const toggle = (field: TrackerField) => {
    const next = !(pending[field.id] ?? field.chartable)
    setPending((prev) => ({ ...prev, [field.id]: next }))
    updateField.mutate(
      { fieldId: field.id, dto: { chartable: next } },
      {
        onError: (err) => toast.error(getErrorMessage(err, `Could not update "${field.label}"`)),
        onSettled: () =>
          setPending((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== field.id))),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-1 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <input type="checkbox" checked={pending[field.id] ?? field.chartable} onChange={() => toggle(field)} />
            <span className="text-foreground">
              {field.label}
              {field.unit && <span className="text-muted-foreground"> ({field.unit})</span>}
            </span>
            {field.cadence === 'WEEKLY' && <Badge tone="blue">weekly</Badge>}
          </label>
        ))}
        {fields.length === 0 && <p className="text-sm text-muted-foreground">No number fields yet — add one below.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Add a field</h3>
        <AddFieldPanel tracker={tracker} defaults={{ chartable: true }} />
        <p className="text-xs text-muted-foreground">
          A new field starts charting from the day you first log it. Days before that stay as they were, and fields you untick keep all
          their logged values.
        </p>
      </div>
    </div>
  )
}

function SeriesChart({ tracker, chart, series }: { tracker: JourneyTracker; chart: ChartData; series: ChartData['series'][number] }) {
  const field = tracker.fields?.find((f) => f.key === series.key)
  const weightKey = (tracker.settings as { syncWeightFieldKey?: string } | null | undefined)?.syncWeightFieldKey || 'weight'
  // Start/target lines are for body measurements only (see isTargetField).
  const targeted = !!field && isTargetField(field)
  const target = targeted ? (tracker.targets?.[series.key] ?? field?.target?.goal) : undefined
  const start = targeted ? tracker.baseline?.[series.key] : undefined
  // The rolling average smooths day-to-day noise; with one weight a week there is nothing to smooth.
  const showAverage = series.key === weightKey && series.cadence !== 'WEEKLY'
  const unit = series.unit ? ` ${series.unit}` : ''

  // Each chart only plots the days it has a value for, so a weekly field isn't stretched across empty days.
  const rows = useMemo(
    () =>
      chart.dates
        .map((date, idx) => ({
          date: chartDate(date),
          value: series.values[idx],
          average: showAverage ? chart.weightRollingAverage[idx] : null,
        }))
        .filter((row) => row.value != null),
    [chart, series, showAverage],
  )

  return (
    <Card
      title={`${series.label}${series.unit ? ` (${series.unit})` : ''}`}
      actions={
        <span className="flex items-center gap-1">
          {series.cadence === 'WEEKLY' && <Badge tone="blue">weekly</Badge>}
          {target != null && <Badge tone="green">Target {target}</Badge>}
        </span>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>No {series.label.toLowerCase()} logged yet.</EmptyState>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} domain={['auto', 'auto']} />
              <Tooltip formatter={(v, name) => [`${v}${unit}`, name]} />
              {start != null && <ReferenceLine y={start} stroke="#9ca3af" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: 'Start', fontSize: 11, fill: '#6b7280', position: 'insideTopRight' }} />}
              {target != null && <ReferenceLine y={target} stroke="#16a34a" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: 'Target', fontSize: 11, fill: '#16a34a', position: 'insideBottomRight' }} />}
              <Line type="monotone" dataKey="value" name={series.label} stroke="#0f766e" strokeWidth={2} dot={rows.length < 25} connectNulls />
              {showAverage && <Line type="monotone" dataKey="average" name="7-day average" stroke="#16a34a" strokeDasharray="4 2" dot={false} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
