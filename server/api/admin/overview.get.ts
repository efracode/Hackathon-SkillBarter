import { desc, eq } from 'drizzle-orm'
import { useDb, schema } from '../../database'
import { runLazyChecks } from '../../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  const [caller] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userSession.user.id))
    .limit(1)

  if (caller?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Khusus Admin' })
  }

  await runLazyChecks(db)

  const allSessions = await db.select().from(schema.sessions)
  const completedSessions = allSessions.filter((s) => s.status === 'completed')

  const allLedger = await db.select().from(schema.creditLedger)
  const totalEscrowed = allLedger
    .filter((l) => l.delta < 0)
    .reduce((acc, l) => acc + Math.abs(l.delta), 0)
  const totalDisbursed = allLedger
    .filter((l) => l.delta > 0 && l.reason.startsWith('Pencairan'))
    .reduce((acc, l) => acc + l.delta, 0)
  const totalRefunded = allLedger
    .filter((l) => l.delta > 0 && l.reason.startsWith('Refund'))
    .reduce((acc, l) => acc + l.delta, 0)

  const allBookings = await db.select().from(schema.sessionBookings)
  const totalExpired = allBookings.filter((b) => b.status === 'expired').length

  const allReviews = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      createdAt: schema.reviews.createdAt,
      reviewerName: schema.users.name
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.reviews.reviewerId, schema.users.id))
    .orderBy(desc(schema.reviews.createdAt))

  const avgRating =
    allReviews.length > 0
      ? Number((allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(2))
      : 0

  const reportRows = await db
    .select({
      report: schema.reports,
      reporterName: schema.users.name,
      session: schema.sessions,
      skillTitle: schema.userSkills.title
    })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.reports.reporterId, schema.users.id))
    .innerJoin(schema.sessions, eq(schema.reports.sessionId, schema.sessions.id))
    .innerJoin(schema.userSkills, eq(schema.sessions.skillId, schema.userSkills.id))
    .orderBy(desc(schema.reports.createdAt))

  return {
    metrics: {
      totalCompleted: completedSessions.length,
      count1on1: completedSessions.filter((s) => s.mode === '1on1').length,
      countGroup: completedSessions.filter((s) => s.mode === 'group').length,
      count30m: completedSessions.filter((s) => s.durationMinutes === 30).length,
      count60m: completedSessions.filter((s) => s.durationMinutes === 60).length,
      totalEscrowed,
      totalDisbursed,
      totalRefunded,
      totalExpired,
      reviewCount: allReviews.length,
      avgRating
    },
    reviews: allReviews,
    reports: reportRows
  }
})
