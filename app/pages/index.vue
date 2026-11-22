<script setup lang="ts">
definePageMeta({
  layout: false
})

interface PreviewItem {
  id: string
  category: string
  title: string
  description: string | null
  tutorName: string
  tutorMeta: string
  isVerifiedUksw: boolean
  isVerifiedMentor: boolean
  completedSessions: number
  avgRating: number
  reviewCount: number
  latestReview: {
    rating: number
    comment: string
    reviewerName: string
  } | null
  hasOpenSlot: boolean
  slotBadge: string
}

interface PreviewPayload {
  stats: {
    activeSkills: number
    completedSessions: number
    verifiedReviews: number
  }
  previews: PreviewItem[]
}

const { loggedIn } = useUserSession()
const { data: previewData, status: previewStatus } = useLazyFetch<PreviewPayload>('/api/preview')

const selectedCategory = ref('Semua')
const expandedSkillId = ref<string | null>(null)
const activeSpotlightId = ref<string | null>(null)

const categories = computed(() => {
  const list = previewData.value?.previews || []
  const unique = Array.from(new Set(list.map((p) => p.category)))
  return ['Semua', ...unique]
})

const spotlightItem = computed(() => {
  const list = previewData.value?.previews || []
  if (activeSpotlightId.value) {
    const found = list.find((p) => p.id === activeSpotlightId.value)
    if (found) return found
  }
  return list[0] || null
})

const directoryList = computed(() => {
  const list = previewData.value?.previews || []
  if (selectedCategory.value === 'Semua') return list
  return list.filter((p) => p.category === selectedCategory.value)
})

