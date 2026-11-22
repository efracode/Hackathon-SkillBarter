import { eq } from 'drizzle-orm'
import { useDb, schema } from '../../database'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },
  async onSuccess(event, { user: googleUser }) {
    const db = useDb()
    const googleId = String(googleUser.sub)

    let [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, googleId))
      .limit(1)

    if (!existing) {
      const [inserted] = await db
        .insert(schema.users)
        .values({
          googleId,
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          avatarUrl: googleUser.picture || null,
          creditBalance: 0,
          role: 'user'
        })
        .returning()
      existing = inserted
    }

    if (!existing) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create or load user' })
    }

    await setUserSession(event, {
      user: {
        id: existing.id,
        googleId: existing.googleId,
        email: existing.email,
        name: existing.name,
        avatarUrl: existing.avatarUrl,
        role: existing.role,
        onboardingCompleted: Boolean(existing.onboardingCompletedAt)
      }
    })

    return sendRedirect(event, existing.onboardingCompletedAt ? '/dashboard' : '/onboarding')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
