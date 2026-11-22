import { asc, eq } from 'drizzle-orm'
import { useDb, schema } from '../../../database'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const sessionId = getRouterParam(event, 'id')
  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session ID diperlukan' })
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

  const messages = await db
    .select({
      id: schema.chatMessages.id,
      senderId: schema.chatMessages.senderId,
      body: schema.chatMessages.body,
      createdAt: schema.chatMessages.createdAt,
      senderName: schema.users.name,
      senderAvatar: schema.users.avatarUrl
    })
    .from(schema.chatMessages)
    .innerJoin(schema.users, eq(schema.chatMessages.senderId, schema.users.id))
    .where(eq(schema.chatMessages.sessionId, sessionId))
    .orderBy(asc(schema.chatMessages.createdAt))

  return { messages }
})
