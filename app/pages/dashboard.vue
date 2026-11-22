<script setup lang="ts">
import type { BookingSkillItem } from '~/components/SkillBookingPanel.vue'

interface DashboardPayload {
  user: {
    name: string
    email: string
    isVerifiedUksw: boolean
    creditBalance: number
    escrowBalance: number
    penaltyCount: number
    cooldownUntil: string | null
  }
  mentorProgress: {
    completedCount: number
    avgRating: number
    reviewCount: number
    isVerifiedMentor: boolean
  }
  incomingQueueCount: number
  upcomingLearner: Array<{
    bookingId: string
    bookingStatus: string
    sessionId: string
    scheduledAt: string
    durationMinutes: number
    format: string
    skillTitle: string
    tutorName: string
  }>
  upcomingTutor: Array<{
    sessionId: string
    scheduledAt: string
    durationMinutes: number
    format: string
    skillTitle: string
  }>
  recommendations: Array<{
    skill: { id: string; category: string; title: string; description: string | null }
    tutorName: string
    tutorAvatarUrl?: string | null
    tutorMajor: string | null
    tutorCampus: string | null
    tutorVerifiedUksw: boolean
    matchesInterest: boolean
    nextSlot: {
      id: string
      scheduledAt: string
      durationMinutes: number
      mode: string
      format: string
    } | null
  }>
  recentLedger: Array<{
    id: string
    delta: number
    balanceAfter: number
    reason: string
    createdAt: string
  }>
}

