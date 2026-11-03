import { useState } from 'react'
import toast from 'react-hot-toast'
import { ExternalLink, Send } from 'lucide-react'
import {
  useCreateTelegramLink,
  useTelegramStatus,
  useTelegramTest,
  useUnlinkTelegram,
  useUpdateTelegramPreferences,
} from '../../hooks/useProfile'
import { getErrorMessage } from '../../lib/api'
import { Badge, Button, Card, Loading } from '../../components/ui'
import type { TelegramLinkResponse, TelegramStatus } from '../../types/profile'

/** "15:00" in Asia/Kolkata → "3:00 pm IST". */
function formatTime(hhmm: string, timeZone: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const zone = timeZone === 'Asia/Kolkata' ? 'IST' : timeZone
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'} ${zone}`
}

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function TelegramCard() {
  const [pendingLink, setPendingLink] = useState<TelegramLinkResponse | null>(null)
  const { data: status, isLoading } = useTelegramStatus(!!pendingLink)
  const createLink = useCreateTelegramLink()

  const connect = async () => {
    try {
      const link = await createLink.mutateAsync()
      setPendingLink(link)
      // Opened from the click handler's async continuation, so some browsers may block it —
      // the "Open Telegram" button below is the fallback.
      window.open(link.deepLink, '_blank', 'noopener')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start connecting Telegram'))
    }
  }

  return (
    <Card title="Telegram logging alerts">
      {isLoading || !status ? (
        <Loading />
      ) : !status.configured ? (
        <p className="text-sm text-muted-foreground">Telegram alerts aren't set up on this server yet.</p>
      ) : status.linked ? (
        <LinkedView status={status} onDisconnected={() => setPendingLink(null)} />
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Get a Telegram message at {formatTime(status.schedule.dailyReminder, status.schedule.timeZone)} if you haven't logged your
            journey tracker yet, and at {formatTime(status.schedule.missedDayAlert, status.schedule.timeZone)} if the day is about to be
            missed.
          </p>
          {pendingLink ? (
            <div className="flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sky-900">
              <span>
                In Telegram, press <strong>Start</strong> in your chat with @{pendingLink.botUsername}. This page updates once you're connected.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={pendingLink.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <ExternalLink size={12} /> Open Telegram
                </a>
                <span className="animate-pulse text-xs">Waiting for Telegram…</span>
                <Button size="sm" variant="ghost" onClick={() => setPendingLink(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={connect} loading={createLink.isPending} className="w-fit">
              <Send size={14} /> Connect Telegram
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function LinkedView({ status, onDisconnected }: { status: TelegramStatus; onDisconnected: () => void }) {
  const update = useUpdateTelegramPreferences()
  const unlink = useUnlinkTelegram()
  const test = useTelegramTest()
  const { timeZone } = status.schedule

  const toggle = (key: 'dailyReminder' | 'missedDayAlert') =>
    update.mutate({ [key]: !status[key] }, { onError: (err) => toast.error(getErrorMessage(err, 'Could not update the alert')) })

  const sendTest = async () => {
    try {
      await test.mutateAsync()
      toast.success('Test message sent — check Telegram')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send a test message'))
    }
  }

  const disconnect = async () => {
    try {
      await unlink.mutateAsync()
      onDisconnected()
      toast.success('Telegram disconnected')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not disconnect Telegram'))
    }
  }

  const alerts = [
    {
      key: 'dailyReminder' as const,
      label: `Reminder at ${formatTime(status.schedule.dailyReminder, timeZone)}`,
      hint: "If today isn't logged yet",
    },
    {
      key: 'missedDayAlert' as const,
      label: `Missed-day alert at ${formatTime(status.schedule.missedDayAlert, timeZone)}`,
      hint: 'If the day ends without a log',
    },
  ]

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="green">Connected</Badge>
        <span className="text-foreground">{status.username ? `@${status.username}` : 'Telegram chat'}</span>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {alerts.map((alert) => (
          <div key={alert.key} className="flex items-center justify-between gap-3 py-2">
            <div>
              <div className="font-medium text-foreground">{alert.label}</div>
              <div className="text-xs text-muted-foreground">{alert.hint}</div>
            </div>
            <Switch checked={status[alert.key]} onChange={() => toggle(alert.key)} label={alert.label} disabled={update.isPending} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={sendTest} loading={test.isPending}>
          Send test message
        </Button>
        <Button size="sm" variant="ghost" onClick={disconnect} loading={unlink.isPending}>
          Disconnect
        </Button>
      </div>
    </div>
  )
}
