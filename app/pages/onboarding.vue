<script setup lang="ts">
import { compressAvatarFile } from '~/utils/avatarUpload'
import { TEACH_CATEGORIES, getUserInitials } from '~/utils/designTokens'

definePageMeta({
  layout: false
})

const { user: sessionUser, fetch: fetchSession } = useUserSession()

const categories = TEACH_CATEGORIES

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

const currentStep = ref<1 | 2 | 3>(1)

const displayName = ref(sessionUser.value?.name || '')
const avatarUrl = ref<string | null>(sessionUser.value?.avatarUrl || null)
const hasEditedName = ref(false)
const hasEditedAvatar = ref(false)
const bio = ref('')
const campus = ref(
  sessionUser.value?.isVerifiedUksw ? 'Universitas Kristen Satya Wacana (UKSW)' : ''
)
const major = ref('')
const avatarError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(
  sessionUser,
  (u: typeof sessionUser.value) => {
    if (!u) return
    if (!hasEditedName.value && !displayName.value.trim() && u.name) {
      displayName.value = u.name
    }
    if (!hasEditedAvatar.value && !avatarUrl.value && u.avatarUrl) {
      avatarUrl.value = u.avatarUrl
    }
    if (!campus.value && u.isVerifiedUksw) {
      campus.value = 'Universitas Kristen Satya Wacana (UKSW)'
    }
  },
  { immediate: true }
)

const learnInput = ref('')
const learnCategory = ref<string>('Teknologi & Coding')
const learnSkills = ref<Array<{ category: string; title: string }>>([
  { category: 'Desain & UI/UX', title: 'Review Portofolio UI/UX' }
])

const teachCategory = ref<string>('Teknologi & Coding')
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
    hasEditedAvatar.value = true
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

function validateStep(step: 1 | 2): boolean {
  errorMessage.value = ''
  if (step === 1) {
    if (displayName.value.trim().length < 2) {
      errorMessage.value = 'Isi nama tampilan kamu (minimal 2 karakter).'
      return false
    }
    return true
  }
  if (learnInput.value.trim()) {
    addLearnSkill()
  }
  if (learnSkills.value.length === 0) {
    errorMessage.value = 'Pilih minimal 1 topik yang ingin kamu pelajari.'
    return false
  }
  return true
}

function goToStep(targetStep: 1 | 2 | 3) {
  if (targetStep <= currentStep.value) {
    errorMessage.value = ''
    currentStep.value = targetStep
    return
  }
  if (targetStep >= 2 && !validateStep(1)) {
    currentStep.value = 1
    return
  }
  if (targetStep === 3 && !validateStep(2)) {
    currentStep.value = 2
    return
  }
  currentStep.value = targetStep
}

function goNextStep() {
  if (currentStep.value === 1 && validateStep(1)) {
    currentStep.value = 2
    return
  }
  if (currentStep.value === 2 && validateStep(2)) {
    currentStep.value = 3
  }
}

