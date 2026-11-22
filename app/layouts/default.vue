<script setup lang="ts">
const route = useRoute()
const { user, loggedIn } = useUserSession()

const { data: meData } = useLazyFetch('/api/me', {
  key: 'me-profile',
  immediate: loggedIn.value
})

const quickCmdOpen = ref(false)

const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
const escrowBalance = computed(() => meData.value?.user?.escrowBalance ?? 0)
const hasSessionAlert = computed(() => Boolean(meData.value?.user?.hasActiveSessionAlert))
const isAdmin = computed(() => (meData.value?.user?.role || user.value?.role) === 'admin')
const isVerifiedUksw = computed(() =>
  Boolean(meData.value?.user?.isVerifiedUksw ?? user.value?.isVerifiedUksw)
)

const totalPool = computed(() => Math.max(1, creditBalance.value + escrowBalance.value))
const availableRatio = computed(() => Math.round((creditBalance.value / totalPool.value) * 100))

const workspaceNav = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-ph-house' },
  { label: 'Jelajah Mentor', to: '/explore', icon: 'i-ph-compass' },
  { label: 'Sesi Saya', to: '/sessions', icon: 'i-ph-calendar-check' },
  { label: 'Mengajar', to: '/teach', icon: 'i-ph-chalkboard-teacher' }
]

