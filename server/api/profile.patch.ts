import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../database'
import { avatarUrlSchema } from '../utils/validation'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nama tampilan minimal 2 karakter').max(80).optional(),
  avatarUrl: avatarUrlSchema,
  bio: z.string().max(240).optional().nullable(),
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
      statusMessage: parsed.error.issues[0]?.message || 'Input profil tidak valid'
    })
  }

  const db = useDb()
  const patchData: Record<string, string | null> = {
    campus: parsed.data.campus?.trim() || null,
    major: parsed.data.major?.trim() || null,
    bio: parsed.data.bio?.trim() || null
  }

  if (parsed.data.name) {
    patchData.name = parsed.data.name.trim()
  }
  if (parsed.data.avatarUrl !== undefined) {
    patchData.avatarUrl = parsed.data.avatarUrl === '' ? null : parsed.data.avatarUrl
  }

  const [updated] = await db
    .update(schema.users)
    .set(patchData)
    .where(eq(schema.users.id, userSession.user.id))
    .returning()

  if (updated) {
    await setUserSession(event, {
      user: {
        ...userSession.user,
        name: updated.name,
        avatarUrl: updated.avatarUrl
      }
    })
  }

  return { user: updated }
})
