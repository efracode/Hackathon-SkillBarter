<script setup lang="ts">
interface TeachResponse {
  cooldownUntil: string | null
  penaltyCount: number
  completedCount: number
  avgRating: number
  reviewCount: number
  isVerifiedMentor: boolean
  pendingHoldQueueCount: number
  skills: Array<{
    id: string
    category: string
    title: string
    description: string | null
    templateTag: string | null
  }>
  sessions: Array<{
    id: string
    skillId: string
    mode: string
    durationMinutes: number
    format: string
    locationOrLink: string
    scheduledAt: string
    maxLearners: number
    status: string
  }>
}

const { data, status, error, refresh } = await useFetch<TeachResponse>('/api/teach/skills')

const categories = ['Teknologi & Coding', 'Desain & UI/UX', 'Bahasa & Presentasi', 'Akademik & Riset', 'Karier & CV']

const newSkillCategory = ref('Teknologi & Coding')
const newSkillTitle = ref('')
const newSkillDesc = ref('')
const creatingSkill = ref(false)
const skillMessage = ref('')

const selectedSkillId = ref('')
const slotMode = ref<'1on1' | 'group'>('1on1')
const slotDuration = ref<30 | 60>(30)
const slotFormat = ref<'online' | 'in_person'>('online')
const slotLocation = ref('')
const slotDateTime = ref('')
const slotMaxLearners = ref(4)
const creatingSlot = ref(false)
const slotError = ref('')
const slotSuccess = ref('')

watch(
  () => data.value?.skills,
  (skills: TeachResponse['skills'] | undefined) => {
    if (skills?.length && !selectedSkillId.value) {
      selectedSkillId.value = skills[0]!.id
    }
  },
  { immediate: true }
)

watch(slotMode, (mode: '1on1' | 'group') => {
  if (mode === 'group') {
    slotDuration.value = 60
  }
})

const inCooldown = computed(() => {
  if (!data.value?.cooldownUntil) return false
  return new Date(data.value.cooldownUntil).getTime() > Date.now()
})

async function createSkill() {
  if (newSkillTitle.value.trim().length < 3) return
  creatingSkill.value = true
  skillMessage.value = ''
  try {
    await $fetch('/api/teach/skills', {
      method: 'POST',
      body: {
        category: newSkillCategory.value,
        title: newSkillTitle.value,
        description: newSkillDesc.value
      }
    })
    newSkillTitle.value = ''
    newSkillDesc.value = ''
    skillMessage.value = 'Penawaran skill baru berhasil ditambahkan.'
    await refresh()
  } finally {
    creatingSkill.value = false
  }
}

