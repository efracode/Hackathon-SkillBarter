import { eq } from 'drizzle-orm'
import { useDb, schema } from '../../../database'
import { getGroupSessionEarnedCredits, mutateUserCredit } from '../../../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const bookingId = getRouterParam(event, 'id')
  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: 'Booking ID diperlukan' })
  }

  const db = useDb()
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(schema.sessionBookings)
      .where(eq(schema.sessionBookings.id, bookingId))
      .for('update')
      .limit(1)

    if (!booking) {
      throw createError({ statusCode: 404, statusMessage: 'Booking tidak ditemukan' })
    }

    if (booking.learnerId !== userSession.user!.id) {
      throw createError({ statusCode: 403, statusMessage: 'Akses ditolak' })
    }

    if (booking.status === 'queued') {
      await tx
        .update(schema.sessionBookings)
        .set({ status: 'cancelled_free' })
        .where(eq(schema.sessionBookings.id, booking.id))

      await mutateUserCredit(tx, {
        userId: booking.learnerId,
        bookingId: booking.id,
        delta: booking.creditsHeld,
        reason: 'Refund Batal dari Hold Queue'
      })

      return { status: 'cancelled_free', refunded: true }
    }

    if (booking.status !== 'confirmed' || !booking.sessionId) {
      throw createError({ statusCode: 400, statusMessage: 'Booking tidak dapat dibatalkan pada status ini' })
    }

    const [sess] = await tx
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, booking.sessionId))
      .for('update')
      .limit(1)

    if (!sess) {
      throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
    }

    const twelveHoursMs = 12 * 60 * 60 * 1000
    const isFreeCancel = sess.scheduledAt.getTime() - Date.now() >= twelveHoursMs

    if (isFreeCancel) {
      await tx
        .update(schema.sessionBookings)
        .set({ status: 'cancelled_free' })
        .where(eq(schema.sessionBookings.id, booking.id))

      await mutateUserCredit(tx, {
        userId: booking.learnerId,
        bookingId: booking.id,
        delta: booking.creditsHeld,
        reason: 'Refund Batal Gratis (>= 12 Jam Sebelum Sesi)'
      })

      return { status: 'cancelled_free', refunded: true }
    }

    // Late cancellation (< 12h): credit forfeited to tutor (respecting group cap of 2)
    let tutorPayout = booking.creditsHeld
    if (sess.mode === 'group') {
      const earnedSoFar = await getGroupSessionEarnedCredits(tx, sess.id)
      tutorPayout = Math.max(0, Math.min(booking.creditsHeld, 2 - earnedSoFar))
    }

    await tx
      .update(schema.sessionBookings)
      .set({ status: 'forfeited_to_tutor' })
      .where(eq(schema.sessionBookings.id, booking.id))

    if (tutorPayout > 0) {
      await mutateUserCredit(tx, {
        userId: sess.tutorId,
        bookingId: booking.id,
        delta: tutorPayout,
        reason: 'Kompensasi Pembatalan Terlambat (< 12 Jam)'
      })
    }

    return { status: 'forfeited_to_tutor', refunded: false }
  })

  return result
})
