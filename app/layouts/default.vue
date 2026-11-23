<script setup lang="ts">
const route = useRoute()
const { user, loggedIn } = useUserSession()

const { data: meData } = useLazyFetch('/api/me', {
  key: 'me-profile',
  immediate: loggedIn.value
})

const quickCmdOpen = ref(false)
const signOutDialogOpen = ref(false)

const displayName = computed(() => meData.value?.user?.name || user.value?.name || 'Mahasiswa')
const displayEmail = computed(() => meData.value?.user?.email || user.value?.email || '')
const displayAvatar = computed(() => meData.value?.user?.avatarUrl ?? user.value?.avatarUrl ?? null)
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
const escrowBalance = computed(() => meData.value?.user?.escrowBalance ?? 0)
const hasSessionAlert = computed(() => Boolean(meData.value?.user?.hasActiveSessionAlert))
const isAdmin = computed(() => (meData.value?.user?.role || user.value?.role) === 'admin')
const isVerifiedUksw = computed(() =>
  Boolean(meData.value?.user?.isVerifiedUksw ?? user.value?.isVerifiedUksw)
)

const primaryNav = computed(() => {
  const items = [
    { label: 'Beranda', to: '/dashboard', icon: 'i-ph-house' },
    { label: 'Jelajah Skill', to: '/explore', icon: 'i-ph-compass' },
    { label: 'Jadwal & Sesi', to: '/sessions', icon: 'i-ph-calendar-check' },
    { label: 'Ajarkan Skill', to: '/teach', icon: 'i-ph-graduation-cap' },
    { label: 'Kredit Saya', to: '/wallet', icon: 'i-ph-wallet' }
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
  { label: 'Mengajar', to: '/teach', icon: 'i-ph-graduation-cap' },
  { label: 'Kredit', to: '/wallet', icon: 'i-ph-wallet' }
]

const isActive = (path: string) =>
  route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    quickCmdOpen.value = !quickCmdOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FAF8F4] text-[#14181F]">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-[6px] focus:bg-[#1D4ED8] focus:text-white focus:text-sm focus:font-semibold"
    >
      Lewati ke konten utama
    </a>

    <!-- Sticky Editorial Top Masthead (h-[60px] Desktop / h-14 Mobile) -->
    <header class="sticky top-0 z-30 bg-white border-b border-[#E5E0D5]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-14 md:h-[60px] flex items-center justify-between gap-4">
        <!-- Brand -->
        <NuxtLink
          to="/dashboard"
          aria-label="Beranda SkillBarter"
          class="inline-flex items-center min-h-[44px] shrink-0"
        >
          <SkillBarterLogo size="sm" />
        </NuxtLink>

        <!-- Desktop Primary Navigation (5 items + Admin if role=admin) -->
        <nav aria-label="Navigasi Utama" class="hidden md:flex items-center gap-1 h-full">
          <NuxtLink
            v-for="item in primaryNav"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="nav-link relative h-full inline-flex items-center gap-1.5 px-3 text-[13px] font-medium text-[#475569] hover:text-[#14181F] transition-colors whitespace-nowrap"
          >
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"
              aria-label="Ada sesi atau daftar tunggu aktif"
            />
          </NuxtLink>
        </nav>

        <!-- Right Utility Bar: Credit/Escrow Readout + Account Dropdown -->
        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Desktop Credit Pill -->
          <NuxtLink
            to="/wallet"
            class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F4] hover:border-[#1D4ED8] text-xs font-semibold tabular-nums min-h-[38px] transition-colors"
            aria-label="Lihat Kredit Saya dan Kredit dalam Pemesanan"
          >
            <span class="font-mono font-bold text-[#1D4ED8]">{{ creditBalance }} Kredit</span>
            <template v-if="escrowBalance > 0">
              <span class="h-3 w-px bg-[#E5E0D5]" aria-hidden="true" />
              <span class="font-mono font-semibold text-[#92400E]">{{ escrowBalance }} Dipesan</span>
            </template>
          </NuxtLink>

          <!-- Mobile Compact Credit Pill -->
          <NuxtLink
            to="/wallet"
            class="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F4] text-xs font-mono font-bold tabular-nums min-h-[40px]"
            aria-label="Lihat Kredit Saya"
          >
            <span class="text-[#1D4ED8]">{{ creditBalance }}K</span>
            <template v-if="escrowBalance > 0">
              <span class="text-[#E5E0D5]" aria-hidden="true">|</span>
              <span class="text-[#92400E]">{{ escrowBalance }}P</span>
            </template>
          </NuxtLink>

          <!-- Desktop & Mobile Account Dropdown -->
          <div class="hidden md:block">
            <AccountDropdown
              :name="displayName"
              :email="displayEmail"
              :avatar-url="displayAvatar"
              :is-verified-uksw="isVerifiedUksw"
              :is-admin="isAdmin"
              @sign-out="signOutDialogOpen = true"
            />
          </div>
          <div class="md:hidden">
            <AccountDropdown
              :name="displayName"
              :email="displayEmail"
              :avatar-url="displayAvatar"
              :is-verified-uksw="isVerifiedUksw"
              :is-admin="isAdmin"
              compact
              @sign-out="signOutDialogOpen = true"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main id="main-content" class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 pb-24 md:pb-12">
      <slot />
    </main>

    <!-- Mobile Fixed Bottom Navigation (5 Tabs, 62px height, >=44px touch targets) -->
    <nav
      aria-label="Navigasi Mobile"
      class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E5E0D5] h-[62px]"
    >
      <div class="grid grid-cols-5 h-full">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="mobile-nav-link flex flex-col items-center justify-center gap-1 min-h-[44px] h-full text-[11px] font-medium text-[#475569] hover:text-[#1D4ED8] transition-colors"
        >
          <span class="relative">
            <UIcon :name="item.icon" class="w-5 h-5" aria-hidden="true" />
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#1D4ED8]"
              aria-label="Ada sesi atau daftar tunggu aktif"
            />
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <QuickCommandModal v-model:open="quickCmdOpen" :is-admin="isAdmin" />
    <SignOutDialog v-model:open="signOutDialogOpen" />
  </div>
</template>
