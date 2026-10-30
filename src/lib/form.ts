/**
 * Drops empty form values before sending a DTO: blank strings, NaN (an empty
 * `valueAsNumber` input) and undefined. The backend's ValidationPipe rejects
 * `""` for @IsNumber / @IsDateString fields, so they must be omitted instead.
 */
export function compact<T extends object>(values: T): T {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && v !== null && !(typeof v === 'number' && Number.isNaN(v))),
  ) as T
}

/** `register` options for an optional numeric input. */
export const optionalNumber = { setValueAs: (v: string) => (v === '' || v == null ? undefined : Number(v)) }
