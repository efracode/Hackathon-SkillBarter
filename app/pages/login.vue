<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const { loggedIn, user } = useUserSession()
const hasOAuthError = computed(() => route.query.error === 'oauth_failed')

const previewDomain = ref<'uksw' | 'general'>('uksw')
const isRedirecting = ref(false)

watch(loggedIn, (isAuth: boolean) => {
  if (isAuth && import.meta.client) {
    navigateTo(user.value?.onboardingCompleted ? '/dashboard' : '/onboarding')
  }
})
</script>

<template>
  <main class="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900">
    <!-- Left Architectural Blueprint Column (50%) -->
    <section class="lg:col-span-6 bg-blueprint-grid border-b lg:border-b-0 lg:border-r border-slate-200 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
      <div class="flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 min-h-[40px]"
        >
          <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Pratinjau</span>
        </NuxtLink>
        <SkillBarterLogo size="sm" />
      </div>

      <div class="max-w-lg space-y-6 my-auto">
        <div class="space-y-3">
          <span class="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-200 bg-white text-blue-700 inline-block">
            Ekonomi Waktu Kampus · 1:1 Adil
          </span>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-[1.1]">
            Tukar waktumu jadi
            <span class="font-serif italic font-normal text-blue-600">kredit belajar,</span>
            bukan biaya uang.
          </h1>
          <p class="text-sm text-slate-600 leading-relaxed">
            Satu kali masuk Google untuk membuka dompet kredit awal, memilih mentor terverifikasi QR, atau menawarkan micro-session 30 menit.
          </p>
        </div>

        <!-- Interactive Live Account Status Preview Card -->
        <div class="bg-white border-2 border-blue-600 rounded-2xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Simulasi Status Akun
            </span>
            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                :class="[
                  'px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
                  previewDomain === 'uksw' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-700'
                ]"
                @click="previewDomain = 'uksw'"
              >
                @student.uksw.edu
              </button>
              <button
                type="button"
                :class="[
                  'px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
                  previewDomain === 'general' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-700'
                ]"
                @click="previewDomain = 'general'"
              >
                Gmail Umum
              </button>
            </div>
          </div>

          <Transition name="panel-slide" mode="out-in">
            <div v-if="previewDomain === 'uksw'" key="card-uksw" class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-bold text-slate-900">Mahasiswa UKSW</p>
                  <p class="font-mono text-xs text-slate-500">nama@student.uksw.edu</p>
                </div>
                <VerifiedUkswBadge />
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div class="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <p class="text-slate-600">Modal Awal</p>
                  <p class="font-mono font-bold text-blue-700 mt-0.5">+2 Kredit</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p class="text-slate-600">Status Kampus</p>
                  <p class="font-semibold text-slate-900 mt-0.5">Auto-Verified UKSW</p>
                </div>
              </div>
            </div>

            <div v-else key="card-general" class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-bold text-slate-900">Mahasiswa Umum</p>
                  <p class="font-mono text-xs text-slate-500">nama@gmail.com</p>
                </div>
                <span class="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50">
                  Akun Standar
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div class="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <p class="text-slate-600">Modal Awal</p>
                  <p class="font-mono font-bold text-blue-700 mt-0.5">+2 Kredit</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p class="text-slate-600">Akses Direktori</p>
                  <p class="font-semibold text-slate-900 mt-0.5">Penuh (Belajar &amp; Ajar)</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <p class="text-xs text-slate-500">
        SkillBarter · Case 1: Smarter Campus and Learning · Tim pecut agen
      </p>
    </section>

    <!-- Right Focused Single-Auth Column (50%) -->
    <section class="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-white">
      <div class="w-full max-w-md space-y-6">
        <div class="space-y-2">
          <p class="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
            Pintu Masuk Tunggal
          </p>
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Masuk ke SkillBarter
          </h2>
          <p class="text-sm text-slate-600">
            Autentikasi instan lewat Google tanpa kode OTP berulang.
          </p>
        </div>

        <div aria-live="polite">
          <UAlert
            v-if="hasOAuthError"
            color="error"
            variant="subtle"
            icon="i-ph-warning-circle"
            title="Gagal masuk dengan Google"
            description="Terjadi kendala saat autentikasi. Silakan coba klik tombol di bawah kembali."
          />
        </div>

        <!-- Single OAuth Entry Button Across Entire App -->
        <a
          href="/api/auth/google"
          :aria-busy="isRedirecting"
          class="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-[background-color,transform] duration-150 active:scale-[0.99] min-h-[50px]"
          @click="isRedirecting = true"
        >
          <UIcon name="i-ph-google-logo-bold" class="w-5 h-5" aria-hidden="true" />
          <span>{{ isRedirecting ? 'Mengalihkan ke Google…' : 'Masuk dengan Google' }}</span>
        </a>

        <!-- 3 Crisp Single-Line Guarantees -->
        <ul class="border-t border-slate-200 pt-5 space-y-3 text-xs sm:text-sm text-slate-600">
          <li class="flex items-start gap-2.5">
            <UIcon name="i-ph-check-circle" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Nama tampilan, foto profil, dan bio dapat diatur sendiri saat onboarding.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <UIcon name="i-ph-check-circle" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Pengguna baru langsung masuk ke Dashboard dengan modal <strong class="font-mono text-blue-700">+2 kredit</strong>.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <UIcon name="i-ph-check-circle" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Email <strong class="text-slate-900">@student.uksw.edu</strong> atau <strong class="text-slate-900">@uksw.edu</strong> otomatis memperoleh badge Verified UKSW.</span>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>
