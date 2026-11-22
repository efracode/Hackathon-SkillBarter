import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { useDb, schema } from '../database'
import { runLazyChecks } from '../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const search = String(query.q || '').trim().toLowerCase()
  const category = String(query.category || '').trim()
  const durationFilter = query.duration ? Number(query.duration) : null
  const modeFilter = String(query.mode || '').trim()
  const formatFilter = String(query.format || '').trim()
  const availableOnly = query.availableOnly === 'true'

  const db = useDb()
  await runLazyChecks(db)

  const teachSkills = await db
    .select({
      skill: schema.userSkills,
      tutor: {
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        campus: schema.users.campus,
        major: schema.users.major,
        penaltyCount: schema.users.penaltyCount,
        teachingCooldownUntil: schema.users.teachingCooldownUntil
      }
    })
    .from(schema.userSkills)
    .innerJoin(schema.users, eq(schema.userSkills.userId, schema.users.id))
    .where(eq(schema.userSkills.direction, 'teach'))
    .orderBy(desc(schema.userSkills.createdAt))

  const now = new Date()
  const upcomingSessions = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.status, 'confirmed'),
        gte(schema.sessions.scheduledAt, now)
      )
    )
    .orderBy(schema.sessions.scheduledAt)

  const activeBookings = await db
    .select({
      sessionId: schema.sessionBookings.sessionId,
      learnerId: schema.sessionBookings.learnerId
    })
    .from(schema.sessionBookings)
    .where(inArray(schema.sessionBookings.status, ['confirmed', 'checked_in']))

  const completedSessions = await db
    .select({
      tutorId: schema.sessions.tutorId
    })
    .from(schema.sessions)
    .where(eq(schema.sessions.status, 'completed'))

  const allReviews = await db
    .select({
      id: schema.reviews.id,
      tutorId: schema.reviews.tutorId,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      createdAt: schema.reviews.createdAt,
      reviewerName: schema.users.name
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.reviews.reviewerId, schema.users.id))
    .orderBy(desc(schema.reviews.createdAt))

  const bookingCountBySession = new Map<string, number>()
  for (const b of activeBookings) {
    if (!b.sessionId) continue
    bookingCountBySession.set(b.sessionId, (bookingCountBySession.get(b.sessionId) ?? 0) + 1)
  }

  const completedByTutor = new Map<string, number>()
  for (const c of completedSessions) {
    completedByTutor.set(c.tutorId, (completedByTutor.get(c.tutorId) ?? 0) + 1)
  }

  const reviewsByTutor = new Map<string, typeof allReviews>()
  for (const r of allReviews) {
    const list = reviewsByTutor.get(r.tutorId) ?? []
    list.push(r)
    reviewsByTutor.set(r.tutorId, list)
  }

  const items = teachSkills
    .map(({ skill, tutor }) => {
      const tutorCooldownActive =
        tutor.teachingCooldownUntil !== null && tutor.teachingCooldownUntil.getTime() > now.getTime()

      const slots = upcomingSessions
        .filter((s) => s.skillId === skill.id)
        .map((s) => {
          const bookedCount = bookingCountBySession.get(s.id) ?? 0
          return {
            id: s.id,
            mode: s.mode,
            durationMinutes: s.durationMinutes,
            format: s.format,
            locationOrLink: s.locationOrLink,
            scheduledAt: s.scheduledAt,
            maxLearners: s.maxLearners,
            bookedCount,
            remainingSpots: Math.max(0, s.maxLearners - bookedCount)
          }
        })
        .filter((s) => s.remainingSpots > 0)

      const tutorReviews = reviewsByTutor.get(tutor.id) ?? []
      const avgRating =
        tutorReviews.length > 0
          ? Number(
              (tutorReviews.reduce((acc, r) => acc + r.rating, 0) / tutorReviews.length).toFixed(1)
            )
          : 0
      const completedCount = completedByTutor.get(tutor.id) ?? 0
      const isVerifiedMentor =
        completedCount >= 3 && avgRating >= 4.5 && tutor.penaltyCount === 0

      return {
        skill,
        tutor: {
          ...tutor,
          completedCount,
          avgRating,
          reviewCount: tutorReviews.length,
          isVerifiedMentor,
          inCooldown: tutorCooldownActive
        },
        slots: tutorCooldownActive ? [] : slots,
        reviews: tutorReviews.slice(0, 6)
      }
    })
    .filter((item) => {
      if (item.tutor.inCooldown) return false
      if (search) {
        const hay = `${item.skill.title} ${item.skill.category} ${item.tutor.name} ${item.tutor.major || ''}`.toLowerCase()
        if (!hay.includes(search)) return false
      }
      if (category && category !== 'Semua' && item.skill.category !== category) return false
      if (availableOnly && item.slots.length === 0) return false
      if (durationFilter && !item.slots.some((s) => s.durationMinutes === durationFilter)) {
        return false
      }
      if (modeFilter && !item.slots.some((s) => s.mode === modeFilter)) {
        return false
      }
      if (formatFilter && !item.slots.some((s) => s.format === formatFilter)) {
        return false
      }
      return true
    })

  return { items }
})