const { data, status, error, refresh } = useLazyFetch<DashboardPayload>('/api/dashboard')
const { data: meData, refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const { data: exploreCache, refresh: refreshExplore } = useLazyFetch<{ items: BookingSkillItem[] }>('/api/explore', {
  key: 'dashboard-explore-lookup'
})

const dashboardMode = ref<'learn' | 'teach'>('learn')
const recFilter = ref<'all' | 'match' | 'slot'>('all')

const drawerOpen = ref(false)
const activeDrawerItem = ref<BookingSkillItem | null>(null)
const drawerLoading = ref(false)

const myUserId = computed(() => meData.value?.user?.id || '')
const creditBalance = computed(() => data.value?.user?.creditBalance ?? meData.value?.user?.creditBalance ?? 0)
const upcomingTotal = computed(
  () => (data.value?.upcomingLearner?.length ?? 0) + (data.value?.upcomingTutor?.length ?? 0)
)

const mentorProgressPercent = computed(() => {
  const count = data.value?.mentorProgress?.completedCount ?? 0
  return Math.min(100, Math.round((count / 3) * 100))
})

const filteredRecommendations = computed(() => {
  const list = data.value?.recommendations || []
  if (recFilter.value === 'match') return list.filter((r) => r.matchesInterest)
  if (recFilter.value === 'slot') return list.filter((r) => Boolean(r.nextSlot))
  return list
})

async function openQuickBooking(skillId: string) {
  drawerOpen.value = true
  const existing = exploreCache.value?.items?.find((it) => it.skill.id === skillId) || null
  if (existing) {
    activeDrawerItem.value = existing
    return
  }

  drawerLoading.value = true
  try {
    await refreshExplore()
    activeDrawerItem.value = exploreCache.value?.items?.find((it) => it.skill.id === skillId) || null
  } finally {
    drawerLoading.value = false
  }
}

async function handleQuickBooked() {
  await Promise.all([refresh(), refreshMe(), refreshExplore()])
  setTimeout(() => {
    drawerOpen.value = false
  }, 850)
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="status === 'pending'" class="space-y-5" aria-busy="true">
      <div class="h-16 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div v-for="n in 4" :key="n" class="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7 h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div class="lg:col-span-5 h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
      <p class="sr-only">Memuat dashboard SkillBarter…</p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat dashboard"
      description="Terjadi kendala saat mengambil ringkasan akun. Muat ulang untuk mencoba lagi."
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <!-- Top Command Header + Mode Switcher -->
      <section class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Pusat Aktivitas
            </span>
            <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Halo, <span class="font-serif italic font-normal text-blue-600">{{ data.user.name.split(' ')[0] }}</span>
          </h1>
          <p class="text-sm text-slate-600">
            Pantau kredit, booking mentor langsung dari sini, atau beralih ke mode mengajar.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Mode Dashboard">
            <button
              type="button"
              role="tab"
              :aria-selected="dashboardMode === 'learn'"
              :class="[
                'px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px]',
                dashboardMode === 'learn' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-blue-700'
              ]"
              @click="dashboardMode = 'learn'"
            >
              Mode Belajar
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="dashboardMode === 'teach'"
              :class="[
                'px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px]',
                dashboardMode === 'teach' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-blue-700'
              ]"
              @click="dashboardMode = 'teach'"
            >
              Mode Mengajar
            </button>
          </div>

          <NuxtLink
            to="/explore"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[42px] transition-colors"
          >
            <UIcon name="i-ph-compass" class="w-4 h-4" aria-hidden="true" />
            <span>Jelajah Semua</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Row 1: 4 Technical Precision KPI Stroke Cards with Animated Count-Up -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NuxtLink
          to="/wallet"
          class="bg-white border border-slate-200 rounded-2xl p-4 stroke-interactive flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-medium">Saldo Tersedia</span>
            <UIcon name="i-ph-wallet" class="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p class="font-mono text-2xl sm:text-3xl font-bold text-blue-600">
            <AnimatedNumber :value="data.user.creditBalance" />
            <span class="text-xs font-sans font-semibold text-slate-500 ml-1">Kredit</span>
          </p>
        </NuxtLink>

        <NuxtLink
          to="/wallet"
          class="bg-white border border-slate-200 rounded-2xl p-4 stroke-interactive flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-medium">Terkunci di Escrow</span>
            <UIcon name="i-ph-lock-simple-duotone" class="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p class="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
            <AnimatedNumber :value="data.user.escrowBalance" />
            <span class="text-xs font-sans font-semibold text-slate-500 ml-1">Kredit</span>
          </p>
        </NuxtLink>

        <NuxtLink
          to="/sessions"
          class="bg-white border border-slate-200 rounded-2xl p-4 stroke-interactive flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-medium">Agenda Mendatang</span>
            <UIcon name="i-ph-calendar-check" class="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p class="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
            <AnimatedNumber :value="upcomingTotal" />
            <span class="text-xs font-sans font-semibold text-slate-500 ml-1">Sesi</span>
          </p>
        </NuxtLink>

        <NuxtLink
          to="/profile"
          class="bg-white border border-slate-200 rounded-2xl p-4 stroke-interactive flex flex-col justify-between gap-2"
        >
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-medium">Progres Peer Mentor</span>
            <UIcon name="i-ph-seal-check-duotone" class="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p class="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
            <AnimatedNumber :value="Math.min(3, data.mentorProgress.completedCount)" /><span class="text-base text-slate-400">/3</span>
            <span class="text-xs font-sans font-semibold text-slate-500 ml-1">Sesi</span>
          </p>
        </NuxtLink>
      </section>

      <!-- Action Banner for Incoming Hold Queue -->
      <UAlert
        v-if="data.incomingQueueCount > 0"
        color="primary"
        variant="subtle"
        icon="i-ph-clock"
        :title="`Ada ${data.incomingQueueCount} permintaan Hold Queue menunggu responmu`"
        description="Terima dan tentukan jadwalnya di tab Hold Queue sebelum batas 48 jam berakhir."
      >
        <template #actions>
          <NuxtLink
            to="/sessions?tab=queue"
            class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Lihat Antrean
          </NuxtLink>
        </template>
      </UAlert>

      <!-- Animated Mode Content -->
      <Transition name="panel-slide" mode="out-in">
        <!-- MODE BELAJAR -->
        <div v-if="dashboardMode === 'learn'" key="mode-learn" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left (7 cols): Interactive Mentor Recommendations with Direct Quick-Booking Drawer -->
          <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <header class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm sm:text-base font-bold text-slate-900">Rekomendasi Mentor Untukmu</h2>
                <p class="text-xs text-slate-500">Klik mentor untuk melihat jadwal, bio, dan langsung booking.</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600'
                  ]"
                  @click="recFilter = 'all'"
                >
                  Semua
                </button>
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'match' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600'
                  ]"
                  @click="recFilter = 'match'"
                >
                  Cocok Minat
                </button>
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'slot' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600'
                  ]"
                  @click="recFilter = 'slot'"
                >
                  Slot Buka
                </button>
              </div>
            </header>

            <div v-if="filteredRecommendations.length === 0" class="p-8 text-center space-y-2">
              <p class="text-sm font-semibold text-slate-900">Tidak ada rekomendasi pada filter ini</p>
              <button
                type="button"
                class="text-xs font-semibold text-blue-700 hover:underline"
                @click="recFilter = 'all'"
              >
                Tampilkan Semua Mentor
              </button>
            </div>

            <TransitionGroup v-else name="list-stagger" tag="ul" class="divide-y divide-slate-200">
              <li
                v-for="rec in filteredRecommendations"
                :key="rec.skill.id"
                class="p-4 sm:p-5 hover:bg-blue-50/30 transition-colors border-l-4 border-l-transparent hover:border-l-blue-600"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <UAvatar :src="rec.tutorAvatarUrl || undefined" :alt="rec.tutorName" size="sm" class="mt-0.5 shrink-0" />
                    <div class="min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm sm:text-base font-bold text-slate-900 leading-snug">{{ rec.skill.title }}</p>
                        <span
                          v-if="rec.matchesInterest"
                          class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          Cocok Minatmu
                        </span>
                      </div>
                      <div class="flex flex-wrap items-center gap-1.5 text-xs">
                        <span class="font-semibold text-slate-800">{{ rec.tutorName }}</span>
                        <VerifiedUkswBadge v-if="rec.tutorVerifiedUksw" />
                      </div>
                      <p class="text-xs text-slate-500 tabular-nums">
                        {{
                          [
                            rec.skill.category,
                            rec.tutorMajor,
                            rec.nextSlot ? `${formatDateTime(rec.nextSlot.scheduledAt)} (${rec.nextSlot.durationMinutes}m)` : 'Via Hold Queue 48j'
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        }}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    :class="[
                      'shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold min-h-[40px] transition-colors inline-flex items-center justify-center gap-1.5',
                      rec.nextSlot
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border border-blue-600 bg-white hover:bg-blue-50 text-blue-700'
                    ]"
                    @click="openQuickBooking(rec.skill.id)"
                  >
                    <span>{{ rec.nextSlot ? 'Booking Cepat' : 'Hold Queue' }}</span>
                    <UIcon name="i-ph-arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            </TransitionGroup>
          </section>

          <!-- Right (5 cols): Agenda + Verified Mentor Anchor + Ledger -->
          <div class="lg:col-span-5 space-y-5">
            <!-- Upcoming Agenda -->
            <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
              <div class="flex items-center justify-between">
                <h2 class="text-sm sm:text-base font-bold text-slate-900">Agenda Sesi Terdekat</h2>
                <NuxtLink to="/sessions" class="text-xs font-semibold text-blue-700 hover:underline">
                  Kelola Sesi
                </NuxtLink>
              </div>

              <div
                v-if="data.upcomingLearner.length === 0 && data.upcomingTutor.length === 0"
                class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <p class="text-xs font-semibold text-slate-900">Jadwalmu masih kosong</p>
                <p class="text-xs text-slate-600">
                  Klik <strong class="text-slate-900">Booking Cepat</strong> pada rekomendasi mentor di samping untuk memesan sesi pertamamu.
                </p>
              </div>

              <ul v-else class="space-y-2.5">
                <li
                  v-for="s in data.upcomingLearner"
                  :key="s.bookingId"
                  class="p-3.5 rounded-xl bg-white border border-blue-200 flex items-center justify-between gap-3"
                >
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-blue-700 tabular-nums">
                      Belajar · {{ formatDateTime(s.scheduledAt) }}
                    </p>
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ s.skillTitle }}</p>
                  </div>
                  <NuxtLink
                    :to="`/sessions/${s.sessionId}`"
                    class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center"
                  >
                    Masuk
                  </NuxtLink>
                </li>
                <li
                  v-for="t in data.upcomingTutor"
                  :key="t.sessionId"
                  class="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between gap-3"
                >
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-blue-700 tabular-nums">
                      Mengajar · {{ formatDateTime(t.scheduledAt) }}
                    </p>
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ t.skillTitle }}</p>
                  </div>
                  <NuxtLink
                    :to="`/sessions/${t.sessionId}`"
                    class="px-3.5 py-2 rounded-lg border border-blue-600 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center"
                  >
                    Check-in
                  </NuxtLink>
                </li>
              </ul>
            </section>

            <!-- Verified Peer Mentor Progress Anchor (Primary Stroke) -->
            <section class="bg-white border-2 border-blue-600 rounded-2xl p-5 space-y-3.5">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                    Reputasi Peer Mentor
                  </p>
                  <h2 class="text-base font-bold text-slate-900 mt-0.5">
                    {{ data.mentorProgress.isVerifiedMentor ? 'Verified Peer Mentor Aktif' : 'Menuju Verified Peer Mentor' }}
                  </h2>
                </div>
                <UIcon name="i-ph-seal-check-duotone" class="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
              </div>

              <div class="space-y-2">
                <div class="flex justify-between text-xs text-slate-600 tabular-nums">
                  <span>Sesi Mengajar ({{ Math.min(3, data.mentorProgress.completedCount) }}/3)</span>
                  <span>Rating: {{ data.mentorProgress.reviewCount > 0 ? `${data.mentorProgress.avgRating}/5` : 'Belum ada' }}</span>
                </div>
                <div class="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                  <div
                    class="h-full bg-blue-600 transition-[width] duration-500 ease-out"
                    :style="{ width: `${mentorProgressPercent}%` }"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span>Penalti aktif: <strong class="text-slate-900 font-mono">{{ data.user.penaltyCount }}</strong></span>
                <NuxtLink to="/profile" class="text-blue-700 hover:underline font-semibold">
                  Detail Reputasi
                </NuxtLink>
              </div>
            </section>

            <!-- Recent Ledger -->
            <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-900">Aktivitas Ledger Terbaru</h2>
                <NuxtLink to="/wallet" class="text-xs font-semibold text-blue-700 hover:underline">
                  Semua
                </NuxtLink>
              </div>
              <p v-if="!data.recentLedger?.length" class="text-xs text-slate-600">
                Belum ada aktivitas mutasi kredit.
              </p>
              <ul v-else class="divide-y divide-slate-100">
                <li
                  v-for="row in data.recentLedger"
                  :key="row.id"
                  class="py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <span class="text-slate-700 truncate">{{ row.reason }}</span>
                  <span
                    :class="[
                      'font-mono font-bold tabular-nums shrink-0',
                      row.delta >= 0 ? 'text-blue-700' : 'text-slate-600'
                    ]"
                  >
                    {{ row.delta >= 0 ? `+${row.delta}` : row.delta }}
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <!-- MODE MENGAJAR -->
        <div v-else key="mode-teach" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <section class="lg:col-span-7 bg-white border-2 border-blue-600 rounded-2xl p-6 space-y-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-ph-chalkboard-teacher" class="w-5 h-5 text-blue-600" aria-hidden="true" />
              <h2 class="text-base font-bold text-slate-900">Siap Berbagi Micro-Session 30 Menit?</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              Tidak perlu silabus panjang. Buka slot 30 menit untuk tanya-jawab dasar atau review tugas teman dan dapatkan kredit belajar baru.
            </p>
            <div class="flex flex-wrap gap-3 pt-1">
              <NuxtLink
                to="/teach"
                class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[44px] inline-flex items-center"
              >
                Kelola Topik &amp; Buat Slot
              </NuxtLink>
              <NuxtLink
                to="/sessions?tab=queue"
                class="px-4 py-2.5 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-blue-700 text-sm font-semibold min-h-[44px] inline-flex items-center"
              >
                Cek Hold Queue Masuk ({{ data.incomingQueueCount }})
              </NuxtLink>
            </div>
          </section>

          <section class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 class="text-base font-bold text-slate-900">Jadwal Mengajarmu</h2>
            <p v-if="data.upcomingTutor.length === 0" class="text-xs text-slate-600">
              Belum ada slot mengajar aktif. Publikasikan jadwal pertamamu dari menu Mengajar.
            </p>
            <ul v-else class="space-y-2.5">
              <li
                v-for="t in data.upcomingTutor"
                :key="t.sessionId"
                class="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-blue-700 tabular-nums">
                    {{ formatDateTime(t.scheduledAt) }}
                  </p>
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ t.skillTitle }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${t.sessionId}`"
                  class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                >
                  Check-in
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </Transition>
    </template>

    <!-- Direct Quick-Booking Slideover Drawer -->
    <USlideover v-model:open="drawerOpen" :title="activeDrawerItem?.skill.title || 'Detail & Booking Cepat'">
      <template #body>
        <div v-if="drawerLoading" class="space-y-3 animate-pulse" aria-busy="true">
          <div class="h-6 w-3/4 bg-slate-200 rounded" />
          <div class="h-20 w-full bg-slate-100 rounded-xl" />
          <div class="h-28 w-full bg-slate-100 rounded-xl" />
          <p class="text-xs text-slate-500">Memuat jadwal dan ulasan mentor…</p>
        </div>
        <SkillBookingPanel
          v-else-if="activeDrawerItem"
          :item="activeDrawerItem"
          :my-user-id="myUserId"
          :credit-balance="creditBalance"
          @booked="handleQuickBooked"
        />
        <div v-else class="p-6 text-center space-y-3">
          <p class="text-sm text-slate-600">Penawaran ini sudah tidak tersedia atau sedang dalam cooldown.</p>
          <NuxtLink
            to="/explore"
            class="inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Buka Direktori Jelajah
          </NuxtLink>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
.list-stagger-enter-active,
.list-stagger-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.list-stagger-enter-from,
.list-stagger-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
