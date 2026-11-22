<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const hasOAuthError = computed(() => route.query.error === 'oauth_failed')

const trustPoints = [
  {
    icon: 'i-ph-clock',
    title: 'Micro-session 30 menit santai',
    desc: 'Mulai belajar dari 2 kredit modal awal tanpa wajib langsung mengajar.'
  },
  {
    icon: 'i-ph-lock-simple-duotone',
    title: 'Kredit aman di Escrow',
    desc: 'Pertukaran 1:1 adil dengan bilangan bulat, anti-minus, dan refund otomatis.'
  },
  {
    icon: 'i-ph-seal-check-duotone',
    title: 'Ulasan 100% terverifikasi',
    desc: 'Rating hanya terbuka setelah kehadiran tercatat via Check-in 6 digit atau QR.'
  }
]
</script>

<template>
  <main class="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10">
    <div class="w-full max-w-md space-y-4">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[36px]"
      >
        <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
        <span>Kembali ke Pratinjau</span>
      </NuxtLink>

      <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div class="flex flex-col items-start gap-3 mb-6">
          <SkillBarterLogo size="lg" />
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Masuk ke SkillBarter
          </h1>
          <p class="text-sm text-slate-600 leading-relaxed">
            Tukar keahlian praktis antar mahasiswa lewat sesi singkat 30 menit, tanpa biaya uang.
          </p>
        </div>

        <UAlert
          v-if="hasOAuthError"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="Gagal masuk dengan Google"
          description="Terjadi kendala saat autentikasi. Silakan coba masuk kembali."
          class="mb-5"
        />

        <ul class="space-y-4 mb-7">
          <li v-for="point in trustPoints" :key="point.title" class="flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5"
            >
              <UIcon :name="point.icon" class="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ point.title }}</p>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">{{ point.desc }}</p>
            </div>
          </li>
        </ul>

        <a
          href="/api/auth/google"
          class="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors duration-150 min-h-[48px]"
        >
          <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
          <span>Masuk dengan Google</span>
        </a>

        <p class="mt-4 text-xs text-slate-500 text-center">
          Pengguna baru langsung mendapat 2 kredit belajar untuk mencoba sesi pertama.
        </p>
      </div>
    </div>
  </main>
</template>
