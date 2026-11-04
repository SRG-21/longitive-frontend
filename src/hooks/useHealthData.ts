import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { buildOcrFormData } from '../lib/upload'
import type {
  AnalyticsDashboard,
  BodyComposition,
  BodyCompositionTrends,
  LabReport,
  LabSpreadsheetRow,
  LabTrendPoint,
  MoodLog,
  OcrUpload,
  SleepLog,
  SleepScore,
} from '../types/health'

// ---------- Analytics ----------

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => (await api.get<AnalyticsDashboard>('/analytics/dashboard')).data,
  })
}

// ---------- Body composition ----------

export type BodyCompositionInput = Partial<Omit<BodyComposition, 'id' | 'date' | 'source' | 'sourceImageUrl'>> & { date: string }

export function useBodyCompositionHistory(from?: string, to?: string) {
  return useQuery({
    queryKey: ['body-composition', 'history', from, to],
    queryFn: async () => (await api.get<BodyComposition[]>('/body-composition', { params: { from, to } })).data,
  })
}

export function useBodyCompositionTrends() {
  return useQuery({
    queryKey: ['body-composition', 'trends'],
    queryFn: async () => (await api.get<BodyCompositionTrends>('/body-composition/trends')).data,
  })
}

function useInvalidateHealth() {
  const queryClient = useQueryClient()
  return (...keys: string[]) => {
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }
}

export function useCreateBodyComposition() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (dto: BodyCompositionInput) => (await api.post<BodyComposition>('/body-composition', dto)).data,
    onSuccess: () => invalidate('body-composition'),
  })
}

export function useBodyCompositionOcr() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (file: File) =>
      (await api.post<OcrUpload<BodyComposition>>('/body-composition/ocr', await buildOcrFormData(file))).data,
    onSuccess: () => invalidate('body-composition'),
  })
}

// ---------- Lab reports ----------

export interface LabResultInput {
  testName: string
  category?: string
  value: number
  unit?: string
  referenceMin?: number
  referenceMax?: number
  status?: string
  notes?: string
}

export interface LabReportInput {
  reportDate: string
  labName?: string
  reportType?: string
  results: LabResultInput[]
}

export function useLabReports(params: { from?: string; to?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ['lab-reports', 'list', params],
    queryFn: async () => (await api.get<LabReport[]>('/lab-reports', { params })).data,
  })
}

export function useLabReport(id: string | undefined) {
  return useQuery({
    queryKey: ['lab-reports', 'detail', id],
    queryFn: async () => (await api.get<LabReport>(`/lab-reports/${id}`)).data,
    enabled: !!id,
  })
}

export function useLabTrend(testName: string | undefined) {
  return useQuery({
    queryKey: ['lab-reports', 'trend', testName],
    queryFn: async () => (await api.get<LabTrendPoint[]>(`/lab-reports/trends/${encodeURIComponent(testName!)}`)).data,
    enabled: !!testName,
  })
}

export function useLabSpreadsheet(tests: string[], from?: string, to?: string) {
  return useQuery({
    queryKey: ['lab-reports', 'spreadsheet', tests, from, to],
    queryFn: async () =>
      (await api.get<LabSpreadsheetRow[]>('/lab-reports/spreadsheet', { params: { tests: tests.join(','), from, to } })).data,
    enabled: tests.length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useCreateLabReport() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (dto: LabReportInput) => (await api.post<LabReport>('/lab-reports', dto)).data,
    onSuccess: () => invalidate('lab-reports'),
  })
}

export function useUploadLabReport() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (file: File) => {
      const endpoint = file.type === 'application/pdf' ? '/lab-reports/pdf' : '/lab-reports/ocr'
      return (await api.post<OcrUpload<LabReport>>(endpoint, await buildOcrFormData(file))).data
    },
    onSuccess: () => invalidate('lab-reports'),
  })
}

export function useVerifyLabReport() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (id: string) => (await api.patch<LabReport>(`/lab-reports/${id}/verify`)).data,
    onSuccess: () => invalidate('lab-reports'),
  })
}

// ---------- Sleep & mood ----------

export interface SleepLogInput {
  date: string
  bedtime?: string
  wakeTime?: string
  duration?: number
  quality?: number
  notes?: string
}

export interface MoodLogInput {
  date: string
  mood?: number
  energy?: number
  stressLevel?: number
  notes?: string
}

export function useSleepLogs(from?: string, to?: string) {
  return useQuery({
    queryKey: ['sleep', 'logs', from, to],
    queryFn: async () => (await api.get<SleepLog[]>('/sleep/log', { params: { from, to } })).data,
  })
}

export function useSleepScore() {
  return useQuery({
    queryKey: ['sleep', 'score'],
    queryFn: async () => (await api.get<SleepScore>('/sleep/score')).data,
  })
}

export function useCreateSleepLog() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (dto: SleepLogInput) => (await api.post<SleepLog>('/sleep/log', dto)).data,
    onSuccess: () => invalidate('sleep'),
  })
}

export function useMoodLogs(from?: string, to?: string) {
  return useQuery({
    queryKey: ['mood', 'logs', from, to],
    queryFn: async () => (await api.get<MoodLog[]>('/mood/log', { params: { from, to } })).data,
  })
}

export function useCreateMoodLog() {
  const invalidate = useInvalidateHealth()
  return useMutation({
    mutationFn: async (dto: MoodLogInput) => (await api.post<MoodLog>('/mood/log', dto)).data,
    onSuccess: () => invalidate('mood'),
  })
}

/** A short-lived link to a scanned report's original file (the stored file is private). */
export async function getLabReportFileUrl(id: string) {
  return (await api.get<{ url: string }>(`/lab-reports/${id}/file`)).data.url
}
