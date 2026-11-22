import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'
import { mutateUserCredit } from '../../../utils/creditEngine'

const respondSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('decline')
  }),
  z.object({
    action: z.literal('accept'),
    durationMinutes: z.union([z.literal(30), z.literal(60)]),
    format: z.enum(['online', 'in_person']),
    locationOrLink: z.string().min(3).max(300),
    scheduledAt: z.string().datetime()
  })
])

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const bookingId = getRouterParam(event, 'id')
  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: 'Booking ID diperlukan' })
  }

  const parsed = respondSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input konfirmasi tidak valid'
    })
  }

  const db = useDb()
  const tutorId = userSession.user.id

  const result = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(schema.sessionBookings)
      .where(eq(schema.sessionBookings.id, bookingId))
      .for('update')
      .limit(1)

    if (!booking || booking.status !== 'queued') {
      throw createError({ statusCode: 404, statusMessage: 'Permintaan Hold Queue tidak ditemukan' })
    }

    const [skill] = await tx
      .select()
      .from(schema.userSkills)
      .where(eq(schema.userSkills.id, booking.skillId))
      .limit(1)

    if (!skill || skill.userId !== tutorId) {
      throw createError({ statusCode: 403, statusMessage: 'Hanya pengajar pemilik skill yang dapat merespons' })
    }

    if (parsed.data.action === 'decline') {
      await tx
        .update(schema.sessionBookings)
        .set({ status: 'cancelled_free' })
        .where(eq(schema.sessionBookings.id, booking.id))

      await mutateUserCredit(tx, {
        userId: booking.learnerId,
        bookingId: booking.id,
        delta: booking.creditsHeld,
        reason: `Refund Hold Queue Ditolak Pengajar: ${skill.title}`
      })

      return { status: 'declined', sessionId: null }
    }

    const [tutor] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, tutorId))
      .limit(1)

    if (tutor?.teachingCooldownUntil && tutor.teachingCooldownUntil.getTime() > Date.now()) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Mode mengajar sedang dalam masa cooldown'
      })
    }

    const scheduledDate = new Date(parsed.data.scheduledAt)
    if (scheduledDate.getTime() <= Date.now()) {
      throw createError({ statusCode: 400, statusMessage: 'Jadwal sesi harus di masa depan' })
    }

    const [createdSession] = await tx
      .insert(schema.sessions)
      .values({
        tutorId,
        skillId: skill.id,
        mode: '1on1',
        durationMinutes: parsed.data.durationMinutes,
        format: parsed.data.format,
        locationOrLink: parsed.data.locationOrLink.trim(),
        scheduledAt: scheduledDate,
        maxLearners: 1,
        status: 'confirmed'
      })
      .returning()

    if (!createdSession) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal menjadwalkan sesi' })
    }

    await tx
      .update(schema.sessionBookings)
      .set({
        sessionId: createdSession.id,
        status: 'confirmed',
        holdExpiresAt: null
      })
      .where(eq(schema.sessionBookings.id, booking.id))

    return { status: 'confirmed', sessionId: createdSession.id }
  })

  return result
})
