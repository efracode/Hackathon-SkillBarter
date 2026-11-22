import { z } from 'zod'
import { useDb, schema } from '../../database'

const createSkillSchema = z.object({
  category: z.string().min(2).max(60),
  title: z.string().min(3).max(120),
  description: z.string().max(400).optional().nullable(),
  templateTag: z.string().max(60).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = createSkillSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data penawaran skill tidak valid'
    })
  }

  const db = useDb()
  const [created] = await db
    .insert(schema.userSkills)
    .values({
      userId: session.user.id,
      direction: 'teach',
      category: parsed.data.category.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      templateTag: parsed.data.templateTag?.trim() || null,
      availabilitySlots: []
    })
    .returning()

  return { skill: created }
})
