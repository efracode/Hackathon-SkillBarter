<script setup lang="ts">
definePageMeta({
  layout: false
})

const categories = ['Teknologi & Coding', 'Desain & UI/UX', 'Bahasa & Presentasi', 'Akademik & Riset', 'Karier & CV']

const microTemplates = [
  { tag: 'Review Tugas / Portofolio (30m)', title: 'Review Tugas atau Portofolio 30 Menit', category: 'Desain & UI/UX' },
  { tag: 'Q&A Dasar (30m)', title: 'Sesi Tanya-Jawab Dasar 30 Menit', category: 'Teknologi & Coding' },
  { tag: 'Latihan Presentasi (30m)', title: 'Latihan & Umpan Balik Presentasi 30 Menit', category: 'Bahasa & Presentasi' },
  { tag: 'Bedah Studi Kasus (30m)', title: 'Bedah Studi Kasus Singkat 30 Menit', category: 'Akademik & Riset' }
]

const teachCategory = ref('Teknologi & Coding')
const teachTitle = ref('')
const teachTemplateTag = ref<string | null>(null)
const teachDescription = ref('')

const learnInput = ref('')
const learnCategory = ref('Desain & UI/UX')
const learnSkills = ref<Array<{ category: string; title: string }>>([])

const campus = ref('')
const major = ref('')

const submitting = ref(false)
const errorMessage = ref('')

function applyTemplate(tpl: (typeof microTemplates)[number]) {
  teachTemplateTag.value = tpl.tag
  teachTitle.value = tpl.title
  teachCategory.value = tpl.category
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

  if (teachTitle.value.trim().length < 3) {
    errorMessage.value = 'Isi judul skill yang bisa kamu ajarkan (minimal 3 karakter).'
    return
  }

  if (learnInput.value.trim()) {
    addLearnSkill()
  }

  if (learnSkills.value.length === 0) {
    errorMessage.value = 'Tambahkan minimal 1 topik yang ingin kamu pelajari.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: {
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
    await navigateTo('/explore')
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
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between gap-4 mb-6">
        <SkillBarterLogo size="md" />
        <span class="text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
          Langkah 1 dari 1: Modal Awal +2 Kredit
        </span>
      </div>

      <header class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Siapkan Profil Beri &amp; Terima
        </h1>
        <p class="mt-1 text-sm sm:text-base text-slate-600">
          Lengkapi satu topik yang bisa kamu bantu dan satu topik yang ingin kamu pelajari untuk mengklaim 2 kredit awal.
        </p>
      </header>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        :title="errorMessage"
        class="mb-5"
      />

      <form class="space-y-6" @submit.prevent="submitOnboarding">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Kartu Kiri: Skill Ajar -->
          <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Apa yang bisa kamu bantu?</h2>
              <p class="mt-1 text-sm text-slate-600">
                Mulai dari micro-session 30 menit. Santai, tanya-jawab, tanpa harus bikin slide.
              </p>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-700 mb-2">Template Micro-Session 1-Klik:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tpl in microTemplates"
                  :key="tpl.tag"
                  type="button"
                  :class="[
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150 min-h-[36px]',
                    teachTemplateTag === tpl.tag
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  ]"
                  @click="applyTemplate(tpl)"
                >
                  {{ tpl.tag }}
                </button>
              </div>
            </div>

            <div>
              <label for="teach-category" class="block text-sm font-medium text-slate-800 mb-1.5">
                Kategori Skill Ajar
              </label>
              <select
                id="teach-category"
                v-model="teachCategory"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label for="teach-title" class="block text-sm font-medium text-slate-800 mb-1.5">
                Judul Topik Micro-Session
              </label>
              <input
                id="teach-title"
                v-model="teachTitle"
                type="text"
                required
                placeholder="Contoh: Review CV & Portofolio UI/UX"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
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
                placeholder="Tidak perlu silabus panjang. Cukup jelaskan apa yang bisa didiskusikan selama 30 menit."
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </section>

          <!-- Kartu Kanan: Skill Belajar + Kampus -->
          <section class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Apa yang ingin kamu pelajari?</h2>
              <p class="mt-1 text-sm text-slate-600">
                Tambahkan minimal satu topik agar direktori bisa membantumu menemukan mentor yang cocok.
              </p>
            </div>

            <div class="space-y-2.5">
              <label for="learn-category" class="block text-sm font-medium text-slate-800">
                Kategori &amp; Topik Minat Belajar
              </label>
              <select
                id="learn-category"
                v-model="learnCategory"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>

              <div class="flex gap-2">
                <input
                  id="learn-title"
                  v-model="learnInput"
                  type="text"
                  placeholder="Contoh: Dasar SQL / Public Speaking"
                  class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
                  @keydown.enter.prevent="addLearnSkill"
                />
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-800 min-h-[44px]"
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
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
              >
                <span>{{ item.title }} ({{ item.category }})</span>
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

            <div class="pt-2 border-t border-slate-200 space-y-3">
              <p class="text-xs text-slate-600">
                Opsional, bantu teman sekampus menemukanmu untuk sesi tatap muka.
              </p>
              <div>
                <label for="campus" class="block text-sm font-medium text-slate-800 mb-1.5">
                  Kampus (Opsional)
                </label>
                <input
                  id="campus"
                  v-model="campus"
                  type="text"
                  placeholder="Nama universitas atau politeknik"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
                />
              </div>
              <div>
                <label for="major" class="block text-sm font-medium text-slate-800 mb-1.5">
                  Jurusan (Opsional)
                </label>
                <input
                  id="major"
                  v-model="major"
                  type="text"
                  placeholder="Contoh: Teknik Informatika / DKV"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-[44px]"
                />
              </div>
            </div>
          </section>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors duration-150 min-h-[48px]"
          >
            <UIcon name="i-ph-check-circle" class="w-5 h-5" aria-hidden="true" />
            <span>{{ submitting ? 'Menyimpan...' : 'Simpan & Klaim +2 Kredit' }}</span>
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
