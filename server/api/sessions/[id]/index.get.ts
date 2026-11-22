import { and, asc, eq } from 'drizzle-orm'
import { useDb, schema } from '../../../database'
import { runLazyChecks } from '../../../utils/creditEngine'

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
  await runLazyChecks(db)

  const [sessRow] = await db
    .select({
      session: schema.sessions,
      skill: schema.userSkills,
      tutor: {
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        campus: schema.users.campus,
        major: schema.users.major
      }
    })
    .from(schema.sessions)
    .innerJoin(schema.userSkills, eq(schema.sessions.skillId, schema.userSkills.id))
    .innerJoin(schema.users, eq(schema.sessions.tutorId, schema.users.id))
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)

  if (!sessRow) {
    throw createError({ statusCode: 404, statusMessage: 'Sesi tidak ditemukan' })
  }

  const bookings = await db
    .select({
      booking: schema.sessionBookings,
      learner: {
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl
      }
    })
    .from(schema.sessionBookings)
    .innerJoin(schema.users, eq(schema.sessionBookings.learnerId, schema.users.id))
    .where(eq(schema.sessionBookings.sessionId, sessionId))
    .orderBy(asc(schema.sessionBookings.createdAt))

  const currentUserId = userSession.user.id
  const isTutor = sessRow.session.tutorId === currentUserId
  const myBookingRow = bookings.find((b) => b.booking.learnerId === currentUserId)

  if (!isTutor && !myBookingRow) {
    throw createError({ statusCode: 403, statusMessage: 'Kamu bukan peserta sesi ini' })
  }

  let myReview = null
  let myReport = null
  if (myBookingRow) {
    const [rev] = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.bookingId, myBookingRow.booking.id))
      .limit(1)
    myReview = rev || null

    const [rep] = await db
      .select()
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.bookingId, myBookingRow.booking.id),
          eq(schema.reports.reporterId, currentUserId)
        )
      )
      .limit(1)
    myReport = rep || null
  }

  return {
    roleInSession: isTutor ? 'tutor' : 'learner',
    session: {
      ...sessRow.session,
      // Never leak check-in code to learner before they enter it
      checkinCode: isTutor ? sessRow.session.checkinCode : null,
      hasCheckinCode: Boolean(sessRow.session.checkinCode)
    },
    skill: sessRow.skill,
    tutor: sessRow.tutor,
    myBooking: myBookingRow?.booking || null,
    participants: bookings.map((b) => ({
      bookingId: b.booking.id,
      status: b.booking.status,
      checkedInAt: b.booking.checkedInAt,
      learner: b.learner
    })),
    myReview,
    myReport
  }
})
