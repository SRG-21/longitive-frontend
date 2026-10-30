import type { ReactNode } from 'react'

// AI-generated plans and answers come back as free text: sometimes Markdown, sometimes JSON
// (often wrapped in ```json fences). This renders either safely, without dangerouslySetInnerHTML.

function stripFences(text: string): string {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : text
}

function tryParseJson(text: string): unknown {
  const candidate = stripFences(text).trim()
  if (!candidate.startsWith('{') && !candidate.startsWith('[')) return undefined
  try {
    return JSON.parse(candidate)
  } catch {
    return undefined
  }
}

function humanize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

function JsonView({ value, depth = 0 }: { value: unknown; depth?: number }): ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
  if (typeof value !== 'object') return <span>{String(value)}</span>
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v !== 'object' || v === null)) {
      return <span>{value.map(String).join(', ')}</span>
    }
    return (
      <div className="flex flex-col gap-2">
        {value.map((item, idx) => (
          <div key={idx} className="rounded-md border border-border p-3">
            <JsonView value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <dl className="flex flex-col gap-1.5">
      {Object.entries(value as Record<string, unknown>).map(([key, v]) => {
        const nested = typeof v === 'object' && v !== null
        return (
          <div key={key} className={nested ? 'flex flex-col gap-1' : 'flex flex-wrap gap-x-2'}>
            <dt className={`font-medium text-foreground ${depth === 0 && nested ? 'text-sm' : ''}`}>{humanize(key)}{nested ? '' : ':'}</dt>
            <dd className={nested ? 'pl-3' : 'text-foreground'}>
              <JsonView value={v} depth={depth + 1} />
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={idx}>{part.slice(2, -2)}</strong> : part,
  )
}

function MarkdownView({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {list.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
      </ul>,
    )
    list = []
  }

  text.split('\n').forEach((raw) => {
    const line = raw.trim()
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (bullet) {
      list.push(bullet[1])
      return
    }
    flushList()
    if (!line) return
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push(<h3 key={blocks.length} className="pt-1 font-semibold text-foreground">{renderInline(heading[1])}</h3>)
    } else {
      blocks.push(<p key={blocks.length}>{renderInline(line)}</p>)
    }
  })
  flushList()

  return <div className="flex flex-col gap-2">{blocks}</div>
}

export default function AiContent({ content }: { content: unknown }) {
  if (content === null || content === undefined || content === '') {
    return <p className="text-sm text-muted-foreground">No content.</p>
  }
  const parsed = typeof content === 'string' ? tryParseJson(content) : content
  return (
    <div className="text-sm leading-relaxed text-foreground">
      {parsed !== undefined ? <JsonView value={parsed} /> : <MarkdownView text={String(content)} />}
    </div>
  )
}
