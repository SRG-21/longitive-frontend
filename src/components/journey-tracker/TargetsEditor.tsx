import toast from 'react-hot-toast'
import { useBodyCompositionHistory } from '../../hooks/useHealthData'
import { useGoals } from '../../hooks/useProfile'
import { Button, EmptyState, Input } from '../ui'

export interface TargetField {
  key: string
  label: string
  unit?: string | null
  /** A target already stored on the field itself (older trackers), shown as the placeholder. */
  goal?: number
}

type Numbers = Record<string, number>

interface Props {
  fields: TargetField[]
  baseline: Numbers
  targets: Numbers
  onChange: (next: { baseline: Numbers; targets: Numbers }) => void
  /** Called when an edit is finished (an input loses focus, or a fill button is used). */
  onCommit?: (next: { baseline: Numbers; targets: Numbers }) => void
}

// Profile goals and body measurements use their own names; these map them onto tracker field keys.
const GOAL_FOR_KEY: Record<string, string> = {
  weight: 'targetWeightKg',
  waist: 'targetWaistCm',
  bodyFatPct: 'targetBodyFatPercent',
}
const MEASUREMENT_FOR_KEY: Record<string, 'weight' | 'waist' | 'bodyFat'> = {
  weight: 'weight',
  waist: 'waist',
  bodyFatPct: 'bodyFat',
}

function withValue(record: Numbers, key: string, raw: string): Numbers {
  const next = { ...record }
  if (raw === '' || Number.isNaN(Number(raw))) delete next[key]
  else next[key] = Number(raw)
  return next
}

export default function TargetsEditor({ fields, baseline, targets, onChange, onCommit }: Props) {
  const { data: goals } = useGoals()
  const { data: measurements } = useBodyCompositionHistory()
  const latest = measurements?.[0]

  const fillTargets = () => {
    const next = { ...targets }
    let filled = 0
    for (const f of fields) {
      const value = (goals as Record<string, unknown> | undefined)?.[GOAL_FOR_KEY[f.key]]
      if (typeof value === 'number') {
        next[f.key] = value
        filled++
      }
    }
    if (!filled) toast.error('None of these fields match a goal in your profile. Add goals under Profile → Goals.')
    else {
      onChange({ baseline, targets: next })
      onCommit?.({ baseline, targets: next })
      toast.success(`Filled ${filled} target${filled === 1 ? '' : 's'} from your profile goals`)
    }
  }

  const fillBaseline = () => {
    const next = { ...baseline }
    let filled = 0
    for (const f of fields) {
      const source = MEASUREMENT_FOR_KEY[f.key]
      const value = source ? latest?.[source] : undefined
      if (typeof value === 'number') {
        next[f.key] = value
        filled++
      }
    }
    if (!filled) toast.error('No matching measurements found. Add one under Body composition.')
    else {
      onChange({ baseline: next, targets })
      onCommit?.({ baseline: next, targets })
      toast.success(`Filled ${filled} starting value${filled === 1 ? '' : 's'} from your latest measurements`)
    }
  }

  if (!fields.length) {
    return (
      <EmptyState>
        Targets are for body measurements. Add a Weight or Waist field, or tick <strong>Weekly entry</strong> on a number field you
        measure, to set a starting value and target for it.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Field</th>
              <th className="py-2 pr-3 font-medium">Starting value</th>
              <th className="py-2 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 font-medium text-foreground">
                  {f.label}
                  {f.unit && <span className="font-normal text-muted-foreground"> ({f.unit})</span>}
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    step="any"
                    aria-label={`${f.label} starting value`}
                    value={baseline[f.key] ?? ''}
                    onChange={(e) => onChange({ baseline: withValue(baseline, f.key, e.target.value), targets })}
                    onBlur={() => onCommit?.({ baseline, targets })}
                    className="w-32"
                  />
                </td>
                <td className="py-2">
                  <Input
                    type="number"
                    step="any"
                    aria-label={`${f.label} target`}
                    value={targets[f.key] ?? ''}
                    placeholder={f.goal != null ? String(f.goal) : undefined}
                    onChange={(e) => onChange({ baseline, targets: withValue(targets, f.key, e.target.value) })}
                    onBlur={() => onCommit?.({ baseline, targets })}
                    className="w-32"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Weight, waist, body fat and any number field you log weekly.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={fillTargets}>
          Fill targets from my profile goals
        </Button>
        <Button size="sm" variant="outline" onClick={fillBaseline}>
          Use my latest measurements as the starting point
        </Button>
      </div>
    </div>
  )
}
