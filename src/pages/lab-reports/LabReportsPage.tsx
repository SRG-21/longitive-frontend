import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import {
  useCreateLabReport,
  useLabReports,
  useLabSpreadsheet,
  useUploadLabReport,
  type LabReportInput,
  type LabResultInput,
} from '../../hooks/useHealthData'
import { getErrorMessage } from '../../lib/api'
import { formatDate, todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, PageHeader, Select, Tabs } from '../../components/ui'
import FileDropzone from '../../components/FileDropzone'
import type { LabSpreadsheetRow, TestStatus } from '../../types/health'
import { inferStatus, statusTone, TEST_STATUSES } from './labStatus'

type View = 'reports' | 'compare'

const emptyResult: LabResultInput = { testName: '', value: NaN }

export default function LabReportsPage() {
  const [view, setView] = useState<View>('reports')
  const [category, setCategory] = useState('')
  const { data: reports, isLoading } = useLabReports(category ? { category } : {})
  const { data: allReports } = useLabReports()
  const [showForm, setShowForm] = useState(false)
  const upload = useUploadLabReport()
  const navigate = useNavigate()

  const categories = useMemo(
    () => [...new Set((allReports ?? []).flatMap((r) => r.results.map((t) => t.category).filter(Boolean) as string[]))].sort(),
    [allReports],
  )
  const testNames = useMemo(() => [...new Set((allReports ?? []).flatMap((r) => r.results.map((t) => t.testName)))].sort(), [allReports])

  const onUpload = async (file: File) => {
    try {
      const report = await upload.mutateAsync(file)
      if (report.alreadyUploaded) toast('You already uploaded this file — opening that report', { icon: 'ℹ️' })
      else toast.success(`Extracted ${report.results.length} results — please review them`)
      navigate(`/lab-reports/${report.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not extract results from that file'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lab reports"
        description="Upload blood work and other lab results, then follow each marker over time."
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close form' : 'Add report manually'}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Scan a report" className={showForm ? '' : 'lg:col-span-3'}>
          <FileDropzone onFile={onUpload} busy={upload.isPending} label="Upload a lab report (photo or PDF)" />
          <p className="mt-2 text-xs text-muted-foreground">Scanned results are marked unverified until you review and confirm them.</p>
        </Card>
        {showForm && <ManualReportForm onDone={() => setShowForm(false)} className="lg:col-span-2" />}
      </div>

      <Tabs<View>
        value={view}
        onChange={setView}
        options={[
          { value: 'reports', label: 'Reports' },
          { value: 'compare', label: 'Compare markers' },
        ]}
      />

      {view === 'reports' ? (
        <div className="flex flex-col gap-3">
          {categories.length > 0 && (
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-xs">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
          {isLoading ? (
            <Loading />
          ) : reports?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {reports.map((report) => {
                const flagged = report.results.filter((r) => r.status !== 'NORMAL')
                return (
                  <Link key={report.id} to={`/lab-reports/${report.id}`} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground">{report.labName || report.reportType || 'Lab report'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(report.reportDate)} · {report.results.length} results
                        </div>
                      </div>
                      {report.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="yellow">Needs review</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {flagged.length === 0 && <span className="text-xs text-muted-foreground">All results within range</span>}
                      {flagged.slice(0, 5).map((r) => (
                        <Badge key={r.id} tone={statusTone(r.status)}>
                          {r.testName}: {r.status.toLowerCase()}
                        </Badge>
                      ))}
                      {flagged.length > 5 && <Badge>+{flagged.length - 5} more</Badge>}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState>No lab reports yet. Scan one or enter results manually.</EmptyState>
          )}
        </div>
      ) : (
        <CompareMarkers testNames={testNames} />
      )}
    </div>
  )
}

function ManualReportForm({ onDone, className }: { onDone: () => void; className?: string }) {
  const create = useCreateLabReport()
  const { register, control, handleSubmit } = useForm<LabReportInput>({
    defaultValues: { reportDate: todayIso(), results: [{ ...emptyResult }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'results' })

  const onSubmit = async (values: LabReportInput) => {
    const results = values.results
      .filter((r) => r.testName.trim() && !Number.isNaN(r.value))
      .map((r) => {
        const result = compact(r)
        return { ...result, status: result.status || inferStatus(result.value, result.referenceMin, result.referenceMax) }
      })
    if (!results.length) {
      toast.error('Add at least one result with a name and value')
      return
    }
    try {
      await create.mutateAsync({ ...compact({ reportDate: values.reportDate, labName: values.labName, reportType: values.reportType }), results })
      toast.success('Lab report saved')
      onDone()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save lab report'))
    }
  }

  return (
    <Card title="Enter results manually" className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Report date">
            <Input type="date" max={todayIso()} {...register('reportDate', { required: true })} />
          </Field>
          <Field label="Lab name">
            <Input {...register('labName')} />
          </Field>
          <Field label="Report type">
            <Input placeholder="e.g. Lipid panel" {...register('reportType')} />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-2 items-end gap-2 rounded-md border border-border p-2 sm:grid-cols-7">
              <Field label="Test" className="col-span-2">
                <Input placeholder="e.g. HbA1c" {...register(`results.${idx}.testName`)} />
              </Field>
              <Field label="Value">
                <Input type="number" step="any" {...register(`results.${idx}.value`, { valueAsNumber: true })} />
              </Field>
              <Field label="Unit">
                <Input {...register(`results.${idx}.unit`)} />
              </Field>
              <Field label="Ref min">
                <Input type="number" step="any" {...register(`results.${idx}.referenceMin`, optionalNumber)} />
              </Field>
              <Field label="Ref max">
                <Input type="number" step="any" {...register(`results.${idx}.referenceMax`, optionalNumber)} />
              </Field>
              <div className="flex items-end gap-1">
                <Field label="Status" className="flex-1">
                  <Select {...register(`results.${idx}.status`)}>
                    <option value="">Auto</option>
                    {TEST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button variant="ghost" aria-label="Remove result" onClick={() => remove(idx)} disabled={fields.length === 1}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <Field label="Category" className="col-span-2 sm:col-span-7">
                <Input placeholder="e.g. Diabetes, Lipids, Thyroid" {...register(`results.${idx}.category`)} />
              </Field>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => append({ ...emptyResult })}>
            <Plus size={14} /> Add result
          </Button>
          <Button type="submit" loading={create.isPending}>
            Save report
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CompareMarkers({ testNames }: { testNames: string[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const { data: rows, isFetching } = useLabSpreadsheet(selected)

  const toggle = (name: string) => setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  if (!testNames.length) return <EmptyState>Add a lab report to compare markers across dates.</EmptyState>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {testNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              selected.includes(name) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      {selected.length === 0 ? (
        <EmptyState>Pick one or more markers to see them side by side.</EmptyState>
      ) : isFetching && !rows ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                {selected.map((name) => (
                  <th key={name} className="px-3 py-2 font-medium">
                    <Link to={`/lab-reports/trends/${encodeURIComponent(name)}`} className="hover:text-primary">
                      {name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row: LabSpreadsheetRow) => (
                <tr key={row.date} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.date)}</td>
                  {selected.map((name) => {
                    const cell = row[name]
                    if (!cell || typeof cell === 'string') return <td key={name} className="px-3 py-2 text-muted-foreground">—</td>
                    return (
                      <td key={name} className="px-3 py-2">
                        <span className="mr-1">
                          {cell.value} {cell.unit}
                        </span>
                        {cell.status !== 'NORMAL' && <Badge tone={statusTone(cell.status as TestStatus)}>{cell.status.toLowerCase()}</Badge>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
