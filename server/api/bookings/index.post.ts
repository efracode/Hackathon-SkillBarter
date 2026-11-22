import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../database'
import { mutateUserCredit } from '../../utils/creditEngine'

const bookingSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  skillId: z.string().uuid(),
  preferredTimeNote: z.string().max(240).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = bookingSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Permintaan booking tidak valid'
    })
  }

  const { sessionId, skillId, preferredTimeNote } = parsed.data
  const db = useDb()
  const learnerId = userSession.user.id

  const booking = await db.transaction(async (tx) => {
    const [skill] = await tx
      .select()
      .from(schema.userSkills)
      .where(
        and(
          eq(schema.userSkills.id, skillId),
          eq(schema.userSkills.direction, 'teach')
        )
      )
      .limit(1)

    if (!skill) {
      throw createError({ statusCode: 404, statusMessage: 'Penawaran skill tidak ditemukan' })
    }

    if (skill.userId === learnerId) {
      throw createError({ statusCode: 400, statusMessage: 'Tidak dapat membooking skill milik sendiri' })
    }

    const [tutor] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, skill.userId))
      .limit(1)

    if (tutor?.teachingCooldownUntil && tutor.teachingCooldownUntil.getTime() > Date.now()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Pengajar sedang dalam masa cooldown sementara'
      })
    }

    if (sessionId) {
      const [targetSession] = await tx
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, sessionId),
            eq(schema.sessions.skillId, skill.id)
          )
        )
        .for('update')
        .limit(1)

      if (!targetSession || targetSession.status !== 'confirmed') {
        throw createError({ statusCode: 404, statusMessage: 'Slot sesi tidak tersedia' })
      }

      if (targetSession.scheduledAt.getTime() <= Date.now()) {
        throw createError({ statusCode: 400, statusMessage: 'Slot sesi sudah melewati waktu mulai' })
      }

      const activeBookings = await tx
        .select()
        .from(schema.sessionBookings)
        .where(
          and(
            eq(schema.sessionBookings.sessionId, targetSession.id),
            inArray(schema.sessionBookings.status, ['confirmed', 'checked_in'])
          )
        )
        .for('update')

      if (activeBookings.some((b) => b.learnerId === learnerId)) {
        throw createError({ statusCode: 400, statusMessage: 'Kamu sudah terdaftar di slot sesi ini' })
      }

      if (activeBookings.length >= targetSession.maxLearners) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Slot sesi sudah penuh. Silakan masuk Hold Queue.'
        })
      }

      const [createdBooking] = await tx
        .insert(schema.sessionBookings)
        .values({
          sessionId: targetSession.id,
          skillId: skill.id,
          learnerId,
          creditsHeld: 1,
          status: 'confirmed'
        })
        .returning()

      if (!createdBooking) {
        throw createError({ statusCode: 500, statusMessage: 'Gagal membuat booking' })
      }

      await mutateUserCredit(tx, {
        userId: learnerId,
        bookingId: createdBooking.id,
        delta: -1,
        reason: `Escrow Booking: ${skill.title}`
      })

      return createdBooking
    }

    // Hold Queue mode (48h expiration, session_id nullable until tutor schedules)
    const [existingQueue] = await tx
      .select({ id: schema.sessionBookings.id })
      .from(schema.sessionBookings)
      .where(
        and(
          eq(schema.sessionBookings.skillId, skill.id),
          eq(schema.sessionBookings.learnerId, learnerId),
          eq(schema.sessionBookings.status, 'queued')
        )
      )
      .limit(1)

    if (existingQueue) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kamu sudah berada di Hold Queue untuk skill ini'
      })
    }

    const holdExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const [queuedBooking] = await tx
      .insert(schema.sessionBookings)
      .values({
        sessionId: null,
        skillId: skill.id,
        learnerId,
        creditsHeld: 1,
        status: 'queued',
        preferredTimeNote: preferredTimeNote?.trim() || null,
        holdExpiresAt
      })
      .returning()

    if (!queuedBooking) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal masuk Hold Queue' })
    }

    await mutateUserCredit(tx, {
      userId: learnerId,
      bookingId: queuedBooking.id,
      delta: -1,
      reason: `Escrow Hold Queue (48 Jam): ${skill.title}`
    })

    return queuedBooking
  })

  return { booking }
})
