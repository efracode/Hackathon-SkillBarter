<script setup lang="ts">
const route = useRoute()
const { user, loggedIn } = useUserSession()

const { data: meData, refresh: refreshMe } = await useFetch('/api/me', {
  key: 'me-profile',
  immediate: loggedIn.value
})

watch(
  () => route.fullPath,
  () => {
    if (loggedIn.value) {
      refreshMe()
    }
  }
)

const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
const escrowBalance = computed(() => meData.value?.user?.escrowBalance ?? 0)
const hasSessionAlert = computed(() => Boolean(meData.value?.user?.hasActiveSessionAlert))
const isAdmin = computed(() => (meData.value?.user?.role || user.value?.role) === 'admin')

const desktopNav = computed(() => {
  const items = [
    { label: 'Jelajah', to: '/explore', icon: 'i-ph-compass' },
    { label: 'Sesi Saya', to: '/sessions', icon: 'i-ph-calendar-check' },
    { label: 'Mengajar', to: '/teach', icon: 'i-ph-chalkboard-teacher' }
  ]
  if (isAdmin.value) {
    items.push({ label: 'Admin', to: '/admin', icon: 'i-ph-shield-check' })
  }
  return items
})

const mobileNav = [
  { label: 'Jelajah', to: '/explore', icon: 'i-ph-compass' },
  { label: 'Sesi Saya', to: '/sessions', icon: 'i-ph-calendar-check' },
  { label: 'Mengajar', to: '/teach', icon: 'i-ph-chalkboard-teacher' },
  { label: 'Profil', to: '/profile', icon: 'i-ph-user' }
]

const isActive = (path: string) =>
  route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <!-- Top Navigation Bar (Desktop & Mobile) -->
    <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NuxtLink
          to="/explore"
          class="inline-flex items-center min-h-[44px]"
          aria-label="Beranda SkillBarter"
        >
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <!-- Desktop Center Nav -->
        <nav aria-label="Navigasi Utama" class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in desktopNav"
            :key="item.to"
            :to="item.to"
            :class="[
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[44px]',
              isActive(item.to)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            <UIcon :name="item.icon" class="w-4 h-4" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="w-2 h-2 rounded-full bg-indigo-600"
              aria-label="Ada sesi atau permintaan aktif"
            />
          </NuxtLink>
        </nav>

        <!-- Right Controls: Credit Pill & Profile Avatar -->
        <div class="flex items-center gap-2.5">
          <NuxtLink
            to="/wallet"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors duration-150 min-h-[40px] text-xs sm:text-sm font-medium text-slate-800 tabular-nums"
            aria-label="Lihat Dompet Kredit dan Escrow"
          >
            <UIcon name="i-ph-wallet" class="w-4 h-4 text-teal-700" aria-hidden="true" />
            <span>{{ creditBalance }} Kredit</span>
            <span v-if="escrowBalance > 0" class="text-amber-700 font-semibold">
              · {{ escrowBalance }} Escrow
            </span>
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="hidden md:inline-flex items-center justify-center rounded-full min-w-[44px] min-h-[44px] hover:bg-slate-100 transition-colors duration-150"
            aria-label="Profil Saya"
          >
            <UAvatar
              :src="meData?.user?.avatarUrl || user?.avatarUrl || undefined"
              :alt="meData?.user?.name || user?.name || 'Pengguna'"
              size="sm"
            />
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
      <slot />
    </main>

    <!-- Mobile Fixed Bottom Navigation (4 Tabs) -->
    <nav
      aria-label="Navigasi Mobile"
      class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200"
    >
      <div class="grid grid-cols-4">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs font-medium transition-colors duration-150',
            isActive(item.to) ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <span class="relative">
            <UIcon :name="item.icon" class="w-5 h-5" aria-hidden="true" />
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-indigo-600"
              aria-label="Ada sesi atau permintaan aktif"
            />
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
