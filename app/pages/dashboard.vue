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

const { data, status, refresh } = useLazyFetch<DashboardPayload>('/api/dashboard')
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
const escrowBalance = computed(() => data.value?.user?.escrowBalance ?? 0)
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

const nextScheduleSummary = computed(() => {
  const nl = data.value?.upcomingLearner?.[0]
  if (nl) return `${formatShortDate(nl.scheduledAt)} | ${nl.durationMinutes}m ${nl.format === 'online' ? 'Online' : 'Kampus'}`
  const nt = data.value?.upcomingTutor?.[0]
  if (nt) return `${formatShortDate(nt.scheduledAt)} | ${nt.durationMinutes}m ${nt.format === 'online' ? 'Online' : 'Kampus'}`
  return 'Belum ada jadwal aktif'
})

const contextualPriority = computed(() => {
  const d = data.value
  if (!d) return null
  if (d.user.cooldownUntil && new Date(d.user.cooldownUntil).getTime() > Date.now()) {
    return {
      tone: 'rose' as const,
      label: 'Status Cooldown Mengajar',
      title: `Publikasi jadwal ditahan hingga ${formatDateTime(d.user.cooldownUntil)}`,
      ctaLabel: 'Lihat Status Mengajar',
      to: '/teach'
    }
  }
  if (d.incomingQueueCount > 0) {
    return {
      tone: 'amber' as const,
      label: 'Daftar Tunggu 48 Jam',
      title: `${d.incomingQueueCount} permintaan belajar menunggu jadwal dari kamu`,
      ctaLabel: 'Tinjau Daftar Tunggu',
      to: '/sessions?tab=queue'
    }
  }
  const nextLearner = d.upcomingLearner[0]
  if (nextLearner) {
    return {
      tone: 'cobalt' as const,
      label: 'Jadwal Belajar Terdekat',
      title: `${nextLearner.skillTitle} bersama ${nextLearner.tutorName} (${formatDateTime(nextLearner.scheduledAt)})`,
      ctaLabel: 'Buka Ruang Sesi',
      to: `/sessions/${nextLearner.sessionId}`
    }
  }
  const nextTutor = d.upcomingTutor[0]
  if (nextTutor) {
    return {
      tone: 'cobalt' as const,
      label: 'Jadwal Mengajar Terdekat',
      title: `${nextTutor.skillTitle} (${formatDateTime(nextTutor.scheduledAt)})`,
      ctaLabel: 'Kelola & Check-in',
      to: `/sessions/${nextTutor.sessionId}`
    }
  }
  if (creditBalance.value < 1) {
    return {
      tone: 'amber' as const,
      label: 'Kredit Saya 0',
      title: 'Buka 1 jadwal mengajar 30 menit untuk memperoleh kredit pertamamu',
      ctaLabel: 'Ajarkan Skill',
      to: '/teach'
    }
  }
  return {
    tone: 'cobalt' as const,
    label: 'Siap Belajar',
    title: `Kamu punya ${creditBalance.value} Kredit siap dipakai memesan sesi belajar`,
    ctaLabel: 'Cari Skill untuk Dipelajari',
    to: '/explore'
  }
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

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-7">
    <div v-if="status === 'pending'" aria-busy="true" class="space-y-6">
      <div class="h-16 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 h-80 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
        <div class="lg:col-span-5 h-80 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      </div>
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat data aktivitas"
      description="Periksa koneksi lalu muat ulang halaman."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Muat Ulang
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Greeting & Mode Switcher Header -->
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-[13px] font-medium text-[#526071]">Halo, {{ data.user.name }}</p>
            <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" />
          </div>
          <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
            Apa yang bisa kamu lakukan sekarang?
          </h1>
          <p class="text-sm text-[#475569]">
            {{
              dashboardMode === 'learn'
                ? 'Pantau jadwal belajar, kredit yang tersedia, dan mentor aktif dari kampus.'
                : 'Kelola Daftar Tunggu, progres Verified Peer Mentor, dan jadwal mengajar.'
            }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <div class="inline-flex p-1 rounded-[6px] bg-[#F3EFE6] border border-[#E5E0D5]" role="tablist" aria-label="Mode Beranda">
            <button
              type="button"
              role="tab"
              :aria-selected="dashboardMode === 'learn'"
              :class="[
                'px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-colors min-h-[36px]',
                dashboardMode === 'learn' ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
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
                'px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-colors min-h-[36px]',
                dashboardMode === 'teach' ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
              ]"
              @click="dashboardMode = 'teach'"
            >
              Mode Mengajar
            </button>
          </div>

          <span class="hidden sm:inline-flex">
            <UiButton
              :to="dashboardMode === 'learn' ? '/explore' : '/teach'"
              variant="primary"
              size="sm"
              :icon="dashboardMode === 'learn' ? 'i-ph-compass' : 'i-ph-plus'"
            >
              {{ dashboardMode === 'learn' ? 'Jelajah Skill' : 'Ajarkan Skill' }}
            </UiButton>
          </span>
        </div>
      </section>

      <!-- Single Next-Action Strip -->
      <section v-if="contextualPriority">
        <div class="bg-white border border-[#E5E0D5] rounded-[8px] p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-0.5 min-w-0">
            <p
              :class="[
                'text-xs font-semibold',
                contextualPriority.tone === 'rose'
                  ? 'text-[#BE123C]'
                  : contextualPriority.tone === 'amber'
                    ? 'text-[#92400E]'
                    : 'text-[#1D4ED8]'
              ]"
            >
              Tindakan berikutnya | {{ contextualPriority.label }}
            </p>
            <p class="text-[15px] font-bold text-[#14181F]">
              {{ contextualPriority.title }}
            </p>
          </div>
          <UiButton
            :to="contextualPriority.to"
            variant="dark"
            size="sm"
            icon="i-ph-arrow-right"
          >
            {{ contextualPriority.ctaLabel }}
          </UiButton>
        </div>
      </section>

      <!-- Paper-Native Credit & Schedule Strip (Friendly Indonesian Terms) -->
      <section class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-0 py-4 border-y border-[#E5E0D5] tabular-nums">
        <NuxtLink to="/wallet" class="group space-y-1 sm:pr-6">
          <p class="text-xs font-semibold text-[#526071]">Kredit Saya</p>
          <p class="font-mono text-2xl font-bold text-[#1D4ED8] group-hover:underline">
            <AnimatedNumber :value="creditBalance" suffix=" Kredit" />
          </p>
          <p class="text-xs text-[#526071]">Siap dipakai belajar</p>
        </NuxtLink>

        <NuxtLink to="/wallet" class="group space-y-1 border-l border-[#E5E0D5] pl-4 sm:px-6">
          <p class="text-xs font-semibold text-[#526071]">Kredit dalam Pemesanan</p>
          <p class="font-mono text-2xl font-bold text-[#92400E] group-hover:underline">
            <AnimatedNumber :value="escrowBalance" suffix=" Kredit" />
          </p>
          <p class="text-xs text-[#526071]">Aman ditahan hingga sesi selesai</p>
        </NuxtLink>

        <NuxtLink to="/sessions" class="col-span-2 sm:col-span-1 group space-y-1 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#E5E0D5] sm:pl-6">
          <p class="text-xs font-semibold text-[#526071]">Jadwal Belajar</p>
          <p class="font-mono text-2xl font-bold text-[#14181F] group-hover:underline">
            <AnimatedNumber :value="upcomingTotal" suffix=" Sesi Aktif" />
          </p>
          <p class="text-xs text-[#526071] truncate">{{ nextScheduleSummary }}</p>
        </NuxtLink>
      </section>

      <!-- Mobile Quick Action Buttons (Matching Mobile 390 Design) -->
      <div class="grid grid-cols-1 gap-2.5 sm:hidden">
        <UiButton to="/explore" variant="primary" block>
          Cari Skill untuk Dipelajari
        </UiButton>
        <UiButton to="/teach" variant="secondary" block>
          Ajarkan Skill
        </UiButton>
      </div>

      <!-- Main Split Workspace (7 / 5 Paper Columns) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <!-- Left 7 Cols: Learn Recommendations OR Teach Studio Overview -->
        <section class="lg:col-span-7 space-y-4">
          <template v-if="dashboardMode === 'learn'">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0D5]">
              <div>
                <h2 class="text-lg font-bold text-[#14181F]">Rekomendasi mentor untuk kamu</h2>
              </div>
              <div class="flex items-center gap-3">
                <div class="inline-flex rounded-[6px] border border-[#E5E0D5] bg-white p-0.5 text-[11px] font-semibold">
                  <button
                    v-for="tab in [
                      { id: 'all', label: 'Semua' },
                      { id: 'match', label: 'Cocok Minat' },
                      { id: 'slot', label: 'Ada Slot' }
                    ]"
                    :key="tab.id"
                    type="button"
                    :class="[
                      'px-2.5 py-1 rounded-[4px] transition-colors min-h-[32px]',
                      recFilter === tab.id ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
                    ]"
                    @click="recFilter = tab.id as 'all' | 'match' | 'slot'"
                  >
                    {{ tab.label }}
                  </button>
                </div>
                <NuxtLink to="/explore" class="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap">
                  Lihat semua di Jelajah
                </NuxtLink>
              </div>
            </div>

            <div v-if="filteredRecommendations.length === 0" class="py-10 text-center space-y-3 border-b border-[#E5E0D5]">
              <p class="text-sm font-semibold text-[#14181F]">Belum ada mentor yang cocok dengan filter ini.</p>
              <UiButton to="/explore" variant="primary" size="sm">
                Buka Jelajah Skill
              </UiButton>
            </div>

            <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
              <li v-for="rec in filteredRecommendations" :key="rec.skill.id">
                <button
                  type="button"
                  class="w-full text-left py-4 px-2 hover:bg-white/80 transition-colors flex items-start justify-between gap-4 min-h-[64px]"
                  @click="openQuickBooking(rec.skill.id)"
                >
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-xs font-semibold text-[#1D4ED8]">{{ rec.skill.category }}</span>
                      <UiBadge v-if="rec.matchesInterest" tone="primary">
                        Sesuai Minat
                      </UiBadge>
                    </div>
                    <p class="text-[15px] font-bold text-[#14181F] leading-snug">{{ rec.skill.title }}</p>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526071]">
                      <span class="font-semibold text-[#14181F]">{{ rec.tutorName }}</span>
                      <VerifiedUkswBadge v-if="rec.tutorVerifiedUksw" />
                      <span v-if="rec.tutorMajor || rec.tutorCampus">
                        | {{ [rec.tutorMajor, rec.tutorCampus].filter(Boolean).join(', ') }}
                      </span>
                    </div>
                  </div>

                  <div class="text-right shrink-0 space-y-1.5">
                    <UiBadge
                      :tone="rec.nextSlot ? 'success' : 'warning'"
                      :icon="rec.nextSlot ? 'i-ph-calendar-check' : 'i-ph-clock'"
                    >
                      {{ rec.nextSlot ? 'Slot Tersedia' : 'Daftar Tunggu 48j' }}
                    </UiBadge>
                    <p v-if="rec.nextSlot" class="font-mono text-[11px] text-[#526071] tabular-nums">
                      {{ rec.nextSlot.durationMinutes }}m | {{ rec.nextSlot.format === 'online' ? 'Online' : 'Kampus' }} | 1 Kredit
                    </p>
                  </div>
                </button>
              </li>
            </ul>
          </template>

          <template v-else>
            <div class="space-y-5 border-b border-[#E5E0D5] pb-6">
              <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0D5]">
                <div>
                  <p class="text-xs font-semibold text-[#1D4ED8]">Kesiapan Mengajar</p>
                  <h2 class="text-lg font-bold text-[#14181F] mt-0.5">
                    Progres Verified Peer Mentor
                  </h2>
                </div>
                <span class="font-mono text-sm font-bold text-[#1D4ED8] tabular-nums">{{ mentorProgressPercent }}%</span>
              </div>

              <div class="h-2.5 w-full bg-[#F3EFE6] border border-[#E5E0D5] rounded-[4px] overflow-hidden">
                <div class="h-full bg-[#1D4ED8] transition-[width] duration-300" :style="{ width: `${mentorProgressPercent}%` }" />
              </div>

              <p class="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Syarat lencana otomatis: minimal <strong class="text-[#14181F]">3 sesi selesai</strong>, rating rata-rata <strong class="text-[#14181F]">&gt;= 4.5</strong>, dan <strong class="text-[#14181F]">0 penalti aktif</strong>.
              </p>

              <div class="flex flex-wrap gap-3 pt-1">
                <UiButton to="/teach" variant="primary" size="sm" icon="i-ph-calendar-plus">
                  Ajarkan Skill &amp; Buka Jadwal
                </UiButton>
                <UiButton to="/sessions?tab=queue" variant="secondary" size="sm">
                  Kelola Daftar Tunggu ({{ data.incomingQueueCount }})
                </UiButton>
              </div>
            </div>
          </template>
        </section>

        <!-- Right 5 Cols: Jadwal Belajar & Riwayat Kredit Terbaru -->
        <aside class="lg:col-span-5 lg:border-l lg:border-[#E5E0D5] lg:pl-8 space-y-7">
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-2.5 border-b border-[#E5E0D5]">
              <h2 class="text-base font-bold text-[#14181F]">Jadwal Belajar</h2>
              <NuxtLink to="/sessions" class="text-xs font-semibold text-[#1D4ED8] hover:underline">
                Semua Sesi
              </NuxtLink>
            </div>

            <div
              v-if="data.upcomingLearner.length === 0 && data.upcomingTutor.length === 0"
              class="py-4 text-xs text-[#526071] space-y-2 border-b border-[#E5E0D5]"
            >
              <p>Belum ada jadwal sesi aktif saat ini.</p>
              <NuxtLink to="/explore" class="inline-block font-semibold text-[#1D4ED8] hover:underline">
                Cari skill untuk dipelajari -&gt;
              </NuxtLink>
            </div>

            <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
              <li v-for="item in data.upcomingLearner" :key="item.bookingId" class="py-3">
                <NuxtLink :to="`/sessions/${item.sessionId}`" class="block group space-y-1">
                  <p class="font-mono text-xs font-semibold text-[#1D4ED8] tabular-nums">
                    {{ formatDateTime(item.scheduledAt) }} | {{ item.durationMinutes }}m {{ item.format === 'online' ? 'Online' : 'Kampus' }}
                  </p>
                  <p class="text-sm font-bold text-[#14181F] group-hover:text-[#1D4ED8] truncate">
                    {{ item.skillTitle }}
                  </p>
                  <p class="text-xs text-[#526071]">Mentor: {{ item.tutorName }}</p>
                </NuxtLink>
              </li>
              <li v-for="item in data.upcomingTutor" :key="item.sessionId" class="py-3">
                <NuxtLink :to="`/sessions/${item.sessionId}`" class="block group space-y-1">
                  <p class="font-mono text-xs font-semibold text-[#047857] tabular-nums">
                    Mengajar | {{ formatDateTime(item.scheduledAt) }} | {{ item.durationMinutes }}m
                  </p>
                  <p class="text-sm font-bold text-[#14181F] group-hover:text-[#1D4ED8] truncate">
                    {{ item.skillTitle }}
                  </p>
                  <p class="text-xs text-[#526071]">{{ item.format === 'online' ? 'Online' : 'Tatap Muka Kampus' }}</p>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between pb-2.5 border-b border-[#E5E0D5]">
              <h2 class="text-base font-bold text-[#14181F]">Riwayat Kredit Terbaru</h2>
              <NuxtLink to="/wallet" class="text-xs font-semibold text-[#1D4ED8] hover:underline">
                Kredit Saya
              </NuxtLink>
            </div>

            <p v-if="data.recentLedger.length === 0" class="text-xs text-[#526071] py-4 border-b border-[#E5E0D5]">
              Belum ada catatan riwayat kredit.
            </p>
            <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
              <li v-for="row in data.recentLedger.slice(0, 4)" :key="row.id" class="py-3 flex items-center justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <p class="font-medium text-[#14181F] truncate">{{ row.reason }}</p>
                  <p class="font-mono text-[11px] text-[#526071] tabular-nums">{{ formatDateTime(row.createdAt) }}</p>
                </div>
                <span
                  :class="[
                    'font-mono font-bold tabular-nums shrink-0',
                    row.delta > 0 ? 'text-[#047857]' : 'text-[#92400E]'
                  ]"
                >
                  {{ row.delta > 0 ? `+${row.delta}` : row.delta }} Kredit
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </template>

    <!-- Quick Booking Slideover -->
    <USlideover v-model:open="drawerOpen" title="Detail &amp; Pemesanan Mentor">
      <template #body>
        <div v-if="drawerLoading" class="py-10 text-center text-sm text-[#526071]" aria-busy="true">
          Memuat detail mentor dan jadwal…
        </div>
        <SkillBookingPanel
          v-else-if="activeDrawerItem"
          :item="activeDrawerItem"
          :my-user-id="myUserId"
          :credit-balance="creditBalance"
          @booked="handleQuickBooked"
        />
        <p v-else class="py-8 text-center text-sm text-[#526071]">
          Detail penawaran tidak ditemukan.
        </p>
      </template>
    </USlideover>
  </div>
</template>