const accountNav = computed(() => {
  const items = [
    { label: 'Dompet & Ledger', to: '/wallet', icon: 'i-ph-wallet' },
    { label: 'Profil & Reputasi', to: '/profile', icon: 'i-ph-user' }
  ]
  if (isAdmin.value) {
    items.push({ label: 'Admin Panel', to: '/admin', icon: 'i-ph-shield-check' })
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

const pageMetaTitle = computed(() => {
  const p = route.path
  if (p === '/dashboard') return { title: 'Dashboard', code: 'WORKSPACE / OVERVIEW' }
  if (p.startsWith('/explore')) return { title: 'Jelajah Mentor', code: 'DIRECTORY / EXPLORE' }
  if (p.startsWith('/sessions/')) return { title: 'Session Workspace', code: 'SESSIONS / LIVE' }
  if (p.startsWith('/sessions')) return { title: 'Sesi Saya', code: 'SESSIONS / QUEUE' }
  if (p.startsWith('/teach')) return { title: 'Mengajar', code: 'MENTOR / STUDIO' }
  if (p.startsWith('/wallet')) return { title: 'Dompet Kredit', code: 'LEDGER / ESCROW' }
  if (p.startsWith('/profile')) return { title: 'Profil & Reputasi', code: 'ACCOUNT / PROFILE' }
  if (p.startsWith('/admin')) return { title: 'Dashboard Admin', code: 'ADMIN / METRICS' }
  return { title: 'SkillBarter', code: 'WORKSPACE' }
})

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
  <div class="min-h-screen flex bg-slate-50 text-slate-900">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold"
    >
      Lewati ke konten utama
    </a>

    <!-- Desktop Persistent Left Sidebar (248px) -->
    <aside
      aria-label="Navigasi Sidebar"
      class="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-white border-r border-slate-200 z-30"
    >
      <!-- Sidebar Brand -->
      <div class="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <NuxtLink to="/dashboard" aria-label="Dashboard SkillBarter" class="inline-flex items-center min-h-[40px]">
          <SkillBarterLogo size="sm" />
        </NuxtLink>
        <span class="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
          MVP
        </span>
      </div>

      <!-- Primary Quick CTA -->
      <div class="p-3 border-b border-slate-200">
        <NuxtLink
          to="/teach"
          class="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[40px] transition-colors"
        >
          <UIcon name="i-ph-plus-bold" class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Buka Slot Micro-Session</span>
        </NuxtLink>
      </div>

      <!-- Navigation Sections -->
      <nav aria-label="Navigasi Utama" class="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div class="space-y-1">
          <p class="px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>
          <NuxtLink
            v-for="item in workspaceNav"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="sidebar-nav-link flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors min-h-[40px]"
          >
            <span class="inline-flex items-center gap-2.5 min-w-0">
              <UIcon :name="item.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ item.label }}</span>
            </span>
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="w-2 h-2 rounded-full bg-blue-600 shrink-0"
              aria-label="Ada sesi atau permintaan aktif"
            />
          </NuxtLink>
        </div>

        <div class="space-y-1">
          <p class="px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Akun
          </p>
          <NuxtLink
            v-for="item in accountNav"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="sidebar-nav-link flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors min-h-[40px]"
          >
            <UIcon :name="item.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sticky Bottom Wallet + User Identity -->
      <div class="p-3 border-t border-slate-200 space-y-2.5 bg-slate-50/70">
        <NuxtLink
          to="/wallet"
          class="block p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-600 transition-colors space-y-2"
        >
          <div class="flex items-center justify-between text-xs tabular-nums">
            <span class="font-semibold text-slate-700">Dompet Kredit</span>
            <span class="font-mono font-bold text-blue-700">{{ creditBalance }}K</span>
          </div>
          <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div class="bg-blue-600 transition-[width] duration-300" :style="{ width: `${availableRatio}%` }" />
            <div
              v-if="escrowBalance > 0"
              class="bg-blue-200 transition-[width] duration-300"
              :style="{ width: `${100 - availableRatio}%` }"
            />
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
            <span>Tersedia: {{ creditBalance }}</span>
            <span>Escrow: {{ escrowBalance }}</span>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/profile"
          class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
        >
          <UAvatar
            :src="meData?.user?.avatarUrl || user?.avatarUrl || undefined"
            :alt="meData?.user?.name || user?.name || 'Pengguna'"
            size="sm"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-slate-900 truncate">
              {{ meData?.user?.name || user?.name || 'Mahasiswa' }}
            </p>
            <div class="mt-0.5 flex items-center gap-1">
              <VerifiedUkswBadge v-if="isVerifiedUksw" />
              <span v-else class="text-[11px] text-slate-500 truncate">Akun Aktif</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </aside>

    <!-- Right Workspace Column -->
    <div class="flex-1 flex flex-col min-w-0 md:pl-64">
      <!-- Top Context Bar (Desktop + Mobile) -->
      <header class="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div class="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <!-- Mobile Logo / Desktop Breadcrumb -->
          <div class="flex items-center gap-3 min-w-0">
            <NuxtLink to="/dashboard" class="md:hidden inline-flex items-center min-h-[40px]" aria-label="Dashboard SkillBarter">
              <SkillBarterLogo size="sm" />
            </NuxtLink>
            <div class="hidden md:flex items-center gap-2.5 min-w-0">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                {{ pageMetaTitle.code }}
              </span>
              <span class="text-slate-300" aria-hidden="true">/</span>
              <span class="text-sm font-bold text-slate-900 truncate">{{ pageMetaTitle.title }}</span>
            </div>
          </div>

          <!-- Right Controls: Quick Command Ctrl+K + Mobile Wallet Pill -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-600 hover:bg-white text-xs text-slate-600 min-h-[36px] transition-colors"
              aria-label="Buka pencarian cepat (Ctrl+K)"
              @click="quickCmdOpen = true"
            >
              <UIcon name="i-ph-magnifying-glass" class="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span class="hidden sm:inline">Cari halaman atau mentor…</span>
              <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono text-[10px] font-semibold text-slate-600">
                Ctrl K
              </kbd>
            </button>

            <NuxtLink
              to="/wallet"
              class="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-white text-xs font-semibold text-slate-900 tabular-nums min-h-[36px]"
              aria-label="Lihat Dompet Kredit"
            >
              <UIcon name="i-ph-wallet" class="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>{{ creditBalance }}K</span>
              <span v-if="escrowBalance > 0" class="text-blue-700">· {{ escrowBalance }}E</span>
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- Main Workspace Canvas -->
      <main id="main-content" class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
        <slot />
      </main>
    </div>

    <!-- Mobile Fixed Bottom Navigation (5 Tabs) -->
    <nav
      aria-label="Navigasi Mobile"
      class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200"
    >
      <div class="grid grid-cols-5">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="mobile-nav-link flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[11px] font-medium text-slate-600 hover:text-blue-700 transition-colors duration-150"
        >
          <span class="relative">
            <UIcon :name="item.icon" class="w-5 h-5" aria-hidden="true" />
            <span
              v-if="item.to === '/sessions' && hasSessionAlert"
              class="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-blue-600"
              aria-label="Ada sesi atau permintaan aktif"
            />
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <QuickCommandModal v-model:open="quickCmdOpen" :is-admin="isAdmin" />
  </div>
</template>
