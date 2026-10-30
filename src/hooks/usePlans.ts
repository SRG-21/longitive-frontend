import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  DailyChart,
  DailyChecklist,
  DailyScore,
  DietPlan,
  ExerciseLog,
  ExercisePlan,
  ExerciseStats,
  HydrationPlan,
  InventoryItem,
  ChecklistItem,
  ProgressStreak,
  ReorderAlert,
  Reminder,
  SupplementPlan,
  WeeklyProgressReport,
} from '../types/health'

function useInvalidate() {
  const queryClient = useQueryClient()
  return (...keys: string[]) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}

// ---------- Exercise ----------

export interface ExerciseLogInput {
  date: string
  exerciseType: string
  duration?: number
  intensity?: string
  heartRateAvg?: number
  notes?: string
}

export function useExercisePlan() {
  return useQuery({
    queryKey: ['exercise', 'plan'],
    queryFn: async () => (await api.get<ExercisePlan | null>('/exercise/plan')).data || null,
  })
}

export function useGenerateExercisePlan() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { goal?: string; equipmentLevel?: string }) =>
      (await api.post<ExercisePlan>('/exercise/plan/generate', dto)).data,
    onSuccess: () => invalidate('exercise', 'progress'),
  })
}

export function useExerciseLogs(from?: string, to?: string) {
  return useQuery({
    queryKey: ['exercise', 'logs', from, to],
    queryFn: async () => (await api.get<ExerciseLog[]>('/exercise/log', { params: { from, to } })).data,
  })
}

export function useExerciseStats() {
  return useQuery({
    queryKey: ['exercise', 'stats'],
    queryFn: async () => (await api.get<ExerciseStats>('/exercise/stats')).data,
  })
}

export function useCreateExerciseLog() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: ExerciseLogInput) => (await api.post<ExerciseLog>('/exercise/log', dto)).data,
    onSuccess: () => invalidate('exercise', 'analytics'),
  })
}

// ---------- Nutrition (health-chart) ----------

export function useDietPlan() {
  return useQuery({
    queryKey: ['health-chart', 'diet'],
    queryFn: async () => (await api.get<DietPlan | null>('/health-chart/diet')).data || null,
  })
}

export function useGenerateDietPlan() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { targetCalories?: number; preferences?: Record<string, unknown> }) =>
      (await api.post<DietPlan>('/health-chart/diet/generate', dto)).data,
    onSuccess: () => invalidate('health-chart'),
  })
}

export function useSupplementPlan() {
  return useQuery({
    queryKey: ['health-chart', 'supplements'],
    queryFn: async () => (await api.get<SupplementPlan | null>('/health-chart/supplements')).data || null,
  })
}

export function useGenerateSupplementPlan() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async () => (await api.post<SupplementPlan>('/health-chart/supplements/generate', {})).data,
    onSuccess: () => invalidate('health-chart'),
  })
}

export function useHydrationPlan() {
  return useQuery({
    queryKey: ['health-chart', 'hydration'],
    queryFn: async () => (await api.get<HydrationPlan | null>('/health-chart/hydration')).data || null,
  })
}

export function useGenerateHydrationPlan() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dailyTarget?: number) =>
      (await api.post<HydrationPlan>('/health-chart/hydration/generate', { dailyTarget })).data,
    onSuccess: () => invalidate('health-chart'),
  })
}

export function useDailyChart(date: string) {
  return useQuery({
    queryKey: ['health-chart', 'daily', date],
    queryFn: async () => (await api.get<DailyChart | null>(`/health-chart/daily/${date}`)).data || null,
  })
}

export function useGenerateDailyChart() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (date: string) => (await api.post<DailyChart>('/health-chart/daily/generate', { date })).data,
    onSuccess: () => invalidate('health-chart'),
  })
}

// ---------- Progress & reminders ----------

export function useDailyChecklist(date: string) {
  return useQuery({
    queryKey: ['progress', 'daily', date],
    queryFn: async () => (await api.get<DailyChecklist>(`/progress/daily/${date}`)).data,
  })
}

export function useUpdateChecklist(date: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (items: ChecklistItem[]) =>
      (await api.patch<DailyChecklist>(`/progress/daily/${date}`, { items })).data,
    onSuccess: () => invalidate('progress', 'analytics'),
  })
}

export function useStreaks() {
  return useQuery({
    queryKey: ['progress', 'streaks'],
    queryFn: async () => (await api.get<ProgressStreak | null>('/progress/streaks')).data || null,
  })
}

export function useDailyScore(date: string) {
  return useQuery({
    queryKey: ['progress', 'score', date],
    queryFn: async () => (await api.get<DailyScore>(`/progress/score/${date}`)).data,
  })
}

export function useWeeklyProgress() {
  return useQuery({
    queryKey: ['progress', 'weekly'],
    queryFn: async () => (await api.get<WeeklyProgressReport>('/progress/weekly-report')).data,
  })
}

export interface ReminderInput {
  type: string
  title: string
  message?: string
  cronExpression: string
}

export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: async () => (await api.get<Reminder[]>('/reminders')).data,
  })
}

export function useCreateReminder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: ReminderInput) => (await api.post<Reminder>('/reminders', dto)).data,
    onSuccess: () => invalidate('reminders'),
  })
}

export function useUpdateReminder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<ReminderInput> & { isActive?: boolean } }) =>
      (await api.patch(`/reminders/${id}`, dto)).data,
    onSuccess: () => invalidate('reminders'),
  })
}

export function useDeleteReminder() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/reminders/${id}`)).data,
    onSuccess: () => invalidate('reminders'),
  })
}

// ---------- Inventory ----------

export interface InventoryItemInput {
  name: string
  type: string
  quantity?: number
  unit?: string
  dailyDosage?: number
  reorderThresholdDays?: number
  expiryDate?: string
  costPerUnit?: number
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: async () => (await api.get<InventoryItem[]>('/inventory')).data,
  })
}

export function useReorderAlerts() {
  return useQuery({
    queryKey: ['inventory', 'reorder-alerts'],
    queryFn: async () => (await api.get<ReorderAlert[]>('/inventory/reorder-alerts')).data,
  })
}

export function useExpiringSoon() {
  return useQuery({
    queryKey: ['inventory', 'expiring-soon'],
    queryFn: async () => (await api.get<InventoryItem[]>('/inventory/expiring-soon')).data,
  })
}

export function useCreateInventoryItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: InventoryItemInput) => (await api.post<InventoryItem>('/inventory', dto)).data,
    onSuccess: () => invalidate('inventory'),
  })
}

export function useUpdateInventoryItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<Omit<InventoryItemInput, 'type' | 'unit' | 'costPerUnit'>> }) =>
      (await api.patch<InventoryItem>(`/inventory/${id}`, dto)).data,
    onSuccess: () => invalidate('inventory'),
  })
}

export function useConsumeItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity?: number }) =>
      (await api.post<{ remaining: number }>(`/inventory/${id}/consume`, { quantity })).data,
    onSuccess: () => invalidate('inventory'),
  })
}

export function useRestockItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) =>
      (await api.post<{ newQuantity: number }>(`/inventory/${id}/restock`, { quantity })).data,
    onSuccess: () => invalidate('inventory'),
  })
}
