<script setup lang="ts">
definePageMeta({
  layout: false
})

const { loggedIn, user } = useUserSession()
if (loggedIn.value) {
  await navigateTo(user.value?.onboardingCompleted ? '/explore' : '/onboarding')
} else {
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
    Mengarahkan ke halaman utama...
  </div>
</template>
