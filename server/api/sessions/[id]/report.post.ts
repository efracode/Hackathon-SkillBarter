import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'

const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Jelaskan masalah minimal 5 karakter').max(600)
})

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const sessionId = getRouterParam(event, 'id')
  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session ID diperlukan' })
  }

  const parsed = reportSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Laporan tidak valid'
    })
  }

  const db = useDb()
  const reporterId = userSession.user.id

  const report = await db.transaction(async (tx) => {
    const [sess] = await tx
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1)

    if (!sess) {
      throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
    }

    const [booking] = await tx
      .select()
      .from(schema.sessionBookings)
      .where(
        and(
          eq(schema.sessionBookings.sessionId, sessionId),
          eq(schema.sessionBookings.learnerId, reporterId)
        )
      )
      .for('update')
      .limit(1)

    if (!booking && sess.tutorId !== reporterId) {
      throw createError({ statusCode: 403, statusMessage: 'Kamu bukan peserta sesi ini' })
    }

    if (booking && ['confirmed', 'checked_in'].includes(booking.status)) {
      await tx
        .update(schema.sessionBookings)
        .set({ status: 'disputed' })
        .where(eq(schema.sessionBookings.id, booking.id))
    }

    const [created] = await tx
      .insert(schema.reports)
      .values({
        sessionId,
        bookingId: booking?.id ?? null,
        reporterId,
        reason: parsed.data.reason,
        status: 'open'
      })
      .returning()

    return created
  })

  return { report }
})
