// Response shapes of the backend's health modules (mirrors prisma/schema.prisma in longitive-backend).
// Dates arrive as ISO strings.

/** Recorded for documents scanned with Mistral OCR. The file itself stays private. */
export interface OcrInfo {
  fileKey?: string | null
  ocrModel?: string | null
  ocrPages?: number | null
  ocrMs?: number | null
  ocrCostUsd?: number | null
}

/** OCR uploads say whether the same file had been uploaded before (then nothing new was created). */
export type OcrUpload<T> = T & { alreadyUploaded?: boolean }

export interface BodyComposition extends OcrInfo {
  id: string
  date: string
  height?: number | null
  weight?: number | null
  bmi?: number | null
  bodyFat?: number | null
  visceralFat?: number | null
  subcutaneousFat?: number | null
  muscleMass?: number | null
  boneMass?: number | null
  bodyWater?: number | null
  bmr?: number | null
  metabolicAge?: number | null
  waist?: number | null
  hip?: number | null
  chest?: number | null
  bloodPressureSystolic?: number | null
  bloodPressureDiastolic?: number | null
  heartRate?: number | null
  spo2?: number | null
  source: 'MANUAL' | 'OCR'
  sourceImageUrl?: string | null
}

export type BodyCompositionMetric = Exclude<keyof BodyComposition, 'id' | 'date' | 'source' | 'sourceImageUrl' | keyof OcrInfo>

export interface BodyCompositionTrends {
  records: BodyComposition[]
  trends: Partial<Record<'weight' | 'bmi' | 'bodyFat' | 'muscleMass' | 'visceralFat', { change: number; direction: 'up' | 'down' | 'stable' }>>
}

export type TestStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL'

export interface LabTestResult {
  id: string
  reportId: string
  testName: string
  category?: string | null
  value: number
  unit?: string | null
  referenceMin?: number | null
  referenceMax?: number | null
  status: TestStatus
  notes?: string | null
}

export interface LabReport extends OcrInfo {
  id: string
  reportDate: string
  labName?: string | null
  reportType?: string | null
  fileUrl?: string | null
  source: 'MANUAL' | 'OCR'
  verified: boolean
  results: LabTestResult[]
  createdAt: string
}

export interface LabTrendPoint extends LabTestResult {
  report: { reportDate: string }
}

export type LabSpreadsheetRow = { date: string } & Record<string, { value: number; unit?: string | null; status: TestStatus } | string>

export interface SleepLog {
  id: string
  date: string
  bedtime?: string | null
  wakeTime?: string | null
  duration?: number | null
  quality?: number | null
  notes?: string | null
}

export interface SleepScore {
  score: number
  avgDuration: number
  avgQuality: number
}

export interface MoodLog {
  id: string
  date: string
  mood?: number | null
  energy?: number | null
  stressLevel?: number | null
  notes?: string | null
}

export interface ExercisePlan {
  id: string
  goal?: string | null
  equipmentLevel?: string | null
  weeklySchedule?: unknown
  createdAt: string
}

export interface ExerciseLog {
  id: string
  date: string
  exerciseType: string
  duration?: number | null
  intensity?: string | null
  heartRateAvg?: number | null
  notes?: string | null
}

export interface ExerciseStats {
  totalSessions: number
  totalMinutes: number
  avgHeartRate: number
  byType: Record<string, number>
}

export interface DietPlan {
  id: string
  preferences?: Record<string, unknown> | null
  targetCalories?: number | null
  macroSplit?: Record<string, unknown> | null
  meals?: unknown
  startDate?: string | null
  createdAt: string
}

export interface SupplementPlan {
  id: string
  supplements?: unknown
  ayurvedicRemedies?: unknown
  createdAt: string
}

export interface HydrationPlan {
  id: string
  dailyTarget?: number | null
  schedule?: { time: string; amount: number; unit: string }[] | null
  createdAt: string
}

export interface DailyChart {
  id: string
  date: string
  schedule?: { time: string; activity: string; detail: string }[] | null
}

export interface ChecklistItem {
  task: string
  completed: boolean
  time?: string
}

export interface DailyChecklist {
  id: string
  date: string
  items: ChecklistItem[] | null
}

export interface ProgressStreak {
  currentStreak: number
  longestStreak: number
  lastCompletedDate?: string | null
}

export interface DailyScore {
  score: number
  total: number
  percentage: number
}

export interface WeeklyProgressReport {
  dailyScores: { date: string; score: number }[]
  averageScore: number
  daysTracked: number
}

export interface Reminder {
  id: string
  type: string
  title: string
  message?: string | null
  cronExpression: string
  isActive: boolean
  lastSentAt?: string | null
}

export type InventoryItemType = 'MED' | 'SUPPLEMENT'

export interface InventoryItem {
  id: string
  name: string
  type: InventoryItemType
  quantity: number
  unit?: string | null
  dailyDosage?: number | null
  reorderThresholdDays?: number | null
  expiryDate?: string | null
  costPerUnit?: number | null
}

export interface ReorderAlert extends InventoryItem {
  daysRemaining: number
}

export interface HealthScore {
  overall: number
  breakdown: Partial<Record<'bmi' | 'sleep' | 'exercise' | 'adherence' | 'mood', number>>
}

export interface AnalyticsDashboard {
  healthScore: HealthScore
  streak: ProgressStreak | null
  latestBodyComp: BodyComposition | null
  recentLabReports: LabReport[]
}
