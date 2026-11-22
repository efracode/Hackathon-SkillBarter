import { desc, eq, inArray } from 'drizzle-orm'
import { useDb, schema } from '../../database'
import { runLazyChecks } from '../../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = userSession.user.id
  const db = useDb()
  await runLazyChecks(db)

  // Learner bookings
  const myBookings = await db
    .select({
      booking: schema.sessionBookings,
      skill: schema.userSkills,
      tutor: {
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl
      },
      session: schema.sessions
    })
    .from(schema.sessionBookings)
    .innerJoin(schema.userSkills, eq(schema.sessionBookings.skillId, schema.userSkills.id))
    .innerJoin(schema.users, eq(schema.userSkills.userId, schema.users.id))
    .leftJoin(schema.sessions, eq(schema.sessionBookings.sessionId, schema.sessions.id))
    .where(eq(schema.sessionBookings.learnerId, userId))
    .orderBy(desc(schema.sessionBookings.createdAt))

  // Tutor sessions
  const tutorSessions = await db
    .select({
      session: schema.sessions,
      skill: schema.userSkills
    })
    .from(schema.sessions)
    .innerJoin(schema.userSkills, eq(schema.sessions.skillId, schema.userSkills.id))
    .where(eq(schema.sessions.tutorId, userId))
    .orderBy(desc(schema.sessions.scheduledAt))

  const allRelevantSessionIds = Array.from(
    new Set([
      ...myBookings.map((b) => b.session?.id).filter((id): id is string => Boolean(id)),
      ...tutorSessions.map((t) => t.session.id)
    ])
  )

  const sessionBookingCounts = new Map<string, number>()
  if (allRelevantSessionIds.length > 0) {
    const relatedBookings = await db
      .select({
        sessionId: schema.sessionBookings.sessionId,
        status: schema.sessionBookings.status
      })
      .from(schema.sessionBookings)
      .where(inArray(schema.sessionBookings.sessionId, allRelevantSessionIds))

    for (const rb of relatedBookings) {
      if (!rb.sessionId) continue
      if (['confirmed', 'checked_in', 'completed'].includes(rb.status)) {
        sessionBookingCounts.set(rb.sessionId, (sessionBookingCounts.get(rb.sessionId) ?? 0) + 1)
      }
    }
  }

  // Incoming Hold Queue requests for this tutor's teach skills
  const myTeachSkills = await db
    .select({ id: schema.userSkills.id })
    .from(schema.userSkills)
    .where(eq(schema.userSkills.userId, userId))

  const mySkillIds = myTeachSkills.map((s) => s.id)
  const incomingHoldQueue =
    mySkillIds.length > 0
      ? await db
          .select({
            booking: schema.sessionBookings,
            skill: schema.userSkills,
            learner: {
              id: schema.users.id,
              name: schema.users.name,
              avatarUrl: schema.users.avatarUrl,
              campus: schema.users.campus,
              major: schema.users.major
            }
          })
          .from(schema.sessionBookings)
          .innerJoin(schema.userSkills, eq(schema.sessionBookings.skillId, schema.userSkills.id))
          .innerJoin(schema.users, eq(schema.sessionBookings.learnerId, schema.users.id))
          .where(inArray(schema.sessionBookings.skillId, mySkillIds))
          .orderBy(desc(schema.sessionBookings.createdAt))
      : []

  return {
    learnerBookings: myBookings.map((row) => ({
      ...row,
      confirmedCount: row.session ? sessionBookingCounts.get(row.session.id) ?? 0 : 0
    })),
    tutorSessions: tutorSessions.map((row) => ({
      ...row,
      confirmedCount: sessionBookingCounts.get(row.session.id) ?? 0
    })),
    incomingHoldQueue: incomingHoldQueue.filter((q) => q.booking.status === 'queued')
  }
})
