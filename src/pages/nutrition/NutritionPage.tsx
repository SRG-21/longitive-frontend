import { useState } from 'react'
import toast from 'react-hot-toast'
import { Apple, Droplets, Dumbbell, Pill, Sparkles, Utensils } from 'lucide-react'
import {
  useDailyChart,
  useDietPlan,
  useGenerateDailyChart,
  useGenerateDietPlan,
  useGenerateHydrationPlan,
  useGenerateSupplementPlan,
  useHydrationPlan,
  useSupplementPlan,
} from '../../hooks/usePlans'
import { getErrorMessage } from '../../lib/api'
import { addDays, formatDate, formatDateTime, todayIso } from '../../lib/date'
import AiContent from '../../components/AiContent'
import { Button, Card, EmptyState, Field, Input, Loading, MedicalDisclaimer, PageHeader, Tabs } from '../../components/ui'

type Section = 'daily' | 'diet' | 'supplements' | 'hydration'

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian', 'gluten-free', 'dairy-free', 'low-carb', 'diabetic-friendly']

const activityIcons: Record<string, typeof Apple> = {
  meal: Utensils,
  snack: Apple,
  hydration: Droplets,
  supplement: Pill,
  exercise: Dumbbell,
}

function DailySchedule() {
  const [date, setDate] = useState(todayIso())
  const { data: chart, isLoading } = useDailyChart(date)
  const generate = useGenerateDailyChart()

  const onGenerate = async () => {
    try {
      await generate.mutateAsync(date)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not build the daily schedule'))
    }
  }

  return (
    <Card
      title={`Schedule for ${formatDate(date, { dateStyle: 'full' })}`}
      actions={
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setDate((d) => addDays(d, -1))}>
            ←
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDate(todayIso())}>
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDate((d) => addDays(d, 1))}>
            →
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Loading />
      ) : chart?.schedule?.length ? (
        <div className="flex flex-col gap-3">
          <ol className="relative flex flex-col gap-2 border-l border-border pl-4">
            {chart.schedule.map((item, idx) => {
              const Icon = activityIcons[item.activity] ?? Sparkles
              return (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span className="w-12 font-mono text-xs text-muted-foreground">{item.time}</span>
                  <Icon size={14} className="text-primary" />
                  <span className="text-foreground">{item.detail}</span>
                </li>
              )
            })}
          </ol>
          <Button variant="outline" size="sm" onClick={onGenerate} loading={generate.isPending} className="w-fit">
            Rebuild from current plans
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <EmptyState>No schedule for this day yet. It's built from your active diet, supplement, hydration and exercise plans.</EmptyState>
          <Button onClick={onGenerate} loading={generate.isPending}>
            Build schedule
          </Button>
        </div>
      )}
    </Card>
  )
}

function DietSection() {
  const { data: plan, isLoading } = useDietPlan()
  const generate = useGenerateDietPlan()
  const [targetCalories, setTargetCalories] = useState('2000')
  const [diet, setDiet] = useState<string[]>([])
  const [avoid, setAvoid] = useState('')
  const [cuisine, setCuisine] = useState('')

  const onGenerate = async () => {
    const preferences: Record<string, unknown> = {}
    if (diet.length) preferences.diet = diet
    if (avoid.trim()) preferences.avoid = avoid.split(',').map((s) => s.trim()).filter(Boolean)
    if (cuisine.trim()) preferences.cuisine = cuisine.trim()
    try {
      await generate.mutateAsync({ targetCalories: targetCalories ? Number(targetCalories) : undefined, preferences })
      toast.success('New diet plan ready')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not generate a diet plan'))
    }
  }

  return (
    <Card title="Diet plan">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Target calories / day">
            <Input type="number" min={1000} step={50} value={targetCalories} onChange={(e) => setTargetCalories(e.target.value)} />
          </Field>
          <Field label="Foods to avoid" hint="Comma-separated">
            <Input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="peanuts, shellfish" />
          </Field>
          <Field label="Preferred cuisine">
            <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Indian, Mediterranean…" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDiet((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]))}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                diet.includes(option) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <Button onClick={onGenerate} loading={generate.isPending} className="w-fit">
          <Sparkles size={14} /> {plan ? 'Regenerate diet plan' : 'Generate diet plan'}
        </Button>
        {generate.isPending && <p className="text-sm text-muted-foreground">Generating… this can take up to a minute.</p>}
        {isLoading ? (
          <Loading />
        ) : plan ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {plan.targetCalories ? `${plan.targetCalories} kcal/day · ` : ''}Created {formatDateTime(plan.createdAt)}
            </p>
            <div className="max-h-[32rem] overflow-y-auto rounded-md border border-border p-3">
              <AiContent content={plan.meals} />
            </div>
          </div>
        ) : (
          <EmptyState>No active diet plan.</EmptyState>
        )}
      </div>
    </Card>
  )
}

