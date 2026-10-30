export interface ChatSession {
  id: string
  title?: string | null
  summary?: string | null
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[]
}

export interface ChatReply {
  sessionId: string
  response: string
}

export interface Insight {
  id: string
  type: string
  content: string
  priority: number
  isPinned: boolean
  dataPoints?: unknown
  createdAt: string
}

export type IncidentSeverity = 'GREEN' | 'YELLOW' | 'RED'

export interface HealthIncident {
  id: string
  description: string
  severity: IncidentSeverity
  aiResponse?: string | null
  createdAt: string
}
