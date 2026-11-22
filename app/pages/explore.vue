<script setup lang="ts">
interface ExploreSlot {
  id: string
  mode: string
  durationMinutes: number
  format: string
  locationOrLink: string
  scheduledAt: string
  maxLearners: number
  bookedCount: number
  remainingSpots: number
}

interface ExploreItem {
  skill: {
    id: string
    userId: string
    category: string
    title: string
    description: string | null
    templateTag: string | null
  }
  tutor: {
    id: string
    name: string
    avatarUrl: string | null
    campus: string | null
    major: string | null
    completedCount: number
    avgRating: number
    reviewCount: number
    isVerifiedMentor: boolean
    isVerifiedUksw: boolean
  }
  slots: ExploreSlot[]
  reviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewerName: string
  }>
}

const route = useRoute()
const router = useRouter()

const search = ref(String(route.query.q || ''))
const selectedCategory = ref(String(route.query.category || 'Semua'))
const selectedDuration = ref<string>(String(route.query.duration || ''))
const selectedMode = ref<string>(String(route.query.mode || ''))
const selectedFormat = ref<string>(String(route.query.format || ''))
const availableOnly = ref(route.query.availableOnly === 'true')

const categories = ['Semua', 'Teknologi & Coding', 'Desain & UI/UX', 'Bahasa & Presentasi', 'Akademik & Riset', 'Karier & CV']

const queryParams = computed(() => ({
  q: search.value || undefined,
  category: selectedCategory.value !== 'Semua' ? selectedCategory.value : undefined,
  duration: selectedDuration.value || undefined,
  mode: selectedMode.value || undefined,
  format: selectedFormat.value || undefined,
  availableOnly: availableOnly.value ? 'true' : undefined
}))

watch(queryParams, (next: Record<string, string | undefined>) => {
  const cleanQuery: Record<string, string> = {}
  for (const [k, v] of Object.entries(next)) {
    if (v) cleanQuery[k] = v
  }
  router.replace({ query: cleanQuery })
})

const { data, status, error, refresh } = useLazyFetch<{ items: ExploreItem[] }>('/api/explore', {
  query: queryParams,
  watch: [queryParams]
})

const { data: meData, refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const myUserId = computed(() => meData.value?.user?.id || '')
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)

const detailOpen = ref(false)
const activeItem = ref<ExploreItem | null>(null)
const selectedSlotId = ref<string | null>(null)
const preferredTimeNote = ref('')
const bookingLoading = ref(false)
const bookingError = ref('')
const bookingSuccess = ref('')

function openDetail(item: ExploreItem) {
  activeItem.value = item
  selectedSlotId.value = item.slots[0]?.id ?? null
  preferredTimeNote.value = ''
  bookingError.value = ''
  bookingSuccess.value = ''
  detailOpen.value = true
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

async function confirmBooking() {
  if (!activeItem.value) return
  bookingError.value = ''
  bookingSuccess.value = ''
  bookingLoading.value = true

  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        skillId: activeItem.value.skill.id,
        sessionId: activeItem.value.slots.length > 0 ? selectedSlotId.value : null,
        preferredTimeNote: activeItem.value.slots.length === 0 ? preferredTimeNote.value : null
      }
    })
    await Promise.all([refresh(), refreshMe()])
    bookingSuccess.value =
      activeItem.value.slots.length > 0
        ? 'Booking berhasil! 1 kredit terkunci di escrow.'
        : 'Masuk Hold Queue 48 jam! 1 kredit terkunci di escrow.'
    setTimeout(() => {
      detailOpen.value = false
    }, 900)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    bookingError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal memproses booking.'
  } finally {
    bookingLoading.value = false
  }
}

