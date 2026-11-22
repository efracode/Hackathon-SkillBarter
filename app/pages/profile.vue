<script setup lang="ts">
import { compressAvatarFile } from '~/utils/avatarUpload'

interface ProfilePayload {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    bio: string | null
    campus: string | null
    major: string | null
    creditBalance: number
    penaltyCount: number
    teachingCooldownUntil: string | null
    role: string
    isVerifiedUksw: boolean
    createdAt: string
  }
  reputation: {
    completedTeaching: number
    completedLearning: number
    avgRating: number
    reviewCount: number
    isVerifiedMentor: boolean
  }
  skills: Array<{
    id: string
    direction: string
    category: string
    title: string
  }>
  receivedReviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewerName: string
  }>
}

const { data, status, error, refresh } = useLazyFetch<ProfilePayload>('/api/profile')
const { refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const { clear: clearSession, fetch: fetchSession } = useUserSession()

const activeTab = ref<'identity' | 'reputation' | 'account'>('identity')
const nameInput = ref('')
const avatarInput = ref<string | null>(null)
const bioInput = ref('')
const campusInput = ref('')
const majorInput = ref('')
const avatarError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')
const logoutConfirmOpen = ref(false)

watch(
  () => data.value?.user,
  (u: ProfilePayload['user'] | undefined) => {
    if (u) {
      nameInput.value = u.name || ''
      avatarInput.value = u.avatarUrl || null
      bioInput.value = u.bio || ''
      campusInput.value = u.campus || ''
      majorInput.value = u.major || ''
    }
  },
  { immediate: true }
)

const teachSkills = computed(() =>
  (data.value?.skills || []).filter((s) => s.direction === 'teach')
)
const learnSkills = computed(() =>
  (data.value?.skills || []).filter((s) => s.direction === 'learn')
)

const inCooldown = computed(() => {
  if (!data.value?.user?.teachingCooldownUntil) return false
  return new Date(data.value.user.teachingCooldownUntil).getTime() > Date.now()
})

const milestoneProgress = computed(() => {
  const rep = data.value?.reputation
  const user = data.value?.user
  if (!rep || !user) return 0
  let points = 0
  if (rep.completedTeaching >= 3) points += 1
  if (rep.avgRating >= 4.5 && rep.reviewCount > 0) points += 1
  if (user.penaltyCount === 0) points += 1
  return Math.round((points / 3) * 100)
})

async function onAvatarChange(event: Event) {
  avatarError.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    avatarInput.value = await compressAvatarFile(file)
  } catch (err: unknown) {
    const e = err as { message?: string }
    avatarError.value = e.message || 'Gagal memproses foto.'
  } finally {
    input.value = ''
  }
}

