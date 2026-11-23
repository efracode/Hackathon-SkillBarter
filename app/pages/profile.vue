<script setup lang="ts">
import { compressAvatarFile } from '~/utils/avatarUpload'
import { getUserInitials } from '~/utils/designTokens'

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
    description?: string | null
  }>
  receivedReviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewerName: string
  }>
}

const { data, status, refresh } = useLazyFetch<ProfilePayload>('/api/profile')
const { refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const { fetch: fetchSession } = useUserSession()

const editOpen = ref(false)
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

function syncFormFromData() {
  const u = data.value?.user
  if (!u) return
  nameInput.value = u.name || ''
  avatarInput.value = u.avatarUrl || null
  bioInput.value = u.bio || ''
  campusInput.value = u.campus || ''
  majorInput.value = u.major || ''
}

watch(
  () => data.value?.user,
  () => {
    syncFormFromData()
  },
  { immediate: true }
)

function openEditModal() {
  syncFormFromData()
  saveError.value = ''
  saveMessage.value = ''
  avatarError.value = ''
  editOpen.value = true
}

const teachSkills = computed(() => (data.value?.skills || []).filter((s) => s.direction === 'teach'))
const learnSkills = computed(() => (data.value?.skills || []).filter((s) => s.direction === 'learn'))

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
    setTimeout(() => {
      editOpen.value = false
    }, 650)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    saveError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menyimpan perubahan.'
  } finally {
    saving.value = false
  }
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
  <div class="space-y-8">
    <div v-if="status === 'pending'" aria-busy="true" class="space-y-4">
      <div class="h-32 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      <div class="h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat profil publik"
      description="Periksa koneksi lalu coba muat ulang halaman."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Public Identity Masthead (Strict Public Identity Only: No Settings/Logout tab) -->
      <section class="pb-6 border-b border-[#E5E0D5] flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div class="flex items-start gap-4 sm:gap-5 min-w-0">
          <img
            v-if="data.user.avatarUrl"
            :src="data.user.avatarUrl"
            :alt="data.user.name"
            class="w-16 h-16 rounded-[8px] object-cover border border-[#E5E0D5] shrink-0"
          />
          <div
            v-else
            class="w-16 h-16 rounded-[8px] bg-[#14181F] text-white font-mono text-lg font-bold flex items-center justify-center shrink-0"
          >
            {{ getUserInitials(data.user.name) }}
          </div>

          <div class="space-y-1.5 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
                {{ data.user.name }}
              </h1>
              <VerifiedUkswBadge v-if="data.user.isVerifiedUksw" />
              <UiBadge v-if="data.reputation.isVerifiedMentor" tone="primary" icon="i-ph-medal">
                Verified Peer Mentor
              </UiBadge>
            </div>

            <p v-if="data.user.major || data.user.campus" class="text-[13px] text-[#475569]">
              {{ [data.user.major, data.user.campus].filter(Boolean).join(' | ') }}
            </p>

            <p v-if="data.user.bio" class="text-sm text-[#475569] max-w-2xl leading-relaxed">
              {{ data.user.bio }}
            </p>
            <p v-else class="text-xs text-[#526071]">
              Bio belum diisi. Tambahkan deskripsi singkat di Edit Profil agar calon peserta lebih mengenalmu.
            </p>
          </div>
        </div>

        <div class="flex flex-col lg:items-end gap-3 shrink-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <UiButton variant="secondary" size="sm" icon="i-ph-pencil-simple" @click="openEditModal">
              Edit Profil
            </UiButton>
            <UiButton to="/settings" variant="secondary" size="sm" icon="i-ph-gear">
              Pengaturan
            </UiButton>
          </div>

          <p class="font-mono text-xs font-semibold text-[#047857] tabular-nums">
            {{ data.reputation.completedTeaching }} Mengajar Selesai |
            Rating {{ data.reputation.reviewCount > 0 ? `${data.reputation.avgRating.toFixed(1)}/5` : '—' }}
            ({{ data.reputation.reviewCount }} Ulasan QR)
          </p>
        </div>
      </section>

      <!-- Public Split: Skills (Left 5) & Verified Check-in Reviews (Right 7) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <!-- Left 5 Cols: Teaching & Learning Skills -->
        <section class="lg:col-span-5 space-y-8">
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-2.5 border-b border-[#E5E0D5]">
              <h2 class="text-base font-bold text-[#14181F]">
                Skill yang Diajarkan ({{ teachSkills.length }})
              </h2>
              <NuxtLink to="/teach" class="text-xs font-semibold text-[#1D4ED8] hover:underline">
                Kelola
              </NuxtLink>
            </div>

            <p v-if="teachSkills.length === 0" class="text-xs text-[#526071] py-2">
              Belum ada skill mengajar yang ditambahkan.
            </p>

            <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
              <li v-for="sk in teachSkills" :key="sk.id" class="py-3.5 space-y-1">
                <p class="text-xs font-semibold text-[#1D4ED8]">{{ sk.category }}</p>
                <p class="text-sm font-bold text-[#14181F]">{{ sk.title }}</p>
                <p v-if="sk.description" class="text-xs text-[#475569] leading-relaxed">
                  {{ sk.description }}
                </p>
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h2 class="text-base font-bold text-[#14181F] pb-2.5 border-b border-[#E5E0D5]">
              Minat &amp; Skill Dipelajari ({{ learnSkills.length }})
            </h2>

            <p v-if="learnSkills.length === 0" class="text-xs text-[#526071] py-2">
              Belum ada minat belajar tambahan yang ditampilkan.
            </p>

            <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
              <li v-for="sk in learnSkills" :key="sk.id" class="py-3 flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-[#14181F]">{{ sk.title }}</span>
                <span class="text-xs text-[#526071] shrink-0">{{ sk.category }}</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Right 7 Cols: Attendance-Gated Verified Reviews -->
        <section class="lg:col-span-7 lg:border-l lg:border-[#E5E0D5] lg:pl-8 space-y-3">
          <div class="flex items-center justify-between pb-2.5 border-b border-[#E5E0D5]">
            <h2 class="text-base font-bold text-[#14181F]">
              Ulasan Terverifikasi Check-in QR ({{ data.receivedReviews.length }})
            </h2>
          </div>

          <div
            v-if="data.receivedReviews.length === 0"
            class="py-8 text-center border border-dashed border-[#E5E0D5] rounded-[8px] bg-white px-4"
          >
            <p class="text-sm font-semibold text-[#14181F]">Belum ada ulasan terverifikasi check-in QR.</p>
            <p class="text-xs text-[#526071] mt-1">
              Ulasan hanya muncul setelah peserta hadir dan memvalidasi kode check-in 6-digit atau QR.
            </p>
          </div>

          <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
            <li v-for="rev in data.receivedReviews" :key="rev.id" class="py-4 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="space-y-0.5">
                  <p class="text-sm font-bold text-[#14181F]">{{ rev.reviewerName }}</p>
                  <p class="font-mono text-[11px] text-[#526071]">{{ formatDate(rev.createdAt) }}</p>
                </div>
                <UiBadge tone="success" icon="i-ph-check-circle" mono>
                  {{ rev.rating }}/5 | Check-in Asli
                </UiBadge>
              </div>
              <p class="text-[13px] text-[#475569] leading-relaxed">"{{ rev.comment }}"</p>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- Edit Public Identity Dialog -->
    <UiDialog v-model:open="editOpen" title="Edit Profil Publik">
      <form class="space-y-4" @submit.prevent="saveProfile">
        <UiAlert v-if="saveError" tone="danger" title="Gagal menyimpan" :description="saveError" />
        <UiAlert v-if="saveMessage" tone="success" :title="saveMessage" />

        <div class="flex flex-wrap items-center gap-4 pb-4 border-b border-[#E5E0D5]">
          <img
            v-if="avatarInput"
            :src="avatarInput"
            :alt="nameInput || 'Foto Profil'"
            class="w-14 h-14 rounded-[8px] object-cover border border-[#E5E0D5]"
          />
          <div
            v-else
            class="w-14 h-14 rounded-[8px] bg-[#14181F] text-white font-mono text-sm font-bold flex items-center justify-center"
          >
            {{ getUserInitials(nameInput) }}
          </div>

          <div class="space-y-1.5">
            <div class="flex flex-wrap gap-2">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                @change="onAvatarChange"
              />
              <UiButton variant="secondary" size="sm" @click="fileInputRef?.click()">
                {{ avatarInput ? 'Ganti Foto' : 'Upload Foto' }}
              </UiButton>
              <UiButton
                v-if="avatarInput"
                variant="danger-soft"
                size="sm"
                @click="avatarInput = null"
              >
                Hapus Foto
              </UiButton>
            </div>
            <p class="text-[11px] text-[#526071]">PNG/JPG/WebP maks 5 MB (otomatis crop 1:1).</p>
            <p v-if="avatarError" class="text-xs text-[#BE123C] font-medium">{{ avatarError }}</p>
          </div>
        </div>

        <UiField id="prof-name" label="Nama Tampilan" required>
          <input
            id="prof-name"
            v-model="nameInput"
            type="text"
            maxlength="80"
            placeholder="Nama yang tampil ke mahasiswa lain"
            class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
          />
        </UiField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UiField id="prof-campus" label="Kampus">
            <input
              id="prof-campus"
              v-model="campusInput"
              type="text"
              maxlength="120"
              placeholder="Contoh: UKSW"
              class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
            />
          </UiField>
          <UiField id="prof-major" label="Jurusan">
            <input
              id="prof-major"
              v-model="majorInput"
              type="text"
              maxlength="120"
              placeholder="Contoh: Teknik Informatika"
              class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
            />
          </UiField>
        </div>

        <UiField id="prof-bio" label="Bio Singkat">
          <textarea
            id="prof-bio"
            v-model="bioInput"
            rows="3"
            maxlength="240"
            placeholder="Ceritakan singkat keahlian atau topik yang kamu minati..."
            class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F]"
          />
        </UiField>

        <div class="flex justify-end gap-2.5 pt-2">
          <UiButton variant="secondary" :disabled="saving" @click="editOpen = false">
            Batal
          </UiButton>
          <UiButton type="submit" variant="primary" :loading="saving">
            {{ saving ? 'Menyimpan…' : 'Simpan Perubahan' }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>
