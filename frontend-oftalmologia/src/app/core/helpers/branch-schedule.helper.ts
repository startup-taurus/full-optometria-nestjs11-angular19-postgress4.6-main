export interface BranchOpeningScheduleDay {
  day: number
  enabled: boolean
  startTime: string
  endTime: string
}

interface BranchWeekDay {
  day: number
  labelKey: string
}

interface BranchScheduleFormatOptions {
  dayLabelResolver?: (day: number) => string
  closedLabel?: string
}

export const BRANCH_WEEK_DAYS: BranchWeekDay[] = [
  { day: 0, labelKey: 'WORDS.SUNDAY' },
  { day: 1, labelKey: 'WORDS.MONDAY' },
  { day: 2, labelKey: 'WORDS.TUESDAY' },
  { day: 3, labelKey: 'WORDS.WEDNESDAY' },
  { day: 4, labelKey: 'WORDS.THURSDAY' },
  { day: 5, labelKey: 'WORDS.FRIDAY' },
  { day: 6, labelKey: 'WORDS.SATURDAY' },
]

export const LEGACY_DEFAULT_BRANCH_SCHEDULE: BranchOpeningScheduleDay[] = [
  { day: 0, enabled: false, startTime: '08:00', endTime: '18:00' },
  { day: 1, enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 2, enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 3, enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 4, enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 5, enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 6, enabled: false, startTime: '08:00', endTime: '18:00' },
]

export function buildDefaultBranchSchedule(): BranchOpeningScheduleDay[] {
  return LEGACY_DEFAULT_BRANCH_SCHEDULE.map((item) => ({ ...item }))
}

export function parseBranchSchedule(
  openingHours?: string | null
): BranchOpeningScheduleDay[] {
  if (!openingHours?.trim()) {
    return buildDefaultBranchSchedule()
  }

  try {
    const parsed = JSON.parse(openingHours)
    const scheduleSource = Array.isArray(parsed)
      ? parsed
      : parsed?.weeklySchedule

    if (!Array.isArray(scheduleSource) || scheduleSource.length !== 7) {
      return buildDefaultBranchSchedule()
    }

    const normalized = scheduleSource
      .map((item) => normalizeScheduleDay(item))
      .sort((a, b) => a.day - b.day)

    const uniqueDays = new Set(normalized.map((item) => item.day))
    if (uniqueDays.size !== 7) {
      return buildDefaultBranchSchedule()
    }

    return normalized
  } catch {
    return buildDefaultBranchSchedule()
  }
}

export function serializeBranchSchedule(
  schedule: BranchOpeningScheduleDay[]
): string {
  const normalized = schedule
    .map((item) => normalizeScheduleDay(item))
    .sort((a, b) => a.day - b.day)

  return JSON.stringify(normalized)
}

export function isDateTimeWithinBranchSchedule(
  schedule: BranchOpeningScheduleDay[],
  date: Date
): boolean {
  const daySchedule = schedule.find((item) => item.day === date.getDay())
  if (!daySchedule || !daySchedule.enabled) {
    return false
  }

  const appointmentMinutes = date.getHours() * 60 + date.getMinutes()
  const startMinutes = timeToMinutes(daySchedule.startTime)
  const endMinutes = timeToMinutes(daySchedule.endTime)

  return appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes
}

export function formatBranchScheduleForDisplay(
  openingHours?: string | null,
  options: BranchScheduleFormatOptions = {}
): string {
  const schedule = parseBranchSchedule(openingHours)
  const enabledDays = schedule.filter((item) => item.enabled)
  const closedLabel = options.closedLabel ?? 'Closed'

  if (enabledDays.length === 0) {
    return closedLabel
  }

  const groupedRanges = new Map<string, string[]>()

  for (const day of enabledDays) {
    const key = `${day.startTime}-${day.endTime}`
    const dayLabel = getDayLabel(day.day, options.dayLabelResolver)

    if (!groupedRanges.has(key)) {
      groupedRanges.set(key, [])
    }

    groupedRanges.get(key)?.push(dayLabel)
  }

  const parts = Array.from(groupedRanges.entries()).map(([range, days]) => {
    return `${days.join(', ')}: ${range}`
  })

  return parts.join(' | ')
}

export function formatBranchScheduleByDayForDisplay(
  openingHours?: string | null,
  options: BranchScheduleFormatOptions = {}
): string[] {
  const schedule = parseBranchSchedule(openingHours)
  const closedLabel = options.closedLabel ?? 'Closed'

  return schedule
    .sort((a, b) => a.day - b.day)
    .map((item) => {
      const dayLabel = getDayLabel(item.day, options.dayLabelResolver)
      if (!item.enabled) {
        return `${dayLabel}: ${closedLabel}`
      }

      return `${dayLabel}: ${item.startTime} - ${item.endTime}`
    })
}

function getDayLabel(
  day: number,
  dayLabelResolver?: (day: number) => string
): string {
  if (dayLabelResolver) {
    return dayLabelResolver(day)
  }

  return BRANCH_WEEK_DAYS.find((d) => d.day === day)?.labelKey ?? ''
}

function normalizeScheduleDay(value: any): BranchOpeningScheduleDay {
  const day = Number(value?.day)
  const enabled = Boolean(value?.enabled)
  const startTime = toValidTime(value?.startTime)
  const endTime = toValidTime(value?.endTime)

  return {
    day: Number.isInteger(day) && day >= 0 && day <= 6 ? day : 0,
    enabled,
    startTime,
    endTime,
  }
}

function toValidTime(value: unknown): string {
  if (typeof value !== 'string') {
    return '08:00'
  }

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return '08:00'
  }

  return value
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
