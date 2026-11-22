import { and, eq, inArray, sql } from 'drizzle-orm'
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
      penaltyCount: user.penaltyCount,
      teachingCooldownUntil: user.teachingCooldownUntil,
      role: user.role,
      onboardingCompleted: Boolean(user.onboardingCompletedAt)
    },
    skills
  }
})
