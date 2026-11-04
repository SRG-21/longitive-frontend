import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  useBodyCompositionHistory,
  useBodyCompositionOcr,
  useBodyCompositionTrends,
  useCreateBodyComposition,
  type BodyCompositionInput,
} from '../../hooks/useHealthData'
import { getErrorMessage } from '../../lib/api'
import { chartDate, formatDate, todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, PageHeader, Select, Stat } from '../../components/ui'
import FileDropzone from '../../components/FileDropzone'
import type { BodyCompositionMetric } from '../../types/health'

const METRICS: { int?: boolean; key: BodyCompositionMetric; label: string; unit: string; group: 'Body' | 'Measurements' | 'Vitals' }[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', group: 'Body' },
  { key: 'height', label: 'Height', unit: 'cm', group: 'Body' },
  { key: 'bmi', label: 'BMI', unit: '', group: 'Body' },
  { key: 'bodyFat', label: 'Body fat', unit: '%', group: 'Body' },
  { key: 'visceralFat', label: 'Visceral fat', unit: '', group: 'Body' },
  { key: 'subcutaneousFat', label: 'Subcutaneous fat', unit: '%', group: 'Body' },
  { key: 'muscleMass', label: 'Muscle mass', unit: 'kg', group: 'Body' },
  { key: 'boneMass', label: 'Bone mass', unit: 'kg', group: 'Body' },
  { key: 'bodyWater', label: 'Body water', unit: '%', group: 'Body' },
  { key: 'bmr', label: 'BMR', unit: 'kcal', group: 'Body' },
  { int: true, key: 'metabolicAge', label: 'Metabolic age', unit: 'yrs', group: 'Body' },
  { key: 'waist', label: 'Waist', unit: 'cm', group: 'Measurements' },
  { key: 'hip', label: 'Hip', unit: 'cm', group: 'Measurements' },
  { key: 'chest', label: 'Chest', unit: 'cm', group: 'Measurements' },
  { int: true, key: 'bloodPressureSystolic', label: 'BP systolic', unit: 'mmHg', group: 'Vitals' },
  { int: true, key: 'bloodPressureDiastolic', label: 'BP diastolic', unit: 'mmHg', group: 'Vitals' },
  { int: true, key: 'heartRate', label: 'Resting heart rate', unit: 'bpm', group: 'Vitals' },
  { key: 'spo2', label: 'SpO₂', unit: '%', group: 'Vitals' },
]

const TREND_METRICS = ['weight', 'bmi', 'bodyFat', 'muscleMass', 'visceralFat'] as const
const TABLE_METRICS: BodyCompositionMetric[] = ['weight', 'bmi', 'bodyFat', 'muscleMass', 'visceralFat', 'waist', 'heartRate']

function metricMeta(key: BodyCompositionMetric) {
  return METRICS.find((m) => m.key === key)!
}

export default function BodyCompositionPage() {
  const { data: history, isLoading } = useBodyCompositionHistory()
  const { data: trends } = useBodyCompositionTrends()
  const create = useCreateBodyComposition()
  const ocr = useBodyCompositionOcr()
  const [chartMetric, setChartMetric] = useState<BodyCompositionMetric>('weight')
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, control, setValue } = useForm<BodyCompositionInput>({ defaultValues: { date: todayIso() } })
  const [weight, height] = useWatch({ control, name: ['weight', 'height'] })

  const chartRows = useMemo(
    () =>
      (trends?.records ?? [])
        .filter((r) => r[chartMetric] != null)
        .map((r) => ({ date: chartDate(r.date), value: r[chartMetric] })),
    [trends, chartMetric],
  )

  const onSubmit = async (values: BodyCompositionInput) => {
    try {
      await create.mutateAsync(compact(values))
      toast.success('Measurement saved')
      reset({ date: todayIso() })
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save measurement'))
    }
  }

  const onUpload = async (file: File) => {
    try {
      const record = await ocr.mutateAsync(file)
      if (record.alreadyUploaded) toast(`You already uploaded this file — it's the ${formatDate(record.date)} measurement`, { icon: 'ℹ️' })
      else toast.success(`Extracted measurement for ${formatDate(record.date)}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not read that file'))
    }
  }

  const fillBmi = () => {
    if (weight && height) setValue('bmi', Math.round((weight / (height / 100) ** 2) * 10) / 10)
  }

  const latest = history?.[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Body composition"
        description="Track weight, body fat, measurements and vitals over time."
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close form' : 'Add measurement'}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TREND_METRICS.map((key) => {
          const meta = metricMeta(key)
          const trend = trends?.trends[key]
          const Icon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : ArrowRight
          return (
            <Stat
              key={key}
              label={meta.label}
              value={latest?.[key] != null ? `${latest[key]} ${meta.unit}` : '—'}
              hint={
                trend ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Icon size={12} />
                    {trend.change > 0 ? '+' : ''}
                    {trend.change} since last
                  </span>
                ) : undefined
              }
            />
          )
        })}
      </div>

      {showForm && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Enter manually" className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Field label="Date" className="max-w-xs">
                <Input type="date" max={todayIso()} {...register('date', { required: true })} />
              </Field>
              {(['Body', 'Measurements', 'Vitals'] as const).map((group) => (
                <fieldset key={group} className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {METRICS.filter((m) => m.group === group).map((m) => (
                      <Field key={m.key} label={`${m.label}${m.unit ? ` (${m.unit})` : ''}`}>
                        <Input type="number" step={m.int ? 1 : 'any'} {...register(m.key, optionalNumber)} />
                      </Field>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={create.isPending}>
                  Save measurement
                </Button>
                <Button variant="outline" onClick={fillBmi} disabled={!weight || !height}>
                  Calculate BMI from weight & height
                </Button>
              </div>
            </form>
          </Card>
          <Card title="Or scan a report">
            <p className="mb-3 text-sm text-muted-foreground">Upload a smart-scale or InBody printout and we'll extract the values automatically.</p>
            <FileDropzone onFile={onUpload} busy={ocr.isPending} label="Upload body composition report" />
          </Card>
        </div>
      )}

      <Card
        title="Trend"
        actions={
          <Select value={chartMetric} onChange={(e) => setChartMetric(e.target.value as BodyCompositionMetric)} className="w-auto">
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>
        }
      >
        {chartRows.length >= 2 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => [`${v} ${metricMeta(chartMetric).unit}`, metricMeta(chartMetric).label]} />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState>At least two {metricMeta(chartMetric).label.toLowerCase()} readings are needed to draw a trend.</EmptyState>
        )}
      </Card>

      <Card title="History">
        {isLoading ? (
          <Loading />
        ) : history?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  {TABLE_METRICS.map((key) => (
                    <th key={key} className="py-2 pr-3 font-medium">
                      {metricMeta(key).label}
                    </th>
                  ))}
                  <th className="py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(row.date)}</td>
                    {TABLE_METRICS.map((key) => (
                      <td key={key} className="py-2 pr-3">
                        {row[key] ?? '—'}
                      </td>
                    ))}
                    <td className="py-2">
                      <Badge tone={row.source === 'OCR' ? 'blue' : 'neutral'}>{row.source === 'OCR' ? 'Scanned' : 'Manual'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No measurements yet. Add one manually or scan a report.</EmptyState>
        )}
      </Card>
    </div>
  )
}
