import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'

const checkinSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Kode check-in harus 6 digit angka')
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

  const parsed = checkinSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Format kode check-in tidak valid'
    })
  }

  const db = useDb()
  const learnerId = userSession.user.id

  const result = await db.transaction(async (tx) => {
    const [sess] = await tx
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1)

    if (!sess) {
      throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
    }

    if (!sess.checkinCode) {
      throw createError({ statusCode: 400, statusMessage: 'Pengajar belum membuat kode check-in' })
    }

    if (Date.now() > sess.scheduledAt.getTime() + 15 * 60 * 1000) {
      throw createError({ statusCode: 400, statusMessage: 'Window check-in 15 menit sudah berakhir' })
    }

    if (parsed.data.code !== sess.checkinCode) {
      throw createError({ statusCode: 400, statusMessage: 'Kode check-in 6 digit tidak sesuai' })
    }

    const [booking] = await tx
      .select()
      .from(schema.sessionBookings)
      .where(
        and(
          eq(schema.sessionBookings.sessionId, sess.id),
          eq(schema.sessionBookings.learnerId, learnerId)
        )
      )
      .for('update')
      .limit(1)

    if (!booking) {
      throw createError({ statusCode: 404, statusMessage: 'Booking tidak ditemukan' })
    }

    if (booking.status === 'checked_in' || booking.status === 'completed') {
      return { ok: true, disputeEndsAt: booking.disputeEndsAt }
    }

    if (booking.status !== 'confirmed') {
      throw createError({ statusCode: 400, statusMessage: 'Status booking tidak valid untuk check-in' })
    }

    const now = new Date()
    const disputeEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await tx
      .update(schema.sessionBookings)
      .set({
        status: 'checked_in',
        checkedInAt: now,
        disputeEndsAt
      })
      .where(eq(schema.sessionBookings.id, booking.id))

    return { ok: true, disputeEndsAt }
  })

  return result
})
