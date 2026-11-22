<script setup lang="ts">
const route = useRoute()
const { user, loggedIn } = useUserSession()

const { data: meData } = useLazyFetch('/api/me', {
  key: 'me-profile',
  immediate: loggedIn.value
})

const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
const escrowBalance = computed(() => meData.value?.user?.escrowBalance ?? 0)
const hasSessionAlert = computed(() => Boolean(meData.value?.user?.hasActiveSessionAlert))
const isAdmin = computed(() => (meData.value?.user?.role || user.value?.role) === 'admin')

const desktopNav = computed(() => {
  const items = [
    { label: 'Dashboard', to: '/dashboard', icon: 'i-ph-house' },
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
  { label: 'Beranda', to: '/dashboard', icon: 'i-ph-house' },
  { label: 'Jelajah', to: '/explore', icon: 'i-ph-compass' },
  { label: 'Sesi', to: '/sessions', icon: 'i-ph-calendar-check' },
  { label: 'Mengajar', to: '/teach', icon: 'i-ph-chalkboard-teacher' },
  { label: 'Profil', to: '/profile', icon: 'i-ph-user' }
]

const isActive = (path: string) =>
  route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F5F0] text-slate-900">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-semibold"
    >
      Lewati ke konten utama
    </a>

    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-stone-200">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NuxtLink
          to="/dashboard"
          class="inline-flex items-center min-h-[44px]"
          aria-label="Dashboard SkillBarter"
        >
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <!-- Desktop Center Nav -->
        <nav aria-label="Navigasi Utama" class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in desktopNav"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="nav-link inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors duration-150 min-h-[44px]"
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
            :aria-current="isActive('/wallet') ? 'page' : undefined"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-300 bg-[#F7F5F0] hover:bg-stone-200/70 transition-colors duration-150 min-h-[40px] text-xs sm:text-sm font-semibold text-slate-900 tabular-nums"
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
            :aria-current="isActive('/profile') ? 'page' : undefined"
            class="hidden md:inline-flex items-center justify-center rounded-full min-w-[44px] min-h-[44px] hover:bg-stone-100 transition-colors duration-150"
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
    <main id="main-content" class="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
      <slot />
    </main>

    <!-- Mobile Fixed Bottom Navigation (5 Tabs) -->
    <nav
      aria-label="Navigasi Mobile"
      class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200"
    >
      <div class="grid grid-cols-5">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="mobile-nav-link flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
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
