import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react'
import { useLabReport, useVerifyLabReport } from '../../hooks/useHealthData'
import { getErrorMessage } from '../../lib/api'
import { formatDate } from '../../lib/date'
import { Badge, Button, Card, EmptyState, Loading, PageHeader } from '../../components/ui'
import type { LabTestResult } from '../../types/health'
import { statusTone } from './labStatus'

function rangeLabel(r: LabTestResult) {
  if (r.referenceMin != null && r.referenceMax != null) return `${r.referenceMin} – ${r.referenceMax}`
  if (r.referenceMin != null) return `≥ ${r.referenceMin}`
  if (r.referenceMax != null) return `≤ ${r.referenceMax}`
  return '—'
}

export default function LabReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: report, isLoading } = useLabReport(id)
  const verify = useVerifyLabReport()

  if (isLoading) return <Loading />
  if (!report) return <EmptyState>Lab report not found.</EmptyState>

  const grouped = report.results.reduce<Record<string, LabTestResult[]>>((acc, r) => {
    const key = r.category || 'Other'
    ;(acc[key] ??= []).push(r)
    return acc
  }, {})

  const onVerify = async () => {
    try {
      await verify.mutateAsync(report.id)
      toast.success('Report marked as verified')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not verify report'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/lab-reports" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All lab reports
      </Link>
      <PageHeader
        title={report.labName || report.reportType || 'Lab report'}
        description={`${formatDate(report.reportDate, { dateStyle: 'long' })} · ${report.results.length} results · ${report.source === 'OCR' ? 'scanned' : 'entered manually'}`}
        actions={
          <>
            {report.fileUrl && (
              <a href={report.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                <ExternalLink size={14} /> Original file
              </a>
            )}
            {report.verified ? (
              <Badge tone="green">
                <CheckCircle2 size={12} className="mr-1" /> Verified
              </Badge>
            ) : (
              <Button onClick={onVerify} loading={verify.isPending}>
                Mark as verified
              </Button>
            )}
          </>
        }
      />

      {!report.verified && report.source === 'OCR' && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          These values were extracted automatically. Check them against the original report before relying on them.
        </p>
      )}

      {Object.entries(grouped).map(([category, results]) => (
        <Card key={category} title={category}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Test</th>
                  <th className="py-2 pr-3 font-medium">Result</th>
                  <th className="py-2 pr-3 font-medium">Reference</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {r.testName}
                      {r.notes && <div className="text-xs font-normal text-muted-foreground">{r.notes}</div>}
                    </td>
                    <td className="py-2 pr-3">
                      {r.value} {r.unit}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{rangeLabel(r)}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={statusTone(r.status)}>{r.status.toLowerCase()}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Link to={`/lab-reports/trends/${encodeURIComponent(r.testName)}`} className="text-xs font-medium text-primary">
                        Trend
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  )
}
