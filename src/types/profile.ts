export interface LifestyleProfile {
  smoking?: string | null
  alcohol?: string | null
  sleepHours?: number | null
  stressLevel?: number | null
  occupation?: string | null
  activityLevel?: string | null
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string | null
  dob?: string | null
  gender?: string | null
  bloodGroup?: string | null
  role: string
  twoFactorEnabled: boolean
  lifestyleProfile?: LifestyleProfile | null
  emergencyContacts: EmergencyContact[]
}

export interface MedicalCondition {
  id: string
  condition: string
  type: 'CHRONIC' | 'ACUTE' | 'ALLERGY'
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | null
  diagnosedDate?: string | null
  notes?: string | null
  isActive: boolean
}

export interface FamilyHistory {
  id: string
  relation: string
  condition: string
  ageOfOnset?: number | null
  notes?: string | null
}

export interface Treatment {
  id: string
  name: string
  type: 'MEDICATION' | 'SURGERY' | 'THERAPY'
  startDate?: string | null
  endDate?: string | null
  prescribedBy?: string | null
  notes?: string | null
  isActive: boolean
}

export interface Goals {
  targetWeightKg?: number
  targetBodyFatPercent?: number
  targetSleepHours?: number
  targetDailySteps?: number
  targetWaterIntakeMl?: number
  notes?: string
}

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS'

export interface NotificationPreference {
  id?: string
  channel: NotificationChannel
  enabled: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}
