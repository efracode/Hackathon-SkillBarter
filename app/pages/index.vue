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

const categories = computed(() => {
  const list = previewData.value?.previews || []
  const unique = Array.from(new Set(list.map((p) => p.category)))
  return ['Semua', ...unique]
})

const spotlightItem = computed(() => previewData.value?.previews?.[0] || null)

const directoryList = computed(() => {
  const list = previewData.value?.previews || []
  if (selectedCategory.value === 'Semua') return list
  return list.filter((p) => p.category === selectedCategory.value)
})

function toggleExpand(id: string) {
  expandedSkillId.value = expandedSkillId.value === id ? null : id
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F5F0] text-slate-900">
    <!-- Top Header -->
    <header class="bg-white/95 backdrop-blur-xs border-b border-stone-200 sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" aria-label="SkillBarter Beranda" class="inline-flex items-center min-h-[44px]">
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <nav aria-label="Navigasi Landing" class="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#simulasi" class="hover:text-slate-900 transition-colors">Simulasi Kredit</a>
          <a href="#cara-kerja" class="hover:text-slate-900 transition-colors">Mekanisme Trust</a>
          <a href="#mentor-preview" class="hover:text-slate-900 transition-colors">Direktori Mentor</a>
        </nav>

        <div class="flex items-center gap-2.5">
          <NuxtLink
            v-if="loggedIn"
            to="/dashboard"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[42px]"
          >
            <span>Buka Dashboard</span>
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold min-h-[42px]"
          >
            <span>Masuk</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero Split Section -->
      <section class="border-b border-stone-200 bg-white">
        <div class="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-6 space-y-6">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Pertukaran Skill Mahasiswa
              </span>
              <VerifiedUkswBadge />
            </div>

            <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Belajar skill praktis
              <span class="font-serif italic font-normal text-indigo-600">tanpa uang,</span>
              mengajar untuk kredit.
            </h1>

            <p class="text-base text-slate-600 leading-relaxed max-w-xl">
              Masuk dengan Google dan langsung dapatkan 2 kredit belajar. Akun <strong class="font-semibold text-slate-900">@student.uksw.edu</strong> atau <strong class="font-semibold text-slate-900">@uksw.edu</strong> otomatis terverifikasi dengan badge Verified UKSW.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <a
                v-if="!loggedIn"
                href="/api/auth/google"
                class="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm min-h-[48px] transition-colors"
              >
                <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
                <span>Masuk dengan Google</span>
              </a>
              <NuxtLink
                v-else
                to="/dashboard"
                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm min-h-[48px]"
              >
                <span>Ke Dashboard Saya</span>
              </NuxtLink>

              <a
                href="#mentor-preview"
                class="inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 font-semibold text-sm min-h-[48px]"
              >
                Lihat Direktori Mentor
              </a>
            </div>

            <!-- Real Telemetry Pills from DB -->
            <div v-if="previewData?.stats" class="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium tabular-nums">
              <span class="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {{ previewData.stats.activeSkills }} Penawaran Skill Aktif
              </span>
              <span class="px-3 py-1.5 rounded-full bg-[#F7F5F0] text-slate-700 border border-stone-200">
                {{ previewData.stats.completedSessions }} Sesi Selesai
              </span>
              <span class="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
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
              <p class="font-mono text-xs font-semibold uppercase tracking-wider text-teal-700">
                Mengapa Berbeda dari Grup Chat Biasa
              </p>
              <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Dibangun agar pengajar pemula berani mulai dan ulasan tidak bisa dipalsukan
              </h2>
            </div>

            <div class="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-200">
              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-xs font-semibold text-indigo-700">01 · MICRO-30M</span>
                <div class="sm:col-span-9 space-y-1">
                  <h3 class="text-sm font-bold text-slate-900">Bukan kuliah panjang, cukup 30 menit</h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Template siap pakai seperti Review Portofolio, Q&amp;A Dasar, atau Latihan Presentasi menurunkan beban mental pengajar baru.
                  </p>
                </div>
              </div>

              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-xs font-semibold text-amber-700">02 · ESCROW 1:1</span>
                <div class="sm:col-span-9 space-y-1">
                  <h3 class="text-sm font-bold text-slate-900">Ekonomi kredit anti-minus &amp; anti-inflasi</h3>
                  <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Batal &ge; 12 jam refund 100%, sesi grup dibatasi maksimal 2 kredit untuk pengajar, dan no-show dikenai cooldown 1 sampai 7 hari.
                  </p>
                </div>
              </div>

              <div class="p-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                <span class="sm:col-span-3 font-mono text-teal-700 font-semibold">03 · UKSW TRUST</span>
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

      <!-- Section 3: Asymmetric Spotlight + Interactive Filterable Directory (Zero Copy-Paste Cards) -->
      <section id="mentor-preview" class="max-w-6xl mx-auto px-4 pb-16">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-stone-300 mb-6">
          <div>
            <p class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700">
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
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
                selectedCategory === cat
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-stone-300 text-slate-700 hover:bg-stone-100'
              ]"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div v-if="previewStatus === 'pending'" class="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-busy="true">
          <div class="lg:col-span-5 h-64 bg-slate-900/90 rounded-2xl animate-pulse" />
          <div class="lg:col-span-7 h-64 bg-white border border-stone-200 rounded-2xl animate-pulse" />
        </div>

        <div
          v-else-if="!previewData?.previews?.length"
          class="bg-white border border-stone-200 rounded-2xl p-8 text-center text-sm text-slate-600"
        >
          Belum ada penawaran skill publik saat ini. Masuk untuk menjadi mentor pertama.
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Dark Ink Spotlight Card for Top Verified Mentor -->
          <article
            v-if="spotlightItem"
            class="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-5 border border-slate-800"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                Mentor Terverifikasi
              </span>
              <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                {{ spotlightItem.slotBadge }}
              </span>
            </div>

            <div class="space-y-2">
              <h3 class="text-xl font-bold text-white leading-snug">
                {{ spotlightItem.title }}
              </h3>
              <p v-if="spotlightItem.description" class="text-sm text-slate-300 leading-relaxed">
                {{ spotlightItem.description }}
              </p>
            </div>

            <!-- Real Verified Review Quote -->
            <blockquote
              v-if="spotlightItem.latestReview"
              class="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5"
            >
              <p class="text-xs font-semibold text-teal-300 tabular-nums">
                Ulasan Terverifikasi · Rating {{ spotlightItem.latestReview.rating }}/5
              </p>
              <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
                "{{ spotlightItem.latestReview.comment }}"
              </p>
              <footer class="text-[11px] text-slate-400">
                Oleh {{ spotlightItem.latestReview.reviewerName }}
              </footer>
            </blockquote>

            <div class="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-sm font-semibold text-white">{{ spotlightItem.tutorName }}</span>
                  <VerifiedUkswBadge v-if="spotlightItem.isVerifiedUksw" tone="dark" />
                </div>
                <p v-if="spotlightItem.tutorMeta" class="text-xs text-slate-300">
                  {{ spotlightItem.tutorMeta }}
                </p>
              </div>

              <NuxtLink
                :to="loggedIn ? '/explore' : '/login'"
                class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold min-h-[42px] inline-flex items-center"
              >
                {{ loggedIn ? 'Booking (1 Kredit)' : 'Masuk & Booking' }}
              </NuxtLink>
            </div>
          </article>

          <!-- Right: Interactive Expandable Directory Rows -->
          <div class="lg:col-span-7 bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <header class="px-5 py-3.5 bg-[#F7F5F0] border-b border-stone-200 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">
                Penawaran Skill ({{ directoryList.length }})
              </span>
              <NuxtLink
                :to="loggedIn ? '/explore' : '/login'"
                class="text-xs font-semibold text-indigo-700 hover:underline"
              >
                {{ loggedIn ? 'Buka Direktori Lengkap' : 'Masuk untuk Semua Jadwal' }}
              </NuxtLink>
            </header>

            <TransitionGroup name="list-stagger" tag="ul" class="divide-y divide-stone-200">
              <li
                v-for="item in directoryList"
                :key="item.id"
                class="p-4 sm:p-5 hover:bg-stone-50/80 transition-colors"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-slate-700">
                        {{ item.category }}
                      </span>
                      <span
                        :class="[
                          'text-[11px] font-semibold px-2 py-0.5 rounded',
                          item.hasOpenSlot
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-amber-50 text-amber-700'
                        ]"
                      >
                        {{ item.slotBadge }}
                      </span>
                    </div>

                    <h3 class="text-sm sm:text-base font-semibold text-slate-900">
                      {{ item.title }}
                    </h3>

                    <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span class="font-medium text-slate-800">{{ item.tutorName }}</span>
                      <VerifiedUkswBadge v-if="item.isVerifiedUksw" />
                      <span
                        v-if="item.isVerifiedMentor"
                        class="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded"
                      >
                        <UIcon name="i-ph-seal-check-duotone" class="w-3 h-3" aria-hidden="true" />
                        Verified Peer Mentor
                      </span>
                      <span v-if="item.tutorMeta" class="text-slate-500">· {{ item.tutorMeta }}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    :aria-expanded="expandedSkillId === item.id"
                    class="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold text-slate-800 min-h-[38px]"
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
                    class="mt-3 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600"
                  >
                    <p class="leading-relaxed">
                      {{ item.description || 'Micro-session 30 menit tanya-jawab langsung sesuai kebutuhanmu.' }}
                    </p>
                    <NuxtLink
                      :to="loggedIn ? '/explore' : '/login'"
                      class="shrink-0 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center min-h-[36px] inline-flex items-center justify-center"
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

    <footer class="border-t border-stone-200 bg-white py-6">
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
