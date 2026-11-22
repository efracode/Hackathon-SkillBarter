import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'

const msgSchema = z.object({
  body: z.string().trim().min(1, 'Pesan tidak boleh kosong').max(1000)
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

  const parsed = msgSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Pesan tidak valid'
    })
  }

  const db = useDb()
  const [sess] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)

  if (!sess) {
    throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
  }

  const userId = userSession.user.id
  if (sess.tutorId !== userId) {
    const bookings = await db
      .select({ learnerId: schema.sessionBookings.learnerId })
      .from(schema.sessionBookings)
      .where(eq(schema.sessionBookings.sessionId, sessionId))
    if (!bookings.some((b) => b.learnerId === userId)) {
      throw createError({ statusCode: 403, statusMessage: 'Akses chat ditolak' })
    }
  }

  const [created] = await db
    .insert(schema.chatMessages)
    .values({
      sessionId,
      senderId: userId,
      body: parsed.data.body
    })
    .returning()

  return { message: created }
})
