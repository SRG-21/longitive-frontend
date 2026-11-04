import type { BodyCompositionMetric } from '../../types/health'

export const METRIC_GROUPS = ['Body', 'Composition', 'Weight control', 'Measurements', 'Vitals'] as const
export type MetricGroup = (typeof METRIC_GROUPS)[number]

export interface MetricMeta {
  key: BodyCompositionMetric
  label: string
  unit: string
  group: MetricGroup
  int?: boolean
  /** Signed kg targets (e.g. "-21.7 kg") */
  signed?: boolean
}

export const METRICS: MetricMeta[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', group: 'Body' },
  { key: 'height', label: 'Height', unit: 'cm', group: 'Body' },
  { key: 'bmi', label: 'BMI', unit: '', group: 'Body' },
  { key: 'bmr', label: 'BMR', unit: 'kcal', group: 'Body' },
  { int: true, key: 'metabolicAge', label: 'Metabolic / body age', unit: 'yrs', group: 'Body' },
  { int: true, key: 'age', label: 'Age', unit: 'yrs', group: 'Body' },
  { int: true, key: 'bodyScore', label: 'Body score', unit: 'pts', group: 'Body' },
  { key: 'bodyFat', label: 'Body fat', unit: '%', group: 'Composition' },
  { key: 'fatMass', label: 'Fat mass', unit: 'kg', group: 'Composition' },
  { key: 'visceralFat', label: 'Visceral fat', unit: '', group: 'Composition' },
  { key: 'subcutaneousFat', label: 'Subcutaneous fat', unit: '%', group: 'Composition' },
  { key: 'subcutaneousFatMass', label: 'Subcutaneous fat mass', unit: 'kg', group: 'Composition' },
  { key: 'muscleMass', label: 'Muscle mass', unit: 'kg', group: 'Composition' },
  { key: 'skeletalMuscleMass', label: 'Skeletal muscle mass', unit: 'kg', group: 'Composition' },
  { key: 'bodyWater', label: 'Body water', unit: '%', group: 'Composition' },
  { key: 'bodyWaterMass', label: 'Body water mass', unit: 'kg', group: 'Composition' },
  { key: 'proteinMass', label: 'Protein mass', unit: 'kg', group: 'Composition' },
  { key: 'mineralMass', label: 'Mineral mass', unit: 'kg', group: 'Composition' },
  { key: 'boneMass', label: 'Bone mass', unit: 'kg', group: 'Composition' },
  { key: 'standardWeight', label: 'Standard weight', unit: 'kg', group: 'Weight control' },
  { signed: true, key: 'weightControl', label: 'Weight control', unit: 'kg', group: 'Weight control' },
  { signed: true, key: 'fatControl', label: 'Fat control', unit: 'kg', group: 'Weight control' },
  { signed: true, key: 'muscleControl', label: 'Muscle control', unit: 'kg', group: 'Weight control' },
  { key: 'waist', label: 'Waist', unit: 'cm', group: 'Measurements' },
  { key: 'hip', label: 'Hip', unit: 'cm', group: 'Measurements' },
  { key: 'chest', label: 'Chest', unit: 'cm', group: 'Measurements' },
  { int: true, key: 'bloodPressureSystolic', label: 'BP systolic', unit: 'mmHg', group: 'Vitals' },
  { int: true, key: 'bloodPressureDiastolic', label: 'BP diastolic', unit: 'mmHg', group: 'Vitals' },
  { int: true, key: 'heartRate', label: 'Resting heart rate', unit: 'bpm', group: 'Vitals' },
  { key: 'spo2', label: 'SpO₂', unit: '%', group: 'Vitals' },
]

export function metricMeta(key: BodyCompositionMetric) {
  return METRICS.find((m) => m.key === key)!
}

export function formatMetric(key: BodyCompositionMetric, value: number) {
  const meta = metricMeta(key)
  const sign = meta.signed && value > 0 ? '+' : ''
  return `${sign}${value}${meta.unit ? ` ${meta.unit}` : ''}`
}
