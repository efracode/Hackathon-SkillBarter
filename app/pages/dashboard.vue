<script setup lang="ts">
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

const dashboardMode = ref<'learn' | 'teach'>('learn')
const recFilter = ref<'all' | 'match' | 'slot'>('all')
const expandedRecId = ref<string | null>(null)

const totalCreditPool = computed(() => {
  const avail = data.value?.user?.creditBalance ?? 0
  const escrow = data.value?.user?.escrowBalance ?? 0
  return Math.max(1, avail + escrow)
})

const availablePercent = computed(() => {
  const avail = data.value?.user?.creditBalance ?? 0
  return Math.round((avail / totalCreditPool.value) * 100)
})

const escrowPercent = computed(() => {
  const escrow = data.value?.user?.escrowBalance ?? 0
  return Math.round((escrow / totalCreditPool.value) * 100)
})

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

function toggleExpandRec(id: string) {
  expandedRecId.value = expandedRecId.value === id ? null : id
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
      <div class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-3">
        <div class="h-6 w-56 bg-slate-200 rounded" />
        <div class="h-4 w-80 bg-slate-100 rounded" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
      <p class="text-xs text-slate-600">Memuat dashboard…</p>
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
      <!-- Editorial Greeting + Mode Switcher -->
      <section class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
              Pusat Aktivitas SkillBarter
            </span>
            <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" />
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Halo, <span class="font-serif italic font-normal text-blue-600">{{ data.user.name.split(' ')[0] }}</span>
          </h1>
          <p class="text-sm text-slate-600">
            Kelola saldo belajarmu, pantau agenda sesi, atau beralih ke mode mengajar kapan saja.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Mode Toggle -->
          <div class="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs" role="tablist" aria-label="Mode Dashboard">
            <button
              type="button"
              role="tab"
              :aria-selected="dashboardMode === 'learn'"
              :class="[
                'px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px]',
                dashboardMode === 'learn' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
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
                dashboardMode === 'teach' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
              ]"
              @click="dashboardMode = 'teach'"
            >
              Mode Mengajar
            </button>
          </div>

          <NuxtLink
            to="/explore"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[44px] transition-colors shadow-xs"
          >
            <UIcon name="i-ph-compass" class="w-4 h-4" aria-hidden="true" />
            <span>Jelajahi Mentor</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Visual Credit Vault + Mentor Progress Strip -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Rasio Dompet Kredit
              </p>
              <div class="mt-1 flex items-baseline gap-4 tabular-nums">
                <p class="text-2xl sm:text-3xl font-bold font-mono text-blue-600">
                  {{ data.user.creditBalance }} <span class="text-xs font-sans font-semibold text-slate-600">Tersedia</span>
                </p>
                <p class="text-lg font-bold font-mono text-slate-700">
                  {{ data.user.escrowBalance }} <span class="text-xs font-sans font-semibold text-slate-500">Di Escrow</span>
                </p>
              </div>
            </div>

            <NuxtLink
              to="/wallet"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-xs font-semibold text-blue-700 min-h-[38px] transition-colors"
            >
              <UIcon name="i-ph-wallet" class="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>Buka Ledger</span>
            </NuxtLink>
          </div>

          <!-- Animated Ratio Bar -->
          <div class="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
            <div
              class="bg-blue-600 transition-[width] duration-500 ease-out"
              :style="{ width: `${availablePercent}%` }"
            />
            <div
              class="bg-blue-200 transition-[width] duration-500 ease-out"
              :style="{ width: `${escrowPercent}%` }"
            />
          </div>
          <p class="text-xs text-slate-600">
            Saldo tersedia bisa dipakai booking kapan saja. Kredit di escrow kembali 100% jika batal &ge; 12 jam.
          </p>
        </div>

        <div class="lg:col-span-5 bg-white text-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 border-2 border-blue-600">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                Reputasi Peer Mentor
              </p>
              <h2 class="text-lg font-bold text-slate-900 mt-0.5">
                {{ data.mentorProgress.isVerifiedMentor ? 'Verified Peer Mentor Aktif' : 'Menuju Verified Peer Mentor' }}
              </h2>
            </div>
            <UIcon name="i-ph-seal-check-duotone" class="w-6 h-6 text-blue-600 shrink-0" aria-hidden="true" />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs text-slate-600 tabular-nums">
              <span>Progres Sesi Mengajar ({{ Math.min(3, data.mentorProgress.completedCount) }}/3)</span>
              <span>Rating: {{ data.mentorProgress.reviewCount > 0 ? `${data.mentorProgress.avgRating}/5` : 'Belum ada' }}</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-blue-100 overflow-hidden">
              <div
                class="h-full bg-blue-600 transition-[width] duration-500 ease-out"
                :style="{ width: `${mentorProgressPercent}%` }"
              />
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Penalti aktif: <strong class="text-slate-900 font-mono">{{ data.user.penaltyCount }}</strong></span>
            <NuxtLink to="/profile" class="text-blue-700 hover:underline font-semibold">
              Lihat Detail Reputasi
            </NuxtLink>
          </div>
        </div>
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
        <div v-if="dashboardMode === 'learn'" key="mode-learn" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left (7 cols): Interactive Filterable Recommendations -->
          <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <header class="px-5 py-4 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-slate-900">Rekomendasi Mentor Untukmu</h2>
                <p class="text-xs text-slate-600">Filter cepat berdasarkan minat belajar atau slot tersedia.</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                  ]"
                  @click="recFilter = 'all'"
                >
                  Semua
                </button>
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'match' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                  ]"
                  @click="recFilter = 'match'"
                >
                  Cocok Minat
                </button>
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                    recFilter === 'slot' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                  ]"
                  @click="recFilter = 'slot'"
                >
                  Slot Buka
                </button>
              </div>
            </header>

            <div v-if="filteredRecommendations.length === 0" class="p-8 text-center space-y-2">
              <p class="text-sm font-medium text-slate-900">Tidak ada rekomendasi pada filter ini</p>
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
                class="p-5 hover:bg-blue-50/30 transition-colors"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1.5">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm sm:text-base font-bold text-slate-900">{{ rec.skill.title }}</p>
                      <span
                        v-if="rec.matchesInterest"
                        class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        Cocok Minatmu
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span class="font-semibold text-slate-800">{{ rec.tutorName }}</span>
                      <VerifiedUkswBadge v-if="rec.tutorVerifiedUksw" />
                      <span class="text-slate-500">
                        {{ [rec.skill.category, rec.tutorMajor].filter(Boolean).join(' · ') }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      class="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/70 text-xs font-semibold text-slate-700 hover:text-blue-700 min-h-[40px]"
                      @click="toggleExpandRec(rec.skill.id)"
                    >
                      {{ expandedRecId === rec.skill.id ? 'Tutup' : 'Detail' }}
                    </button>
                    <NuxtLink
                      to="/explore"
                      class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[40px] inline-flex items-center"
                    >
                      {{ rec.nextSlot ? 'Booking' : 'Hold Queue' }}
                    </NuxtLink>
                  </div>
                </div>

                <Transition name="panel-slide">
                  <div
                    v-if="expandedRecId === rec.skill.id"
                    class="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-600 space-y-1"
                  >
                    <p>{{ rec.skill.description || 'Micro-session tanya-jawab langsung sesuai kebutuhan belajarmu.' }}</p>
                    <p v-if="rec.nextSlot" class="font-semibold text-blue-700 tabular-nums">
                      Jadwal terdekat: {{ formatDateTime(rec.nextSlot.scheduledAt) }} ({{ rec.nextSlot.durationMinutes }}m · {{ rec.nextSlot.format === 'online' ? 'Online' : 'Kampus' }})
                    </p>
                  </div>
                </Transition>
              </li>
            </TransitionGroup>
          </section>

          <!-- Right (5 cols): Upcoming Agenda + Recent Ledger -->
          <div class="lg:col-span-5 space-y-5">
            <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-bold text-slate-900">Agenda Sesi Terdekat</h2>
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
                  Pesan sesi 30 menit pertama dari menu Jelajah memakai saldo kreditmu.
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
                  class="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3"
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

            <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
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
                  class="py-2.5 flex items-center justify-between gap-2 text-xs"
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
        <div v-else key="mode-teach" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
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
                class="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 text-sm font-semibold min-h-[44px] inline-flex items-center"
              >
                Cek Hold Queue Masuk ({{ data.incomingQueueCount }})
              </NuxtLink>
            </div>
          </section>

          <section class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h2 class="text-base font-bold text-slate-900">Jadwal Mengajarmu</h2>
            <p v-if="data.upcomingTutor.length === 0" class="text-xs text-slate-600">
              Belum ada slot mengajar aktif. Publikasikan jadwal pertamamu dari menu Mengajar.
            </p>
            <ul v-else class="space-y-2.5">
              <li
                v-for="t in data.upcomingTutor"
                :key="t.sessionId"
                class="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3"
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
