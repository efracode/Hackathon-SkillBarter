<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const hasOAuthError = computed(() => route.query.error === 'oauth_failed')

const previewDomain = ref<'uksw' | 'general'>('uksw')
const activePillar = ref(0)

const pillars = [
  {
    code: '01',
    badge: '+2 Kredit Awal',
    title: 'Masuk langsung dapat 2 kredit belajar',
    desc: 'Tidak harus langsung mengajar. Masuk ke dashboard, pilih mentor, dan pesan sesi pertamamu.',
    sampleTitle: 'Dompet Kredit Awal',
    sampleMetric: '2 Kredit Tersedia · 0 Escrow'
  },
  {
    code: '02',
    badge: 'Micro-Session 30m',
    title: 'Sesi singkat 30 menit berbasis template',
    desc: 'Fokus tanya-jawab, bedah error, atau review portofolio tanpa menyiapkan materi kuliah panjang.',
    sampleTitle: 'Template Populer',
    sampleMetric: 'Review Portofolio · Q&A Dasar · Presentasi'
  },
  {
    code: '03',
    badge: 'Check-in QR & UKSW',
    title: 'Ulasan terverifikasi & badge Verified UKSW',
    desc: 'Rating hanya terbuka setelah check-in QR, dan email @student.uksw.edu / @uksw.edu terverifikasi otomatis.',
    sampleTitle: 'Verifikasi Ganda',
    sampleMetric: 'Verified UKSW + Verified Attendance'
  }
]

const currentPillar = computed(() => pillars[activePillar.value] || pillars[0]!)
</script>

<template>
  <main class="min-h-screen bg-[#F7F5F0] text-slate-900 flex flex-col justify-between px-4 py-8 sm:py-12">
    <div class="max-w-5xl w-full mx-auto">
      <div class="flex items-center justify-between gap-4 pb-6 border-b border-stone-300">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 min-h-[40px]"
        >
          <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Pratinjau</span>
        </NuxtLink>
        <SkillBarterLogo size="sm" />
      </div>

      <div class="pt-10 sm:pt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <!-- Editorial Interactive Column -->
        <section class="lg:col-span-7 space-y-6">
          <div class="space-y-3">
            <p class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Ekonomi Waktu Kampus · 1:1 Adil
            </p>
            <h1 class="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Tukar waktumu jadi
              <span class="font-serif italic font-normal text-indigo-600">kredit belajar,</span>
              bukan biaya uang.
            </h1>
            <p class="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
              Platform pertukaran keahlian antar mahasiswa dengan escrow anti-minus dan bukti kehadiran nyata.
            </p>
          </div>

          <!-- Interactive Pillars -->
          <div class="border-t border-stone-300 divide-y divide-stone-300">
            <button
              v-for="(item, idx) in pillars"
              :key="item.code"
              type="button"
              :aria-pressed="activePillar === idx"
              :class="[
                'w-full text-left py-4 px-3.5 -mx-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-baseline transition-colors duration-150',
                activePillar === idx ? 'bg-white shadow-xs' : 'hover:bg-white/60'
              ]"
              @click="activePillar = idx"
            >
              <span
                :class="[
                  'sm:col-span-2 font-mono text-xs font-semibold',
                  activePillar === idx ? 'text-indigo-700' : 'text-teal-700'
                ]"
              >
                {{ item.code }}
              </span>
              <div class="sm:col-span-10 space-y-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h2 class="text-sm font-semibold text-slate-900">{{ item.title }}</h2>
                  <span
                    v-if="activePillar === idx"
                    class="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {{ item.badge }}
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">{{ item.desc }}</p>
              </div>
            </button>
          </div>

          <!-- Animated Mini Product Preview Strip -->
          <Transition name="panel-slide" mode="out-in">
            <div
              :key="activePillar"
              class="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-0.5">
                <p class="font-mono text-[11px] uppercase tracking-wider text-teal-300">
                  {{ currentPillar.sampleTitle }}
                </p>
                <p class="text-sm font-semibold text-white">{{ currentPillar.sampleMetric }}</p>
              </div>
              <VerifiedUkswBadge tone="dark" />
            </div>
          </Transition>
        </section>

        <!-- Auth Card Column -->
        <section class="lg:col-span-5">
          <div class="bg-white border border-stone-300 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div class="space-y-2 pb-5 border-b border-stone-200">
              <SkillBarterLogo size="md" />
              <h2 class="text-xl font-bold text-slate-900 pt-2">Masuk ke Akunmu</h2>
              <p class="text-sm text-slate-600">
                Gunakan akun Google untuk masuk instan tanpa kode OTP berulang.
              </p>
            </div>

            <!-- Interactive Domain Trust Simulator -->
            <div class="rounded-xl bg-[#F7F5F0] border border-stone-200 p-4 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold text-slate-800">Cek Status Domain Emailmu:</p>
                <div class="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    :class="[
                      'px-2.5 py-1 rounded-md transition-colors',
                      previewDomain === 'uksw' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    ]"
                    @click="previewDomain = 'uksw'"
                  >
                    @student.uksw.edu
                  </button>
                  <button
                    type="button"
                    :class="[
                      'px-2.5 py-1 rounded-md transition-colors',
                      previewDomain === 'general' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    ]"
                    @click="previewDomain = 'general'"
                  >
                    Gmail Umum
                  </button>
                </div>
              </div>

              <Transition name="panel-slide" mode="out-in">
                <div
                  v-if="previewDomain === 'uksw'"
                  key="domain-uksw"
                  class="flex items-center justify-between gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2.5"
                >
                  <span class="text-xs text-slate-700">Email `@student.uksw.edu` / `@uksw.edu`</span>
                  <VerifiedUkswBadge />
                </div>
                <div
                  v-else
                  key="domain-general"
                  class="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2.5"
                >
                  <span class="text-xs text-slate-700">Akun Gmail biasa tetap bisa masuk</span>
                  <span class="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded bg-stone-100">
                    Akun Standar
                  </span>
                </div>
              </Transition>
            </div>

            <div aria-live="polite">
              <UAlert
                v-if="hasOAuthError"
                color="error"
                variant="subtle"
                icon="i-ph-warning-circle"
                title="Gagal masuk dengan Google"
                description="Terjadi kendala saat autentikasi. Silakan coba masuk kembali."
              />
            </div>

            <a
              href="/api/auth/google"
              class="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.99] min-h-[48px]"
            >
              <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
              <span>Masuk dengan Google</span>
            </a>

            <p class="text-xs text-slate-600 text-center">
              Pengguna baru langsung menerima <strong class="font-mono text-teal-700">+2 kredit</strong> setelah 1 langkah onboarding.
            </p>
          </div>
        </section>
      </div>
    </div>

    <footer class="max-w-5xl w-full mx-auto pt-10 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
      <span>SkillBarter · Case 1: Smarter Campus and Learning</span>
      <span>Learning Without Money, Teaching for Credits</span>
    </footer>
  </main>
</template>
