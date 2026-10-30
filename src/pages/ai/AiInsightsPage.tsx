import { useState } from 'react'
import toast from 'react-hot-toast'
import { Hourglass, Pin, Sparkles, Wand2 } from 'lucide-react'
import { useBiologicalAge, useGenerateInsights, useInsights, usePinInsight, useWhatIf } from '../../hooks/useAi'
import { getErrorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/date'
import AiContent from '../../components/AiContent'
import { Badge, Button, Card, EmptyState, Loading, MedicalDisclaimer, Textarea } from '../../components/ui'
import AiTabs from './AiTabs'

const WHAT_IF_EXAMPLES = [
  'What if I walk 10,000 steps every day for 3 months?',
  'What if I cut out added sugar completely?',
  'What if I sleep 8 hours a night instead of 6?',
]

function priorityTone(priority: number) {
  if (priority >= 3) return 'red' as const
  if (priority === 2) return 'yellow' as const
  return 'neutral' as const
}

export default function AiInsightsPage() {
  const { data: insights, isLoading } = useInsights()
  const generate = useGenerateInsights()
  const pin = usePinInsight()
  const bioAge = useBiologicalAge()
  const whatIf = useWhatIf()
  const [scenario, setScenario] = useState('')

  const onGenerate = async () => {
    try {
      await generate.mutateAsync()
      toast.success('New insights generated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not generate insights'))
    }
  }

  const onWhatIf = async (text: string) => {
    if (!text.trim()) return
    setScenario(text)
    try {
      await whatIf.mutateAsync(text.trim())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not analyse that scenario'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AiTabs />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Biological age estimate"
          actions={
            <Button size="sm" onClick={() => bioAge.mutate(undefined, { onError: (err) => toast.error(getErrorMessage(err, 'Could not estimate biological age')) })} loading={bioAge.isPending}>
              <Hourglass size={12} /> {bioAge.data ? 'Re-estimate' : 'Estimate'}
            </Button>
          }
        >
          {bioAge.isPending ? (
            <p className="text-sm text-muted-foreground">Analysing your measurements and lab results…</p>
          ) : bioAge.data ? (
            <div className="max-h-96 overflow-y-auto">
              <AiContent content={bioAge.data.analysis} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Estimates how old your body behaves based on body composition, labs and lifestyle.</p>
          )}
        </Card>

        <Card title="What if…?">
          <div className="flex flex-col gap-3">
            <Textarea rows={2} value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="Describe a lifestyle change to model" />
            <div className="flex flex-wrap gap-2">
              {WHAT_IF_EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => onWhatIf(ex)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent">
                  {ex}
                </button>
              ))}
            </div>
            <Button onClick={() => onWhatIf(scenario)} loading={whatIf.isPending} disabled={!scenario.trim()} className="w-fit">
              <Wand2 size={14} /> Predict impact
            </Button>
            {whatIf.data && (
              <div className="max-h-96 overflow-y-auto rounded-md border border-border p-3">
                <AiContent content={whatIf.data.analysis} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card
        title="Longevity insights"
        actions={
          <Button size="sm" onClick={onGenerate} loading={generate.isPending}>
            <Sparkles size={12} /> Generate new insights
          </Button>
        }
      >
        {isLoading ? (
          <Loading />
        ) : insights?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.id} className={`flex flex-col gap-2 rounded-lg border p-4 ${insight.isPinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={priorityTone(insight.priority)}>{insight.type}</Badge>
                    {insight.isPinned && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                  </div>
                  {!insight.isPinned && (
                    <Button size="sm" variant="ghost" onClick={() => pin.mutate(insight.id)} aria-label="Pin insight">
                      <Pin size={12} />
                    </Button>
                  )}
                </div>
                <AiContent content={insight.content} />
                <span className="text-xs text-muted-foreground">{formatDateTime(insight.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No insights yet. Generate some from your health data.</EmptyState>
        )}
      </Card>

      <MedicalDisclaimer />
    </div>
  )
}
