import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../../database'
import {
  computeCooldownDays,
  getGroupSessionEarnedCredits,
  mutateUserCredit
} from '../../../../utils/creditEngine'

const resolveSchema = z.object({
  decision: z.enum(['refund', 'release', 'penalize']),
  adminNote: z.string().max(300).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const reportId = getRouterParam(event, 'id')
  if (!reportId) {
    throw createError({ statusCode: 400, statusMessage: 'Report ID diperlukan' })
  }

  const parsed = resolveSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Keputusan tidak valid' })
  }

  const db = useDb()
  const [caller] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userSession.user.id))
    .limit(1)

  if (caller?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Khusus Admin' })
  }

  const { decision, adminNote } = parsed.data

  await db.transaction(async (tx) => {
    const [rep] = await tx
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .for('update')
      .limit(1)

    if (!rep || rep.status !== 'open') {
      throw createError({ statusCode: 404, statusMessage: 'Laporan tidak ditemukan atau sudah selesai' })
    }

    const [sess] = await tx
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, rep.sessionId))
      .for('update')
      .limit(1)

    if (!sess) {
      throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
    }

    const booking = rep.bookingId
      ? (
          await tx
            .select()
            .from(schema.sessionBookings)
            .where(eq(schema.sessionBookings.id, rep.bookingId))
            .for('update')
            .limit(1)
        )[0]
      : null

    if (decision === 'refund') {
      if (booking && ['confirmed', 'checked_in', 'disputed'].includes(booking.status)) {
        await tx
          .update(schema.sessionBookings)
          .set({ status: 'cancelled_free' })
          .where(eq(schema.sessionBookings.id, booking.id))

        await mutateUserCredit(tx, {
          userId: booking.learnerId,
          bookingId: booking.id,
          delta: booking.creditsHeld,
          reason: 'Refund Keputusan Sengketa Admin'
        })
      }

      await tx
        .update(schema.reports)
        .set({ status: 'refunded', adminNote: adminNote?.trim() || null })
        .where(eq(schema.reports.id, rep.id))
      return
    }

    if (decision === 'release') {
      if (booking && ['confirmed', 'checked_in', 'disputed'].includes(booking.status)) {
        let payout = booking.creditsHeld
        if (sess.mode === 'group') {
          const earned = await getGroupSessionEarnedCredits(tx, sess.id)
          payout = Math.max(0, Math.min(booking.creditsHeld, 2 - earned))
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
            reason: 'Pencairan Keputusan Sengketa Admin'
          })
        }
      }

      await tx
        .update(schema.reports)
        .set({ status: 'released', adminNote: adminNote?.trim() || null })
        .where(eq(schema.reports.id, rep.id))
      return
    }

    // decision === 'penalize': refund learner + apply 1->3->7 day cooldown to tutor
    if (booking && ['confirmed', 'checked_in', 'disputed'].includes(booking.status)) {
      await tx
        .update(schema.sessionBookings)
        .set({ status: 'tutor_penalized' })
        .where(eq(schema.sessionBookings.id, booking.id))

      await mutateUserCredit(tx, {
        userId: booking.learnerId,
        bookingId: booking.id,
        delta: booking.creditsHeld,
        reason: 'Refund Sengketa + Penalti Cooldown Pengajar'
      })
    }

    const [tutor] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, sess.tutorId))
      .for('update')
      .limit(1)

    if (tutor) {
      const nextPenalty = tutor.penaltyCount + 1
      const days = computeCooldownDays(nextPenalty)
      const cooldownUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      await tx
        .update(schema.users)
        .set({ penaltyCount: nextPenalty, teachingCooldownUntil: cooldownUntil })
        .where(eq(schema.users.id, tutor.id))
    }

    await tx
      .update(schema.reports)
      .set({ status: 'penalized', adminNote: adminNote?.trim() || null })
      .where(eq(schema.reports.id, rep.id))
  })

  return { ok: true }
})
