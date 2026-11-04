import { Badge, Card } from '../../components/ui'
import { formatDate } from '../../lib/date'
import type { BodyComposition, BodySegmentKey, BodySegments } from '../../types/health'
import { METRIC_GROUPS, METRICS, formatMetric } from './metrics'

const SEGMENTS: { key: BodySegmentKey; label: string }[] = [
  { key: 'leftArm', label: 'Left arm' },
  { key: 'rightArm', label: 'Right arm' },
  { key: 'trunk', label: 'Trunk' },
  { key: 'leftLeg', label: 'Left leg' },
  { key: 'rightLeg', label: 'Right leg' },
]

// Weight = water + protein + minerals + fat, the breakdown smart scales print.
const BREAKDOWN = [
  { key: 'bodyWaterMass', label: 'Body water', color: 'bg-blue-500' },
  { key: 'proteinMass', label: 'Protein', color: 'bg-red-500' },
  { key: 'mineralMass', label: 'Minerals', color: 'bg-emerald-400' },
  { key: 'fatMass', label: 'Fat', color: 'bg-amber-400' },
] as const

const hasSegments = (s?: BodySegments | null) => !!s && SEGMENTS.some(({ key }) => s[key]?.mass != null || s[key]?.percent != null)

function cell(v?: number | null, unit = '') {
  return v == null ? '—' : `${v}${unit}`
}

export default function MeasurementDetail({ m }: { m: BodyComposition }) {
  const parts = BREAKDOWN.filter((p) => m[p.key] != null)
  const total = parts.reduce((sum, p) => sum + (m[p.key] as number), 0)
  const segments = hasSegments(m.segmentalFat) || hasSegments(m.segmentalMuscle)
  const meta = [m.measuredTime && m.measuredTime.slice(0, 5), m.reportName, m.deviceName, m.deviceId].filter(Boolean)

  return (
    <Card
      title={`Measurement · ${formatDate(m.date, { dateStyle: 'long' })}`}
      actions={<Badge tone={m.source === 'OCR' ? 'blue' : 'neutral'}>{m.source === 'OCR' ? 'Scanned' : 'Manual'}</Badge>}
    >
      <div className="flex flex-col gap-5">
        {(meta.length > 0 || m.bodyType) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {meta.join(' · ')}
            {m.bodyType && <Badge tone="yellow">Body type: {m.bodyType}</Badge>}
          </div>
        )}

        {parts.length >= 2 && m.weight != null && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weight breakdown</h3>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Weight breakdown">
              {parts.map((p) => (
                <div key={p.key} className={p.color} style={{ width: `${((m[p.key] as number) / total) * 100}%` }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {parts.map((p) => (
                <span key={p.key} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${p.color}`} />
                  {p.label} <strong className="font-medium">{m[p.key]} kg</strong>
                  <span className="text-muted-foreground">({Math.round(((m[p.key] as number) / m.weight!) * 1000) / 10}%)</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {METRIC_GROUPS.map((group) => {
          const rows = METRICS.filter((x) => x.group === group && m[x.key] != null)
          if (!rows.length) return null
          return (
            <section key={group} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {rows.map((x) => (
                  <div key={x.key} className="flex flex-col">
                    <dt className="text-xs text-muted-foreground">{x.label}</dt>
                    <dd className="text-sm font-medium text-foreground">{formatMetric(x.key, m[x.key] as number)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )
        })}

        {segments && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segmental analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Segment</th>
                    <th className="py-2 pr-3 font-medium">Fat</th>
                    <th className="py-2 pr-3 font-medium">Fat vs standard</th>
                    <th className="py-2 pr-3 font-medium">Muscle</th>
                    <th className="py-2 font-medium">Muscle vs standard</th>
                  </tr>
                </thead>
                <tbody>
                  {SEGMENTS.map(({ key, label }) => {
                    const fat = m.segmentalFat?.[key]
                    const muscle = m.segmentalMuscle?.[key]
                    return (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 font-medium text-foreground">{label}</td>
                        <td className="py-2 pr-3">{cell(fat?.mass, ' kg')}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{cell(fat?.percent, '%')}</td>
                        <td className="py-2 pr-3">{cell(muscle?.mass, ' kg')}</td>
                        <td className="py-2 text-muted-foreground">{cell(muscle?.percent, '%')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Card>
  )
}
