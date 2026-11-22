<script setup lang="ts">
definePageMeta({
  layout: false
})

interface PreviewPayload {
  stats: {
    activeSkills: number
    completedSessions: number
    verifiedReviews: number
  }
  previews: Array<{
    id: string
    category: string
    title: string
    description: string | null
    tutorName: string
    tutorMeta: string
    isVerifiedMentor: boolean
    avgRating: number
    reviewCount: number
    slotBadge: string
  }>
}

const { loggedIn } = useUserSession()
const { data: previewData, status: previewStatus } = useLazyFetch<PreviewPayload>('/api/preview')

const activeStep = ref(0)
const simulationSteps = [
  {
    code: '01',
    label: 'Booking Slot',
    title: 'Kredit dikunci aman di Escrow',
    detail: 'Saat kamu memesan micro-session 30 menit, 1 kredit dipindahkan ke escrow agar pengajar yakin pemesan serius.',
    learnerAvailable: 1,
    escrowHeld: 1,
    tutorEarned: 0,
    statusBadge: 'Escrow Terkunci'
  },
  {
    code: '02',
    label: 'Micro-Session 30m',
    title: 'Sesi santai berbasis template topik',
    detail: 'Tanpa perlu slide kuliah berat. Fokus tanya-jawab, bedah error, atau review portofolio lewat Meet atau tatap muka kampus.',
    learnerAvailable: 1,
    escrowHeld: 1,
    tutorEarned: 0,
    statusBadge: 'Sesi Berlangsung'
  },
  {
    code: '03',
    label: 'Check-in QR / PIN',
    title: 'Kehadiran terverifikasi di tempat',
    detail: 'Pengajar memunculkan kode 6 digit & QR. Pembelajar memindai untuk mencatat bukti kehadiran nyata sebelum mengulas.',
    learnerAvailable: 1,
    escrowHeld: 1,
    tutorEarned: 0,
    statusBadge: 'Kehadiran Terverifikasi'
  },
  {
    code: '04',
    label: 'Ulasan & Cair',
    title: 'Ulasan terbuka & kredit cair 1:1',
    detail: 'Form rating hanya terbuka bagi peserta yang check-in. Setelah jeda sengketa 24 jam, 1 kredit cair ke pengajar.',
    learnerAvailable: 1,
    escrowHeld: 0,
    tutorEarned: 1,
    statusBadge: 'Selesai (+1 Kredit)'
  }
]

