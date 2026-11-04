import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ConnectedApp, ConsentInfo, JourneyReview, JourneyReviewList } from '../types/claude'

// A review asks Claude to read the whole journey; allow it time to finish.
const REVIEW_TIMEOUT = 180_000

export function useJourneyReviews(trackerId: string | undefined) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'reviews'],
    queryFn: async () => (await api.get<JourneyReviewList>(`/journey-trackers/${trackerId}/reviews`)).data,
    enabled: !!trackerId,
  })
}

export function useRequestReview(trackerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (today: string) =>
      (await api.post<JourneyReview>(`/journey-trackers/${trackerId}/reviews`, undefined, { params: { today }, timeout: REVIEW_TIMEOUT })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-trackers', trackerId, 'reviews'] }),
  })
}

/** The OAuth request parameters the consent page passes back to the API unchanged. */
export type AuthorizationParams = Record<string, string>

export function useConsentInfo(params: AuthorizationParams) {
  return useQuery({
    queryKey: ['oauth', 'consent', params],
    queryFn: async () => (await api.get<ConsentInfo>('/oauth/authorize/info', { params })).data,
    retry: false,
  })
}

export function useConsentDecision() {
  return useMutation({
    mutationFn: async ({ params, approve }: { params: AuthorizationParams; approve: boolean }) =>
      (await api.post<{ redirectTo: string }>('/oauth/authorize/decision', { ...params, approve })).data,
  })
}

export function useConnectedApps() {
  return useQuery({
    queryKey: ['oauth', 'grants'],
    queryFn: async () => (await api.get<ConnectedApp[]>('/oauth/grants')).data,
  })
}

export function useDisconnectApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/oauth/grants/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['oauth', 'grants'] }),
  })
}
