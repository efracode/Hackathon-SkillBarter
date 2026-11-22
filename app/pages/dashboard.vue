<script setup lang="ts">
interface DashboardPayload {
  user: {
    name: string
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
    skill: { id: string; category: string; title: string }
    tutorName: string
    tutorMajor: string | null
    tutorCampus: string | null
    matchesInterest: boolean
    nextSlot: { id: string; scheduledAt: string; durationMinutes: number; mode: string } | null
  }>
}

const { data, status, error, refresh } = useLazyFetch<DashboardPayload>('/api/dashboard')

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
      <div class="bg-white border border-stone-200 rounded-2xl p-6 animate-pulse space-y-3">
        <div class="h-6 w-56 bg-stone-200 rounded" />
        <div class="h-4 w-80 bg-stone-100 rounded" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="h-28 bg-white border border-stone-200 rounded-2xl animate-pulse" />
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
      <!-- Editorial Greeting Header -->
      <section class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-stone-300">
        <div class="space-y-1">
          <p class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Beranda Belajar
          </p>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Halo, <span class="font-serif italic font-normal text-indigo-600">{{ data.user.name.split(' ')[0] }}</span>
          </h1>
          <p class="text-sm text-slate-600">
            Mulai dari sesi belajar 30 menit memakai kreditmu, atau buka jadwal mengajar saat siap.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <NuxtLink
            to="/explore"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px] transition-colors"
          >
            <UIcon name="i-ph-compass" class="w-4 h-4" aria-hidden="true" />
            <span>Jelajahi Mentor</span>
          </NuxtLink>
          <NuxtLink
            to="/wallet"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-slate-800 text-sm font-semibold min-h-[44px] transition-colors"
          >
            <UIcon name="i-ph-wallet" class="w-4 h-4 text-teal-700" aria-hidden="true" />
            <span>Riwayat Kredit</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Ruled Telemetry Strip (Asymmetric Visual Contrast vs Plain Boxes) -->
      <section class="bg-white border border-stone-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
        <div class="p-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium text-slate-600">Saldo Tersedia</p>
            <p class="mt-1 text-3xl font-bold font-mono text-teal-700 tabular-nums">
              {{ data.user.creditBalance }}
              <span class="text-sm font-sans font-semibold">Kredit</span>
            </p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <UIcon name="i-ph-wallet" class="w-5 h-5" aria-hidden="true" />
          </span>
        </div>

        <div class="p-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium text-slate-600">Terkunci di Escrow</p>
            <p class="mt-1 text-3xl font-bold font-mono text-amber-700 tabular-nums">
              {{ data.user.escrowBalance }}
              <span class="text-sm font-sans font-semibold">Kredit</span>
            </p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <UIcon name="i-ph-lock-simple-duotone" class="w-5 h-5" aria-hidden="true" />
          </span>
        </div>

        <div class="p-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium text-slate-600">Progres Verified Mentor</p>
            <p class="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {{ Math.min(3, data.mentorProgress.completedCount) }}/3
              <span class="text-xs font-sans font-medium text-slate-600">Sesi Selesai</span>
            </p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <UIcon name="i-ph-seal-check-duotone" class="w-5 h-5" aria-hidden="true" />
          </span>
        </div>
      </section>

      <!-- Action Banner for Incoming Hold Queue -->
      <UAlert
        v-if="data.incomingQueueCount > 0"
        color="warning"
        variant="subtle"
        icon="i-ph-clock"
        :title="`Ada ${data.incomingQueueCount} permintaan Hold Queue menunggu responmu`"
        description="Terima dan tentukan jadwalnya di tab Hold Queue sebelum batas 48 jam berakhir."
      >
        <template #actions>
          <NuxtLink
            to="/sessions?tab=queue"
            class="px-3.5 py-2 rounded-lg bg-amber-700 text-white text-xs font-semibold"
          >
            Lihat Antrean
          </NuxtLink>
        </template>
      </UAlert>

      <!-- Main Workspace Split -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left (7 cols): Ruled Directory Recommendations -->
        <section class="lg:col-span-7 bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <header class="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900">Rekomendasi Mentor Untukmu</h2>
              <p class="text-xs text-slate-600">Diprioritaskan berdasarkan topik belajar pilihanmu.</p>
            </div>
            <NuxtLink to="/explore" class="text-xs font-semibold text-indigo-700 hover:underline">
              Lihat Semua
            </NuxtLink>
          </header>

          <div v-if="data.recommendations.length === 0" class="p-8 text-center space-y-2">
            <p class="text-sm font-medium text-slate-900">Belum ada mentor lain yang membuka penawaran</p>
            <p class="text-xs text-slate-600">Periksa kembali halaman Jelajah secara berkala atau tawarkan topik pertamamu.</p>
          </div>

          <ul v-else class="divide-y divide-stone-200">
            <li
              v-for="rec in data.recommendations"
              :key="rec.skill.id"
              class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
            >
              <div class="min-w-0 space-y-1.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-xs font-medium px-2.5 py-0.5 rounded-md bg-stone-100 text-slate-700">
                    {{ rec.skill.category }}
                  </span>
                  <span
                    v-if="rec.matchesInterest"
                    class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    Cocok Minatmu
                  </span>
                </div>
                <p class="text-sm font-semibold text-slate-900">{{ rec.skill.title }}</p>
                <p class="text-xs text-slate-600 truncate">
                  {{ rec.tutorName }}
                  <template v-if="rec.tutorMajor"> · {{ rec.tutorMajor }}</template>
                  <template v-if="rec.nextSlot">
                    · {{ formatDateTime(rec.nextSlot.scheduledAt) }}
                  </template>
                </p>
              </div>

              <NuxtLink
                to="/explore"
                class="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold text-slate-900 min-h-[42px]"
              >
                {{ rec.nextSlot ? 'Booking (1 Kredit)' : 'Hold Queue' }}
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Right (5 cols): Agenda & Optional Teaching CTA -->
        <div class="lg:col-span-5 space-y-5">
          <section class="bg-white border border-stone-200 rounded-2xl p-5 space-y-3.5">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-900">Agenda Sesi Terdekat</h2>
              <NuxtLink to="/sessions" class="text-xs font-semibold text-indigo-700 hover:underline">
                Kelola Sesi
              </NuxtLink>
            </div>

            <div
              v-if="data.upcomingLearner.length === 0 && data.upcomingTutor.length === 0"
              class="p-4 rounded-xl bg-[#F7F5F0] border border-stone-200 space-y-2"
            >
              <p class="text-xs font-semibold text-slate-800">Jadwalmu masih kosong</p>
              <p class="text-xs text-slate-600">
                Pesan sesi 30 menit pertama dari menu Jelajah memakai 2 kredit modal awalmu.
              </p>
            </div>

            <ul v-else class="space-y-2.5">
              <li
                v-for="s in data.upcomingLearner"
                :key="s.bookingId"
                class="p-3.5 rounded-xl bg-[#F7F5F0] border border-stone-200 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-indigo-700 tabular-nums">
                    Belajar · {{ formatDateTime(s.scheduledAt) }}
                  </p>
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ s.skillTitle }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${s.sessionId}`"
                  class="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center"
                >
                  Masuk
                </NuxtLink>
              </li>
              <li
                v-for="t in data.upcomingTutor"
                :key="t.sessionId"
                class="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-teal-700 tabular-nums">
                    Mengajar · {{ formatDateTime(t.scheduledAt) }}
                  </p>
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ t.skillTitle }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${t.sessionId}`"
                  class="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center"
                >
                  Check-in
                </NuxtLink>
              </li>
            </ul>
          </section>

          <section class="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-ph-chalkboard-teacher" class="w-5 h-5 text-indigo-600" aria-hidden="true" />
              <h2 class="text-sm font-bold text-slate-900">Siap Berbagi 30 Menit?</h2>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Saat kredit belajarmu menipis atau kamu ingin membantu teman seangkatan, buka slot micro-session singkat tanpa perlu bikin silabus panjang.
            </p>
            <NuxtLink
              to="/teach"
              class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-stone-300 bg-[#F7F5F0] hover:bg-stone-200/70 text-xs font-semibold text-slate-900 min-h-[40px]"
            >
              Buka Pengaturan Mengajar
            </NuxtLink>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
