<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const hasOAuthError = computed(() => route.query.error === 'oauth_failed')

const pillars = [
  {
    code: '01',
    title: 'Mulai belajar dari 2 kredit modal awal',
    desc: 'Tidak harus langsung mengajar. Masuk ke dashboard, pilih mentor, dan pesan sesi pertamamu.'
  },
  {
    code: '02',
    title: 'Micro-session 30 menit berbasis template',
    desc: 'Fokus tanya-jawab, bedah error, atau review portofolio tanpa menyiapkan slide panjang.'
  },
  {
    code: '03',
    title: 'Ulasan 100% terverifikasi via Check-in QR',
    desc: 'Rating hanya terbuka setelah kehadiran dicatat di tempat dengan kode 6 digit atau QR.'
  }
]
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
        <!-- Editorial Value Column -->
        <section class="lg:col-span-7 space-y-6">
          <div class="space-y-3">
            <p class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Ekonomi Waktu Kampus · 1:1 Adil
            </p>
            <h1 class="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]">
              Tukar waktumu jadi
              <span class="font-serif italic font-normal text-indigo-600">kredit belajar,</span>
              bukan biaya uang.
            </h1>
            <p class="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
              Platform pertukaran keahlian antar mahasiswa dengan escrow anti-minus dan bukti kehadiran nyata.
            </p>
          </div>

          <div class="border-t border-stone-300 divide-y divide-stone-300">
            <div
              v-for="item in pillars"
              :key="item.code"
              class="py-4 grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-baseline"
            >
              <span class="sm:col-span-2 font-mono text-xs font-semibold text-teal-700">
                {{ item.code }}
              </span>
              <div class="sm:col-span-10 space-y-1">
                <h2 class="text-sm font-semibold text-slate-900">{{ item.title }}</h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">{{ item.desc }}</p>
              </div>
            </div>
          </div>
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
              class="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors duration-150 min-h-[48px]"
            >
              <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
              <span>Masuk dengan Google</span>
            </a>

            <div class="rounded-xl bg-[#F7F5F0] border border-stone-200 p-4 space-y-1.5 text-xs text-slate-700">
              <p class="font-semibold text-slate-900">Apa yang terjadi setelah masuk?</p>
              <p>
                Pengguna baru memilih minat belajar dalam 1 langkah lalu langsung menerima <strong class="font-mono text-teal-700">+2 kredit</strong> di Dashboard.
              </p>
            </div>
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
