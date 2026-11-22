import { and, eq, inArray, isNull, lte, ne, sql } from 'drizzle-orm'
import { useDb, schema } from '../database'
import { computeCooldownDays, computeGroupPayout } from './creditRules'

type DbInstance = ReturnType<typeof useDb>
type TxInstance = Parameters<Parameters<DbInstance['transaction']>[0]>[0]

export async function mutateUserCredit(
  tx: TxInstance,
  params: {
    userId: string
    bookingId: string | null
    delta: number
    reason: string
  }
) {
  const [lockedUser] = await tx
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, params.userId))
    .for('update')
    .limit(1)

  if (!lockedUser) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  const nextBalance = lockedUser.creditBalance + params.delta
  if (nextBalance < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Saldo kredit tidak mencukupi' })
  }

  const [updated] = await tx
    .update(schema.users)
    .set({ creditBalance: nextBalance })
    .where(eq(schema.users.id, lockedUser.id))
    .returning()

  await tx.insert(schema.creditLedger).values({
    userId: lockedUser.id,
    bookingId: params.bookingId,
    delta: params.delta,
    balanceAfter: nextBalance,
    reason: params.reason
  })

  return updated
}

export async function getGroupSessionEarnedCredits(tx: TxInstance, sessionId: string): Promise<number> {
  const rows = await tx
    .select({ id: schema.sessionBookings.id })
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.sessionId, sessionId),
        inArray(schema.sessionBookings.status, ['completed', 'forfeited_to_tutor'])
      )
    )
  return Math.min(2, rows.length)
}

