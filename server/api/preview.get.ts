import { desc, eq, gte, sql } from 'drizzle-orm'
import { useDb, schema } from '../database'

export default defineEventHandler(async () => {
  const db = useDb()
  const now = new Date()

  const [skillStats, completedStats, reviewStats, featuredSkills, upcomingSlots] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.userSkills)
      .where(eq(schema.userSkills.direction, 'teach')),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.sessions)
      .where(eq(schema.sessions.status, 'completed')),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.reviews),
    db
      .select({
        id: schema.userSkills.id,
        category: schema.userSkills.category,
        title: schema.userSkills.title,
        description: schema.userSkills.description,
        tutorId: schema.users.id,
        tutorName: schema.users.name,
        tutorMajor: schema.users.major,
        tutorCampus: schema.users.campus,
        penaltyCount: schema.users.penaltyCount
      })
      .from(schema.userSkills)
      .innerJoin(schema.users, eq(schema.userSkills.userId, schema.users.id))
      .where(eq(schema.userSkills.direction, 'teach'))
      .orderBy(desc(schema.userSkills.createdAt))
      .limit(3),
    db
      .select({
        skillId: schema.sessions.skillId,
        durationMinutes: schema.sessions.durationMinutes,
        mode: schema.sessions.mode,
        format: schema.sessions.format
      })
      .from(schema.sessions)
      .where(gte(schema.sessions.scheduledAt, now))
  ])

  const allReviews = await db
    .select({
      tutorId: schema.reviews.tutorId,
      rating: schema.reviews.rating
    })
    .from(schema.reviews)

  const allCompletedByTutor = await db
    .select({ tutorId: schema.sessions.tutorId })
    .from(schema.sessions)
    .where(eq(schema.sessions.status, 'completed'))

  const previews = featuredSkills.map((item) => {
    const tutorRevs = allReviews.filter((r) => r.tutorId === item.tutorId)
    const avgRating =
      tutorRevs.length > 0
        ? Number((tutorRevs.reduce((acc, r) => acc + r.rating, 0) / tutorRevs.length).toFixed(1))
        : 0
    const completed = allCompletedByTutor.filter((c) => c.tutorId === item.tutorId).length
    const slot = upcomingSlots.find((s) => s.skillId === item.id)

    return {
      id: item.id,
      category: item.category,
      title: item.title,
      description: item.description,
      tutorName: item.tutorName,
      tutorMeta: [item.tutorMajor, item.tutorCampus].filter(Boolean).join(' · '),
      isVerifiedMentor: completed >= 3 && avgRating >= 4.5 && item.penaltyCount === 0,
      avgRating,
      reviewCount: tutorRevs.length,
      slotBadge: slot
        ? `${slot.durationMinutes}m · ${slot.mode === 'group' ? 'Grup' : '1-on-1'} · ${slot.format === 'online' ? 'Online' : 'Kampus'}`
        : 'Tersedia via Hold Queue'
    }
  })

  return {
    stats: {
      activeSkills: skillStats[0]?.count ?? 0,
      completedSessions: completedStats[0]?.count ?? 0,
      verifiedReviews: reviewStats[0]?.count ?? 0
    },
    previews
  }
})
