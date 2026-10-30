import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords don't match", path: ['confirm'] })

type FormValues = z.infer<typeof schema>

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-foreground">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">This link is missing its token. Request a new one.</p>
        <Link to="/forgot-password" className="text-center text-sm text-primary">
          Request a new link
        </Link>
      </div>
    )
  }

  const onSubmit = async ({ newPassword }: FormValues) => {
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      toast.success('Password updated — log in with your new password')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err, 'This reset link is invalid or has expired'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">New password</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" type="password" autoComplete="new-password" {...register('newPassword')} />
        {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Confirm password</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" type="password" autoComplete="new-password" {...register('confirm')} />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {isSubmitting ? 'Saving…' : 'Update password'}
      </button>
    </form>
  )
}
