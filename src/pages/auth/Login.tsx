import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post('/auth/login', values)
      if (data.requiresTwoFactor) {
        toast.error('This account has 2FA enabled, which this UI does not yet support.')
        return
      }
      setSession(data)
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'))
    }
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
