import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Phone } from 'lucide-react'
import {
  useGoals,
  useLifestyle,
  useProfile,
  useUpdateGoals,
  useUpdateLifestyle,
  useUpdateProfile,
  type ProfileInput,
} from '../../hooks/useProfile'
import { getErrorMessage } from '../../lib/api'
import { todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import { useAuthStore } from '../../stores/authStore'
import { Button, Card, Field, Input, Loading, PageHeader, Select, Tabs } from '../../components/ui'
import type { Goals, LifestyleProfile } from '../../types/profile'
import MedicalHistory from './MedicalHistory'

type Section = 'personal' | 'medical' | 'lifestyle' | 'goals'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function PersonalInfo() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const session = useAuthStore()
  const { register, handleSubmit, reset } = useForm<ProfileInput>()

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        phone: profile.phone ?? '',
        dob: profile.dob ? profile.dob.slice(0, 10) : '',
        gender: profile.gender ?? '',
        bloodGroup: profile.bloodGroup ?? '',
      })
    }
  }, [profile, reset])

  const onSubmit = async (values: ProfileInput) => {
    try {
      const updated = await update.mutateAsync(compact(values))
      if (session.user && updated?.name) session.setSession({ user: { ...session.user, name: updated.name }, accessToken: session.accessToken!, refreshToken: session.refreshToken! })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update profile'))
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Personal information" className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input {...register('name', { required: true })} />
          </Field>
          <Field label="Email" hint="Email can't be changed here">
            <Input value={profile?.email ?? ''} disabled />
          </Field>
          <Field label="Phone">
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label="Date of birth">
            <Input type="date" max={todayIso()} {...register('dob')} />
          </Field>
          <Field label="Gender">
            <Select {...register('gender')}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Blood group">
            <Select {...register('bloodGroup')}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={update.isPending} className="w-fit">
            Save changes
          </Button>
        </form>
      </Card>
      <Card title="Emergency contacts">
        {profile?.emergencyContacts.length ? (
          <ul className="flex flex-col gap-2 text-sm">
            {profile.emergencyContacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>
                  <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.relationship}</span>
                </span>
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-primary">
                  <Phone size={12} /> {c.phone}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No emergency contacts on file. Ask your practitioner to add them.</p>
        )}
      </Card>
    </div>
  )
}

function LifestyleForm() {
  const { data: lifestyle, isLoading } = useLifestyle()
  const update = useUpdateLifestyle()
  const { register, handleSubmit, reset } = useForm<LifestyleProfile>()

  useEffect(() => {
    if (lifestyle) reset({ ...lifestyle })
  }, [lifestyle, reset])

  const onSubmit = async (values: LifestyleProfile) => {
    const { smoking, alcohol, sleepHours, stressLevel, occupation, activityLevel } = values
    try {
      await update.mutateAsync(compact({ smoking, alcohol, sleepHours, stressLevel, occupation, activityLevel }))
      toast.success('Lifestyle saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save lifestyle'))
    }
  }

  if (isLoading) return <Loading />

  return (
    <Card title="Lifestyle">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-3">
        <Field label="Smoking">
          <Select {...register('smoking')}>
            <option value="">—</option>
            <option value="never">Never</option>
            <option value="former">Former</option>
            <option value="occasional">Occasional</option>
            <option value="daily">Daily</option>
          </Select>
        </Field>
        <Field label="Alcohol">
          <Select {...register('alcohol')}>
            <option value="">—</option>
            <option value="none">None</option>
            <option value="occasional">Occasional</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </Select>
        </Field>
        <Field label="Activity level">
          <Select {...register('activityLevel')}>
            <option value="">—</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Very active</option>
          </Select>
        </Field>
        <Field label="Typical sleep (hours)">
          <Input type="number" step="0.5" min={0} max={24} {...register('sleepHours', optionalNumber)} />
        </Field>
        <Field label="Stress level (1–10)">
          <Input type="number" step={1} min={1} max={10} {...register('stressLevel', optionalNumber)} />
        </Field>
        <Field label="Occupation">
          <Input {...register('occupation')} />
        </Field>
        <Button type="submit" loading={update.isPending} className="w-fit">
          Save lifestyle
        </Button>
      </form>
    </Card>
  )
}

function GoalsForm() {
  const { data: goals, isLoading } = useGoals()
  const update = useUpdateGoals()
  const { register, handleSubmit, reset } = useForm<Goals>()

  useEffect(() => {
    if (goals) reset(goals)
  }, [goals, reset])

  const onSubmit = async (values: Goals) => {
    try {
      await update.mutateAsync(compact(values))
      toast.success('Goals saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save goals'))
    }
  }

  if (isLoading) return <Loading />

  return (
    <Card title="Health goals">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-3">
        <Field label="Target weight (kg)">
          <Input type="number" step="0.1" {...register('targetWeightKg', optionalNumber)} />
        </Field>
        <Field label="Target body fat (%)">
          <Input type="number" step="0.1" {...register('targetBodyFatPercent', optionalNumber)} />
        </Field>
        <Field label="Target sleep (hours)">
          <Input type="number" step="0.5" {...register('targetSleepHours', optionalNumber)} />
        </Field>
        <Field label="Daily steps">
          <Input type="number" step={500} {...register('targetDailySteps', optionalNumber)} />
        </Field>
        <Field label="Daily water (ml)">
          <Input type="number" step={250} {...register('targetWaterIntakeMl', optionalNumber)} />
        </Field>
        <Field label="Notes" className="sm:col-span-3">
          <Input {...register('notes')} placeholder="Why these goals matter to you" />
        </Field>
        <Button type="submit" loading={update.isPending} className="w-fit">
          Save goals
        </Button>
      </form>
    </Card>
  )
}

export default function ProfilePage() {
  const [section, setSection] = useState<Section>('personal')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile & health history" description="This context personalises every AI plan and answer." />
      <Tabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'personal', label: 'Personal' },
          { value: 'medical', label: 'Medical history' },
          { value: 'lifestyle', label: 'Lifestyle' },
          { value: 'goals', label: 'Goals' },
        ]}
      />
      {section === 'personal' && <PersonalInfo />}
      {section === 'medical' && <MedicalHistory />}
      {section === 'lifestyle' && <LifestyleForm />}
      {section === 'goals' && <GoalsForm />}
    </div>
  )
}
