import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  ChartData,
  LoggingStatus,
  JourneyTracker,
  TrackerEntry,
  TrackerFieldInput,
  WeeklyReview,
  WeightLossTemplate,
} from '../types/journey-tracker'

export function useTrackers() {
  return useQuery({
    queryKey: ['journey-trackers'],
    queryFn: async () => (await api.get<JourneyTracker[]>('/journey-trackers')).data,
  })
}

export function useTracker(id: string | undefined) {
  return useQuery({
    queryKey: ['journey-trackers', id],
    queryFn: async () => (await api.get<JourneyTracker>(`/journey-trackers/${id}`)).data,
    enabled: !!id,
  })
}

export function useTemplatePreview() {
  return useMutation({
    mutationFn: async () =>
      (await api.get<WeightLossTemplate>('/journey-trackers/templates/weight-loss/preview')).data,
  })
}

interface CreateTrackerInput {
  name: string
  type?: string
  cadence?: string
  startDate: string
  /** null clears the end date (update only). */
  endDate?: string | null
  baseline?: Record<string, number>
  targets?: Record<string, number>
  settings?: Record<string, unknown>
  fields?: TrackerFieldInput[]
}

export function useCreateTracker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateTrackerInput) =>
      (await api.post<JourneyTracker>('/journey-trackers', dto)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-trackers'] }),
  })
}

export function useUpdateTracker(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CreateTrackerInput> & { status?: string }) =>
      (await api.patch<JourneyTracker>(`/journey-trackers/${id}`, dto)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-trackers', id] })
      queryClient.invalidateQueries({ queryKey: ['journey-trackers'] })
    },
  })
}

export function useActivateTracker(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<JourneyTracker>(`/journey-trackers/${id}/activate`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-trackers', id] })
      queryClient.invalidateQueries({ queryKey: ['journey-trackers'] })
    },
  })
}

export function useAddField(trackerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: TrackerFieldInput) =>
      (await api.post(`/journey-trackers/${trackerId}/fields`, dto)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-trackers', trackerId] }),
  })
}

export function useUpdateField(trackerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ fieldId, dto }: { fieldId: string; dto: Partial<TrackerFieldInput> & { isActive?: boolean } }) =>
      (await api.patch(`/journey-trackers/${trackerId}/fields/${fieldId}`, dto)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-trackers', trackerId] }),
  })
}

export function useReorderFields(trackerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (order: Array<{ fieldId: string; sortOrder: number }>) =>
      (await api.patch(`/journey-trackers/${trackerId}/fields/reorder`, { order })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-trackers', trackerId] }),
  })
}

export function useEntries(trackerId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'entries', from, to],
    queryFn: async () =>
      (await api.get<TrackerEntry[]>(`/journey-trackers/${trackerId}/entries`, { params: { from, to } })).data,
    enabled: !!trackerId,
  })
}

export function useEntry(trackerId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'entries', date],
    queryFn: async () =>
      (await api.get<TrackerEntry | null>(`/journey-trackers/${trackerId}/entries/${date}`)).data,
    enabled: !!trackerId && !!date,
  })
}

export function useUpsertEntry(trackerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, values, remark }: { date: string; values: Record<string, unknown>; remark?: string }) =>
      (await api.put<TrackerEntry>(`/journey-trackers/${trackerId}/entries/${date}`, { values, remark })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-trackers', trackerId] })
    },
  })
}

export function useChartData(trackerId: string | undefined) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'chart'],
    queryFn: async () => (await api.get<ChartData>(`/journey-trackers/${trackerId}/chart`)).data,
    enabled: !!trackerId,
  })
}

// `today` is the browser's local calendar day: the server can't know the user's timezone, and
// "missed" days are counted up to (not including) the user's today.
export function useWeeklyReview(trackerId: string | undefined, today: string) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'weekly-review', today],
    queryFn: async () =>
      (await api.get<WeeklyReview>(`/journey-trackers/${trackerId}/weekly-review`, { params: { today } })).data,
    enabled: !!trackerId,
  })
}

export function useLoggingStatus(trackerId: string | undefined, today: string) {
  return useQuery({
    queryKey: ['journey-trackers', trackerId, 'logging-status', today],
    queryFn: async () =>
      (await api.get<LoggingStatus>(`/journey-trackers/${trackerId}/logging-status`, { params: { today } })).data,
    enabled: !!trackerId,
  })
}

export async function downloadTrackerCsv(trackerId: string) {
  const response = await api.get(`/journey-trackers/${trackerId}/entries/export.csv`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `tracker-${trackerId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
