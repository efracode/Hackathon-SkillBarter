import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { useDb, schema } from '../database'
import { runLazyChecks } from '../utils/creditEngine'

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = useDb()
  await runLazyChecks(db)

  const userId = userSession.user.id
  const [user] = await db
    .select({
      creditBalance: schema.users.creditBalance
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  const [escrowAgg] = await db
    .select({
      escrowTotal: sql<number>`coalesce(sum(${schema.sessionBookings.creditsHeld}), 0)::int`
    })
    .from(schema.sessionBookings)
    .where(
      and(
        eq(schema.sessionBookings.learnerId, userId),
        inArray(schema.sessionBookings.status, ['queued', 'confirmed', 'checked_in', 'disputed'])
      )
    )

  const ledger = await db
    .select()
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.userId, userId))
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(100)

  return {
    creditBalance: user?.creditBalance ?? 0,
    escrowBalance: escrowAgg?.escrowTotal ?? 0,
    ledger
  }
})
