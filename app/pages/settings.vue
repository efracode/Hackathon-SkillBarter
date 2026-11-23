<script setup lang="ts">
interface SettingsProfilePayload {
  user: {
    id: string
    name: string
    email: string
    penaltyCount: number
    teachingCooldownUntil: string | null
    role: string
    isVerifiedUksw: boolean
    createdAt: string
  }
}

const { data, status, refresh } = useLazyFetch<SettingsProfilePayload>('/api/profile')
const activeSection = ref<'account' | 'preferences' | 'session'>('account')
const signOutOpen = ref(false)

const inCooldown = computed(() => {
  if (!data.value?.user?.teachingCooldownUntil) return false
  return new Date(data.value.user.teachingCooldownUntil).getTime() > Date.now()
})

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso))
}

function selectSection(sec: 'account' | 'preferences' | 'session') {
  activeSection.value = sec
  if (import.meta.client) {
    document.getElementById(`settings-${sec}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <div class="flex items-center gap-2 lg:hidden">
          <NuxtLink
            to="/profile"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1D4ED8] min-h-[36px]"
          >
            <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
            <span>Profil</span>
          </NuxtLink>
        </div>
        <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
          Pengaturan Akun
        </h1>
        <p class="text-sm text-[#475569]">
          Informasi akun privat, preferensi aplikasi, dan sesi login. Edit identitas publik tetap di halaman Profil.
        </p>
      </div>

      <UiButton to="/profile" variant="secondary" size="sm" icon="i-ph-user">
        Lihat Profil Publik
      </UiButton>
    </div>

    <div v-if="status === 'pending'" aria-busy="true" class="h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat pengaturan akun"
      description="Periksa koneksi lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Vertical Section Nav (Desktop) -->
      <nav aria-label="Kategori Pengaturan" class="hidden lg:block lg:col-span-3 space-y-1">
        <button
          v-for="item in [
            { id: 'account', label: 'Informasi Akun' },
            { id: 'preferences', label: 'Preferensi' },
            { id: 'session', label: 'Manajemen Sesi' }
          ]"
          :key="item.id"
          type="button"
          :class="[
            'w-full text-left px-3.5 py-2.5 rounded-[6px] text-sm font-semibold transition-colors min-h-[42px]',
            activeSection === item.id
              ? 'bg-white border border-[#E5E0D5] text-[#1D4ED8]'
              : 'text-[#475569] hover:text-[#14181F] hover:bg-white/60'
          ]"
          @click="selectSection(item.id as 'account' | 'preferences' | 'session')"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- Right Settings Content -->
      <div class="lg:col-span-9 lg:border-l lg:border-[#E5E0D5] lg:pl-8 space-y-8">
        <!-- Section 1: Private Account Info & Verification -->
        <section id="settings-account" class="space-y-3">
          <h2 class="text-lg font-bold text-[#14181F]">Informasi Akun &amp; Verifikasi</h2>

          <dl class="divide-y divide-[#E5E0D5] border-y border-[#E5E0D5] text-sm">
            <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <dt class="text-[#475569]">Email Google</dt>
              <dd class="font-semibold text-[#14181F] font-mono text-xs sm:text-sm">{{ data.user.email }}</dd>
            </div>

            <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <dt class="text-[#475569]">Verifikasi Kampus</dt>
              <dd class="font-semibold text-[#14181F] flex flex-wrap items-center gap-2">
                <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" />
                <span v-else class="text-xs sm:text-sm">
                  Akun Standar (Verified UKSW aktif otomatis untuk @student.uksw.edu)
                </span>
              </dd>
            </div>

            <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <dt class="text-[#475569]">Status Cooldown &amp; Penalti</dt>
              <dd>
                <span v-if="inCooldown && data.user.teachingCooldownUntil" class="text-xs sm:text-sm font-semibold text-[#BE123C]">
                  Cooldown aktif hingga {{ formatDate(data.user.teachingCooldownUntil) }} ({{ data.user.penaltyCount }} penalti)
                </span>
                <span v-else class="text-xs sm:text-sm font-semibold text-[#14181F]">
                  {{ data.user.penaltyCount }} penalti aktif, siap mengajar
                </span>
              </dd>
            </div>

            <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <dt class="text-[#475569]">Terdaftar Sejak</dt>
              <dd class="font-mono text-xs sm:text-sm text-[#14181F]">{{ formatDate(data.user.createdAt) }}</dd>
            </div>

            <div v-if="data.user.role === 'admin'" class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <dt class="font-semibold text-[#14181F]">Konsol Admin</dt>
                <dd class="text-xs text-[#526071]">Metrik evaluasi v1, sengketa, dan simulasi demo.</dd>
              </div>
              <UiButton to="/admin" variant="primary" size="sm" icon="i-ph-shield-check">
                Buka Konsol Admin
              </UiButton>
            </div>
          </dl>
        </section>

        <!-- Section 2: Application Preferences (Honestly marked unavailable) -->
        <section id="settings-preferences" class="space-y-3 pt-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-[#14181F]">Preferensi Aplikasi</h2>
            <UiBadge tone="neutral">Belum Tersedia</UiBadge>
          </div>
          <p class="text-sm text-[#475569] leading-relaxed">
            Pengaturan tampilan awal beranda (Belajar/Mengajar) dan pengingat otomatis T-10m sebelum check-in belum tersedia pada versi backend saat ini.
          </p>
        </section>

        <!-- Section 3: Account & Session Management -->
        <section id="settings-session" class="space-y-3 pt-2 border-t border-[#E5E0D5]">
          <h2 class="text-lg font-bold text-[#14181F] pt-2">Manajemen Akun &amp; Sesi</h2>

          <div class="divide-y divide-[#E5E0D5] border-y border-[#E5E0D5]">
            <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-0.5">
                <p class="text-sm font-bold text-[#526071]">Ganti Akun Google (Segera hadir)</p>
                <p class="text-xs text-[#526071]">
                  Backend <code class="font-mono">/api/auth/google</code> saat ini belum mengirim <code class="font-mono">prompt=select_account</code>.
                </p>
              </div>
              <UiBadge tone="neutral">Belum Tersedia</UiBadge>
            </div>

            <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-0.5">
                <p class="text-sm font-bold text-[#BE123C]">Keluar dari perangkat ini</p>
                <p class="text-xs text-[#475569]">
                  Menghapus sesi login aktif di browser ini. Kredit dan riwayat transaksimu tetap aman tersimpan.
                </p>
              </div>
              <UiButton
                variant="danger"
                icon="i-ph-sign-out"
                @click="signOutOpen = true"
              >
                Keluar Akun
              </UiButton>
            </div>
          </div>
        </section>
      </div>
    </div>

    <SignOutDialog v-model:open="signOutOpen" />
  </div>
</template>
