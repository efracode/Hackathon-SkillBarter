export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/login']
  const { loggedIn, user, fetch: fetchSession } = useUserSession()

  if (!loggedIn.value) {
    await fetchSession()
  }

  if (publicPaths.includes(to.path)) {
    if (loggedIn.value) {
      return navigateTo(user.value?.onboardingCompleted ? '/explore' : '/onboarding')
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
    return navigateTo('/explore')
  }

  if (to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/explore')
  }
})
