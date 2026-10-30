export type TrackerStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type TrackerCadence = 'DAILY' | 'WEEKLY' | 'CUSTOM'

export type TrackerFieldType =
  | 'CHECKBOX'
  | 'NUMBER'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'RATING'
  | 'SINGLE_SELECT'
  | 'MULTI_SELECT'
  | 'DATE'
  | 'TIME'
  | 'DURATION'
  | 'PHOTO'
  | 'FORMULA'

export interface TrackerField {
  id: string
  key: string
  label: string
  type: TrackerFieldType
  unit?: string | null
  options?: string[] | null
  target?: Record<string, number> | null
  required: boolean
  chartable: boolean
  scoringWeight?: number | null
  sortOrder: number
  isActive: boolean
}

export interface JourneyTracker {
  id: string
  name: string
  type: string
  cadence: TrackerCadence
  startDate: string
  endDate?: string | null
  status: TrackerStatus
  baseline?: Record<string, number> | null
  targets?: Record<string, number> | null
  settings?: Record<string, unknown> | null
  fields?: TrackerField[]
  createdAt: string
  updatedAt: string
}

export interface TrackerFieldInput {
  key: string
  label: string
  type: TrackerFieldType
  unit?: string | null
  options?: string[] | null
  target?: Record<string, number> | null
  required?: boolean
  chartable?: boolean
  sortOrder?: number
}

export interface WeightLossTemplate {
  name: string
  type: string
  cadence: TrackerCadence
  baseline: Record<string, number>
  targets: Record<string, number>
  settings: Record<string, unknown>
  fields: TrackerFieldInput[]
}

export interface TrackerEntry {
  id: string
  trackerId: string
  date: string
  values: Record<string, unknown>
  remark?: string | null
  completedAt?: string | null
}

export interface ChartData {
  dates: string[]
  series: Array<{ key: string; label: string; unit?: string | null; values: (number | null)[] }>
  weightRollingAverage: (number | null)[]
}

export interface WeeklyReview {
  averageWeight: number | null
  changeFromBaseline: number | null
  completedHabitsPercentage: number
  daysTracked: number
  missedDays: number
}
