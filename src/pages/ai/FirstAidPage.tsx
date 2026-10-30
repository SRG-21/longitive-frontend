import { useState } from 'react'
import toast from 'react-hot-toast'
import { AlertOctagon, PhoneCall, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useFirstAid, useFirstAidHistory } from '../../hooks/useAi'
import { getErrorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/date'
import AiContent from '../../components/AiContent'
import { Button, Card, EmptyState, Field, Loading, Select, Textarea } from '../../components/ui'
import type { HealthIncident, IncidentSeverity } from '../../types/ai'
import AiTabs from './AiTabs'

const severityStyles: Record<IncidentSeverity, { label: string; className: string; icon: typeof ShieldCheck }> = {
  GREEN: { label: 'Manage at home', className: 'border-green-200 bg-green-50 text-green-900', icon: ShieldCheck },
  YELLOW: { label: 'See a doctor soon', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert },
  RED: { label: 'Seek emergency care now', className: 'border-red-200 bg-red-50 text-red-900', icon: AlertOctagon },
}

function IncidentResult({ incident }: { incident: HealthIncident }) {
  const style = severityStyles[incident.severity]
  const Icon = style.icon
  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${style.className}`}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon size={18} /> {style.label}
      </div>
      <div className="rounded-md bg-white/70 p-3">
        <AiContent content={incident.aiResponse} />
      </div>
    </div>
  )
}

export default function FirstAidPage() {
  const { data: history, isLoading } = useFirstAidHistory()
  const firstAid = useFirstAid()
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const submit = async () => {
    if (!description.trim()) return
    try {
      await firstAid.mutateAsync({ description: description.trim(), severity: severity || undefined })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not get guidance — if this is an emergency, call emergency services now'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AiTabs />

      <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        <PhoneCall size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>If someone is unconscious, struggling to breathe, has chest pain, severe bleeding or signs of a stroke, call your local emergency number
          immediately</strong> (112 / 911 / 108). This tool gives general guidance only.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Describe what's happening">
          <div className="flex flex-col gap-3">
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Twisted ankle while running 20 minutes ago, swelling, can put some weight on it" />
            <Field label="How bad does it feel?">
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">Not sure</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </Select>
            </Field>
            <Button onClick={submit} loading={firstAid.isPending} disabled={!description.trim()} className="w-fit">
              Get guidance
            </Button>
          </div>
        </Card>
        <div>{firstAid.data ? <IncidentResult incident={firstAid.data} /> : firstAid.isPending ? <Loading /> : null}</div>
      </div>

      <Card title="Past incidents">
        {isLoading ? (
          <Loading />
        ) : history?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {history.map((incident) => {
              const style = severityStyles[incident.severity]
              return (
                <li key={incident.id} className="py-2">
                  <button type="button" onClick={() => setExpanded(expanded === incident.id ? null : incident.id)} className="flex w-full items-center justify-between gap-2 text-left text-sm">
                    <span className="truncate text-foreground">{incident.description}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}>{style.label}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(incident.createdAt)}</span>
                    </span>
                  </button>
                  {expanded === incident.id && (
                    <div className="mt-2">
                      <IncidentResult incident={incident} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState>No incidents recorded.</EmptyState>
        )}
      </Card>
    </div>
  )
}
