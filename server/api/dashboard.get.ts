import { and, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm'
import { useDb, schema } from '../database'
import { runLazyChecks } from '../utils/creditEngine'
import { isUkswEmail } from '../utils/uksw'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  await runLazyChecks(db)

  const userId = userSession.user.id
  const now = new Date()

  const [
    userRows,
    escrowRows,
    mySkills,
    learnerUpcoming,
    tutorUpcoming,
    completedTutorSessions,
    tutorReviews,
    recommendedSkills,
    openSlots,
    recentLedger
  ] = await Promise.all([
    db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1),
    db
      .select({
        escrowTotal: sql<number>`coalesce(sum(${schema.sessionBookings.creditsHeld}), 0)::int`
      })
      .from(schema.sessionBookings)
      .where(
        and(
          eq(schema.sessionBookings.learnerId, userId),
          inArray(schema.sessionBookings.status, ['queued', 'confirmed', 'checked_in', 'disputed'])
        )
      ),
    db.select().from(schema.userSkills).where(eq(schema.userSkills.userId, userId)),
    db
      .select({
        bookingId: schema.sessionBookings.id,
        bookingStatus: schema.sessionBookings.status,
        sessionId: schema.sessions.id,
        scheduledAt: schema.sessions.scheduledAt,
        durationMinutes: schema.sessions.durationMinutes,
        format: schema.sessions.format,
        skillTitle: schema.userSkills.title,
        tutorName: schema.users.name
      })
      .from(schema.sessionBookings)
      .innerJoin(schema.sessions, eq(schema.sessionBookings.sessionId, schema.sessions.id))
      .innerJoin(schema.userSkills, eq(schema.sessionBookings.skillId, schema.userSkills.id))
      .innerJoin(schema.users, eq(schema.sessions.tutorId, schema.users.id))
      .where(
        and(
          eq(schema.sessionBookings.learnerId, userId),
          inArray(schema.sessionBookings.status, ['confirmed', 'checked_in']),
          gte(schema.sessions.scheduledAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(schema.sessions.scheduledAt)
      .limit(4),
    db
      .select({
        sessionId: schema.sessions.id,
        scheduledAt: schema.sessions.scheduledAt,
        durationMinutes: schema.sessions.durationMinutes,
        format: schema.sessions.format,
        skillTitle: schema.userSkills.title
      })
      .from(schema.sessions)
      .innerJoin(schema.userSkills, eq(schema.sessions.skillId, schema.userSkills.id))
      .where(
        and(
          eq(schema.sessions.tutorId, userId),
          eq(schema.sessions.status, 'confirmed'),
          gte(schema.sessions.scheduledAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(schema.sessions.scheduledAt)
      .limit(4),
    db
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(and(eq(schema.sessions.tutorId, userId), eq(schema.sessions.status, 'completed'))),
    db.select({ rating: schema.reviews.rating }).from(schema.reviews).where(eq(schema.reviews.tutorId, userId)),
    db
      .select({
        skill: schema.userSkills,
        tutorName: schema.users.name,
        tutorEmail: schema.users.email,
        tutorMajor: schema.users.major,
        tutorCampus: schema.users.campus
      })
      .from(schema.userSkills)
      .innerJoin(schema.users, eq(schema.userSkills.userId, schema.users.id))
      .where(and(eq(schema.userSkills.direction, 'teach'), ne(schema.userSkills.userId, userId)))
      .orderBy(desc(schema.userSkills.createdAt))
      .limit(10),
    db
      .select({
        id: schema.sessions.id,
        skillId: schema.sessions.skillId,
        scheduledAt: schema.sessions.scheduledAt,
        durationMinutes: schema.sessions.durationMinutes,
        mode: schema.sessions.mode,
        format: schema.sessions.format
      })
      .from(schema.sessions)
      .where(and(eq(schema.sessions.status, 'confirmed'), gte(schema.sessions.scheduledAt, now))),
    db
      .select()
      .from(schema.creditLedger)
      .where(eq(schema.creditLedger.userId, userId))
      .orderBy(desc(schema.creditLedger.createdAt))
      .limit(4)
  ])

  const user = userRows[0]
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  const learnCategories = new Set(
    mySkills.filter((s) => s.direction === 'learn').map((s) => s.category)
  )
  const teachSkillIds = mySkills.filter((s) => s.direction === 'teach').map((s) => s.id)

  const incomingQueues =
    teachSkillIds.length > 0
      ? await db
          .select({ id: schema.sessionBookings.id })
          .from(schema.sessionBookings)
          .where(
            and(
              inArray(schema.sessionBookings.skillId, teachSkillIds),
              eq(schema.sessionBookings.status, 'queued')
            )
          )
      : []

  const avgRating =
    tutorReviews.length > 0
      ? Number((tutorReviews.reduce((acc, r) => acc + r.rating, 0) / tutorReviews.length).toFixed(1))
      : 0

  const prioritizedRecommendations = recommendedSkills
    .map((item) => ({
      skill: item.skill,
      tutorName: item.tutorName,
      tutorMajor: item.tutorMajor,
      tutorCampus: item.tutorCampus,
      tutorVerifiedUksw: isUkswEmail(item.tutorEmail),
      matchesInterest: learnCategories.has(item.skill.category),
      nextSlot: openSlots.find((s) => s.skillId === item.skill.id) || null
    }))
    .sort((a, b) => Number(b.matchesInterest) - Number(a.matchesInterest))
    .slice(0, 6)

  return {
    user: {
      name: user.name,
      email: user.email,
      isVerifiedUksw: isUkswEmail(user.email),
      creditBalance: user.creditBalance,
      escrowBalance: escrowRows[0]?.escrowTotal ?? 0,
      penaltyCount: user.penaltyCount,
      cooldownUntil: user.teachingCooldownUntil
    },
    mentorProgress: {
      completedCount: completedTutorSessions.length,
      avgRating,
      reviewCount: tutorReviews.length,
      isVerifiedMentor:
        completedTutorSessions.length >= 3 && avgRating >= 4.5 && user.penaltyCount === 0
    },
    incomingQueueCount: incomingQueues.length,
    upcomingLearner: learnerUpcoming,
    upcomingTutor: tutorUpcoming,
    recommendations: prioritizedRecommendations,
    recentLedger
  }
})
