import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHECKIN_EARLY_MS,
  CHECKIN_LATE_MS,
  FORTY_EIGHT_HOURS_MS,
  TWELVE_HOURS_MS,
  TWENTY_FOUR_HOURS_MS,
  TWO_HOURS_MS,
  computeCooldownDays,
  computeGroupPayout,
  isFreeCancellation,
  isGroupQuorumFailed,
  isLearnerNoShow,
  isWithinCheckinWindow,
  shouldMarkSessionCompleted
} from '../server/utils/creditRules'
import { isUkswEmail } from '../server/utils/uksw'
import { avatarUrlSchema } from '../server/utils/validation'

test('cooldown escalation follows 1 -> 3 -> 7 days cap', () => {
  assert.equal(computeCooldownDays(1), 1)
  assert.equal(computeCooldownDays(2), 3)
  assert.equal(computeCooldownDays(3), 7)
  assert.equal(computeCooldownDays(5), 7)
})

test('group session payout caps total tutor earnings at 2 credits', () => {
  assert.equal(computeGroupPayout(1, 0), 1)
  assert.equal(computeGroupPayout(1, 1), 1)
  assert.equal(computeGroupPayout(1, 2), 0)
  assert.equal(computeGroupPayout(1, 3), 0)
})

test('free cancellation requires at least 12 hours before scheduled start', () => {
  const scheduled = 1_700_000_000_000
  assert.equal(isFreeCancellation(scheduled, scheduled - TWELVE_HOURS_MS), true)
  assert.equal(isFreeCancellation(scheduled, scheduled - TWELVE_HOURS_MS + 1), false)
})

test('check-in window opens T-10m and closes T+15m', () => {
  const scheduled = 1_700_000_000_000
  assert.equal(isWithinCheckinWindow(scheduled, scheduled - CHECKIN_EARLY_MS - 1), false)
  assert.equal(isWithinCheckinWindow(scheduled, scheduled - CHECKIN_EARLY_MS), true)
  assert.equal(isWithinCheckinWindow(scheduled, scheduled + CHECKIN_LATE_MS), true)
  assert.equal(isWithinCheckinWindow(scheduled, scheduled + CHECKIN_LATE_MS + 1), false)
})

test('group quorum fails at T-2h when fewer than 2 learners confirmed', () => {
  const scheduled = 1_700_000_000_000
  assert.equal(isGroupQuorumFailed('group', scheduled, 1, scheduled - TWO_HOURS_MS), true)
  assert.equal(isGroupQuorumFailed('group', scheduled, 2, scheduled - TWO_HOURS_MS), false)
  assert.equal(isGroupQuorumFailed('group', scheduled, 1, scheduled - TWO_HOURS_MS - 1), false)
  assert.equal(isGroupQuorumFailed('1on1', scheduled, 1, scheduled - TWO_HOURS_MS), false)
})

test('Verified UKSW badge matches @student.uksw.edu and @uksw.edu only', () => {
  assert.equal(isUkswEmail('672022001@student.uksw.edu'), true)
  assert.equal(isUkswEmail('dosen@uksw.edu'), true)
  assert.equal(isUkswEmail('USER@STUDENT.UKSW.EDU'), true)
  assert.equal(isUkswEmail('user@gmail.com'), false)
  assert.equal(isUkswEmail('fake@notuksw.edu'), false)
  assert.equal(isUkswEmail(null), false)
})

test('learner no-show triggers only after T+15m when checkin code exists and booking is confirmed', () => {
  const scheduled = 1_700_000_000_000
  assert.equal(
    isLearnerNoShow({
      bookingStatus: 'confirmed',
      sessionStatus: 'confirmed',
      hasCheckinCode: true,
      scheduledAtMs: scheduled,
      nowMs: scheduled + CHECKIN_LATE_MS
    }),
    false
  )
  assert.equal(
    isLearnerNoShow({
      bookingStatus: 'confirmed',
      sessionStatus: 'confirmed',
      hasCheckinCode: true,
      scheduledAtMs: scheduled,
      nowMs: scheduled + CHECKIN_LATE_MS + 1
    }),
    true
  )
  assert.equal(
    isLearnerNoShow({
      bookingStatus: 'confirmed',
      sessionStatus: 'confirmed',
      hasCheckinCode: false,
      scheduledAtMs: scheduled,
      nowMs: scheduled + CHECKIN_LATE_MS + 1
    }),
    false
  )
  for (const terminalOrNonEligible of ['checked_in', 'completed', 'forfeited_to_tutor', 'cancelled_free', 'disputed']) {
    assert.equal(
      isLearnerNoShow({
        bookingStatus: terminalOrNonEligible,
        sessionStatus: 'confirmed',
        hasCheckinCode: true,
        scheduledAtMs: scheduled,
        nowMs: scheduled + CHECKIN_LATE_MS + 10_000
      }),
      false
    )
  }
})

test('group cap of 2 credits still applies during learner no-show payout', () => {
  assert.equal(computeGroupPayout(1, 0), 1)
  assert.equal(computeGroupPayout(1, 1), 1)
  assert.equal(computeGroupPayout(1, 2), 0)
})

test('session marks completed only when zero active bookings remain after dispute resolution', () => {
  assert.equal(shouldMarkSessionCompleted(2), false)
  assert.equal(shouldMarkSessionCompleted(1), false)
  assert.equal(shouldMarkSessionCompleted(0), true)
})

test('hold queue expiration and dispute payout windows match 48h and 24h rules', () => {
  assert.equal(FORTY_EIGHT_HOURS_MS, 48 * 60 * 60 * 1000)
  assert.equal(TWENTY_FOUR_HOURS_MS, 24 * 60 * 60 * 1000)
})

test('avatarUrlSchema accepts safe image data URLs and HTTPS URLs while rejecting invalid inputs', () => {
  assert.equal(avatarUrlSchema.safeParse('').success, true)
  assert.equal(avatarUrlSchema.safeParse(null).success, true)
  assert.equal(avatarUrlSchema.safeParse('https://lh3.googleusercontent.com/a/photo.jpg').success, true)
  assert.equal(avatarUrlSchema.safeParse('data:image/webp;base64,UklGRh4AAABXRUJQ').success, true)
  assert.equal(avatarUrlSchema.safeParse('javascript:alert(1)').success, false)
  assert.equal(avatarUrlSchema.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success, false)
})
