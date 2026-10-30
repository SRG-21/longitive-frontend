import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '../../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send reset email'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.</p>
        <Link to="/login" className="text-center text-sm text-primary">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input className="rounded-md border border-input px-3 py-2 text-sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button type="submit" disabled={submitting} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {submitting ? 'Sending…' : 'Send reset link'}
      </button>
      <Link to="/login" className="text-center text-sm text-muted-foreground">
        Back to login
      </Link>
    </form>
  )
}
