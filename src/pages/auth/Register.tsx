import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
})

type FormValues = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post('/auth/register', values)
      setSession(data)
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Create account</h1>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Name</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
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
        <label className="text-sm font-medium text-foreground">Tenant ID</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" {...register('tenantId')} />
        {errors.tenantId && <p className="text-xs text-destructive">{errors.tenantId.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {isSubmitting ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-primary">Log in</Link>
      </p>
    </form>
  )
}