async function submitOnboarding() {
  errorMessage.value = ''

  if (displayName.value.trim().length < 2) {
    errorMessage.value = 'Isi nama tampilan kamu (minimal 2 karakter).'
    currentStep.value = 1
    return
  }

  if (learnInput.value.trim()) {
    addLearnSkill()
  }

  if (learnSkills.value.length === 0) {
    errorMessage.value = 'Pilih minimal 1 topik yang ingin kamu pelajari.'
    currentStep.value = 2
    return
  }

  if (teachTitle.value.trim().length < 3) {
    errorMessage.value = 'Pilih atau isi 1 topik ringan yang bisa kamu bantu (minimal 3 karakter).'
    currentStep.value = 3
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
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menyimpan pengaturan awal. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#FAF8F4] text-[#14181F]">
    <!-- Clean Top Bar -->
    <header class="bg-white border-b border-[#E5E0D5]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2.5 min-w-0">
          <SkillBarterLogo size="sm" />
          <span class="hidden sm:inline text-[#E5E0D5]" aria-hidden="true">|</span>
          <span class="hidden sm:inline text-sm font-semibold text-[#14181F]">Pengaturan Awal</span>
        </div>

        <div class="flex items-center gap-2 text-xs font-mono shrink-0 tabular-nums">
          <span class="font-bold text-[#1D4ED8]">+2 Kredit Awal</span>
          <span class="text-[#E5E0D5]" aria-hidden="true">|</span>
          <span class="text-[#526071]">Langkah {{ currentStep }} dari 3</span>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left 7 Cols: 3-Step Progressive Flow -->
      <section class="min-w-0 lg:col-span-7 space-y-6">
        <div class="space-y-1.5">
          <h1 class="text-2xl sm:text-[28px] font-bold tracking-tight text-[#14181F]">
            Siapkan profilmu sebelum mulai bertukar skill
          </h1>
          <p class="text-sm text-[#475569]">
            Kamu tidak wajib langsung mengajar. Draf micro-session 30 menit bisa diubah kapan saja.
          </p>
        </div>

        <!-- Stepper Bar -->
        <div class="grid grid-cols-3 border border-[#E5E0D5] bg-white rounded-[8px] divide-x divide-[#E5E0D5] overflow-hidden">
          <button
            v-for="step in [
              { id: 1, code: '01', label: 'Identitas & Foto' },
              { id: 2, code: '02', label: 'Minat Belajar' },
              { id: 3, code: '03', label: 'Draf 30 Menit' }
            ]"
            :key="step.id"
            type="button"
            :class="[
              'p-3 text-left transition-colors min-h-[54px]',
              currentStep === step.id
                ? 'bg-[#14181F] text-white'
                : currentStep > step.id
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-white text-[#475569] hover:bg-[#FAF8F4]'
            ]"
            @click="goToStep(step.id as 1 | 2 | 3)"
          >
            <p class="font-mono text-[11px] font-bold">{{ step.code }}</p>
            <p class="text-xs font-semibold truncate mt-0.5">{{ step.label }}</p>
          </button>
        </div>

        <UiAlert
          v-if="errorMessage"
          tone="danger"
          title="Periksa pengisian"
          :description="errorMessage"
        />

        <!-- Step 1: Identity & Photo -->
        <div v-if="currentStep === 1" class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5">
          <div class="flex flex-wrap items-center gap-4 pb-5 border-b border-[#E5E0D5]">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="displayName || 'Foto Profil'"
              class="w-14 h-14 rounded-[8px] object-cover border border-[#E5E0D5]"
            />
            <div
              v-else
              class="w-14 h-14 rounded-[8px] bg-[#14181F] text-white font-mono text-sm font-bold flex items-center justify-center"
            >
              {{ getUserInitials(displayName) }}
            </div>

            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="sr-only"
                  @change="onAvatarChange"
                />
                <UiButton variant="secondary" size="sm" icon="i-ph-camera" @click="fileInputRef?.click()">
                  {{ avatarUrl ? 'Ganti Foto Profil' : 'Upload Foto Profil' }}
                </UiButton>
                <UiButton
                  v-if="avatarUrl"
                  variant="danger-soft"
                  size="sm"
                  @click="hasEditedAvatar = true; avatarUrl = null"
                >
                  Hapus
                </UiButton>
              </div>
              <p class="text-[11px] text-[#526071]">PNG, JPG, atau WebP maks 5 MB (otomatis crop 1:1).</p>
              <p v-if="avatarError" class="text-xs font-medium text-[#BE123C]">{{ avatarError }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <UiField id="onb-name" label="Nama Tampilan" required>
              <input
                id="onb-name"
                v-model="displayName"
                type="text"
                maxlength="80"
                placeholder="Masukkan nama panggilan atau nama lengkap kamu"
                class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
                @input="hasEditedName = true"
              />
            </UiField>

            <UiField id="onb-campus" label="Kampus (otomatis terisi jika @student.uksw.edu)">
              <input
                id="onb-campus"
                v-model="campus"
                type="text"
                maxlength="120"
                placeholder="Contoh: Universitas Kristen Satya Wacana (UKSW)"
                class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
              />
            </UiField>

            <UiField id="onb-major" label="Jurusan / Program Studi">
              <input
                id="onb-major"
                v-model="major"
                type="text"
                maxlength="120"
                placeholder="Contoh: Teknik Informatika"
                class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
              />
            </UiField>

            <UiField id="onb-bio" label="Bio Singkat (Opsional)">
              <textarea
                id="onb-bio"
                v-model="bio"
                rows="3"
                maxlength="240"
                placeholder="Ceritakan singkat minat belajar atau pengalamanmu..."
                class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F]"
              />
            </UiField>
          </div>

          <div class="pt-3 border-t border-[#E5E0D5] flex justify-end">
            <UiButton variant="primary" size="md" @click="goNextStep">
              Lanjut: Minat Belajar
            </UiButton>
          </div>
        </div>

        <!-- Step 2: Learning Interests -->
        <div v-else-if="currentStep === 2" class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5">
          <div class="space-y-2.5">
            <p class="text-[13px] font-semibold text-[#14181F]">Pilih cepat topik yang ingin kamu pelajari</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="chip in quickLearnChips"
                :key="chip.title"
                type="button"
                :class="[
                  'px-3 py-2 rounded-[6px] border text-xs font-semibold transition-colors min-h-[40px]',
                  learnSkills.some((s: { category: string; title: string }) => s.title === chip.title)
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-[#FAF8F4] text-[#475569] border-[#E5E0D5] hover:border-[#94A3B8]'
                ]"
                @click="toggleQuickLearn(chip)"
              >
                {{ chip.title }}
              </button>
            </div>
          </div>

          <div class="pt-4 border-t border-[#E5E0D5] space-y-3">
            <p class="text-[13px] font-semibold text-[#14181F]">Atau tambah topik belajar sendiri</p>
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <select
                v-model="learnCategory"
                aria-label="Kategori minat belajar"
                class="sm:col-span-5 px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <input
                v-model="learnInput"
                type="text"
                placeholder="Mis. Analisis Data SPSS"
                class="sm:col-span-5 px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
                @keydown.enter.prevent="addLearnSkill"
              />
              <UiButton variant="secondary" size="md" class="sm:col-span-2" @click="addLearnSkill">
                Tambah
              </UiButton>
            </div>
          </div>

          <div v-if="learnSkills.length > 0" class="space-y-2">
            <p class="text-xs font-semibold text-[#526071]">
              Minat Terpilih ({{ learnSkills.length }})
            </p>
            <ul class="divide-y divide-[#E5E0D5] border border-[#E5E0D5] rounded-[6px]">
              <li
                v-for="(skill, idx) in learnSkills"
                :key="`${skill.category}-${skill.title}`"
                class="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <div class="min-w-0">
                  <span class="font-semibold text-[#14181F]">{{ skill.title }}</span>
                  <span class="text-xs text-[#526071] ml-2">{{ skill.category }}</span>
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-[#BE123C] hover:underline shrink-0 min-h-[36px]"
                  @click="removeLearnSkill(idx)"
                >
                  Hapus
                </button>
              </li>
            </ul>
          </div>

          <div class="pt-3 border-t border-[#E5E0D5] flex items-center justify-between">
            <UiButton variant="secondary" size="md" @click="currentStep = 1">
              Kembali
            </UiButton>
            <UiButton variant="primary" size="md" @click="goNextStep">
              Lanjut: Draf Mengajar
            </UiButton>
          </div>
        </div>

        <!-- Step 3: 30m Micro-Session Draft -->
        <div v-else class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5">
          <div class="space-y-2">
            <p class="text-sm font-bold text-[#14181F]">Pilih draf sesi singkat 30 menit</p>
            <p class="text-xs text-[#526071]">
              Disimpan sebagai draf saja, kamu tidak wajib langsung membuka jadwal.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                v-for="tpl in microTemplates"
                :key="tpl.tag"
                type="button"
                :class="[
                  'p-3.5 rounded-[6px] border text-left transition-colors',
                  teachTemplateTag === tpl.tag
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]/60'
                    : 'border-[#E5E0D5] bg-[#FAF8F4] hover:border-[#94A3B8]'
                ]"
                @click="applyTemplate(tpl)"
              >
                <p class="text-xs font-bold text-[#1D4ED8]">{{ tpl.category }}</p>
                <p class="text-[13px] font-semibold text-[#14181F] mt-0.5">{{ tpl.title }}</p>
                <p class="font-mono text-[11px] text-[#526071] mt-1">{{ tpl.tag }}</p>
              </button>
            </div>
          </div>

          <div class="space-y-4 pt-3 border-t border-[#E5E0D5]">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UiField id="onb-teach-cat" label="Kategori Topik">
                <select
                  id="onb-teach-cat"
                  v-model="teachCategory"
                  class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
                >
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </UiField>
              <UiField id="onb-teach-title" label="Judul Draf Topik">
                <input
                  id="onb-teach-title"
                  v-model="teachTitle"
                  type="text"
                  maxlength="100"
                  class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
                />
              </UiField>
            </div>

            <UiField id="onb-teach-desc" label="Catatan Singkat (Opsional)">
              <textarea
                id="onb-teach-desc"
                v-model="teachDescription"
                rows="2"
                placeholder="Mis. Cocok untuk tanya-jawab error tugas atau review wireframe."
                class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm"
              />
            </UiField>
          </div>

          <div class="pt-3 border-t border-[#E5E0D5] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <UiButton variant="secondary" size="md" @click="currentStep = 2">
              Kembali
            </UiButton>
            <UiButton
              variant="primary"
              size="md"
              icon="i-ph-check-circle"
              :loading="submitting"
              @click="submitOnboarding"
            >
              {{ submitting ? 'Menyimpan…' : 'Selesai & Klaim +2 Kredit' }}
            </UiButton>
          </div>
        </div>
      </section>

      <!-- Right 5 Cols: Live Profile Card Preview -->
      <aside class="min-w-0 lg:col-span-5 lg:sticky lg:top-8 bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-4">
        <p class="text-sm font-bold text-[#14181F] pb-3 border-b border-[#E5E0D5]">
          Pratinjau kartu profilmu
        </p>

        <div class="flex items-start gap-3.5">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName || 'Pengguna'"
            class="w-12 h-12 rounded-[6px] object-cover border border-[#E5E0D5] shrink-0"
          />
          <div
            v-else
            class="w-12 h-12 rounded-[6px] bg-[#14181F] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0"
          >
            {{ getUserInitials(displayName) }}
          </div>

          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <p class="text-base font-bold text-[#14181F] truncate">
                {{ displayName.trim() || '[Nama Tampilan Kamu]' }}
              </p>
              <VerifiedUkswBadge v-if="sessionUser?.isVerifiedUksw" />
            </div>
            <p class="text-xs text-[#526071]">
              {{ [major.trim(), campus.trim()].filter(Boolean).join(' | ') || '[Jurusan] | [Kampus]' }}
            </p>
          </div>
        </div>

        <p v-if="bio.trim()" class="text-xs text-[#475569] leading-relaxed bg-[#FAF8F4] p-3 rounded-[6px] border border-[#E5E0D5]">
          {{ bio }}
        </p>

        <div class="space-y-2 pt-3 border-t border-[#E5E0D5] text-xs">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[#526071]">Minat Belajar</span>
            <span class="font-mono font-semibold text-[#14181F]">{{ learnSkills.length }} topik</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-[#526071]">Draf Mengajar 30m</span>
            <span class="font-semibold text-[#14181F] truncate max-w-[200px]">{{ teachTitle || 'Belum diisi' }}</span>
          </div>
        </div>

        <p class="text-xs font-medium text-[#1D4ED8] leading-relaxed pt-2 border-t border-[#E5E0D5]">
          Menyelesaikan 3 langkah ini langsung menambahkan +2 Kredit ke saldo awalmu.
        </p>
      </aside>
    </div>
  </main>
</template>
