import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bot, FileText, MessageSquarePlus, Send, User } from 'lucide-react'
import { useChatSession, useChatSessions, useSendChatMessage, useSummarizeSession } from '../../hooks/useAi'
import { getErrorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/date'
import AiContent from '../../components/AiContent'
import { Button, EmptyState, Loading, MedicalDisclaimer, Textarea } from '../../components/ui'
import AiTabs from './AiTabs'

const STARTERS = [
  'How do my latest lab results look?',
  'What should I focus on to improve my biological age?',
  'Is my current weight trend healthy?',
  'Suggest a better sleep routine for me.',
]

export default function AiChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()
  const { data: sessions } = useChatSessions()
  const { data: session, isLoading } = useChatSession(sessionId)
  const send = useSendChatMessage()
  const summarize = useSummarizeSession()
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length, pending])

  const submit = async (text: string) => {
    const message = text.trim()
    if (!message || send.isPending) return
    setPending(message)
    setDraft('')
    try {
      const reply = await send.mutateAsync({ message, sessionId })
      if (reply.sessionId !== sessionId) navigate(`/ai/chat/${reply.sessionId}`)
    } catch (err) {
      setDraft(message)
      toast.error(getErrorMessage(err, 'The assistant could not respond'))
    } finally {
      setPending(null)
    }
  }

  const onSummarize = async () => {
    if (!sessionId) return
    try {
      await summarize.mutateAsync(sessionId)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not summarize this conversation'))
    }
  }

  const messages = sessionId ? (session?.messages ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      <AiTabs />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col gap-2">
          <Button onClick={() => navigate('/ai/chat')} variant="outline">
            <MessageSquarePlus size={14} /> New conversation
          </Button>
          <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
            {sessions?.map((s) => (
              <Link
                key={s.id}
                to={`/ai/chat/${s.id}`}
                className={`rounded-md px-3 py-2 text-sm ${s.id === sessionId ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}`}
              >
                <div className="truncate font-medium">{s.title || 'Conversation'}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(s.updatedAt)} · {s._count?.messages ?? 0} messages
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <div className="flex min-h-[60vh] flex-col rounded-lg border border-border bg-card">
          {session?.summary && (
            <div className="border-b border-border bg-muted/50 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</div>
              <AiContent content={session.summary} />
            </div>
          )}

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {sessionId && isLoading && <Loading />}
            {!sessionId && !pending && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Bot size={32} className="text-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">Your health assistant</h2>
                  <p className="text-sm text-muted-foreground">Answers draw on your profile, conditions, treatments, measurements and recent labs.</p>
                </div>
                <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {STARTERS.map((s) => (
                    <button key={s} type="button" onClick={() => submit(s)} className="rounded-md border border-border p-3 text-left text-sm hover:bg-accent">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sessionId && !isLoading && !session && <EmptyState>Conversation not found.</EmptyState>}
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} />
            ))}
            {pending && (
              <>
                <Message role="USER" content={pending} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot size={16} className="text-primary" />
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <div className="flex gap-2">
              <Textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit(draft)
                  }
                }}
                placeholder="Ask about your health data… (Enter to send, Shift+Enter for a new line)"
                className="flex-1 resize-none"
              />
              <Button onClick={() => submit(draft)} loading={send.isPending} disabled={!draft.trim()} aria-label="Send">
                <Send size={14} />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MedicalDisclaimer />
              {sessionId && messages.length > 1 && (
                <Button size="sm" variant="outline" onClick={onSummarize} loading={summarize.isPending}>
                  <FileText size={12} /> {session?.summary ? 'Re-summarize' : 'Summarize'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Message({ role, content }: { role: 'USER' | 'ASSISTANT'; content: string }) {
  const isUser = role === 'USER'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        {isUser ? <p className="whitespace-pre-wrap text-sm">{content}</p> : <AiContent content={content} />}
      </div>
    </div>
  )
}

