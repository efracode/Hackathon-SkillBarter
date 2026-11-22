import { eq } from 'drizzle-orm'
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

  if (sess.tutorId !== userSession.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Hanya pengajar yang dapat membuat kode check-in' })
  }

  if (sess.status !== 'confirmed') {
    throw createError({ statusCode: 400, statusMessage: 'Sesi tidak dalam status aktif' })
  }

  if (sess.checkinCode) {
    return { checkinCode: sess.checkinCode, checkinGeneratedAt: sess.checkinGeneratedAt }
  }

  const now = Date.now()
  const startWindow = sess.scheduledAt.getTime() - 10 * 60 * 1000
  const endWindow = sess.scheduledAt.getTime() + 15 * 60 * 1000

  if (now < startWindow) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kode check-in baru dapat dibuat mulai 10 menit sebelum sesi dimulai'
    })
  }

  if (now > endWindow) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Batas waktu check-in (T+15 menit) telah berakhir'
    })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const generatedAt = new Date()

  await db
    .update(schema.sessions)
    .set({
      checkinCode: code,
      checkinGeneratedAt: generatedAt
    })
    .where(eq(schema.sessions.id, sess.id))

  return { checkinCode: code, checkinGeneratedAt: generatedAt }
})
