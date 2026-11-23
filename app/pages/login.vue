<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const { loggedIn, user } = useUserSession()
const hasOAuthError = computed(() => Boolean(route.query.error))

const previewDomain = ref<'uksw' | 'general'>('uksw')
const isRedirecting = ref(false)

watch(loggedIn, (isAuth: boolean) => {
  if (isAuth && import.meta.client) {
    navigateTo(user.value?.onboardingCompleted ? '/dashboard' : '/onboarding')
  }
})
</script>

<template>
  <main class="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#FAF8F4] text-[#14181F]">
    <!-- Right Focused Single OAuth Gate (Shown first on Mobile 390 so primary CTA is above the fold) -->
    <section class="min-w-0 lg:col-span-5 lg:order-2 bg-white border-b lg:border-b-0 border-[#E5E0D5] p-5 sm:p-10 lg:p-14 flex flex-col justify-center">
      <!-- Mobile Compact Top Bar -->
      <div class="flex lg:hidden items-center justify-between gap-4 pb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1D4ED8] min-h-[44px]"
        >
          <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
          <span>Pratinjau</span>
        </NuxtLink>
        <SkillBarterLogo size="sm" />
      </div>

      <div class="w-full max-w-[380px] mx-auto space-y-6 my-auto">
        <div class="space-y-2 pb-5 border-b border-[#E5E0D5]">
          <p class="text-xs font-semibold text-[#526071]">
            Autentikasi Google OAuth
          </p>
          <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
            Masuk ke SkillBarter
          </h1>
          <p class="text-[13px] sm:text-sm text-[#475569] leading-relaxed">
            Satu tombol masuk tanpa password. Nama tampilan dan foto profil bisa kamu ubah bebas saat pengaturan awal.
          </p>
        </div>

        <UiAlert
          v-if="hasOAuthError"
          tone="danger"
          title="Autentikasi Google gagal"
          description="Sesi OAuth dibatalkan atau terputus. Klik tombol masuk di bawah untuk mencoba lagi."
        />

        <UiButton
          href="/api/auth/google"
          variant="primary"
          size="lg"
          block
          :loading="isRedirecting"
          :icon="isRedirecting ? undefined : 'i-ph-sign-in'"
          @click="isRedirecting = true"
        >
          {{ isRedirecting ? 'Mengalihkan ke Google…' : 'Masuk dengan Google' }}
        </UiButton>

        <ul class="divide-y divide-[#E5E0D5] border-y border-[#E5E0D5] text-xs text-[#475569]">
          <li class="py-3 flex items-center justify-between gap-2">
            <span>Modal awal pengguna baru</span>
            <span class="font-mono font-bold text-[#1D4ED8] tabular-nums">+2 Kredit</span>
          </li>
          <li class="py-3 flex items-center justify-between gap-2">
            <span>Identitas kustom (nama &amp; foto)</span>
            <span class="font-semibold text-[#14181F]">Dapat diubah</span>
          </li>
          <li class="py-3 flex items-center justify-between gap-2">
            <span>Ulasan mentor</span>
            <span class="font-semibold text-[#047857]">100% Check-in QR</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Left Architectural Editorial Column (Notebook Grid only on Login left col & Hero) -->
    <section class="min-w-0 lg:col-span-7 lg:order-1 bg-editorial-grid lg:border-r border-[#E5E0D5] p-5 sm:p-10 lg:p-14 flex flex-col justify-between gap-10">
      <div class="hidden lg:flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-[#475569] hover:text-[#1D4ED8] min-h-[44px]"
        >
          <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Pratinjau</span>
        </NuxtLink>
        <SkillBarterLogo size="sm" />
      </div>

      <div class="max-w-xl space-y-7 my-auto">
        <div class="space-y-3">
          <p class="text-xs font-semibold text-[#1D4ED8]">
            Pertukaran skill kampus, satu pintu masuk
          </p>
          <h2 class="text-3xl sm:text-[42px] font-bold text-[#14181F] tracking-tight leading-[1.1]">
            Tukar waktumu jadi
            <span class="font-serif italic font-normal text-[#1D4ED8]">kredit belajar,</span>
            bukan biaya uang.
          </h2>
          <p class="text-sm sm:text-[15px] text-[#475569] leading-relaxed">
            Masuk sekali untuk memperoleh +2 kredit modal awal, memesan sesi singkat 30 menit, atau menawarkan keahlianmu ke rekan mahasiswa.
          </p>
        </div>

        <!-- Domain Verification Simulator -->
        <div class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E0D5]">
            <span class="text-xs font-semibold text-[#475569]">
              Cek verifikasi email kampus
            </span>
            <div class="inline-flex flex-wrap rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F4] p-0.5 text-xs font-semibold max-w-full">
              <button
                type="button"
                :class="[
                  'px-2.5 sm:px-3 py-1.5 rounded-[4px] transition-colors whitespace-nowrap min-h-[36px]',
                  previewDomain === 'uksw' ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
                ]"
                @click="previewDomain = 'uksw'"
              >
                @student.uksw.edu
              </button>
              <button
                type="button"
                :class="[
                  'px-2.5 sm:px-3 py-1.5 rounded-[4px] transition-colors whitespace-nowrap min-h-[36px]',
                  previewDomain === 'general' ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
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
                  <p class="text-sm font-bold text-[#14181F]">Mahasiswa UKSW</p>
                  <p class="font-mono text-xs text-[#526071]">nama@student.uksw.edu / @uksw.edu</p>
                </div>
                <VerifiedUkswBadge />
              </div>
              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E0D5] text-xs tabular-nums">
                <div>
                  <p class="text-[#526071]">Modal Awal</p>
                  <p class="font-mono font-bold text-[#1D4ED8] mt-0.5">+2 Kredit</p>
                </div>
                <div>
                  <p class="text-[#526071]">Status Identitas</p>
                  <p class="font-semibold text-[#14181F] mt-0.5">Otomatis Verified UKSW</p>
                </div>
              </div>
            </div>

            <div v-else key="card-general" class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-bold text-[#14181F]">Mahasiswa Umum</p>
                  <p class="font-mono text-xs text-[#526071]">nama@gmail.com</p>
                </div>
                <UiBadge tone="neutral">Akun Standar</UiBadge>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E0D5] text-xs tabular-nums">
                <div>
                  <p class="text-[#526071]">Modal Awal</p>
                  <p class="font-mono font-bold text-[#1D4ED8] mt-0.5">+2 Kredit</p>
                </div>
                <div>
                  <p class="text-[#526071]">Akses Fitur</p>
                  <p class="font-semibold text-[#14181F] mt-0.5">Penuh (Belajar &amp; Mengajar)</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <p class="text-xs text-[#526071] leading-relaxed">
        Domain <code class="font-mono text-[#14181F]">@student.uksw.edu</code> dan <code class="font-mono text-[#14181F]">@uksw.edu</code> memperoleh lencana Verified UKSW otomatis. Akun Gmail umum tetap bisa bergabung.
      </p>
    </section>
  </main>
</template>
