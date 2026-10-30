import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import {
  useCreateFamilyHistory,
  useCreateMedicalCondition,
  useCreateTreatment,
  useFamilyHistory,
  useMedicalConditions,
  useTreatments,
} from '../../hooks/useProfile'
import { getErrorMessage } from '../../lib/api'
import { formatDate, todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, Select } from '../../components/ui'

async function submitWith(action: () => Promise<unknown>, success: string, failure: string, done: () => void) {
  try {
    await action()
    toast.success(success)
    done()
  } catch (err) {
    toast.error(getErrorMessage(err, failure))
  }
}

function Conditions() {
  const { data, isLoading } = useMedicalConditions()
  const create = useCreateMedicalCondition()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ condition: string; type: string; severity: string; diagnosedDate: string; notes: string }>({
    defaultValues: { type: 'CHRONIC' },
  })

  const onSubmit = handleSubmit((values) =>
    submitWith(() => create.mutateAsync(compact(values)), 'Condition added', 'Could not add condition', () => {
      reset({ type: 'CHRONIC' })
      setOpen(false)
    }),
  )

  return (
    <Card title="Conditions & allergies" actions={<Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}><Plus size={12} /> Add</Button>}>
      {open && (
        <form onSubmit={onSubmit} className="mb-4 grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
          <Field label="Condition">
            <Input {...register('condition', { required: true })} placeholder="Type 2 diabetes" />
          </Field>
          <Field label="Type">
            <Select {...register('type')}>
              <option value="CHRONIC">Chronic</option>
              <option value="ACUTE">Acute</option>
              <option value="ALLERGY">Allergy</option>
            </Select>
          </Field>
          <Field label="Severity">
            <Select {...register('severity')}>
              <option value="">—</option>
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
            </Select>
          </Field>
          <Field label="Diagnosed on">
            <Input type="date" max={todayIso()} {...register('diagnosedDate')} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Input {...register('notes')} />
          </Field>
          <Button type="submit" loading={create.isPending} className="w-fit">
            Save
          </Button>
        </form>
      )}
      {isLoading ? (
        <Loading />
      ) : data?.length ? (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium text-foreground">{c.condition}</span>
              <span className="flex items-center gap-1">
                <Badge tone={c.type === 'ALLERGY' ? 'red' : c.type === 'CHRONIC' ? 'yellow' : 'blue'}>{c.type.toLowerCase()}</Badge>
                {c.severity && <Badge>{c.severity.toLowerCase()}</Badge>}
                {c.diagnosedDate && <span className="text-xs text-muted-foreground">since {formatDate(c.diagnosedDate)}</span>}
              </span>
              {c.notes && <span className="w-full text-xs text-muted-foreground">{c.notes}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No conditions recorded.</EmptyState>
      )}
    </Card>
  )
}

function Treatments() {
  const { data, isLoading } = useTreatments()
  const create = useCreateTreatment()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ name: string; type: string; startDate: string; endDate: string; prescribedBy: string; notes: string }>({
    defaultValues: { type: 'MEDICATION' },
  })

  const onSubmit = handleSubmit((values) =>
    submitWith(() => create.mutateAsync(compact(values)), 'Treatment added', 'Could not add treatment', () => {
      reset({ type: 'MEDICATION' })
      setOpen(false)
    }),
  )

  return (
    <Card title="Treatments & medications" actions={<Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}><Plus size={12} /> Add</Button>}>
      {open && (
        <form onSubmit={onSubmit} className="mb-4 grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
          <Field label="Name">
            <Input {...register('name', { required: true })} placeholder="Metformin 500mg" />
          </Field>
          <Field label="Type">
            <Select {...register('type')}>
              <option value="MEDICATION">Medication</option>
              <option value="THERAPY">Therapy</option>
              <option value="SURGERY">Surgery</option>
            </Select>
          </Field>
          <Field label="Start date">
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field label="End date">
            <Input type="date" {...register('endDate')} />
          </Field>
          <Field label="Prescribed by">
            <Input {...register('prescribedBy')} />
          </Field>
          <Field label="Notes">
            <Input {...register('notes')} />
          </Field>
          <Button type="submit" loading={create.isPending} className="w-fit">
            Save
          </Button>
        </form>
      )}
      {isLoading ? (
        <Loading />
      ) : data?.length ? (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {data.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium text-foreground">{t.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Badge>{t.type.toLowerCase()}</Badge>
                {t.startDate && formatDate(t.startDate)}
                {t.endDate && ` – ${formatDate(t.endDate)}`}
                {t.prescribedBy && ` · ${t.prescribedBy}`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No treatments recorded.</EmptyState>
      )}
    </Card>
  )
}

function FamilyHistoryCard() {
  const { data, isLoading } = useFamilyHistory()
  const create = useCreateFamilyHistory()
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ relation: string; condition: string; ageOfOnset?: number; notes: string }>()

  const onSubmit = handleSubmit((values) =>
    submitWith(() => create.mutateAsync(compact(values)), 'Family history added', 'Could not add family history', () => {
      reset()
      setOpen(false)
    }),
  )

  return (
    <Card title="Family history" actions={<Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}><Plus size={12} /> Add</Button>}>
      {open && (
        <form onSubmit={onSubmit} className="mb-4 grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
          <Field label="Relation">
            <Select {...register('relation', { required: true })}>
              {['Mother', 'Father', 'Sibling', 'Grandparent', 'Child', 'Aunt/Uncle', 'Other'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Condition">
            <Input {...register('condition', { required: true })} placeholder="Heart disease" />
          </Field>
          <Field label="Age of onset">
            <Input type="number" step={1} min={0} {...register('ageOfOnset', optionalNumber)} />
          </Field>
          <Field label="Notes">
            <Input {...register('notes')} />
          </Field>
          <Button type="submit" loading={create.isPending} className="w-fit">
            Save
          </Button>
        </form>
      )}
      {isLoading ? (
        <Loading />
      ) : data?.length ? (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {data.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium text-foreground">{f.relation}</span>: {f.condition}
              </span>
              {f.ageOfOnset != null && <span className="text-xs text-muted-foreground">onset at {f.ageOfOnset}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No family history recorded.</EmptyState>
      )}
    </Card>
  )
}

export default function MedicalHistory() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Conditions />
      <Treatments />
      <FamilyHistoryCard />
    </div>
  )
}
