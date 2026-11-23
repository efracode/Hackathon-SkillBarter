<script setup lang="ts">
import { TEACH_CATEGORIES } from '~/utils/designTokens'

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

const { data, status, refresh } = useLazyFetch<TeachResponse>('/api/teach/skills')

const categories = TEACH_CATEGORIES

const slotDrawerOpen = ref(false)
const skillDrawerOpen = ref(false)

const newSkillCategory = ref<string>('Teknologi & Coding')
const newSkillTitle = ref('')
const newSkillDesc = ref('')
const creatingSkill = ref(false)
const skillMessage = ref('')
const skillError = ref('')

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

function skillTitleById(id: string) {
  return data.value?.skills?.find((s) => s.id === id)?.title || 'Topik Skill'
}

async function createSkill() {
  skillError.value = ''
  skillMessage.value = ''
  if (newSkillTitle.value.trim().length < 3) {
    skillError.value = 'Judul topik minimal 3 karakter.'
    return
  }
  creatingSkill.value = true
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
    skillMessage.value = 'Topik skill baru berhasil ditambahkan.'
    await refresh()
    setTimeout(() => {
      skillDrawerOpen.value = false
    }, 650)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    skillError.value = fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menambah skill.'
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
    slotSuccess.value = 'Jadwal mengajar berhasil dipublikasikan ke Jelajah Skill.'
    await refresh()
    setTimeout(() => {
      slotDrawerOpen.value = false
    }, 650)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    slotError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal membuat jadwal mengajar.'
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
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
            Ajarkan Skill &amp; Kelola Jadwal
          </h1>
          <UiBadge v-if="data?.isVerifiedMentor" tone="primary" class="md:hidden">
            Verified Mentor
          </UiBadge>
        </div>
        <p class="text-sm text-[#475569]">
          Buka sesi 1-on-1 (30/60m, +1 kredit) atau grup 2–5 peserta (60m, maks +2 kredit). Formulir dibuka lewat panel samping agar tidak membingungkan.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
        <UiButton variant="secondary" size="md" @click="skillDrawerOpen = true">
          Tambah Topik
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :disabled="inCooldown || !data?.skills?.length"
          @click="slotDrawerOpen = true"
        >
          Buka Jadwal Baru
        </UiButton>
      </div>
    </div>

    <div v-if="status === 'pending'" aria-busy="true" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-7 h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      <div class="lg:col-span-5 h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat studio mengajar"
      description="Periksa koneksi lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Muat Ulang
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Cooldown / Hold Queue Alerts -->
      <UiAlert
        v-if="inCooldown && data.cooldownUntil"
        tone="danger"
        :title="`Masa Cooldown Aktif hingga ${formatDateTime(data.cooldownUntil)} (1 -> 3 -> 7 hari)`"
        description="Jika pengajar tidak hadir lewat T+15m tanpa kode check-in, tombol publikasi slot dinonaktifkan sementara tanpa saldo minus."
      />

      <UiAlert
        v-if="data.pendingHoldQueueCount > 0"
        tone="warning"
        :title="`${data.pendingHoldQueueCount} permintaan Daftar Tunggu menunggu jadwal dari kamu`"
        description="Tinjau dan jadwalkan permintaan dalam 48 jam sebelum kredit kembali otomatis ke pembelajar."
      >
        <template #action>
          <UiButton to="/sessions?tab=queue" variant="secondary" size="sm">
            Kelola Antrean
          </UiButton>
        </template>
      </UiAlert>

      <!-- Inline Readout Strip -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 border-y border-[#E5E0D5] font-mono text-xs font-semibold text-[#047857] tabular-nums">
        <span>Sesi Mengajar Selesai: {{ data.completedCount }}</span>
        <span class="text-[#E5E0D5]" aria-hidden="true">|</span>
        <span>Rating Terverifikasi: {{ data.reviewCount > 0 ? `${data.avgRating.toFixed(1)}/5` : 'Belum ada' }}</span>
        <span class="text-[#E5E0D5]" aria-hidden="true">|</span>
        <span :class="data.isVerifiedMentor ? 'text-[#047857]' : 'text-[#14181F]'">
          Status: {{ data.isVerifiedMentor ? 'Verified Peer Mentor' : `${data.completedCount}/3 menuju Verified Mentor` }}
        </span>
      </div>

      <!-- Primary Split: Published Schedules (Left 7) + Teach Topics (Right 5) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <section class="min-w-0 lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <h2 class="text-base font-bold text-[#14181F]">
              Jadwal Mengajar Terpublikasi ({{ data.sessions.length }})
            </h2>
            <button
              type="button"
              :disabled="inCooldown || !data.skills.length"
              class="text-xs font-semibold text-[#1D4ED8] hover:underline disabled:opacity-40"
              @click="slotDrawerOpen = true"
            >
              + Buka Jadwal
            </button>
          </div>

          <div v-if="data.sessions.length === 0" class="py-10 text-center space-y-3 border-b border-[#E5E0D5]">
            <p class="text-sm font-semibold text-[#14181F]">Belum ada jadwal mengajar yang dipublikasikan.</p>
            <p class="text-xs text-[#526071]">
              Buka 1 sesi 30 menit agar pembelajar bisa langsung memesan tanpa Daftar Tunggu.
            </p>
            <UiButton
              variant="primary"
              size="sm"
              :disabled="inCooldown || !data.skills.length"
              @click="slotDrawerOpen = true"
            >
              Publikasikan Jadwal Pertamamu
            </UiButton>
          </div>

          <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
            <li v-for="s in data.sessions" :key="s.id" class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <p class="font-mono text-xs font-bold text-[#1D4ED8] tabular-nums">
                  {{ formatDateTime(s.scheduledAt) }} | {{ s.durationMinutes }}m |
                  {{ s.mode === 'group' ? `Grup maks ${s.maxLearners} (+2 Kredit maks)` : '1-on-1 (+1 Kredit)' }}
                </p>
                <p class="text-[15px] font-bold text-[#14181F]">{{ skillTitleById(s.skillId) }}</p>
                <p class="text-xs text-[#526071] truncate">
                  {{ s.format === 'online' ? 'Online' : 'Tatap Muka' }}: {{ s.locationOrLink }}
                </p>
              </div>
              <NuxtLink :to="`/sessions/${s.id}`" class="text-xs font-semibold text-[#1D4ED8] hover:underline shrink-0">
                Buka Ruang Sesi
              </NuxtLink>
            </li>
          </ul>
        </section>

        <aside class="min-w-0 lg:col-span-5 lg:border-l lg:border-[#E5E0D5] lg:pl-8 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <h2 class="text-base font-bold text-[#14181F]">Topik Skill Saya ({{ data.skills.length }})</h2>
            <button type="button" class="text-xs font-semibold text-[#1D4ED8] hover:underline" @click="skillDrawerOpen = true">
              + Tambah Topik
            </button>
          </div>

          <p v-if="data.skills.length === 0" class="text-xs text-[#526071] py-4">
            Belum ada topik skill mengajar. Tambahkan minimal 1 topik untuk mulai membuka jadwal.
          </p>

          <ul v-else class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5]">
            <li v-for="sk in data.skills" :key="sk.id" class="py-3.5 space-y-1">
              <p class="text-xs font-semibold text-[#1D4ED8]">{{ sk.category }}</p>
              <p class="text-sm font-bold text-[#14181F]">{{ sk.title }}</p>
              <p v-if="sk.description" class="text-xs text-[#475569] leading-relaxed">{{ sk.description }}</p>
            </li>
          </ul>
        </aside>
      </div>
    </template>

    <!-- Slideover 1: Publish Slot Form -->
    <USlideover v-model:open="slotDrawerOpen" title="Buka Jadwal Mengajar Baru">
      <template #body>
        <form class="space-y-4" @submit.prevent="createSessionSlot">
          <p class="text-xs text-[#475569]">
            1-on-1 berhadiah 1 kredit; Grup (2–5 peserta, wajib 60 menit) dibatasi maksimal 2 kredit.
          </p>

          <UiAlert v-if="slotError" tone="danger" :title="slotError" />
          <UiAlert v-if="slotSuccess" tone="success" :title="slotSuccess" />

          <UiField id="slot-skill" label="Pilih Topik Skill">
            <select
              id="slot-skill"
              v-model="selectedSkillId"
              :disabled="inCooldown || !data?.skills?.length"
              class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
            >
              <option v-for="sk in data?.skills || []" :key="sk.id" :value="sk.id">
                {{ sk.title }} ({{ sk.category }})
              </option>
            </select>
          </UiField>

          <div class="grid grid-cols-2 gap-3">
            <UiField id="slot-mode" label="Mode Sesi">
              <select id="slot-mode" v-model="slotMode" :disabled="inCooldown" class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
                <option value="1on1">1-on-1 (+1K)</option>
                <option value="group">Grup (Cap +2K)</option>
              </select>
            </UiField>

            <UiField id="slot-duration" label="Durasi">
              <select
                id="slot-duration"
                v-model="slotDuration"
                :disabled="inCooldown || slotMode === 'group'"
                class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
              >
                <option :value="30">Micro 30 Menit</option>
                <option :value="60">Standar 60 Menit</option>
              </select>
            </UiField>
          </div>

          <UiField id="slot-format" label="Format Pertemuan">
            <select id="slot-format" v-model="slotFormat" :disabled="inCooldown" class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option value="online">Online (Meet/Zoom)</option>
              <option value="in_person">Tatap Muka Kampus</option>
            </select>
          </UiField>

          <UiField v-if="slotMode === 'group'" id="slot-max" label="Kapasitas Maksimal Peserta (2–5)">
            <input
              id="slot-max"
              v-model.number="slotMaxLearners"
              type="number"
              min="2"
              max="5"
              :disabled="inCooldown"
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm font-mono min-h-[44px]"
            />
          </UiField>

          <UiField id="slot-datetime" label="Jadwal Mulai">
            <input
              id="slot-datetime"
              v-model="slotDateTime"
              type="datetime-local"
              :disabled="inCooldown"
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
            />
          </UiField>

          <UiField id="slot-location" :label="slotFormat === 'online' ? 'Tautan Meeting' : 'Lokasi Kampus'">
            <input
              id="slot-location"
              v-model="slotLocation"
              type="text"
              :disabled="inCooldown"
              :placeholder="slotFormat === 'online' ? 'https://meet.google.com/...' : 'Perpustakaan UKSW Lt. 2'"
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
            />
          </UiField>

          <UiButton
            type="submit"
            variant="primary"
            block
            :loading="creatingSlot"
            :disabled="inCooldown || !data?.skills?.length"
          >
            {{ creatingSlot ? 'Mempublikasikan…' : 'Publikasikan Jadwal Mengajar' }}
          </UiButton>
        </form>
      </template>
    </USlideover>

    <!-- Slideover 2: Add Teach Skill Form -->
    <USlideover v-model:open="skillDrawerOpen" title="Tambah Topik Skill Baru">
      <template #body>
        <form class="space-y-4" @submit.prevent="createSkill">
          <UiAlert v-if="skillError" tone="danger" :title="skillError" />
          <UiAlert v-if="skillMessage" tone="success" :title="skillMessage" />

          <UiField id="new-skill-cat" label="Kategori">
            <select
              id="new-skill-cat"
              v-model="newSkillCategory"
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </UiField>

          <UiField id="new-skill-title" label="Judul Penawaran" required>
            <input
              id="new-skill-title"
              v-model="newSkillTitle"
              type="text"
              placeholder="Mis. Debugging TypeScript & REST API"
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
            />
          </UiField>

          <UiField id="new-skill-desc" label="Deskripsi Singkat">
            <textarea
              id="new-skill-desc"
              v-model="newSkillDesc"
              rows="3"
              placeholder="Jelaskan apa yang akan dibahas selama sesi..."
              class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm"
            />
          </UiField>

          <UiButton type="submit" variant="dark" block :loading="creatingSkill">
            {{ creatingSkill ? 'Menambahkan…' : 'Simpan Topik Skill' }}
          </UiButton>
        </form>
      </template>
    </USlideover>
  </div>
</template>
