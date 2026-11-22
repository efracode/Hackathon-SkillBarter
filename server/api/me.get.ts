import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { useDb, schema } from '../database'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1)

  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'User not found' })
  }

  const [escrowAgg] = await db
    .select({
      escrowTotal: sql<number>`coalesce(sum(${schema.sessionBookings.creditsHeld}), 0)::int`
    })
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.learnerId, user.id),
        inArray(schema.sessionBookings.status, ['queued', 'confirmed', 'checked_in', 'disputed'])
      )
    )

  const skills = await db
    .select()
    .from(schema.userSkills)
    .where(eq(schema.userSkills.userId, user.id))

  const now = new Date()
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000)

  const [upcomingTutor] = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tutorId, user.id),
        eq(schema.sessions.status, 'confirmed'),
        gte(schema.sessions.scheduledAt, windowStart),
        lte(schema.sessions.scheduledAt, next24h)
      )
    )
    .limit(1)

  const [upcomingLearner] = await db
    .select({ id: schema.sessionBookings.id })
    .from(schema.sessionBookings)
    .innerJoin(schema.sessions, eq(schema.sessionBookings.sessionId, schema.sessions.id))
    .where(
      and(
        eq(schema.sessionBookings.learnerId, user.id),
        eq(schema.sessionBookings.status, 'confirmed'),
        gte(schema.sessions.scheduledAt, windowStart),
        lte(schema.sessions.scheduledAt, next24h)
      )
    )
    .limit(1)

  const teachSkillIds = skills.filter((s) => s.direction === 'teach').map((s) => s.id)
  const [incomingQueue] =
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
          .limit(1)
      : []

  const hasActiveSessionAlert = Boolean(upcomingTutor || upcomingLearner || incomingQueue)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      campus: user.campus,
      major: user.major,
      creditBalance: user.creditBalance,
      escrowBalance: escrowAgg?.escrowTotal ?? 0,
      hasActiveSessionAlert,
      penaltyCount: user.penaltyCount,
      teachingCooldownUntil: user.teachingCooldownUntil,
      role: user.role,
      onboardingCompleted: Boolean(user.onboardingCompletedAt)
    },
    skills
  }
})