function toggleExpand(id: string) {
  expandedSkillId.value = expandedSkillId.value === id ? null : id
  activeSpotlightId.value = id
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Top Header -->
    <header class="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" aria-label="SkillBarter Beranda" class="inline-flex items-center min-h-[44px]">
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <nav aria-label="Navigasi Landing" class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#panggung-interaktif" class="hover:text-blue-700 transition-colors">Pratinjau Interaktif</a>
          <a href="#aturan-ekonomi" class="hover:text-blue-700 transition-colors">Mekanisme Kredit</a>
          <a href="#mentor-preview" class="hover:text-blue-700 transition-colors">Direktori Mentor</a>
        </nav>

        <div class="flex items-center gap-2.5">
          <NuxtLink
            v-if="loggedIn"
            to="/dashboard"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[40px] transition-colors"
          >
            <span>Buka Dashboard</span>
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[40px] transition-colors"
          >
            <span>Masuk</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Section 1: Blueprint Hero + Live Interactive Product Stage -->
      <section id="panggung-interaktif" class="bg-blueprint-grid border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-6 space-y-6">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-200 bg-white text-blue-700">
                Pertukaran Skill 1:1
              </span>
              <VerifiedUkswBadge />
            </div>

            <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.08]">
              Belajar skill praktis
              <span class="font-serif italic font-normal text-blue-600">tanpa uang,</span>
              mengajar untuk kredit.
            </h1>

            <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Dapatkan <strong class="font-semibold text-slate-900">+2 kredit awal</strong> begitu masuk, atur nama dan foto profilmu sendiri, lalu pesan micro-session 30 menit dengan ulasan 100% terverifikasi check-in QR.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <NuxtLink
                v-if="!loggedIn"
                to="/login"
                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm min-h-[48px] transition-colors"
              >
                <span>Mulai &amp; Masuk</span>
                <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
              </NuxtLink>
              <NuxtLink
                v-else
                to="/dashboard"
                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm min-h-[48px] transition-colors"
              >
                <span>Ke Dashboard Saya</span>
                <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
              </NuxtLink>

              <a
                href="#mentor-preview"
                class="inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-blue-700 font-semibold text-sm min-h-[48px] transition-colors"
              >
                Lihat Direktori Mentor
              </a>
            </div>

            <!-- Live DB Telemetry Strip -->
            <div
              v-if="previewData?.stats"
              class="grid grid-cols-3 gap-2.5 pt-2 max-w-lg"
            >
              <div class="p-3 rounded-xl bg-white border border-slate-200">
                <p class="font-mono text-xl sm:text-2xl font-bold text-blue-700">
                  <AnimatedNumber :value="previewData.stats.activeSkills" />
                </p>
                <p class="text-[11px] font-medium text-slate-500 mt-0.5">Skill Aktif</p>
              </div>
              <div class="p-3 rounded-xl bg-white border border-slate-200">
                <p class="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                  <AnimatedNumber :value="previewData.stats.completedSessions" />
                </p>
                <p class="text-[11px] font-medium text-slate-500 mt-0.5">Sesi Selesai</p>
              </div>
              <div class="p-3 rounded-xl bg-white border border-slate-200">
                <p class="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                  <AnimatedNumber :value="previewData.stats.verifiedReviews" />
                </p>
                <p class="text-[11px] font-medium text-slate-500 mt-0.5">Ulasan QR</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-6">
            <LiveProductStage :mentor="spotlightItem" />
          </div>
        </div>
      </section>

      <!-- Section 2: Technical Precision Bento (Anti-Inflation & Verified Trust) -->
      <section id="aturan-ekonomi" class="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
              Arsitektur Anti-Eksploitasi
            </p>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Tiga aturan inti yang menjaga ekosistem tetap adil
            </h2>
          </div>
          <span class="font-mono text-xs text-slate-500">
            Bilangan Bulat · Anti-Minus · Attendance-Gated
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Bento 1 -->
          <article class="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5 stroke-interactive">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs font-semibold text-blue-700">01 · MICRO-SESSION</span>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                  30 Menit
                </span>
              </div>
              <h3 class="text-lg font-bold text-slate-900">
                Dirancang agar pengajar pemula berani mulai
              </h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                Tidak perlu membuat silabus panjang. Gunakan template siap pakai seperti Review Portofolio, Q&amp;A Tugas, atau Latihan Presentasi.
              </p>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-3 border-t border-slate-200 text-[11px] font-medium text-slate-700">
              <span class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50">Review Portofolio</span>
              <span class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50">Q&amp;A Dasar</span>
              <span class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50">Latihan Presentasi</span>
            </div>
          </article>

          <!-- Bento 2 -->
          <article class="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5 stroke-interactive">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs font-semibold text-blue-700">02 · ESCROW &amp; ANTI-INFLASI</span>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border border-blue-600 bg-white text-blue-700">
                  1:1 · Cap +2K Grup
                </span>
              </div>
              <h3 class="text-lg font-bold text-slate-900">
                Kredit selalu aman di escrow, bebas saldo minus dan inflasi
              </h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                Batal &ge; 12 jam sebelum sesi otomatis refund 100%. Sesi grup (2-5 peserta) membutuhkan kuorum minimal 2 orang pada T-2 jam dengan pendapatan pengajar maksimal flat 2 kredit.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-200 text-xs tabular-nums">
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <p class="font-mono font-bold text-blue-700">100%</p>
                <p class="text-slate-600">Refund &ge; 12 jam</p>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <p class="font-mono font-bold text-blue-700">48 Jam</p>
                <p class="text-slate-600">Auto-refund Hold Queue</p>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <p class="font-mono font-bold text-slate-900">1-7 Hari</p>
                <p class="text-slate-600">Cooldown No-Show</p>
              </div>
            </div>
          </article>

          <!-- Bento 3 (Full Width Trust Bar) -->
          <article class="md:col-span-12 bg-white border-2 border-blue-600 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-semibold text-blue-700">03 · VERIFIKASI GANDA</span>
                <VerifiedUkswBadge />
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-blue-600 bg-white text-blue-700">
                  <UIcon name="i-ph-qr-code" class="w-3.5 h-3.5" aria-hidden="true" />
                  Attendance-Gated Review
                </span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900">
                Email <code class="font-mono text-blue-700">@student.uksw.edu</code> &amp; <code class="font-mono text-blue-700">@uksw.edu</code> terverifikasi otomatis, ulasan hanya terbuka setelah Check-in QR
              </h3>
            </div>
            <NuxtLink
              :to="loggedIn ? '/dashboard' : '/login'"
              class="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[44px] transition-colors"
            >
              <span>{{ loggedIn ? 'Buka Dashboard' : 'Coba Masuk Sekarang' }}</span>
              <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- Section 3: Master-Detail Public Mentor Directory -->
      <section id="mentor-preview" class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 mb-6">
          <div>
            <p class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
              Data Langsung Dari Direktori Kampus
            </p>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Pratinjau Penawaran &amp; Mentor Aktif
            </h2>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
              ]"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div v-if="previewStatus === 'pending'" class="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-busy="true">
          <div class="lg:col-span-5 h-72 bg-white border-2 border-blue-200 rounded-2xl animate-pulse" />
          <div class="lg:col-span-7 h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        </div>

        <div
          v-else-if="!previewData?.previews?.length"
          class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600"
        >
          Belum ada penawaran skill publik saat ini. Masuk untuk menjadi mentor pertama.
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Primary Blue Stroke Spotlight Card -->
          <Transition name="panel-slide" mode="out-in">
            <article
              v-if="spotlightItem"
              :key="spotlightItem.id"
              class="lg:col-span-5 bg-white text-slate-900 rounded-2xl p-6 space-y-5 border-2 border-blue-600"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  <UIcon name="i-ph-seal-check-duotone" class="w-4 h-4 text-blue-600" aria-hidden="true" />
                  {{ spotlightItem.isVerifiedMentor ? 'Mentor Terverifikasi' : 'Sorotan Penawaran' }}
                </span>
                <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {{ spotlightItem.slotBadge }}
                </span>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-semibold text-blue-700">{{ spotlightItem.category }}</p>
                <h3 class="text-xl font-bold text-slate-900 leading-snug">
                  {{ spotlightItem.title }}
                </h3>
                <p v-if="spotlightItem.description" class="text-sm text-slate-600 leading-relaxed">
                  {{ spotlightItem.description }}
                </p>
              </div>

              <blockquote
                v-if="spotlightItem.latestReview"
                class="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2"
              >
                <p class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 tabular-nums">
                  <UIcon name="i-ph-star-fill" class="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  <span>Ulasan Terverifikasi · Rating {{ spotlightItem.latestReview.rating }}/5</span>
                </p>
                <p class="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  "{{ spotlightItem.latestReview.comment }}"
                </p>
                <footer class="text-[11px] text-slate-500">
                  Oleh {{ spotlightItem.latestReview.reviewerName }}
                </footer>
              </blockquote>
              <div
                v-else
                class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
              >
                <p class="text-xs font-semibold text-blue-700">Sistem Ulasan Check-in QR</p>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Ulasan terverifikasi untuk sesi ini akan tampil otomatis setelah check-in kehadiran pertama selesai.
                </p>
              </div>

              <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <span
                    class="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {{ getInitials(spotlightItem.tutorName) }}
                  </span>
                  <div class="min-w-0 space-y-0.5">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-sm font-semibold text-slate-900 truncate">{{ spotlightItem.tutorName }}</span>
                      <VerifiedUkswBadge v-if="spotlightItem.isVerifiedUksw" />
                    </div>
                    <p v-if="spotlightItem.tutorMeta" class="text-xs text-slate-500 truncate">
                      {{ spotlightItem.tutorMeta }}
                    </p>
                  </div>
                </div>

                <NuxtLink
                  :to="loggedIn ? '/explore' : '/login'"
                  class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[42px] inline-flex items-center transition-colors shrink-0"
                >
                  {{ loggedIn ? 'Booking (1 Kredit)' : 'Masuk & Booking' }}
                </NuxtLink>
              </div>
            </article>
          </Transition>

          <!-- Right: Structured 3-Tier Directory Card -->
          <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <header class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900">Penawaran Skill</span>
                <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 tabular-nums">
                  {{ directoryList.length }}
                </span>
              </div>
              <NuxtLink
                :to="loggedIn ? '/explore' : '/login'"
                class="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
              >
                <span>{{ loggedIn ? 'Buka Direktori Lengkap' : 'Masuk untuk Semua Jadwal' }}</span>
                <UIcon name="i-ph-arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
              </NuxtLink>
            </header>

            <TransitionGroup name="list-stagger" tag="ul" class="divide-y divide-slate-200">
              <li
                v-for="item in directoryList"
                :key="item.id"
                :class="[
                  'p-4 sm:p-5 transition-colors border-l-4',
                  spotlightItem?.id === item.id || expandedSkillId === item.id
                    ? 'border-l-blue-600 bg-blue-50/30'
                    : 'border-l-transparent hover:bg-slate-50'
                ]"
              >
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {{ item.title }}
                      </h3>
                      <span
                        :class="[
                          'text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0',
                          item.hasOpenSlot
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-slate-600 border-slate-300'
                        ]"
                      >
                        {{ item.hasOpenSlot ? 'Slot Tersedia' : 'Hold Queue' }}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        class="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {{ getInitials(item.tutorName) }}
                      </span>
                      <span class="font-semibold text-slate-800">{{ item.tutorName }}</span>
                      <VerifiedUkswBadge v-if="item.isVerifiedUksw" />
                      <span
                        v-if="item.isVerifiedMentor"
                        class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-600 px-2 py-0.5 rounded-md"
                      >
                        <UIcon name="i-ph-seal-check-duotone" class="w-3 h-3" aria-hidden="true" />
                        Verified Peer Mentor
                      </span>
                    </div>

                    <p class="text-xs text-slate-500 tabular-nums">
                      {{
                        [
                          item.category,
                          item.slotBadge,
                          item.tutorMeta,
                          item.reviewCount > 0 ? `Rating ${item.avgRating}/5 (${item.reviewCount})` : null
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      }}
                    </p>
                  </div>

                  <button
                    type="button"
                    :aria-expanded="expandedSkillId === item.id"
                    :class="[
                      'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold min-h-[38px] transition-colors',
                      expandedSkillId === item.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 bg-white hover:border-blue-600 text-slate-700 hover:text-blue-700'
                    ]"
                    @click="toggleExpand(item.id)"
                  >
                    <span>{{ expandedSkillId === item.id ? 'Tutup' : 'Pratinjau' }}</span>
                    <UIcon
                      :name="expandedSkillId === item.id ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                      class="w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <Transition name="panel-slide">
                  <div
                    v-if="expandedSkillId === item.id"
                    class="mt-3 pt-3 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700"
                  >
                    <p class="leading-relaxed">
                      {{ item.description || 'Micro-session 30 menit tanya-jawab langsung sesuai kebutuhanmu.' }}
                    </p>
                    <NuxtLink
                      :to="loggedIn ? '/explore' : '/login'"
                      class="shrink-0 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs text-center min-h-[36px] inline-flex items-center justify-center transition-colors"
                    >
                      {{ loggedIn ? 'Booking Sekarang' : 'Masuk untuk Booking' }}
                    </NuxtLink>
                  </div>
                </Transition>
              </li>
            </TransitionGroup>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 bg-white py-6">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>SkillBarter · Case 1: Smarter Campus and Learning</span>
        <span>Tim pecut agen</span>
      </div>
    </footer>
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
