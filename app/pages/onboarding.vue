<script setup lang="ts">
import { compressAvatarFile } from '~/utils/avatarUpload'

definePageMeta({
  layout: false
})

const { user: sessionUser, fetch: fetchSession } = useUserSession()

const categories = ['Teknologi & Coding', 'Desain & UI/UX', 'Bahasa & Presentasi', 'Akademik & Riset', 'Karier & CV']

const quickLearnChips = [
  { category: 'Teknologi & Coding', title: 'Dasar TypeScript & API' },
  { category: 'Desain & UI/UX', title: 'Review Portofolio UI/UX' },
  { category: 'Karier & CV', title: 'Bedah CV Magang' },
  { category: 'Bahasa & Presentasi', title: 'Latihan Presentasi' }
]

const microTemplates = [
  { tag: 'Q&A Dasar (30m)', title: 'Sesi Tanya-Jawab Dasar 30 Menit', category: 'Teknologi & Coding' },
  { tag: 'Review Tugas / Portofolio (30m)', title: 'Review Tugas atau Portofolio 30 Menit', category: 'Desain & UI/UX' },
  { tag: 'Latihan Presentasi (30m)', title: 'Latihan & Umpan Balik Presentasi 30 Menit', category: 'Bahasa & Presentasi' },
  { tag: 'Bedah Studi Kasus (30m)', title: 'Bedah Studi Kasus Singkat 30 Menit', category: 'Akademik & Riset' }
]

const displayName = ref(sessionUser.value?.name || '')
const avatarUrl = ref<string | null>(sessionUser.value?.avatarUrl || null)
const bio = ref('')
const campus = ref(
  sessionUser.value?.isVerifiedUksw ? 'Universitas Kristen Satya Wacana (UKSW)' : ''
)
const major = ref('')
const avatarError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const learnInput = ref('')
const learnCategory = ref('Teknologi & Coding')
const learnSkills = ref<Array<{ category: string; title: string }>>([
  { category: 'Desain & UI/UX', title: 'Review Portofolio UI/UX' }
])

const teachCategory = ref('Teknologi & Coding')
const teachTitle = ref('Sesi Tanya-Jawab Dasar 30 Menit')
const teachTemplateTag = ref<string | null>('Q&A Dasar (30m)')
const teachDescription = ref('')

const submitting = ref(false)
const errorMessage = ref('')

async function onAvatarChange(event: Event) {
  avatarError.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    avatarUrl.value = await compressAvatarFile(file)
  } catch (err: unknown) {
    const e = err as { message?: string }
    avatarError.value = e.message || 'Gagal memproses foto profil.'
  } finally {
    input.value = ''
  }
}

function applyTemplate(tpl: (typeof microTemplates)[number]) {
  teachTemplateTag.value = tpl.tag
  teachTitle.value = tpl.title
  teachCategory.value = tpl.category
}

function toggleQuickLearn(chip: { category: string; title: string }) {
  const idx = learnSkills.value.findIndex(
    (s: { category: string; title: string }) => s.title === chip.title
  )
  if (idx >= 0) {
    learnSkills.value.splice(idx, 1)
  } else {
    learnSkills.value.push({ ...chip })
  }
}

function addLearnSkill() {
  const title = learnInput.value.trim()
  if (!title) return
  const exists = learnSkills.value.some(
    (s: { category: string; title: string }) =>
      s.title.toLowerCase() === title.toLowerCase() && s.category === learnCategory.value
  )
  if (!exists) {
    learnSkills.value.push({ category: learnCategory.value, title })
  }
  learnInput.value = ''
}

function removeLearnSkill(index: number) {
  learnSkills.value.splice(index, 1)
}

