import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../database'
import { avatarUrlSchema } from '../utils/validation'

const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Nama tampilan minimal 2 karakter').max(80),
  avatarUrl: avatarUrlSchema,
  bio: z.string().max(240).optional().nullable(),
  teachSkill: z.object({
    category: z.string().min(2).max(60),
    title: z.string().min(3).max(120),
    templateTag: z.string().max(60).optional().nullable(),
    description: z.string().max(400).optional().nullable()
  }),
  learnSkills: z
    .array(
      z.object({
        category: z.string().min(2).max(60),
        title: z.string().min(2).max(120)
      })
    )
    .min(1, 'Pilih minimal 1 skill yang ingin dipelajari'),
  campus: z.string().max(120).optional().nullable(),
  major: z.string().max(120).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data onboarding tidak valid'
    })
  }

  const db = useDb()
  const { name, avatarUrl, bio, teachSkill, learnSkills, campus, major } = parsed.data

  const updatedUser = await db.transaction(async (tx) => {
    const [lockedUser] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.user!.id))
      .for('update')
      .limit(1)

    if (!lockedUser) {
      throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
    }

    if (lockedUser.onboardingCompletedAt) {
      return lockedUser
    }

    await tx.insert(schema.userSkills).values({
      userId: lockedUser.id,
      direction: 'teach',
      category: teachSkill.category.trim(),
      title: teachSkill.title.trim(),
      description: teachSkill.description?.trim() || null,
      templateTag: teachSkill.templateTag?.trim() || null,
      availabilitySlots: []
    })

    await tx.insert(schema.userSkills).values(
      learnSkills.map((item) => ({
        userId: lockedUser.id,
        direction: 'learn',
        category: item.category.trim(),
        title: item.title.trim(),
        availabilitySlots: []
      }))
    )

    const newBalance = lockedUser.creditBalance + 2
    const [saved] = await tx
      .update(schema.users)
      .set({
        name: name.trim(),
        avatarUrl: avatarUrl === '' ? null : (avatarUrl ?? lockedUser.avatarUrl),
        bio: bio?.trim() || null,
        campus: campus?.trim() || null,
        major: major?.trim() || null,
        creditBalance: newBalance,
        onboardingCompletedAt: new Date()
      })
      .where(eq(schema.users.id, lockedUser.id))
      .returning()

    if (!saved) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal memperbarui pengguna' })
    }

    // Initial +2 onboarding grant has no associated booking
    await tx.insert(schema.creditLedger).values({
      userId: lockedUser.id,
      bookingId: null,
      delta: 2,
      balanceAfter: newBalance,
      reason: 'Modal Awal Onboarding (+2 Kredit)'
    })

    return saved
  })

  await setUserSession(event, {
    user: {
      ...session.user,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      onboardingCompleted: true
    }
  })

  return {
    ok: true,
    creditBalance: updatedUser.creditBalance
  }
})