function resetFilters() {
  search.value = ''
  selectedCategory.value = 'Semua'
  selectedDuration.value = ''
  selectedMode.value = ''
  selectedFormat.value = ''
  availableOnly.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Jelajah Skill</h1>
        <p class="text-sm text-slate-600">
          Temukan mentor mahasiswa dengan ulasan terverifikasi dari check-in sesi nyata.
        </p>
      </div>
      <NuxtLink
        to="/teach"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[44px] transition-colors"
      >
        <UIcon name="i-ph-chalkboard-teacher" class="w-4 h-4" aria-hidden="true" />
        <span>Tawarkan Micro-Session</span>
      </NuxtLink>
    </div>

    <!-- Search & Filter Bar -->
    <search class="block bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="lg:col-span-2">
          <label for="explore-search" class="sr-only">Cari topik atau nama mentor</label>
          <div class="relative">
            <UIcon
              name="i-ph-magnifying-glass"
              class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="explore-search"
              v-model="search"
              name="q"
              type="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              placeholder="Cari topik, skill, atau nama mentor…"
              class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label for="filter-category" class="sr-only">Filter Kategori</label>
          <select
            id="filter-category"
            v-model="selectedCategory"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 min-h-[44px]"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label for="filter-duration" class="sr-only">Filter Durasi</label>
          <select
            id="filter-duration"
            v-model="selectedDuration"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 min-h-[44px]"
          >
            <option value="">Semua Durasi</option>
            <option value="30">Micro 30 Menit</option>
            <option value="60">Standar 60 Menit</option>
          </select>
        </div>

        <div>
          <label for="filter-mode" class="sr-only">Filter Mode &amp; Format</label>
          <select
            id="filter-mode"
            v-model="selectedMode"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 min-h-[44px]"
          >
            <option value="">Semua Tipe Sesi</option>
            <option value="1on1">1-on-1</option>
            <option value="group">Grup (2-5 Orang)</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium border min-h-[36px] transition-colors',
            selectedFormat === 'online'
              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="selectedFormat = selectedFormat === 'online' ? '' : 'online'"
        >
          Online Meet
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium border min-h-[36px] transition-colors',
            selectedFormat === 'in_person'
              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="selectedFormat = selectedFormat === 'in_person' ? '' : 'in_person'"
        >
          Tatap Muka Kampus
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium border min-h-[36px] transition-colors',
            availableOnly
              ? 'bg-sky-700 border-sky-700 text-white font-semibold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
          ]"
          @click="availableOnly = !availableOnly"
        >
          Slot Tersedia Saja
        </button>
      </div>
    </search>

    <!-- Loading State -->
    <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      <div
        v-for="n in 3"
        :key="n"
        class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse"
      >
        <div class="h-4 w-28 bg-slate-200 rounded" />
        <div class="h-5 w-full bg-slate-200 rounded" />
        <div class="h-4 w-3/4 bg-slate-200 rounded" />
        <div class="h-10 w-full bg-slate-100 rounded-xl" />
      </div>
      <p class="sr-only">Memuat daftar mentor SkillBarter…</p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat direktori skill"
      description="Terjadi kendala saat mengambil data mentor. Silakan coba muat ulang."
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <!-- Empty State -->
    <div
      v-else-if="!data?.items?.length"
      class="bg-white border border-slate-200 rounded-2xl p-8 text-center"
    >
      <UIcon name="i-ph-compass" class="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
      <h2 class="text-base font-semibold text-slate-900">Tidak ada mentor yang cocok</h2>
      <p class="mt-1 text-sm text-slate-600 mb-4">
        Coba ubah filter pencarian atau reset filter untuk melihat seluruh penawaran skill yang tersedia.
      </p>
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-800 min-h-[44px]"
        @click="resetFilters"
      >
        Reset Semua Filter
      </button>
    </div>

    <!-- Directory Grid (4-Element Compact Trust-First Card) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <article
        v-for="item in data.items"
        :key="item.skill.id"
        class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:-translate-y-0.5 hover:border-blue-300 transition-[transform,border-color] duration-150"
      >
        <div class="space-y-3">
          <!-- 1. Header: Category + Slot Summary Pill -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
              {{ item.skill.category }}
            </span>
            <span
              v-if="item.slots[0]"
              class="text-xs font-medium text-slate-600 tabular-nums"
            >
              {{ item.slots[0].durationMinutes }}m ·
              {{ item.slots[0].mode === 'group' ? `Grup ${item.slots[0].bookedCount}/${item.slots[0].maxLearners}` : '1-on-1' }}
              · {{ item.slots[0].format === 'online' ? 'Online' : 'Kampus' }}
            </span>
            <span v-else class="text-xs font-medium text-slate-600">Hold Queue 48j</span>
          </div>

          <!-- 2. Topic Title (max 2 lines) -->
          <h2 class="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
            {{ item.skill.title }}
          </h2>

          <!-- 3. Tutor Trust Row -->
          <div class="flex items-start gap-2.5 pt-1">
            <UAvatar :src="item.tutor.avatarUrl || undefined" :alt="item.tutor.name" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-sm font-semibold text-slate-900 truncate">{{ item.tutor.name }}</span>
                <VerifiedUkswBadge v-if="item.tutor.isVerifiedUksw" />
                <span
                  v-if="item.tutor.isVerifiedMentor"
                  class="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md"
                >
                  <UIcon name="i-ph-seal-check-duotone" class="w-3.5 h-3.5" aria-hidden="true" />
                  Verified Peer Mentor
                </span>
              </div>
              <p v-if="item.tutor.major || item.tutor.campus" class="text-xs text-slate-500 truncate">
                {{ [item.tutor.major, item.tutor.campus].filter(Boolean).join(' · ') }}
              </p>
              <p class="text-xs text-slate-600 mt-1 tabular-nums">
                <template v-if="item.tutor.reviewCount > 0">
                  Rating {{ item.tutor.avgRating }} ({{ item.tutor.reviewCount }} ulasan terverifikasi)
                </template>
                <template v-else>
                  Belum ada ulasan terverifikasi
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- 4. Contextual Action Footer -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <span
            v-if="item.slots.length > 0"
            class="text-sm font-semibold text-blue-900 tabular-nums"
          >
            1 Kredit
          </span>
          <span v-else class="text-xs font-medium text-slate-600">
            Antrean 48 Jam
          </span>

          <button
            v-if="item.tutor.id === myUserId"
            type="button"
            disabled
            class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium min-h-[40px]"
          >
            Penawaranmu
          </button>
          <button
            v-else-if="item.slots.length > 0"
            type="button"
            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[44px] transition-colors duration-150"
            @click="openDetail(item)"
          >
            Booking Sesi
          </button>
          <button
            v-else
            type="button"
            class="px-4 py-2 rounded-xl border border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100/70 text-sm font-semibold min-h-[44px] transition-colors duration-150"
            @click="openDetail(item)"
          >
            Masuk Hold Queue (48j)
          </button>
        </div>
      </article>
    </div>

    <!-- Detail & Booking Slideover -->
    <USlideover v-model:open="detailOpen" :title="activeItem?.skill.title || 'Detail Sesi'">
      <template #body>
        <div v-if="activeItem" class="space-y-5">
          <div class="flex items-center gap-3">
            <UAvatar
              :src="activeItem.tutor.avatarUrl || undefined"
              :alt="activeItem.tutor.name"
              size="md"
            />
            <div>
              <p class="font-semibold text-slate-900">{{ activeItem.tutor.name }}</p>
              <p class="text-xs text-slate-600">
                {{ [activeItem.tutor.major, activeItem.tutor.campus].filter(Boolean).join(' · ') || 'Mahasiswa' }}
              </p>
            </div>
          </div>

          <p v-if="activeItem.skill.description" class="text-sm text-slate-700 leading-relaxed">
            {{ activeItem.skill.description }}
          </p>

          <!-- Slot Picker OR Hold Queue Note -->
          <div v-if="activeItem.slots.length > 0" class="space-y-2.5">
            <p class="text-sm font-semibold text-slate-900">Pilih Jadwal Tersedia:</p>
            <div class="space-y-2">
              <label
                v-for="slot in activeItem.slots"
                :key="slot.id"
                :for="`slot-${slot.id}`"
                :class="[
                  'flex items-start gap-3 p-3 rounded-xl border transition-colors duration-150',
                  selectedSlotId === slot.id
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                ]"
              >
                <input
                  :id="`slot-${slot.id}`"
                  v-model="selectedSlotId"
                  type="radio"
                  :value="slot.id"
                  class="mt-1"
                />
                <div class="text-sm">
                  <p class="font-medium text-slate-900">{{ formatDateTime(slot.scheduledAt) }}</p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    {{ slot.durationMinutes }} menit ·
                    {{ slot.mode === 'group' ? `Grup (sisa ${slot.remainingSpots} kursi)` : '1-on-1' }}
                    · {{ slot.format === 'online' ? 'Online Meet' : `Tatap Muka: ${slot.locationOrLink}` }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div v-else class="space-y-2">
            <UAlert
              color="warning"
              variant="subtle"
              icon="i-ph-clock"
              title="Slot pengajar sedang penuh"
              description="Masuk Hold Queue mengunci 1 kredit di escrow. Jika pengajar tidak menerima dalam 48 jam, kredit otomatis kembali 100%."
            />
            <label for="preferred-time" class="block text-sm font-medium text-slate-800 pt-1">
              Usulan Waktu Pilihan (Opsional)
            </label>
            <textarea
              id="preferred-time"
              v-model="preferredTimeNote"
              rows="2"
              placeholder="Contoh: Bisa Selasa atau Kamis sore jam 16.00 WIB via Google Meet."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div class="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1">
            <p class="font-semibold text-slate-800">Aturan Escrow &amp; Pembatalan:</p>
            <p>Batal minimal 12 jam sebelum sesi mendapat refund 100%. Sisa saldo setelah transaksi: <strong class="tabular-nums text-slate-900">{{ Math.max(0, creditBalance - 1) }} Kredit</strong>.</p>
          </div>

          <div aria-live="polite" class="space-y-2">
            <UAlert
              v-if="bookingError"
              color="error"
              variant="subtle"
              icon="i-ph-warning-circle"
              :title="bookingError"
            />
            <UAlert
              v-if="bookingSuccess"
              color="secondary"
              variant="subtle"
              icon="i-ph-check-circle"
              :title="bookingSuccess"
            />
          </div>

          <button
            type="button"
            :disabled="bookingLoading || creditBalance < 1"
            class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold min-h-[48px] transition-colors"
            @click="confirmBooking"
          >
            {{
              creditBalance < 1
                ? 'Saldo Kredit Tidak Cukup (0 Kredit)'
                : bookingLoading
                  ? 'Memproses Escrow…'
                  : activeItem.slots.length > 0
                    ? 'Kunci 1 Kredit di Escrow & Booking'
                    : 'Kunci 1 Kredit & Masuk Hold Queue'
            }}
          </button>

          <!-- Verified Reviews List -->
          <div class="pt-4 border-t border-slate-200 space-y-3">
            <h3 class="text-sm font-semibold text-slate-900">
              Ulasan Terverifikasi ({{ activeItem.reviews.length }})
            </h3>
            <p v-if="activeItem.reviews.length === 0" class="text-xs text-slate-500">
              Belum ada ulasan terverifikasi untuk pengajar ini.
            </p>
            <ul v-else class="space-y-2.5">
              <li
                v-for="rev in activeItem.reviews"
                :key="rev.id"
                class="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-slate-900">{{ rev.reviewerName }}</span>
                  <span class="text-xs font-semibold text-blue-700 tabular-nums">
                    Rating {{ rev.rating }}/5 · Verified Attendance
                  </span>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed">{{ rev.comment }}</p>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
