import type { BadgeTone } from '../../components/ui'
import type { TestStatus } from '../../types/health'

export const TEST_STATUSES: TestStatus[] = ['NORMAL', 'LOW', 'HIGH', 'CRITICAL']

export function statusTone(status: TestStatus): BadgeTone {
  switch (status) {
    case 'NORMAL':
      return 'green'
    case 'LOW':
      return 'blue'
    case 'HIGH':
      return 'yellow'
    case 'CRITICAL':
      return 'red'
  }
}

/** Derives a status from the reference range when the user hasn't picked one. */
export function inferStatus(value: number, min?: number, max?: number): TestStatus {
  if (min != null && value < min) return 'LOW'
  if (max != null && value > max) return 'HIGH'
  return 'NORMAL'
}
