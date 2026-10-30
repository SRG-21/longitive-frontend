import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLabTrend } from '../../hooks/useHealthData'
import { chartDate, formatDate } from '../../lib/date'
import { Badge, Card, EmptyState, Loading, PageHeader } from '../../components/ui'
import { statusTone } from './labStatus'

export default function LabTrendPage() {
  const { testName } = useParams<{ testName: string }>()
  const { data: points, isLoading } = useLabTrend(testName)

  const rows = (points ?? []).map((p) => ({ date: chartDate(p.report.reportDate), value: p.value }))
  const latest = points?.[points.length - 1]
  const unit = latest?.unit ?? ''
  const refMin = latest?.referenceMin ?? undefined
  const refMax = latest?.referenceMax ?? undefined
  const values = rows.map((r) => r.value)
  // A one-sided range ("≤ 5.7") still needs both edges, or recharts shades the wrong side.
  // Lab values are non-negative, so 0 is a safe floor; the band is clipped to the visible axis.
  const bandLow = refMin ?? 0
  const bandHigh = refMax ?? Math.max(...values, refMin ?? 0) * 2

  return (
    <div className="flex flex-col gap-6">
      <Link to="/lab-reports" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All lab reports
      </Link>
      <PageHeader title={testName ?? ''} description={refMin != null || refMax != null ? `Reference range: ${refMin ?? '…'} – ${refMax ?? '…'} ${unit}` : undefined} />

      {isLoading ? (
        <Loading />
      ) : !points?.length ? (
        <EmptyState>No results recorded for this marker.</EmptyState>
      ) : (
        <>
          <Card title="Over time">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} domain={['auto', 'auto']} />
                  {(refMin != null || refMax != null) && <ReferenceArea y1={bandLow} y2={bandHigh} ifOverflow="hidden" fill="#16a34a" fillOpacity={0.08} />}
                  <Tooltip formatter={(v) => [`${v} ${unit}`, testName]} />
                  <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Shaded band shows the reference range from the most recent report.</p>
          </Card>
          <Card title="All results">
            <ul className="flex flex-col divide-y divide-border text-sm">
              {[...points].reverse().map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <Link to={`/lab-reports/${p.reportId}`} className="hover:text-primary">
                    {formatDate(p.report.reportDate)}
                  </Link>
                  <span className="flex items-center gap-2">
                    {p.value} {p.unit}
                    <Badge tone={statusTone(p.status)}>{p.status.toLowerCase()}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
