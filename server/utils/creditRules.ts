export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
export const CHECKIN_EARLY_MS = 10 * 60 * 1000
export const CHECKIN_LATE_MS = 15 * 60 * 1000

export function computeCooldownDays(nextPenaltyCount: number): number {
  if (nextPenaltyCount <= 1) return 1
  if (nextPenaltyCount === 2) return 3
  return 7
}

export function computeGroupPayout(creditsHeld: number, earnedSoFar: number): number {
  return Math.max(0, Math.min(creditsHeld, 2 - earnedSoFar))
}

export function isFreeCancellation(scheduledAtMs: number, nowMs: number): boolean {
  return scheduledAtMs - nowMs >= TWELVE_HOURS_MS
}

export function isWithinCheckinWindow(scheduledAtMs: number, nowMs: number): boolean {
  return nowMs >= scheduledAtMs - CHECKIN_EARLY_MS && nowMs <= scheduledAtMs + CHECKIN_LATE_MS
}

export function isGroupQuorumFailed(
  mode: string,
  scheduledAtMs: number,
  confirmedCount: number,
  nowMs: number
): boolean {
  if (mode !== 'group') return false
  return nowMs >= scheduledAtMs - TWO_HOURS_MS && confirmedCount < 2
}

export function isLearnerNoShow(params: {
  bookingStatus: string
  sessionStatus: string
  hasCheckinCode: boolean
  scheduledAtMs: number
  nowMs: number
}): boolean {
  if (params.bookingStatus !== 'confirmed' || params.sessionStatus !== 'confirmed') return false
  if (!params.hasCheckinCode) return false
  return params.nowMs > params.scheduledAtMs + CHECKIN_LATE_MS
}

export function shouldMarkSessionCompleted(activeBookingsCount: number): boolean {
  return activeBookingsCount === 0
}
