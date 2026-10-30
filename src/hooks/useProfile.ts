import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  FamilyHistory,
  Goals,
  LifestyleProfile,
  MedicalCondition,
  NotificationChannel,
  NotificationPreference,
  Treatment,
  UserProfile,
} from '../types/profile'

function useInvalidate() {
  const queryClient = useQueryClient()
  return (...key: string[]) => queryClient.invalidateQueries({ queryKey: key })
}

export function useProfile() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => (await api.get<UserProfile>('/users/me')).data,
  })
}

export interface ProfileInput {
  name?: string
  phone?: string
  dob?: string
  gender?: string
  bloodGroup?: string
}

export function useUpdateProfile() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: ProfileInput) => (await api.patch('/users/me', dto)).data,
    onSuccess: () => invalidate('users', 'me'),
  })
}

export function useLifestyle() {
  return useQuery({
    queryKey: ['users', 'me', 'lifestyle'],
    queryFn: async () => (await api.get<LifestyleProfile | null>('/users/me/lifestyle')).data || null,
  })
}

export function useUpdateLifestyle() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: LifestyleProfile) => (await api.patch('/users/me/lifestyle', dto)).data,
    onSuccess: () => invalidate('users', 'me'),
  })
}

export function useGoals() {
  return useQuery({
    queryKey: ['users', 'me', 'goals'],
    queryFn: async () => (await api.get<Goals>('/users/me/goals')).data,
  })
}

export function useUpdateGoals() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: Goals) => (await api.patch<Goals>('/users/me/goals', dto)).data,
    onSuccess: () => invalidate('users', 'me', 'goals'),
  })
}

export function useMedicalConditions() {
  return useQuery({
    queryKey: ['users', 'me', 'medical-conditions'],
    queryFn: async () => (await api.get<MedicalCondition[]>('/users/me/medical-conditions')).data,
  })
}

export function useCreateMedicalCondition() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { condition: string; type: string; severity?: string; diagnosedDate?: string; notes?: string }) =>
      (await api.post('/users/me/medical-conditions', dto)).data,
    onSuccess: () => invalidate('users', 'me', 'medical-conditions'),
  })
}

export function useFamilyHistory() {
  return useQuery({
    queryKey: ['users', 'me', 'family-history'],
    queryFn: async () => (await api.get<FamilyHistory[]>('/users/me/family-history')).data,
  })
}

export function useCreateFamilyHistory() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { relation: string; condition: string; ageOfOnset?: number; notes?: string }) =>
      (await api.post('/users/me/family-history', dto)).data,
    onSuccess: () => invalidate('users', 'me', 'family-history'),
  })
}

export function useTreatments() {
  return useQuery({
    queryKey: ['users', 'me', 'treatments'],
    queryFn: async () => (await api.get<Treatment[]>('/users/me/treatments')).data,
  })
}

export function useCreateTreatment() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { name: string; type: string; startDate?: string; endDate?: string; prescribedBy?: string; notes?: string }) =>
      (await api.post('/users/me/treatments', dto)).data,
    onSuccess: () => invalidate('users', 'me', 'treatments'),
  })
}

// ---------- Notifications ----------

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => (await api.get<NotificationPreference[]>('/notifications/preferences')).data,
  })
}

export function useUpdateNotificationPreference() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (dto: { channel: NotificationChannel; enabled?: boolean; quietHoursStart?: string; quietHoursEnd?: string }) =>
      (await api.patch('/notifications/preferences', dto)).data,
    onSuccess: () => invalidate('notifications', 'preferences'),
  })
}

export function useTestNotification() {
  return useMutation({
    mutationFn: async () => (await api.post('/notifications/test')).data,
  })
}

// ---------- Two-factor auth ----------

export function useEnable2fa() {
  return useMutation({
    mutationFn: async () => (await api.post<{ secret: string; qrCode: string }>('/auth/2fa/enable')).data,
  })
}

export function useVerify2fa() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (code: string) => (await api.post('/auth/2fa/verify', { code })).data,
    onSuccess: () => invalidate('users', 'me'),
  })
}
