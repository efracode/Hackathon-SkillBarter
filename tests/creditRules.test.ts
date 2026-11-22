import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHECKIN_EARLY_MS,
  CHECKIN_LATE_MS,
  TWELVE_HOURS_MS,
  TWO_HOURS_MS,
  computeCooldownDays,
  computeGroupPayout,
  isFreeCancellation,
  isGroupQuorumFailed,
  isWithinCheckinWindow
} from '../server/utils/creditRules'
import { isUkswEmail } from '../server/utils/uksw'

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
