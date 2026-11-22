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
  <div class="min-h-screen bg-[#F4F7FB] text-slate-900">
    <!-- Top Header -->
    <header class="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" aria-label="SkillBarter Beranda" class="inline-flex items-center min-h-[44px]">
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <nav aria-label="Navigasi Landing" class="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#simulasi" class="hover:text-blue-700 transition-colors">Simulasi Kredit</a>
          <a href="#cara-kerja" class="hover:text-blue-700 transition-colors">Mekanisme Trust</a>
          <a href="#mentor-preview" class="hover:text-blue-700 transition-colors">Direktori Mentor</a>
        </nav>

        <div class="flex items-center gap-2.5">
          <NuxtLink
            v-if="loggedIn"
            to="/dashboard"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[42px] transition-colors"
          >
            <span>Buka Dashboard</span>
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[42px] transition-colors"
          >
            <span>Masuk</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero Split Section -->
      <section class="border-b border-slate-200 bg-white">
        <div class="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-6 space-y-6">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
                Pertukaran Skill Mahasiswa
              </span>
              <VerifiedUkswBadge />
            </div>

            <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Belajar skill praktis
              <span class="font-serif italic font-normal text-blue-600">tanpa uang,</span>
              mengajar untuk kredit.
            </h1>

            <p class="text-base text-slate-600 leading-relaxed max-w-xl">
              Masuk dengan Google dan langsung dapatkan 2 kredit belajar. Akun <strong class="font-semibold text-slate-900">@student.uksw.edu</strong> atau <strong class="font-semibold text-slate-900">@uksw.edu</strong> otomatis terverifikasi dengan badge Verified UKSW.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <a
                v-if="!loggedIn"
                href="/api/auth/google"
                class="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm min-h-[48px] transition-colors shadow-xs"
              >
                <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
                <span>Masuk dengan Google</span>
              </a>
              <NuxtLink
                v-else
                to="/dashboard"
                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm min-h-[48px] transition-colors shadow-xs"
              >
                <span>Ke Dashboard Saya</span>
              </NuxtLink>

              <a
                href="#mentor-preview"
                class="inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 font-semibold text-sm min-h-[48px] transition-colors"
              >
                Lihat Direktori Mentor
              </a>
            </div>

            <!-- Real Telemetry Pills from DB -->
            <div v-if="previewData?.stats" class="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium tabular-nums">
              <span class="px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {{ previewData.stats.activeSkills }} Penawaran Skill Aktif
              </span>
              <span class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {{ previewData.stats.completedSessions }} Sesi Selesai
              </span>
              <span class="px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {{ previewData.stats.verifiedReviews }} Ulasan Terverifikasi
              </span>
            </div>
          </div>

          <div id="simulasi" class="lg:col-span-6">
            <CreditFlowSimulator />
          </div>
        </div>
      </section>

      <!-- Section 2: Ruled Mechanism + Interactive Check-in Playground -->
      <section id="cara-kerja" class="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-7 space-y-6">
            <div>
              <p class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
                Mengapa Berbeda dari Grup Chat Biasa
              </p>
              <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Dibangun agar pengajar pemula berani mulai dan ulasan tidak bisa dipalsukan
              </h2>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-200 shadow-xs">
              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-xs font-semibold text-blue-700">01 · MICRO-30M</span>
                <div class="sm:col-span-9 space-y-1">
                  <h3 class="text-sm font-bold text-slate-900">Bukan kuliah panjang, cukup 30 menit</h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Template siap pakai seperti Review Portofolio, Q&amp;A Dasar, atau Latihan Presentasi menurunkan beban mental pengajar baru.
                  </p>
                </div>
              </div>

              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-xs font-semibold text-sky-700">02 · ESCROW 1:1</span>
                <div class="sm:col-span-9 space-y-1">
                  <h3 class="text-sm font-bold text-slate-900">Ekonomi kredit anti-minus &amp; anti-inflasi</h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Batal &ge; 12 jam refund 100%, sesi grup dibatasi maksimal 2 kredit untuk pengajar, dan no-show dikenai cooldown 1 sampai 7 hari.
                  </p>
                </div>
              </div>

              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-blue-800 font-semibold">03 · UKSW TRUST</span>
                <div class="sm:col-span-9 space-y-1">
                  <h3 class="text-sm font-bold text-slate-900">Verifikasi kampus UKSW &amp; Check-in QR</h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Login dengan email <strong class="text-slate-900">@student.uksw.edu</strong> atau <strong class="text-slate-900">@uksw.edu</strong> otomatis memperoleh badge Verified UKSW di profil dan direktori.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5">
            <CheckinPreviewWidget />
          </div>
        </div>
      </section>

      <!-- Section 3: Hierarchical Royal Blue Spotlight + Clean 3-Tier Directory -->
      <section id="mentor-preview" class="max-w-6xl mx-auto px-4 pb-16">
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
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
              ]"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div v-if="previewStatus === 'pending'" class="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-busy="true">
          <div class="lg:col-span-5 h-72 bg-blue-950/90 rounded-2xl animate-pulse" />
          <div class="lg:col-span-7 h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        </div>

        <div
          v-else-if="!previewData?.previews?.length"
          class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600"
        >
          Belum ada penawaran skill publik saat ini. Masuk untuk menjadi mentor pertama.
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Royal Blue Anchor Spotlight Card -->
          <Transition name="panel-slide" mode="out-in">
            <article
              v-if="spotlightItem"
              :key="spotlightItem.id"
              class="lg:col-span-5 bg-gradient-to-br from-[#0B2249] via-[#13366F] to-[#1D4ED8] text-white rounded-2xl p-6 sm:p-7 space-y-5 border border-blue-800/60 shadow-md"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                  <UIcon name="i-ph-seal-check-duotone" class="w-4 h-4 text-sky-300" aria-hidden="true" />
                  {{ spotlightItem.isVerifiedMentor ? 'Mentor Terverifikasi' : 'Sorotan Penawaran' }}
                </span>
                <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-white/12 text-blue-50 border border-white/20">
                  {{ spotlightItem.slotBadge }}
                </span>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-semibold text-sky-200">{{ spotlightItem.category }}</p>
                <h3 class="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {{ spotlightItem.title }}
                </h3>
                <p v-if="spotlightItem.description" class="text-sm text-blue-100/90 leading-relaxed">
                  {{ spotlightItem.description }}
                </p>
              </div>

              <!-- Real Verified Review Quote or Readiness Callout -->
              <blockquote
                v-if="spotlightItem.latestReview"
                class="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2"
              >
                <p class="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 tabular-nums">
                  <UIcon name="i-ph-star-fill" class="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
                  <span>Ulasan Terverifikasi · Rating {{ spotlightItem.latestReview.rating }}/5</span>
                </p>
                <p class="text-xs sm:text-sm text-white/95 leading-relaxed">
                  "{{ spotlightItem.latestReview.comment }}"
                </p>
                <footer class="text-[11px] text-blue-200">
                  Oleh {{ spotlightItem.latestReview.reviewerName }}
                </footer>
              </blockquote>
              <div
                v-else
                class="p-4 rounded-xl bg-white/10 border border-white/15 space-y-1"
              >
                <p class="text-xs font-semibold text-sky-200">Sistem Ulasan Check-in QR</p>
                <p class="text-xs text-blue-100 leading-relaxed">
                  Ulasan terverifikasi untuk sesi ini akan tampil otomatis setelah check-in kehadiran pertama selesai.
                </p>
              </div>

              <div class="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                  <span
                    class="w-10 h-10 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {{ getInitials(spotlightItem.tutorName) }}
                  </span>
                  <div class="min-w-0 space-y-0.5">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-sm font-semibold text-white truncate">{{ spotlightItem.tutorName }}</span>
                      <VerifiedUkswBadge v-if="spotlightItem.isVerifiedUksw" tone="dark" />
                    </div>
                    <p v-if="spotlightItem.tutorMeta" class="text-xs text-blue-200 truncate">
                      {{ spotlightItem.tutorMeta }}
                    </p>
                  </div>
                </div>

                <NuxtLink
                  :to="loggedIn ? '/explore' : '/login'"
                  class="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#0B2249] text-xs font-bold min-h-[42px] inline-flex items-center shadow-xs transition-colors shrink-0"
                >
                  {{ loggedIn ? 'Booking (1 Kredit)' : 'Masuk & Booking' }}
                </NuxtLink>
              </div>
            </article>
          </Transition>

          <!-- Right: Structured 3-Tier Directory Card -->
          <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <header class="px-5 py-3.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900">Penawaran Skill</span>
                <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white tabular-nums">
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
                    ? 'border-l-blue-600 bg-blue-50/35'
                    : 'border-l-transparent hover:bg-slate-50/80'
                ]"
              >
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-2">
                    <!-- Tier 1: Title + Single Clean Availability Tag -->
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {{ item.title }}
                      </h3>
                      <span
                        :class="[
                          'text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0',
                          item.hasOpenSlot
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        ]"
                      >
                        {{ item.hasOpenSlot ? 'Slot Tersedia' : 'Hold Queue' }}
                      </span>
                    </div>

                    <!-- Tier 2: Mentor Identity & Trust Credentials -->
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {{ getInitials(item.tutorName) }}
                      </span>
                      <span class="font-semibold text-slate-800">{{ item.tutorName }}</span>
                      <VerifiedUkswBadge v-if="item.isVerifiedUksw" />
                      <span
                        v-if="item.isVerifiedMentor"
                        class="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md"
                      >
                        <UIcon name="i-ph-seal-check-duotone" class="w-3 h-3" aria-hidden="true" />
                        Verified Peer Mentor
                      </span>
                    </div>

                    <!-- Tier 3: Quiet Structured Metadata -->
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
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700'
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
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
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
