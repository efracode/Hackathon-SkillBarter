import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Ulasan minimal 5 karakter').max(500)
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

  const parsed = reviewSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input ulasan tidak valid'
    })
  }

  const db = useDb()
  const learnerId = userSession.user.id

  const [sess] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)

  if (!sess) {
    throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
  }

  const [booking] = await db
    .select()
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.sessionId, sessionId),
        eq(schema.sessionBookings.learnerId, learnerId)
      )
    )
    .limit(1)

  if (!booking || !booking.checkedInAt) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Ulasan hanya terbuka setelah kehadiranmu terverifikasi melalui Check-in'
    })
  }

  const [existing] = await db
    .select({ id: schema.reviews.id })
    .from(schema.reviews)
    .where(eq(schema.reviews.bookingId, booking.id))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Kamu sudah mengirim ulasan untuk sesi ini' })
  }

  const [created] = await db
    .insert(schema.reviews)
    .values({
      sessionId,
      bookingId: booking.id,
      reviewerId: learnerId,
      tutorId: sess.tutorId,
      rating: parsed.data.rating,
      comment: parsed.data.comment
    })
    .returning()

  return { review: created }
})
