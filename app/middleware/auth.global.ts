export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch: fetchSession } = useUserSession()

  // Always hydrate session when unknown so /login and / never show stale guest state
  if (!loggedIn.value) {
    await fetchSession()
  }

  if (to.path === '/') {
    return
  }

  if (to.path === '/login') {
    if (loggedIn.value) {
      return navigateTo(user.value?.onboardingCompleted ? '/dashboard' : '/onboarding')
    }
    return
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }

  if (!user.value?.onboardingCompleted && to.path !== '/onboarding') {
    return navigateTo('/onboarding')
  }

  if (user.value?.onboardingCompleted && to.path === '/onboarding') {
    return navigateTo('/dashboard')
  }

  if (to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
