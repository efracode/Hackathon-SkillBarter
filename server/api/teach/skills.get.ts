import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { useDb, schema } from '../../database'
import { runLazyChecks } from '../../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  await runLazyChecks(db)

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  const teachSkills = await db
    .select()
    .from(schema.userSkills)
    .where(
      and(
        eq(schema.userSkills.userId, user.id),
        eq(schema.userSkills.direction, 'teach')
      )
    )
    .orderBy(desc(schema.userSkills.createdAt))

  const upcomingSessions = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tutorId, user.id),
        gte(schema.sessions.scheduledAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    )
    .orderBy(schema.sessions.scheduledAt)

  const skillIds = teachSkills.map((s) => s.id)
  const pendingQueues =
    skillIds.length > 0
      ? await db
          .select({ id: schema.sessionBookings.id })
          .from(schema.sessionBookings)
          .where(
            and(
              inArray(schema.sessionBookings.skillId, skillIds),
              eq(schema.sessionBookings.status, 'queued')
            )
          )
      : []

  const completedSessions = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tutorId, user.id),
        eq(schema.sessions.status, 'completed')
      )
    )

  const tutorReviews = await db
    .select({ rating: schema.reviews.rating })
    .from(schema.reviews)
    .where(eq(schema.reviews.tutorId, user.id))

  const avgRating =
    tutorReviews.length > 0
      ? Number((tutorReviews.reduce((acc, r) => acc + r.rating, 0) / tutorReviews.length).toFixed(1))
      : 0

  return {
    cooldownUntil: user.teachingCooldownUntil,
    penaltyCount: user.penaltyCount,
    completedCount: completedSessions.length,
    avgRating,
    reviewCount: tutorReviews.length,
    isVerifiedMentor:
      completedSessions.length >= 3 && avgRating >= 4.5 && user.penaltyCount === 0,
    pendingHoldQueueCount: pendingQueues.length,
    skills: teachSkills,
    sessions: upcomingSessions
  }
})
