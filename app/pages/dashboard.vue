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
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading Skeleton (Instant Page Transition) -->
    <div v-if="status === 'pending'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-3">
        <div class="h-6 w-56 bg-slate-200 rounded" />
        <div class="h-4 w-80 bg-slate-100 rounded" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
      <p class="sr-only">Sedang memuat dashboard SkillBarter...</p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat dashboard"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <!-- Greeting & Credit Hero Card -->
      <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div class="space-y-1.5">
          <p class="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Dashboard Belajar &amp; Mengajar
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Halo, {{ data.user.name.split(' ')[0] }}
          </h1>
          <p class="text-sm text-slate-600">
            Gunakan kreditmu untuk belajar dari mentor terverifikasi, atau buka sesi 30 menit saat kamu siap berbagi.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 tabular-nums">
            <p class="text-xs text-teal-700 font-medium">Saldo Tersedia</p>
            <p class="text-2xl font-bold font-mono text-teal-700">{{ data.user.creditBalance }} Kredit</p>
          </div>
          <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 tabular-nums">
            <p class="text-xs text-amber-700 font-medium">Di Escrow</p>
            <p class="text-2xl font-bold font-mono text-amber-700">{{ data.user.escrowBalance }} Kredit</p>
          </div>
          <NuxtLink
            to="/explore"
            class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[48px]"
          >
            <UIcon name="i-ph-compass" class="w-4 h-4" aria-hidden="true" />
            <span>Cari Mentor</span>
          </NuxtLink>
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
            to="/sessions"
            class="px-3.5 py-2 rounded-lg bg-amber-700 text-white text-xs font-semibold"
          >
            Lihat Antrean
          </NuxtLink>
        </template>
      </UAlert>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left (7 cols): Recommended Mentors Matching Interests -->
        <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-bold text-slate-900">Rekomendasi Mentor Untukmu</h2>
              <p class="text-xs text-slate-600">Diprioritaskan berdasarkan minat belajarmu.</p>
            </div>
            <NuxtLink to="/explore" class="text-xs font-semibold text-indigo-600 hover:underline">
              Lihat Semua
            </NuxtLink>
          </div>

          <div v-if="data.recommendations.length === 0" class="py-8 text-center text-sm text-slate-600">
            Belum ada mentor lain yang membuka penawaran saat ini.
          </div>

          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="rec in data.recommendations"
              :key="rec.skill.id"
              class="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ rec.skill.category }}
                  </span>
                  <span
                    v-if="rec.matchesInterest"
                    class="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700"
                  >
                    Cocok Minatmu
                  </span>
                </div>
                <p class="text-sm font-semibold text-slate-900">{{ rec.skill.title }}</p>
                <p class="text-xs text-slate-600">
                  {{ rec.tutorName }}
                  <template v-if="rec.tutorMajor"> · {{ rec.tutorMajor }}</template>
                  <template v-if="rec.nextSlot">
                    · Slot terdekat: {{ formatDateTime(rec.nextSlot.scheduledAt) }}
                  </template>
                </p>
              </div>

              <NuxtLink
                to="/explore"
                class="shrink-0 inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 min-h-[40px]"
              >
                {{ rec.nextSlot ? 'Booking (1 Kredit)' : 'Masuk Hold Queue' }}
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Right (5 cols): Upcoming Sessions & Mentor Progress -->
        <div class="lg:col-span-5 space-y-5">
          <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-900">Jadwal Sesi Terdekat</h2>
              <NuxtLink to="/sessions" class="text-xs font-semibold text-indigo-600 hover:underline">
                Kelola Sesi
              </NuxtLink>
            </div>

            <div
              v-if="data.upcomingLearner.length === 0 && data.upcomingTutor.length === 0"
              class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600"
            >
              Belum ada sesi terjadwal. Cari mentor di Jelajah untuk mulai belajar.
            </div>

            <ul v-else class="space-y-2.5">
              <li
                v-for="s in data.upcomingLearner"
                :key="s.bookingId"
                class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-indigo-700">Belajar · {{ formatDateTime(s.scheduledAt) }}</p>
                  <p class="text-sm font-medium text-slate-900 truncate">{{ s.skillTitle }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${s.sessionId}`"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shrink-0"
                >
                  Masuk
                </NuxtLink>
              </li>
              <li
                v-for="t in data.upcomingTutor"
                :key="t.sessionId"
                class="p-3 rounded-xl bg-teal-50/50 border border-teal-200 flex items-center justify-between gap-2"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-teal-700">Mengajar · {{ formatDateTime(t.scheduledAt) }}</p>
                  <p class="text-sm font-medium text-slate-900 truncate">{{ t.skillTitle }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${t.sessionId}`"
                  class="px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold shrink-0"
                >
                  Check-in
                </NuxtLink>
              </li>
            </ul>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-ph-seal-check-duotone" class="w-5 h-5 text-teal-700" aria-hidden="true" />
                <h2 class="text-sm font-bold text-slate-900">Status Peer Mentor</h2>
              </div>
              <NuxtLink to="/teach" class="text-xs font-semibold text-indigo-600 hover:underline">
                Atur Mengajar
              </NuxtLink>
            </div>
            <p class="text-xs text-slate-600 tabular-nums">
              {{ data.mentorProgress.completedCount }}/3 Sesi Selesai ·
              {{ data.mentorProgress.reviewCount > 0 ? `Rating ${data.mentorProgress.avgRating}/5` : 'Belum ada ulasan' }} ·
              {{ data.user.penaltyCount }} Penalti
            </p>
            <p class="text-xs text-slate-500">
              Siap berbagi? Buka slot micro-session 30 menit di menu Mengajar kapan pun kamu mau.
            </p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
