import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ChatReply, ChatSession, ChatSessionDetail, HealthIncident, Insight } from '../types/ai'

// AI calls can take tens of seconds (OpenAI, or the Ollama fallback), well past axios' default of no
// timeout but often past proxies' patience — callers show a pending state for the whole wait.
const AI_TIMEOUT = 120_000

export function useChatSessions() {
  return useQuery({
    queryKey: ['ai', 'sessions'],
    queryFn: async () => (await api.get<ChatSession[]>('/ai/chat/sessions')).data,
  })
}

export function useChatSession(id: string | undefined) {
  return useQuery({
    queryKey: ['ai', 'sessions', id],
    queryFn: async () => (await api.get<ChatSessionDetail | null>(`/ai/chat/sessions/${id}`)).data || null,
    enabled: !!id,
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { message: string; sessionId?: string }) =>
      (await api.post<ChatReply>('/ai/chat', dto, { timeout: AI_TIMEOUT })).data,
    onSuccess: (reply) => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['ai', 'sessions', reply.sessionId] })
    },
  })
}

export function useSummarizeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ sessionId: string; summary: string } | null>(`/ai/chat/sessions/${id}/summarize`, {}, { timeout: AI_TIMEOUT })).data || null,
    onSuccess: (_data, id) => queryClient.invalidateQueries({ queryKey: ['ai', 'sessions', id] }),
  })
}

export function useInsights() {
  return useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: async () => (await api.get<Insight[]>('/ai/insights')).data,
  })
}

export function useGenerateInsights() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post('/ai/insights/generate', {}, { timeout: AI_TIMEOUT })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'insights'] }),
  })
}

export function usePinInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/ai/insights/${id}/pin`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'insights'] }),
  })
}

export function useBiologicalAge() {
  return useMutation({
    mutationFn: async () => (await api.get<{ analysis: string }>('/ai/biological-age', { timeout: AI_TIMEOUT })).data,
  })
}

export function useWhatIf() {
  return useMutation({
    mutationFn: async (scenario: string) =>
      (await api.post<{ scenario: string; analysis: string }>('/ai/what-if', { scenario }, { timeout: AI_TIMEOUT })).data,
  })
}

export function useFirstAidHistory() {
  return useQuery({
    queryKey: ['ai', 'first-aid'],
    queryFn: async () => (await api.get<HealthIncident[]>('/ai/first-aid/history')).data,
  })
}

export function useFirstAid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { description: string; severity?: string }) =>
      (await api.post<HealthIncident>('/ai/first-aid', dto, { timeout: AI_TIMEOUT })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'first-aid'] }),
  })
}
