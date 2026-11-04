import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { safeNextPath } from '../../lib/redirect'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const next = safeNextPath(useSearchParams()[0].get('next'))
  const setSession = useAuthStore((s) => s.setSession)
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post('/auth/login', values)
      if (data.requiresTwoFactor) {
        setPreAuthToken(data.preAuthToken)
        return
      }
      setSession(data)
      navigate(next)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'))
    }
  }

  if (preAuthToken) {
    return <TwoFactorStep preAuthToken={preAuthToken} onCancel={() => setPreAuthToken(null)} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Log in</h1>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Password</label>
        <input
          className="rounded-md border border-input px-3 py-2 text-sm"
          type="password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        <Link to="/forgot-password" className="self-end text-xs text-primary">
          Forgot password?
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Tenant ID (optional)</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" {...register('tenantId')} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        No account? <Link to="/register" className="text-primary">Register</Link>
      </p>
    </form>
  )
}

function TwoFactorStep({ preAuthToken, onCancel }: { preAuthToken: string; onCancel: () => void }) {
  const navigate = useNavigate()
  const next = safeNextPath(useSearchParams()[0].get('next'))
  const setSession = useAuthStore((s) => s.setSession)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/2fa/login', { preAuthToken, code })
      setSession(data)
      navigate(next)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid code'))
      // The challenge token only lives for 5 minutes; once it's gone, start over.
      if (getErrorMessage(err, '').includes('expired')) onCancel()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Two-factor authentication</h1>
      <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
      <input
        className="rounded-md border border-input px-3 py-2 text-center text-lg tracking-widest"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      />
      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? 'Verifying…' : 'Verify'}
      </button>
      <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
        Back to login
      </button>
    </form>
  )
}
