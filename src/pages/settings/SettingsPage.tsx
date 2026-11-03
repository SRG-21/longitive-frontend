import { useState } from 'react'
import toast from 'react-hot-toast'
import { BellRing, Mail, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react'
import {
  useEnable2fa,
  useNotificationPreferences,
  useProfile,
  useTestNotification,
  useUpdateNotificationPreference,
  useVerify2fa,
} from '../../hooks/useProfile'
import { getErrorMessage } from '../../lib/api'
import { Badge, Button, Card, Field, Input, Loading, PageHeader } from '../../components/ui'
import type { NotificationChannel, NotificationPreference } from '../../types/profile'
import TelegramCard from './TelegramCard'

const CHANNELS: { channel: NotificationChannel; label: string; icon: typeof Mail }[] = [
  { channel: 'PUSH', label: 'Push notifications', icon: Smartphone },
  { channel: 'EMAIL', label: 'Email', icon: Mail },
  { channel: 'SMS', label: 'SMS', icon: MessageSquare },
]

function ChannelRow({ channel, label, icon: Icon, pref }: { channel: NotificationChannel; label: string; icon: typeof Mail; pref?: NotificationPreference }) {
  const update = useUpdateNotificationPreference()
  const [start, setStart] = useState(pref?.quietHoursStart ?? '')
  const [end, setEnd] = useState(pref?.quietHoursEnd ?? '')
  // A channel with no saved preference isn't used by the backend at all, so treat it as off.
  const enabled = pref?.enabled ?? false

  const save = async (dto: { enabled?: boolean; quietHoursStart?: string; quietHoursEnd?: string }) => {
    try {
      await update.mutateAsync({ channel, ...dto })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update preference'))
    }
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-primary" />
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{enabled ? 'On' : 'Off'}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Quiet from">
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} disabled={!enabled} className="w-32" />
        </Field>
        <Field label="Quiet until">
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={!enabled} className="w-32" />
        </Field>
        <Button
          variant="outline"
          onClick={() => save({ quietHoursStart: start || undefined, quietHoursEnd: end || undefined })}
          disabled={!enabled || !start || !end || (start === pref?.quietHoursStart && end === pref?.quietHoursEnd)}
        >
          Save hours
        </Button>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${label} ${enabled ? 'on' : 'off'}`}
          onClick={() => save({ enabled: !enabled })}
          disabled={update.isPending}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )
}

function Notifications() {
  const { data: prefs, isLoading } = useNotificationPreferences()
  const test = useTestNotification()

  const sendTest = async () => {
    try {
      await test.mutateAsync()
      toast.success('Test notification sent to your enabled channels')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send test notification'))
    }
  }

  return (
    <Card
      title="Notifications"
      actions={
        <Button size="sm" variant="outline" onClick={sendTest} loading={test.isPending}>
          <BellRing size={12} /> Send test
        </Button>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex flex-col">
          {CHANNELS.map((c) => (
            // Keyed on the saved hours so the inputs reset whenever the server copy changes.
            <ChannelRow key={`${c.channel}-${prefs?.find((p) => p.channel === c.channel)?.quietHoursStart}-${prefs?.find((p) => p.channel === c.channel)?.quietHoursEnd}`} {...c} pref={prefs?.find((p) => p.channel === c.channel)} />
          ))}
        </div>
      )}
    </Card>
  )
}

function TwoFactor() {
  const { data: profile, isLoading } = useProfile()
  const enable = useEnable2fa()
  const verify = useVerify2fa()
  const [code, setCode] = useState('')

  const start = async () => {
    try {
      await enable.mutateAsync()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start 2FA setup'))
    }
  }

  const confirm = async () => {
    try {
      await verify.mutateAsync(code)
      toast.success('Two-factor authentication is on')
      enable.reset()
      setCode('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'That code did not match — try the latest one'))
    }
  }

  if (isLoading) return <Loading />

  return (
    <Card title="Two-factor authentication">
      {profile?.twoFactorEnabled && !enable.data ? (
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck size={18} className="text-primary" />
          <Badge tone="green">Enabled</Badge>
          <span className="text-muted-foreground">You'll be asked for a code from your authenticator app at each login.</span>
        </div>
      ) : enable.data ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <img src={enable.data.qrCode} alt="2FA QR code" className="h-44 w-44 rounded-md border border-border" />
          <div className="flex flex-col gap-3">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
              <li>Scan the QR code with Google Authenticator, 1Password, Authy or similar.</li>
              <li>
                Or enter this key manually: <code className="rounded bg-muted px-1 py-0.5 text-xs">{enable.data.secret}</code>
              </li>
              <li>Enter the 6-digit code it shows to finish.</li>
            </ol>
            <div className="flex gap-2">
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-32" />
              <Button onClick={confirm} loading={verify.isPending} disabled={code.length !== 6} className="whitespace-nowrap">
                Verify & enable
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Protect your health data with a one-time code from an authenticator app.</p>
          <Button onClick={start} loading={enable.isPending}>
            Set up 2FA
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Notifications and account security." />
      <TelegramCard />
      <Notifications />
      <TwoFactor />
    </div>
  )
}
