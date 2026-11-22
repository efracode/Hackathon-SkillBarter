import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../database'

const createSessionSchema = z.object({
  skillId: z.string().uuid(),
  mode: z.enum(['1on1', 'group']),
  durationMinutes: z.union([z.literal(30), z.literal(60)]),
  format: z.enum(['online', 'in_person']),
  locationOrLink: z.string().min(3).max(300),
  scheduledAt: z.string().datetime(),
  maxLearners: z.number().int().min(1).max(5).optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = createSessionSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data slot sesi tidak valid'
    })
  }

  const data = parsed.data
  if (data.mode === 'group' && data.durationMinutes !== 60) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sesi grup wajib berdurasi 60 menit'
    })
  }

  const scheduledDate = new Date(data.scheduledAt)
  if (scheduledDate.getTime() <= Date.now()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Waktu sesi harus di masa depan'
    })
  }

  const db = useDb()
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  if (user.teachingCooldownUntil && user.teachingCooldownUntil.getTime() > Date.now()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Mode mengajar sedang dalam masa cooldown akibat no-show sebelumnya'
    })
  }

  const [skill] = await db
    .select()
    .from(schema.userSkills)
    .where(
      and(
        eq(schema.userSkills.id, data.skillId),
        eq(schema.userSkills.userId, user.id),
        eq(schema.userSkills.direction, 'teach')
      )
    )
    .limit(1)

  if (!skill) {
    throw createError({ statusCode: 404, statusMessage: 'Penawaran skill tidak ditemukan' })
  }

  const maxLearners = data.mode === '1on1' ? 1 : Math.min(5, Math.max(2, data.maxLearners ?? 5))

  const [created] = await db
    .insert(schema.sessions)
    .values({
      tutorId: user.id,
      skillId: skill.id,
      mode: data.mode,
      durationMinutes: data.durationMinutes,
      format: data.format,
      locationOrLink: data.locationOrLink.trim(),
      scheduledAt: scheduledDate,
      maxLearners,
      status: 'confirmed'
    })
    .returning()

  return { session: created }
})