async function submitOnboarding() {
  errorMessage.value = ''

  if (displayName.value.trim().length < 2) {
    errorMessage.value = 'Isi nama tampilan kamu (minimal 2 karakter).'
    return
  }

  if (learnInput.value.trim()) {
    addLearnSkill()
  }

  if (learnSkills.value.length === 0) {
    errorMessage.value = 'Pilih minimal 1 topik yang ingin kamu pelajari.'
    return
  }

  if (teachTitle.value.trim().length < 3) {
    errorMessage.value = 'Pilih atau isi 1 topik ringan yang bisa kamu bantu (minimal 3 karakter).'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: {
        name: displayName.value,
        avatarUrl: avatarUrl.value ?? '',
        bio: bio.value,
        teachSkill: {
          category: teachCategory.value,
          title: teachTitle.value,
          templateTag: teachTemplateTag.value,
          description: teachDescription.value
        },
        learnSkills: learnSkills.value,
        campus: campus.value,
        major: major.value
      }
    })
    await fetchSession()
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    errorMessage.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menyimpan onboarding. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 py-8 px-4">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <SkillBarterLogo size="md" />
        <div class="flex items-center gap-2">
          <VerifiedUkswBadge v-if="sessionUser?.isVerifiedUksw" />
          <span class="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Onboarding 1 Langkah · +2 Kredit Belajar
          </span>
        </div>
      </div>

      <header>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Atur Identitas &amp; Minat Belajarmu
        </h1>
        <p class="mt-1 text-sm sm:text-base text-slate-600">
          Sesuaikan nama tampilan dan foto profilmu agar tidak memakai bawaan Google, lalu klaim 2 kredit awal ke Dashboard.
        </p>
      </header>

      <div aria-live="polite">
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          :title="errorMessage"
        />
      </div>

      <form class="space-y-6" @submit.prevent="submitOnboarding">
        <!-- Step 1: Custom Identity & Photo Upload -->
        <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <div class="flex items-center gap-4">
              <UAvatar
                :src="avatarUrl || undefined"
                :alt="displayName || 'Foto Profil'"
                size="xl"
              />
              <div class="space-y-2">
                <p class="text-xs font-semibold text-slate-800">Foto Profil</p>
                <div class="flex flex-wrap gap-2">
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="sr-only"
                    aria-label="Pilih file foto profil"
                    @change="onAvatarChange"
                  />
                  <button
                    type="button"
                    class="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-semibold text-blue-800 min-h-[38px]"
                    @click="fileInputRef?.click()"
                  >
                    Upload Foto
                  </button>
                  <button
                    v-if="avatarUrl"
                    type="button"
                    class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-rose-600 min-h-[38px]"
                    @click="avatarUrl = null"
                  >
                    Hapus Foto
                  </button>
                </div>
                <p v-if="avatarError" class="text-xs text-rose-600">{{ avatarError }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <label for="display-name" class="block text-sm font-medium text-slate-800 mb-1">
                Nama Tampilan
              </label>
              <input
                id="display-name"
                v-model="displayName"
                name="name"
                type="text"
                required
                placeholder="Nama panggilan atau nama lengkap…"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label for="bio-input" class="block text-sm font-medium text-slate-800 mb-1">
                Bio Singkat (Opsional)
              </label>
              <input
                id="bio-input"
                v-model="bio"
                name="bio"
                type="text"
                placeholder="Contoh: Mahasiswa TI semester 5, suka UI/UX & backend…"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label for="campus" class="block text-sm font-medium text-slate-800 mb-1">
                Kampus (Opsional)
              </label>
              <input
                id="campus"
                v-model="campus"
                name="campus"
                type="text"
                placeholder="Nama universitas atau politeknik…"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label for="major" class="block text-sm font-medium text-slate-800 mb-1">
                Jurusan (Opsional)
              </label>
              <input
                id="major"
                v-model="major"
                name="major"
                type="text"
                placeholder="Contoh: Teknik Informatika / DKV…"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              />
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Learn Skills Card -->
          <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">1. Apa yang ingin kamu pelajari?</h2>
              <p class="mt-1 text-sm text-slate-600">
                Dipakai untuk memprioritaskan rekomendasi mentor di dashboardmu.
              </p>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-700 mb-2">Pilihan Cepat 1-Klik:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="chip in quickLearnChips"
                  :key="chip.title"
                  type="button"
                  :class="[
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors min-h-[36px]',
                    learnSkills.some((s: { category: string; title: string }) => s.title === chip.title)
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                      : 'bg-blue-50/60 border-blue-100 text-slate-700 hover:bg-blue-100/70'
                  ]"
                  @click="toggleQuickLearn(chip)"
                >
                  {{ chip.title }}
                </button>
              </div>
            </div>

            <div class="space-y-2.5">
              <label for="learn-category" class="block text-sm font-medium text-slate-800">
                Atau tambah topik lain:
              </label>
              <select
                id="learn-category"
                v-model="learnCategory"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>

              <div class="flex gap-2">
                <input
                  id="learn-title"
                  v-model="learnInput"
                  type="text"
                  placeholder="Contoh: Dasar SQL / Public Speaking…"
                  class="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
                  @keydown.enter.prevent="addLearnSkill"
                />
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-sm font-semibold text-blue-800 min-h-[44px]"
                  @click="addLearnSkill"
                >
                  Tambah
                </button>
              </div>
            </div>

            <div v-if="learnSkills.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="(item, idx) in learnSkills"
                :key="`${item.category}-${item.title}`"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium"
              >
                <span>{{ item.title }}</span>
                <button
                  type="button"
                  :aria-label="`Hapus ${item.title}`"
                  class="hover:text-rose-600 p-0.5"
                  @click="removeLearnSkill(idx)"
                >
                  <UIcon name="i-ph-x" class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            </div>
          </section>

          <!-- Draft Teach Skill Card -->
          <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">2. Topik santai yang bisa kamu bantu</h2>
              <p class="mt-1 text-sm text-slate-600">
                Disimpan sebagai draf profil saja. Kamu baru menerima murid jika membuka slot jadwal di menu Mengajar.
              </p>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-700 mb-2">Template Micro-Session 30 Menit:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tpl in microTemplates"
                  :key="tpl.tag"
                  type="button"
                  :class="[
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 min-h-[36px]',
                    teachTemplateTag === tpl.tag
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
                  ]"
                  @click="applyTemplate(tpl)"
                >
                  {{ tpl.tag }}
                </button>
              </div>
            </div>

            <div>
              <label for="teach-category" class="block text-sm font-medium text-slate-800 mb-1.5">
                Kategori
              </label>
              <select
                id="teach-category"
                v-model="teachCategory"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label for="teach-title" class="block text-sm font-medium text-slate-800 mb-1.5">
                Judul Topik Draf
              </label>
              <input
                id="teach-title"
                v-model="teachTitle"
                type="text"
                required
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <div>
              <label for="teach-desc" class="block text-sm font-medium text-slate-800 mb-1.5">
                Catatan Singkat (Opsional)
              </label>
              <textarea
                id="teach-desc"
                v-model="teachDescription"
                rows="2"
                placeholder="Bisa diubah kapan saja dari menu Mengajar…"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </section>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors duration-150 min-h-[48px]"
          >
            <UIcon name="i-ph-check-circle" class="w-5 h-5" aria-hidden="true" />
            <span>{{ submitting ? 'Menyiapkan Dashboard…' : 'Simpan & Masuk Dashboard (+2 Kredit)' }}</span>
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
