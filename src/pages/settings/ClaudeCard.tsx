import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, Unplug } from 'lucide-react'
import { useConnectedApps, useDisconnectApp } from '../../hooks/useClaude'
import { api, getErrorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/date'
import { Button, Card, Loading } from '../../components/ui'

/** The MCP endpoint lives next to the REST API: <API base>/mcp. */
const MCP_URL = `${String(api.defaults.baseURL).replace(/\/+$/, '')}/mcp`

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed — select the text and copy it manually')
    }
  }
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground" title={value}>
        {value}
      </code>
      <Button size="sm" variant="outline" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  )
}

export default function ClaudeCard() {
  const { data: apps, isLoading } = useConnectedApps()
  const disconnect = useDisconnectApp()

  const onDisconnect = async (id: string, name: string) => {
    try {
      await disconnect.mutateAsync(id)
      toast.success(`${name} disconnected`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not disconnect'))
    }
  }

  return (
    <Card title="Claude">
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-muted-foreground">
          Connect Claude to your journey trackers so you can ask it to analyse your progress and suggest next steps at any time. Claude
          gets read-only access, and only after you approve it.
        </p>

        <div className="flex flex-col gap-2">
          <span className="font-medium text-foreground">Connector URL</span>
          <CopyField value={MCP_URL} label="connector URL" />
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              <strong>Claude app:</strong> Settings → Connectors → Add custom connector, paste the URL, then sign in and press Allow.
            </li>
            <li>
              <strong>Claude Code:</strong> <code className="rounded bg-muted px-1">claude mcp add --transport http longevity {MCP_URL}</code>, then run{' '}
              <code className="rounded bg-muted px-1">/mcp</code> to sign in.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-medium text-foreground">Connected apps</span>
          {isLoading ? (
            <Loading />
          ) : apps?.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {apps.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <div className="font-medium text-foreground">{app.clientName}</div>
                    <div className="text-xs text-muted-foreground">
                      Connected {formatDateTime(app.connectedAt)}
                      {app.lastUsedAt ? ` · last used ${formatDateTime(app.lastUsedAt)}` : ' · not used yet'}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onDisconnect(app.id, app.clientName)} loading={disconnect.isPending}>
                    <Unplug size={14} /> Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing connected yet.</p>
          )}
        </div>
      </div>
    </Card>
  )
}
