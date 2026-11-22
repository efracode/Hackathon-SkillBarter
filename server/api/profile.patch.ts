import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../database'

const profileSchema = z.object({
  campus: z.string().max(120).optional().nullable(),
  major: z.string().max(120).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const userSession = await getUserSession(event)
  if (!userSession.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = profileSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Input profil tidak valid'
    })
  }

  const db = useDb()
  const [updated] = await db
    .update(schema.users)
    .set({
      campus: parsed.data.campus?.trim() || null,
      major: parsed.data.major?.trim() || null
    })
    .where(eq(schema.users.id, userSession.user.id))
    .returning()

  return { user: updated }
})
