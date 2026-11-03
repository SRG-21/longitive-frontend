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

/** How often a field is logged: every day, or once a week in the weekly review. */
export type FieldCadence = 'DAILY' | 'WEEKLY'

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
  /** Missing on fields created before cadence existed, which are daily. */
  cadence?: FieldCadence | null
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
  cadence?: FieldCadence | null
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
  series: Array<{
    key: string
    label: string
    unit?: string | null
    cadence?: FieldCadence
    values: (number | null)[]
  }>
  weightRollingAverage: (number | null)[]
}

export interface WeeklyReview {
  averageWeight: number | null
  latestWeight: number | null
  latestWeightDate: string | null
  baselineWeight: number | null
  targetWeight: number | null
  changeFromBaseline: number | null
  /** 0–100, how far the latest weight has moved from the baseline toward the target. */
  progressToTarget: number | null
  completedHabitsPercentage: number
  daysTracked: number
  missedDays: number
  missedDates: string[]
  windowFrom: string
  windowTo: string
}

export type WeekStatus = 'logged' | 'missed' | 'due'

export interface WeekCheckin {
  week: number
  from: string
  to: string
  status: WeekStatus
  loggedDate: string | null
}

export interface LoggingStatus {
  today: string
  startDate: string
  endDate: string | null
  started: boolean
  dayNumber: number
  totalDays: number | null
  daysLeft: number | null
  hasDailyFields: boolean
  hasWeeklyFields: boolean
  loggedToday: boolean
  /** Days before today, since the start, with no daily log (oldest first). */
  missedDays: string[]
  weeks: WeekCheckin[]
}
