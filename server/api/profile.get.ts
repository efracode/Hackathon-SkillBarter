import { and, desc, eq } from 'drizzle-orm'
import { useDb, schema } from '../database'
import { isUkswEmail } from '../utils/uksw'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  const userId = userSession.user.id

  const [userRows, skills, completedTutorSessions, completedLearnerBookings, receivedReviews] =
    await Promise.all([
      db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1),
      db.select().from(schema.userSkills).where(eq(schema.userSkills.userId, userId)),
      db
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(and(eq(schema.sessions.tutorId, userId), eq(schema.sessions.status, 'completed'))),
      db
        .select({ id: schema.sessionBookings.id })
        .from(schema.sessionBookings)
        .where(
          and(
            eq(schema.sessionBookings.learnerId, userId),
            eq(schema.sessionBookings.status, 'completed')
          )
        ),
      db
        .select({
          id: schema.reviews.id,
          rating: schema.reviews.rating,
          comment: schema.reviews.comment,
          createdAt: schema.reviews.createdAt,
          reviewerName: schema.users.name
        })
        .from(schema.reviews)
        .innerJoin(schema.users, eq(schema.reviews.reviewerId, schema.users.id))
        .where(eq(schema.reviews.tutorId, userId))
        .orderBy(desc(schema.reviews.createdAt))
    ])

  const user = userRows[0]
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  const avgRating =
    receivedReviews.length > 0
      ? Number(
          (
            receivedReviews.reduce((acc, r) => acc + r.rating, 0) / receivedReviews.length
          ).toFixed(1)
        )
      : 0

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      campus: user.campus,
      major: user.major,
      creditBalance: user.creditBalance,
      penaltyCount: user.penaltyCount,
      teachingCooldownUntil: user.teachingCooldownUntil,
      role: user.role,
      isVerifiedUksw: isUkswEmail(user.email),
      createdAt: user.createdAt
    },
    reputation: {
      completedTeaching: completedTutorSessions.length,
      completedLearning: completedLearnerBookings.length,
      avgRating,
      reviewCount: receivedReviews.length,
      isVerifiedMentor:
        completedTutorSessions.length >= 3 && avgRating >= 4.5 && user.penaltyCount === 0
    },
    skills,
    receivedReviews
  }
})
