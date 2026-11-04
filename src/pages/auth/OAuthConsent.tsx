import { useMemo } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import { useConsentDecision, useConsentInfo, type AuthorizationParams } from '../../hooks/useClaude'
import { getErrorMessage } from '../../lib/api'
import { loginPathFor } from '../../lib/redirect'
import { useAuthStore } from '../../stores/authStore'

const OAUTH_PARAMS = ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'scope', 'state', 'resource']

/**
 * Where the backend's /oauth/authorize sends the browser: the signed-in user sees which app is
 * asking for what, and approves or denies. The answer goes back to the app's redirect URI.
 */
export default function OAuthConsent() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const [search] = useSearchParams()
  const params = useMemo(() => {
    const out: AuthorizationParams = {}
    for (const key of OAUTH_PARAMS) {
      const value = search.get(key)
      if (value) out[key] = value
    }
    return out
  }, [search])

  if (!accessToken) return <Navigate to={loginPathFor(location)} replace />
  return <ConsentCard params={params} userName={user?.name ?? user?.email ?? ''} />
}

function ConsentCard({ params, userName }: { params: AuthorizationParams; userName: string }) {
  const { data: info, isLoading, error } = useConsentInfo(params)
  const decide = useConsentDecision()

  const answer = async (approve: boolean) => {
    try {
      const { redirectTo } = await decide.mutateAsync({ params, approve })
      window.location.assign(redirectTo)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong'))
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (error || !info) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">Can't connect this app</h1>
        <p className="text-sm text-muted-foreground">{getErrorMessage(error, 'This sign-in request is invalid or has expired.')}</p>
        <p className="text-sm text-muted-foreground">Start the connection again from the app you came from.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-primary" size={22} />
        <h1 className="text-xl font-semibold text-foreground">Connect {info.clientName}?</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{info.clientName}</strong> ({info.redirectHost}) wants to access your Longevity account
        {userName ? ` (${userName})` : ''}. It will be able to:
      </p>
      <ul className="flex flex-col gap-2">
        {info.scopes.map((s) => (
          <li key={s.scope} className="rounded-md border border-border bg-secondary/50 p-3 text-sm text-foreground">
            {s.description}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        It can only read — not change — your data. You can disconnect it any time in Settings → Claude.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => answer(false)}
          disabled={decide.isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          disabled={decide.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {decide.isPending ? 'Connecting…' : 'Allow'}
        </button>
      </div>
    </div>
  )
}