function SupplementSection() {
  const { data: plan, isLoading } = useSupplementPlan()
  const generate = useGenerateSupplementPlan()

  const onGenerate = async () => {
    try {
      await generate.mutateAsync()
      toast.success('New supplement plan ready')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not generate a supplement plan'))
    }
  }

  return (
    <Card title="Supplement plan">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Recommendations are based on your conditions and your most recent lab results.</p>
        <Button onClick={onGenerate} loading={generate.isPending} className="w-fit">
          <Sparkles size={14} /> {plan ? 'Regenerate' : 'Generate supplement plan'}
        </Button>
        {isLoading ? (
          <Loading />
        ) : plan ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Created {formatDateTime(plan.createdAt)}</p>
            <div className="max-h-[32rem] overflow-y-auto rounded-md border border-border p-3">
              <AiContent content={plan.supplements} />
            </div>
            {plan.ayurvedicRemedies != null && (
              <div className="rounded-md border border-border p-3">
                <h3 className="mb-2 text-sm font-semibold">Ayurvedic remedies</h3>
                <AiContent content={plan.ayurvedicRemedies} />
              </div>
            )}
          </div>
        ) : (
          <EmptyState>No active supplement plan.</EmptyState>
        )}
        <MedicalDisclaimer />
      </div>
    </Card>
  )
}

function HydrationSection() {
  const { data: plan, isLoading } = useHydrationPlan()
  const generate = useGenerateHydrationPlan()
  const [target, setTarget] = useState('3000')

  const onGenerate = async () => {
    try {
      await generate.mutateAsync(target ? Number(target) : undefined)
      toast.success('Hydration plan updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create a hydration plan'))
    }
  }

  return (
    <Card title="Hydration plan">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Daily target (ml)">
            <Input type="number" min={500} step={250} value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Button onClick={onGenerate} loading={generate.isPending}>
            {plan ? 'Update plan' : 'Create plan'}
          </Button>
        </div>
        {isLoading ? (
          <Loading />
        ) : plan?.schedule?.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground">
              {plan.dailyTarget} ml across {plan.schedule.length} glasses
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {plan.schedule.map((slot, idx) => (
                <div key={idx} className="flex flex-col items-center rounded-md border border-border p-2 text-xs">
                  <Droplets size={14} className="text-sky-500" />
                  <span className="font-medium">{slot.time}</span>
                  <span className="text-muted-foreground">
                    {slot.amount} {slot.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState>No hydration plan yet.</EmptyState>
        )}
      </div>
    </Card>
  )
}

export default function NutritionPage() {
  const [section, setSection] = useState<Section>('daily')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nutrition & daily plan" description="Diet, supplements and hydration combine into a timed daily schedule." />
      <Tabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'daily', label: 'Daily schedule' },
          { value: 'diet', label: 'Diet' },
          { value: 'supplements', label: 'Supplements' },
          { value: 'hydration', label: 'Hydration' },
        ]}
      />
      {section === 'daily' && <DailySchedule />}
      {section === 'diet' && <DietSection />}
      {section === 'supplements' && <SupplementSection />}
      {section === 'hydration' && <HydrationSection />}
    </div>
  )
}