const currentSim = computed(() => simulationSteps[activeStep.value] || simulationSteps[0]!)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Editorial Top Bar -->
    <header class="bg-white/95 border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" aria-label="SkillBarter Beranda" class="inline-flex items-center min-h-[44px]">
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <nav aria-label="Navigasi Landing" class="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#simulasi" class="hover:text-slate-900 transition-colors">Simulasi Kredit</a>
          <a href="#mentor-preview" class="hover:text-slate-900 transition-colors">Pratinjau Mentor</a>
          <a href="#cara-kerja" class="hover:text-slate-900 transition-colors">Mekanisme Trust</a>
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
      <section class="border-b border-slate-200 bg-white">
        <div class="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-6 space-y-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Pertukaran Skill Antar Mahasiswa
            </p>

            <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]">
              Belajar skill praktis
              <span class="font-serif italic font-normal text-indigo-600">tanpa uang,</span>
              mengajar untuk kredit.
            </h1>

            <p class="text-base text-slate-600 leading-relaxed max-w-xl">
              Dapatkan 2 kredit awal setelah masuk. Gunakan untuk sesi singkat 30 menit bersama rekan mahasiswa yang memiliki ulasan terverifikasi check-in QR.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <a
                v-if="!loggedIn"
                href="/api/auth/google"
                class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm min-h-[48px] transition-colors"
              >
                <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
                <span>Masuk dengan Google</span>
              </a>
              <NuxtLink
                v-else
                to="/dashboard"
                class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm min-h-[48px]"
              >
                <span>Ke Dashboard Saya</span>
              </NuxtLink>

              <a
                href="#mentor-preview"
                class="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm min-h-[48px]"
              >
                Lihat Pratinjau Mentor
              </a>
            </div>

            <!-- Real Telemetry Pills from DB -->
            <div v-if="previewData?.stats" class="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium tabular-nums">
              <span class="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {{ previewData.stats.activeSkills }} Penawaran Skill Aktif
              </span>
              <span class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {{ previewData.stats.completedSessions }} Sesi Selesai
              </span>
              <span class="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {{ previewData.stats.verifiedReviews }} Ulasan Terverifikasi
              </span>
            </div>
          </div>

          <!-- Interactive Credit & Escrow Preview Widget -->
          <div id="simulasi" class="lg:col-span-6">
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pratinjau Mekanisme
                  </p>
                  <h2 class="text-base font-bold text-slate-900">
                    Simulasi Siklus 1 Kredit &amp; Escrow
                  </h2>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-indigo-700">
                  {{ currentSim.statusBadge }}
                </span>
              </div>

              <!-- Step Selector Tabs -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist" aria-label="Tahapan Simulasi Kredit">
                <button
                  v-for="(step, idx) in simulationSteps"
                  :key="step.code"
                  type="button"
                  role="tab"
                  :aria-selected="activeStep === idx"
                  :class="[
                    'text-left p-2.5 rounded-xl border text-xs transition-colors min-h-[44px]',
                    activeStep === idx
                      ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  ]"
                  @click="activeStep = idx"
                >
                  <span class="font-mono block opacity-80">{{ step.code }}</span>
                  <span class="truncate block">{{ step.label }}</span>
                </button>
              </div>

              <!-- Active Simulation State Card -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">{{ currentSim.title }}</h3>
                  <p class="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {{ currentSim.detail }}
                  </p>
                </div>

                <div class="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 font-mono tabular-nums">
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p class="text-[11px] font-sans text-slate-500">Saldo Pembelajar</p>
                    <p class="text-lg font-bold text-slate-900">{{ currentSim.learnerAvailable }}</p>
                  </div>
                  <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <p class="text-[11px] font-sans text-amber-700">Escrow Terkunci</p>
                    <p class="text-lg font-bold text-amber-700">{{ currentSim.escrowHeld }}</p>
                  </div>
                  <div class="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                    <p class="text-[11px] font-sans text-teal-700">Kredit Pengajar</p>
                    <p class="text-lg font-bold text-teal-700">+{{ currentSim.tutorEarned }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Ruled Mechanism Section (Varying Rhythm) -->
      <section id="cara-kerja" class="max-w-6xl mx-auto px-4 py-12">
        <div class="mb-6">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dirancang agar pengajar pemula tidak ragu memulai
          </h2>
          <p class="text-sm text-slate-600 mt-1">
            Setiap aturan di SkillBarter dibuat untuk menjaga keadilan waktu dan keaslian ulasan.
          </p>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-200">
          <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-baseline">
            <span class="md:col-span-2 font-mono text-xs font-semibold text-indigo-700">01 · MICRO-SESSION</span>
            <h3 class="md:col-span-4 text-base font-semibold text-slate-900">
              Mulai dari 30 menit tanpa materi berat
            </h3>
            <p class="md:col-span-6 text-sm text-slate-600 leading-relaxed">
              Pilih template siap pakai seperti Review Tugas, Q&amp;A Dasar, atau Latihan Presentasi. Masuk dulu ke dashboard untuk belajar memakai 2 kredit awal sebelum kamu siap mengajar.
            </p>
          </div>

          <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-baseline">
            <span class="md:col-span-2 font-mono text-xs font-semibold text-amber-700">02 · ESCROW 1:1</span>
            <h3 class="md:col-span-4 text-base font-semibold text-slate-900">
              Saldo bilangan bulat dan anti-minus
            </h3>
            <p class="md:col-span-6 text-sm text-slate-600 leading-relaxed">
              Batal minimal 12 jam sebelum sesi otomatis mengembalikan 100% kredit. Sesi grup berkapasitas 2 sampai 5 orang tetap dibatasi maksimal 2 kredit untuk pengajar agar ekonomi bebas inflasi.
            </p>
          </div>

          <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-baseline">
            <span class="md:col-span-2 font-mono text-xs font-semibold text-teal-700">03 · CHECK-IN QR</span>
            <h3 class="md:col-span-4 text-base font-semibold text-slate-900">
              Ulasan hanya terbuka setelah hadir
            </h3>
            <p class="md:col-span-6 text-sm text-slate-600 leading-relaxed">
              Pembelajar wajib memvalidasi kode 6 digit atau memindai QR pengajar saat sesi berlangsung. Pengajar dengan minimal 3 sesi selesai, rating 4.5+, dan 0 penalti memperoleh badge Verified Peer Mentor.
            </p>
          </div>
        </div>
      </section>

      <!-- Live Public Mentor Preview from Database -->
      <section id="mentor-preview" class="max-w-6xl mx-auto px-4 pb-16">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pratinjau Penawaran Skill Saat Ini
            </h2>
            <p class="text-sm text-slate-600 mt-1">
              Data langsung dari direktori kampus. Masuk dengan akun Google untuk melihat semua jadwal.
            </p>
          </div>
          <NuxtLink
            :to="loggedIn ? '/explore' : '/login'"
            class="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {{ loggedIn ? 'Buka Direktori Lengkap' : 'Masuk untuk Booking' }}
          </NuxtLink>
        </div>

        <div v-if="previewStatus === 'pending'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse"
          >
            <div class="h-4 w-24 bg-slate-200 rounded" />
            <div class="h-5 w-full bg-slate-200 rounded" />
            <div class="h-4 w-2/3 bg-slate-200 rounded" />
          </div>
        </div>

        <div
          v-else-if="!previewData?.previews?.length"
          class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600"
        >
          Belum ada penawaran skill publik yang tersedia saat ini. Masuk untuk membuat penawaran pertama.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article
            v-for="item in previewData.previews"
            :key="item.id"
            class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
          >
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {{ item.category }}
                </span>
                <span class="text-xs font-medium text-slate-600">{{ item.slotBadge }}</span>
              </div>

              <h3 class="text-base font-semibold text-slate-900 leading-snug">
                {{ item.title }}
              </h3>

              <p v-if="item.description" class="text-xs text-slate-600 line-clamp-2">
                {{ item.description }}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 space-y-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-sm font-medium text-slate-900">{{ item.tutorName }}</span>
                <span
                  v-if="item.isVerifiedMentor"
                  class="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md"
                >
                  <UIcon name="i-ph-seal-check-duotone" class="w-3.5 h-3.5" aria-hidden="true" />
                  Verified Peer Mentor
                </span>
              </div>
              <p v-if="item.tutorMeta" class="text-xs text-slate-500">{{ item.tutorMeta }}</p>
              <p class="text-xs font-medium text-slate-700 tabular-nums">
                {{
                  item.reviewCount > 0
                    ? `Rating ${item.avgRating} (${item.reviewCount} ulasan terverifikasi)`
                    : 'Belum ada ulasan terverifikasi'
                }}
              </p>
            </div>
          </article>
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