export async function runLazyChecks(db: DbInstance) {
  const now = new Date()

  // 1. Auto-expire Hold Queue bookings older than 48h
  const expiredQueues = await db
    .select({ id: schema.sessionBookings.id })
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.status, 'queued'),
        lte(schema.sessionBookings.holdExpiresAt, now)
      )
    )

  for (const q of expiredQueues) {
    await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(schema.sessionBookings)
        .where(eq(schema.sessionBookings.id, q.id))
        .for('update')
        .limit(1)

      if (!booking || booking.status !== 'queued') return

      await tx
        .update(schema.sessionBookings)
        .set({ status: 'expired' })
        .where(eq(schema.sessionBookings.id, booking.id))

      await mutateUserCredit(tx, {
        userId: booking.learnerId,
        bookingId: booking.id,
        delta: booking.creditsHeld,
        reason: 'Refund Otomatis Hold Queue 48 Jam Kedaluwarsa'
      })
    })
  }

  // 2. Auto-cancel group sessions with < 2 confirmed learners at T - 2 hours
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const candidateGroupSessions = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.mode, 'group'),
        eq(schema.sessions.status, 'confirmed'),
        lte(schema.sessions.scheduledAt, twoHoursAhead)
      )
    )

  for (const sess of candidateGroupSessions) {
    await db.transaction(async (tx) => {
      const [lockedSession] = await tx
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sess.id))
        .for('update')
        .limit(1)

      if (!lockedSession || lockedSession.status !== 'confirmed') return

      const confirmedBookings = await tx
        .select()
        .from(schema.sessionBookings)
        .where(
          and(
            eq(schema.sessionBookings.sessionId, lockedSession.id),
            eq(schema.sessionBookings.status, 'confirmed')
          )
        )
        .for('update')

      if (confirmedBookings.length >= 2) return

      await tx
        .update(schema.sessions)
        .set({ status: 'cancelled' })
        .where(eq(schema.sessions.id, lockedSession.id))

      for (const b of confirmedBookings) {
        await tx
          .update(schema.sessionBookings)
          .set({ status: 'cancelled_free' })
          .where(eq(schema.sessionBookings.id, b.id))

        await mutateUserCredit(tx, {
          userId: b.learnerId,
          bookingId: b.id,
          delta: b.creditsHeld,
          reason: 'Refund Otomatis Kuorum Grup < 2 pada T-2 Jam'
        })
      }
    })
  }

  // 3. Auto-penalize tutor no-show if > 15m past scheduledAt and checkin_code was never created
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000)
  const missedCheckinSessions = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.status, 'confirmed'),
        isNull(schema.sessions.checkinCode),
        lte(schema.sessions.scheduledAt, fifteenMinsAgo)
      )
    )

  for (const s of missedCheckinSessions) {
    await db.transaction(async (tx) => {
      const [lockedSession] = await tx
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, s.id))
        .for('update')
        .limit(1)

      if (!lockedSession || lockedSession.status !== 'confirmed' || lockedSession.checkinCode) return

      const activeBookings = await tx
        .select()
        .from(schema.sessionBookings)
        .where(
          and(
            eq(schema.sessionBookings.sessionId, lockedSession.id),
            eq(schema.sessionBookings.status, 'confirmed')
          )
        )
        .for('update')

      await tx
        .update(schema.sessions)
        .set({ status: 'tutor_penalized' })
        .where(eq(schema.sessions.id, lockedSession.id))

      for (const b of activeBookings) {
        await tx
          .update(schema.sessionBookings)
          .set({ status: 'tutor_penalized' })
          .where(eq(schema.sessionBookings.id, b.id))

        await mutateUserCredit(tx, {
          userId: b.learnerId,
          bookingId: b.id,
          delta: b.creditsHeld,
          reason: 'Refund 100% Tutor No-Show (Kode Check-in Tidak Dibuat)'
        })
      }

      if (activeBookings.length > 0) {
        const [tutor] = await tx
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, lockedSession.tutorId))
          .for('update')
          .limit(1)

        if (tutor) {
          const nextPenalty = tutor.penaltyCount + 1
          const cooldownDays = computeCooldownDays(nextPenalty)
          const cooldownUntil = new Date(now.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
          await tx
            .update(schema.users)
            .set({
              penaltyCount: nextPenalty,
              teachingCooldownUntil: cooldownUntil
            })
            .where(eq(schema.users.id, tutor.id))
        }
      }
    })
  }

  // 4. Auto-release escrow after 24h dispute window for checked_in bookings with no open reports
  const readyForPayout = await db
    .select({ id: schema.sessionBookings.id })
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.status, 'checked_in'),
        lte(schema.sessionBookings.disputeEndsAt, now)
      )
    )

  for (const r of readyForPayout) {
    await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(schema.sessionBookings)
        .where(eq(schema.sessionBookings.id, r.id))
        .for('update')
        .limit(1)

      if (!booking || booking.status !== 'checked_in' || !booking.sessionId) return

      const [openReport] = await tx
        .select({ id: schema.reports.id })
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.bookingId, booking.id),
            eq(schema.reports.status, 'open')
          )
        )
        .limit(1)

      if (openReport) return

      const [sess] = await tx
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, booking.sessionId))
        .limit(1)

      if (!sess) return

      let payout = booking.creditsHeld
      if (sess.mode === 'group') {
        const earnedSoFar = await getGroupSessionEarnedCredits(tx, sess.id)
        payout = computeGroupPayout(booking.creditsHeld, earnedSoFar)
      }

      await tx
        .update(schema.sessionBookings)
        .set({ status: 'completed' })
        .where(eq(schema.sessionBookings.id, booking.id))

      if (payout > 0) {
        await mutateUserCredit(tx, {
          userId: sess.tutorId,
          bookingId: booking.id,
          delta: payout,
          reason: `Pencairan Sesi Selesai (${sess.mode === 'group' ? 'Grup' : '1-on-1'})`
        })
      }

      const [remainingActive] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.sessionBookings)
        .where(
          and(
            eq(schema.sessionBookings.sessionId, sess.id),
            ne(schema.sessionBookings.status, 'completed'),
            ne(schema.sessionBookings.status, 'cancelled_free'),
            ne(schema.sessionBookings.status, 'forfeited_to_tutor')
          )
        )

      if ((remainingActive?.count ?? 0) === 0) {
        await tx
          .update(schema.sessions)
          .set({ status: 'completed' })
          .where(eq(schema.sessions.id, sess.id))
      }
    })
  }
}