async function saveProfile() {
  saveError.value = ''
  saveMessage.value = ''
  if (nameInput.value.trim().length < 2) {
    saveError.value = 'Nama tampilan minimal 2 karakter.'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PATCH',
      body: {
        name: nameInput.value,
        avatarUrl: avatarInput.value ?? '',
        bio: bioInput.value,
        campus: campusInput.value,
        major: majorInput.value
      }
    })
    await Promise.all([refresh(), refreshMe(), fetchSession()])
    saveMessage.value = 'Profil dan foto berhasil diperbarui.'
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    saveError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menyimpan perubahan.'
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse" aria-busy="true">
      <p class="text-sm text-slate-600">Memuat profil dan reputasi…</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat profil"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <!-- Royal Blue Identity Banner -->
      <section class="bg-gradient-to-br from-[#0B2249] via-[#13366F] to-[#1D4ED8] text-white rounded-2xl p-6 sm:p-7 space-y-5 border border-blue-800/60 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <UAvatar :src="data.user.avatarUrl || undefined" :alt="data.user.name" size="xl" />
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-bold text-white">{{ data.user.name }}</h1>
                <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" tone="dark" />
                <span
                  v-if="data.reputation.isVerifiedMentor"
                  class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/15 text-blue-100 border border-white/25"
                >
                  <UIcon name="i-ph-seal-check-duotone" class="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
                  Verified Peer Mentor
                </span>
              </div>
              <p class="text-sm text-blue-100">{{ data.user.email }}</p>
              <p v-if="data.user.bio" class="text-xs sm:text-sm text-white/90 pt-0.5">
                {{ data.user.bio }}
              </p>
              <p v-if="data.user.campus || data.user.major" class="text-xs text-blue-200">
                {{ [data.user.major, data.user.campus].filter(Boolean).join(' · ') }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center bg-white/10 border border-white/15 rounded-xl px-4 py-3 tabular-nums shrink-0">
            <div>
              <p class="text-[11px] text-blue-200">Kredit</p>
              <p class="text-lg font-bold font-mono text-sky-200">{{ data.user.creditBalance }}</p>
            </div>
            <div>
              <p class="text-[11px] text-blue-200">Mengajar</p>
              <p class="text-lg font-bold font-mono text-white">{{ data.reputation.completedTeaching }}</p>
            </div>
            <div>
              <p class="text-[11px] text-blue-200">Rating</p>
              <p class="text-lg font-bold font-mono text-white">
                {{ data.reputation.reviewCount > 0 ? data.reputation.avgRating : '0.0' }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="!data.user.isVerifiedUksw"
          class="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-xs text-blue-100 flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            Ingin mendapatkan badge <strong class="text-white">Verified UKSW</strong>? Masuk menggunakan akun email <code class="font-mono text-white">@student.uksw.edu</code> atau <code class="font-mono text-white">@uksw.edu</code>.
          </span>
        </div>
      </section>

      <UAlert
        v-if="inCooldown && data.user.teachingCooldownUntil"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        title="Status Cooldown Mengajar Aktif"
        :description="`Mode mengajar dijeda hingga ${formatDate(data.user.teachingCooldownUntil)}.`"
      />

      <!-- Tab Switcher -->
      <div role="tablist" aria-label="Bagian Profil" class="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'identity'"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors',
            activeTab === 'identity'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="activeTab = 'identity'"
        >
          Identitas &amp; Skill
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'reputation'"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors',
            activeTab === 'reputation'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="activeTab = 'reputation'"
        >
          Reputasi &amp; Ulasan ({{ data.receivedReviews.length }})
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'account'"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors',
            activeTab === 'account'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="activeTab = 'account'"
        >
          Dompet &amp; Akun
        </button>
      </div>

      <Transition name="panel-slide" mode="out-in">
        <!-- Tab 1: Identity, Photo & Skills -->
        <div v-if="activeTab === 'identity'" key="tab-identity" class="grid grid-cols-1 md:grid-cols-12 gap-5">
          <section class="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <h2 class="text-base font-bold text-slate-900">Edit Identitas &amp; Foto Profil</h2>
            <form class="space-y-4" @submit.prevent="saveProfile">
              <!-- Avatar Upload Row -->
              <div class="flex items-center gap-4 pb-3 border-b border-slate-200">
                <UAvatar :src="avatarInput || undefined" :alt="nameInput || 'Foto Profil'" size="lg" />
                <div class="space-y-1.5">
                  <div class="flex flex-wrap gap-2">
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      class="sr-only"
                      aria-label="Upload foto profil baru"
                      @change="onAvatarChange"
                    />
                    <button
                      type="button"
                      class="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-semibold text-blue-800 min-h-[38px]"
                      @click="fileInputRef?.click()"
                    >
                      Ganti Foto
                    </button>
                    <button
                      v-if="avatarInput"
                      type="button"
                      class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-rose-600 min-h-[38px]"
                      @click="avatarInput = null"
                    >
                      Hapus
                    </button>
                  </div>
                  <p v-if="avatarError" class="text-xs text-rose-600">{{ avatarError }}</p>
                </div>
              </div>

              <div>
                <label for="profile-name" class="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan
                </label>
                <input
                  id="profile-name"
                  v-model="nameInput"
                  name="name"
                  type="text"
                  required
                  class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label for="profile-bio" class="block text-xs font-semibold text-slate-700 mb-1">
                  Bio Singkat
                </label>
                <textarea
                  id="profile-bio"
                  v-model="bioInput"
                  name="bio"
                  rows="2"
                  placeholder="Ceritakan singkat minat atau pengalaman belajarmu…"
                  class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="profile-campus" class="block text-xs font-semibold text-slate-700 mb-1">
                    Kampus
                  </label>
                  <input
                    id="profile-campus"
                    v-model="campusInput"
                    name="campus"
                    type="text"
                    placeholder="Contoh: UKSW"
                    class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label for="profile-major" class="block text-xs font-semibold text-slate-700 mb-1">
                    Jurusan / Program Studi
                  </label>
                  <input
                    id="profile-major"
                    v-model="majorInput"
                    name="major"
                    type="text"
                    placeholder="Contoh: Teknik Informatika"
                    class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 pt-1" aria-live="polite">
                <span v-if="saveError" class="text-xs font-semibold text-rose-600">{{ saveError }}</span>
                <span v-else-if="saveMessage" class="text-xs font-semibold text-blue-700">{{ saveMessage }}</span>
                <button
                  type="submit"
                  :disabled="saving"
                  class="ml-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[42px]"
                >
                  {{ saving ? 'Menyimpan…' : 'Simpan Profil' }}
                </button>
              </div>
            </form>
          </section>

          <section class="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-900">Daftar Skill Aktif</h2>
              <NuxtLink to="/teach" class="text-xs font-semibold text-blue-700 hover:underline">
                Kelola Mengajar
              </NuxtLink>
            </div>

            <div class="space-y-2">
              <p class="text-xs font-semibold text-slate-600">Topik Draf Mengajar ({{ teachSkills.length }})</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="skill in teachSkills"
                  :key="skill.id"
                  class="text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-3 py-1.5"
                >
                  {{ skill.title }}
                </span>
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-slate-200">
              <p class="text-xs font-semibold text-slate-600">Minat Belajar ({{ learnSkills.length }})</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="skill in learnSkills"
                  :key="skill.id"
                  class="text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5"
                >
                  {{ skill.title }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <!-- Tab 2: Reputation & Verified Reviews -->
        <div v-else-if="activeTab === 'reputation'" key="tab-reputation" class="space-y-5">
          <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-bold text-slate-900">Syarat Badge Verified Peer Mentor</h2>
              <span class="font-mono text-xs font-bold text-blue-700 tabular-nums">{{ milestoneProgress }}%</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full bg-blue-600 transition-[width] duration-500 ease-out"
                :style="{ width: `${milestoneProgress}%` }"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-[#EFF5FD] border border-blue-100">
                <p class="font-semibold text-slate-900">1. Minimal 3 Sesi Selesai</p>
                <p class="text-slate-600 mt-0.5 tabular-nums">Saat ini: {{ data.reputation.completedTeaching }}/3</p>
              </div>
              <div class="p-3 rounded-xl bg-[#EFF5FD] border border-blue-100">
                <p class="font-semibold text-slate-900">2. Rating Rata-rata &ge; 4.5</p>
                <p class="text-slate-600 mt-0.5 tabular-nums">
                  Saat ini: {{ data.reputation.reviewCount > 0 ? data.reputation.avgRating : 'Belum ada ulasan' }}
                </p>
              </div>
              <div class="p-3 rounded-xl bg-[#EFF5FD] border border-blue-100">
                <p class="font-semibold text-slate-900">3. Nol Penalti Aktif</p>
                <p class="text-slate-600 mt-0.5 tabular-nums">Saat ini: {{ data.user.penaltyCount }} Penalti</p>
              </div>
            </div>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h2 class="text-base font-bold text-slate-900">Ulasan Terverifikasi Diterima</h2>
            <p v-if="data.receivedReviews.length === 0" class="text-sm text-slate-600">
              Belum ada ulasan yang diterima. Selesaikan sesi mengajar dengan check-in untuk menerima ulasan asli.
            </p>
            <ul v-else class="divide-y divide-slate-200">
              <li v-for="rev in data.receivedReviews" :key="rev.id" class="py-3 first:pt-0 last:pb-0 space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-slate-900">{{ rev.reviewerName }}</span>
                  <span class="font-semibold text-blue-700 tabular-nums">
                    Rating {{ rev.rating }}/5 · Verified Attendance
                  </span>
                </div>
                <p class="text-sm text-slate-700">{{ rev.comment }}</p>
              </li>
            </ul>
          </section>
        </div>

        <!-- Tab 3: Account & Shortcuts -->
        <div v-else key="tab-account" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NuxtLink
              to="/wallet"
              class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50/40 min-h-[56px]"
            >
              <span class="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-900">
                <UIcon name="i-ph-wallet" class="w-5 h-5 text-blue-700" aria-hidden="true" />
                Dompet Kredit &amp; Ledger
              </span>
              <UIcon name="i-ph-caret-right" class="w-4 h-4 text-slate-500" aria-hidden="true" />
            </NuxtLink>

            <NuxtLink
              v-if="data.user.role === 'admin'"
              to="/admin"
              class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50/40 min-h-[56px]"
            >
              <span class="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-900">
                <UIcon name="i-ph-shield-check" class="w-5 h-5 text-blue-600" aria-hidden="true" />
                Dashboard Admin &amp; Simulasi
              </span>
              <UIcon name="i-ph-caret-right" class="w-4 h-4 text-slate-500" aria-hidden="true" />
            </NuxtLink>
          </div>

          <div class="pt-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold min-h-[44px]"
              @click="logoutConfirmOpen = true"
            >
              <UIcon name="i-ph-sign-out" class="w-4 h-4" aria-hidden="true" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      </Transition>
    </template>

    <!-- Logout Confirmation Modal -->
    <UModal v-model:open="logoutConfirmOpen" title="Keluar dari SkillBarter?">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-slate-600">
            Sesi login kamu di perangkat ini akan diakhiri. Saldo kredit dan jadwal sesimu tetap tersimpan aman.
          </p>
          <div class="flex justify-end gap-2.5">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 min-h-[42px]"
              @click="logoutConfirmOpen = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold min-h-[42px]"
              @click="handleLogout"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
