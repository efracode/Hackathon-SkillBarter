import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../database'
import { runLazyChecks } from '../../utils/creditEngine'

const simSchema = z.object({
  action: z.enum(['release_disputes', 'expire_queues', 'run_lazy_checks'])
})

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

  const parsed = simSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Aksi simulasi tidak valid' })
  }

  const past = new Date(Date.now() - 1000)

  if (parsed.data.action === 'release_disputes') {
    await db
      .update(schema.sessionBookings)
      .set({ disputeEndsAt: past })
      .where(eq(schema.sessionBookings.status, 'checked_in'))
  }

  if (parsed.data.action === 'expire_queues') {
    await db
      .update(schema.sessionBookings)
      .set({ holdExpiresAt: past })
      .where(eq(schema.sessionBookings.status, 'queued'))
  }

  await runLazyChecks(db, true)
  return { ok: true }
})