async function createSessionSlot() {
  slotError.value = ''
  slotSuccess.value = ''
  if (!selectedSkillId.value || !slotDateTime.value || slotLocation.value.trim().length < 3) {
    slotError.value = 'Lengkapi pilihan skill, jadwal waktu, dan lokasi atau tautan Meet.'
    return
  }

  creatingSlot.value = true
  try {
    await $fetch('/api/teach/sessions', {
      method: 'POST',
      body: {
        skillId: selectedSkillId.value,
        mode: slotMode.value,
        durationMinutes: slotDuration.value,
        format: slotFormat.value,
        locationOrLink: slotLocation.value,
        scheduledAt: new Date(slotDateTime.value).toISOString(),
        maxLearners: slotMode.value === 'group' ? slotMaxLearners.value : 1
      }
    })
    slotLocation.value = ''
    slotDateTime.value = ''
    slotSuccess.value = 'Slot sesi berhasil dipublikasikan ke direktori Jelajah.'
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    slotError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal membuat slot sesi.'
  } finally {
    creatingSlot.value = false
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Mengajar</h1>
      <p class="text-sm text-slate-600">
        Tidak perlu silabus panjang. Cukup bantu jawab pertanyaan atau review tugas teman selama 30 menit.
      </p>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
      <p class="text-sm text-slate-600">Memuat data mengajar...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat halaman mengajar"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <!-- Cooldown Alert -->
      <UAlert
        v-if="inCooldown && data.cooldownUntil"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        title="Mode mengajar sedang dalam masa Cooldown"
        :description="`Dijeda hingga ${formatDateTime(data.cooldownUntil)} karena no-show sebelumnya. Kamu tidak dapat membuka slot sesi baru sementara.`"
      />

      <!-- Hold Queue Reminder -->
      <UAlert
        v-if="data.pendingHoldQueueCount > 0"
        color="warning"
        variant="subtle"
        icon="i-ph-clock"
        :title="`Ada ${data.pendingHoldQueueCount} permintaan Hold Queue menunggu konfirmasimu`"
        description="Buka tab Hold Queue di halaman Sesi Saya untuk menentukan jadwal atau menolak permintaan."
      >
        <template #actions>
          <NuxtLink
            to="/sessions"
            class="px-3 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-semibold"
          >
            Buka Sesi Saya
          </NuxtLink>
        </template>
      </UAlert>

      <!-- Verified Peer Mentor Progress -->
      <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-ph-seal-check-duotone" class="w-5 h-5 text-teal-700" aria-hidden="true" />
            <h2 class="text-base font-semibold text-slate-900">Progres Badge Verified Peer Mentor</h2>
          </div>
          <span
            v-if="data.isVerifiedMentor"
            class="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200"
          >
            Aktif Terverifikasi
          </span>
          <span v-else class="text-xs font-medium text-slate-600">Belum Tercapai</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm tabular-nums">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-600">Sesi Selesai (Syarat >= 3)</p>
            <p class="font-semibold text-slate-900 mt-0.5">{{ Math.min(3, data.completedCount) }}/3 Sesi</p>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-600">Rating Rata-rata (Syarat >= 4.5)</p>
            <p class="font-semibold text-slate-900 mt-0.5">
              {{ data.reviewCount > 0 ? `${data.avgRating} / 5.0` : 'Belum ada ulasan' }}
            </p>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-600">Penalti Aktif (Syarat 0)</p>
            <p class="font-semibold text-slate-900 mt-0.5">{{ data.penaltyCount }} Penalti</p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Publish New Session Slot -->
        <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 class="text-base font-semibold text-slate-900">Buat Slot Jadwal Mengajar</h2>

          <UAlert v-if="slotError" color="error" variant="subtle" :title="slotError" />
          <UAlert v-if="slotSuccess" color="secondary" variant="subtle" :title="slotSuccess" />

          <form class="space-y-3.5" @submit.prevent="createSessionSlot">
            <div>
              <label for="slot-skill" class="block text-sm font-medium text-slate-800 mb-1">
                Pilih Penawaran Skill
              </label>
              <select
                id="slot-skill"
                v-model="selectedSkillId"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="s in data.skills" :key="s.id" :value="s.id">
                  {{ s.title }} ({{ s.category }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="slot-mode" class="block text-sm font-medium text-slate-800 mb-1">
                  Mode Sesi
                </label>
                <select
                  id="slot-mode"
                  v-model="slotMode"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                >
                  <option value="1on1">1-on-1 (1 Kredit)</option>
                  <option value="group">Grup 2-5 Orang (Maks 2 Kredit)</option>
                </select>
              </div>
              <div>
                <label for="slot-duration" class="block text-sm font-medium text-slate-800 mb-1">
                  Durasi
                </label>
                <select
                  id="slot-duration"
                  v-model="slotDuration"
                  :disabled="slotMode === 'group'"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                >
                  <option :value="30">Micro-Session 30 Menit</option>
                  <option :value="60">Standar 60 Menit</option>
                </select>
              </div>
            </div>

            <div v-if="slotMode === 'group'">
              <label for="slot-max" class="block text-sm font-medium text-slate-800 mb-1">
                Kapasitas Maksimal Peserta (2-5)
              </label>
              <input
                id="slot-max"
                v-model.number="slotMaxLearners"
                type="number"
                min="2"
                max="5"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="slot-format" class="block text-sm font-medium text-slate-800 mb-1">
                  Format Pertemuan
                </label>
                <select
                  id="slot-format"
                  v-model="slotFormat"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                >
                  <option value="online">Online (Meet/Zoom/Discord)</option>
                  <option value="in_person">Tatap Muka (Kampus)</option>
                </select>
              </div>
              <div>
                <label for="slot-time" class="block text-sm font-medium text-slate-800 mb-1">
                  Tanggal &amp; Jam Mulai
                </label>
                <input
                  id="slot-time"
                  v-model="slotDateTime"
                  type="datetime-local"
                  required
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label for="slot-location" class="block text-sm font-medium text-slate-800 mb-1">
                {{ slotFormat === 'online' ? 'Tautan Meeting' : 'Titik Temu di Kampus' }}
              </label>
              <input
                id="slot-location"
                v-model="slotLocation"
                type="text"
                required
                :placeholder="slotFormat === 'online' ? 'https://meet.google.com/...' : 'Perpustakaan Pusat Lt. 2'"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              :disabled="creatingSlot || inCooldown || data.skills.length === 0"
              class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold min-h-[44px]"
            >
              {{ creatingSlot ? 'Mempublikasikan...' : 'Publikasikan Slot ke Direktori' }}
            </button>
          </form>
        </section>

        <!-- Add New Skill Offer -->
        <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 class="text-base font-semibold text-slate-900">Tambah Topik Skill Mengajar</h2>
          <UAlert v-if="skillMessage" color="secondary" variant="subtle" :title="skillMessage" />

          <form class="space-y-3.5" @submit.prevent="createSkill">
            <div>
              <label for="new-skill-cat" class="block text-sm font-medium text-slate-800 mb-1">
                Kategori
              </label>
              <select
                id="new-skill-cat"
                v-model="newSkillCategory"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label for="new-skill-title" class="block text-sm font-medium text-slate-800 mb-1">
                Judul Topik
              </label>
              <input
                id="new-skill-title"
                v-model="newSkillTitle"
                type="text"
                required
                placeholder="Contoh: Bedah Error React & TypeScript 30 Menit"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-h-[44px]"
              />
            </div>
            <div>
              <label for="new-skill-desc" class="block text-sm font-medium text-slate-800 mb-1">
                Deskripsi Singkat (Opsional)
              </label>
              <textarea
                id="new-skill-desc"
                v-model="newSkillDesc"
                rows="2"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <button
              type="submit"
              :disabled="creatingSkill"
              class="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-sm font-semibold min-h-[44px]"
            >
              {{ creatingSkill ? 'Menyimpan...' : 'Simpan Topik Skill Baru' }}
            </button>
          </form>

          <div v-if="data.sessions.length > 0" class="pt-4 border-t border-slate-200 space-y-2">
            <h3 class="text-sm font-semibold text-slate-900">Slot Terjadwal Kamu ({{ data.sessions.length }})</h3>
            <ul class="space-y-2">
              <li
                v-for="s in data.sessions"
                :key="s.id"
                class="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <p class="font-semibold text-slate-900">{{ formatDateTime(s.scheduledAt) }}</p>
                  <p class="text-slate-600">{{ s.durationMinutes }}m · {{ s.mode }} · {{ s.format }}</p>
                </div>
                <NuxtLink
                  :to="`/sessions/${s.id}`"
                  class="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-100"
                >
                  Workspace
                </NuxtLink>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
