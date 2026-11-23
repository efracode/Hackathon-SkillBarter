<script setup lang="ts">
import type { BookingSkillItem } from '~/components/SkillBookingPanel.vue'
import { SKILL_CATEGORIES } from '~/utils/designTokens'

const route = useRoute()
const router = useRouter()

const search = ref(String(route.query.q || ''))
const selectedCategory = ref(String(route.query.category || 'Semua'))
const selectedDuration = ref<string>(String(route.query.duration || ''))
const selectedMode = ref<string>(String(route.query.mode || ''))
const selectedFormat = ref<string>(String(route.query.format || ''))
const availableOnly = ref(route.query.availableOnly === 'true')

const categories = SKILL_CATEGORIES

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

const { data, status, refresh } = useLazyFetch<{ items: BookingSkillItem[] }>('/api/explore', {
  query: queryParams,
  watch: [queryParams]
})

const { data: meData, refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const myUserId = computed(() => meData.value?.user?.id || '')
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)

const activeSkillId = ref<string | null>(null)
const mobileDrawerOpen = ref(false)
const mobileFilterOpen = ref(false)

const activeItem = computed<BookingSkillItem | null>(() => {
  const items = data.value?.items || []
  if (items.length === 0) return null
  if (activeSkillId.value) {
    const found = items.find((i) => i.skill.id === activeSkillId.value)
    if (found) return found
  }
  return items[0] || null
})

const advancedFilterCount = computed(() => {
  let count = 0
  if (selectedDuration.value) count += 1
  if (selectedMode.value) count += 1
  if (selectedFormat.value) count += 1
  if (availableOnly.value) count += 1
  return count
})

const activeFilterCount = computed(() => {
  let count = advancedFilterCount.value
  if (search.value.trim()) count += 1
  if (selectedCategory.value !== 'Semua') count += 1
  return count
})

function selectItem(item: BookingSkillItem, openMobile = false) {
  activeSkillId.value = item.skill.id
  if (openMobile && import.meta.client && window.innerWidth < 1024) {
    mobileDrawerOpen.value = true
  }
}

async function handleBooked() {
  await Promise.all([refresh(), refreshMe()])
  setTimeout(() => {
    mobileDrawerOpen.value = false
  }, 850)
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
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
          Cari Skill untuk Dipelajari
        </h1>
        <p class="text-sm text-[#475569]">
          Filter topik, cek jadwal terbuka 30 atau 60 menit, dan baca ulasan asli dari peserta yang sudah check-in.
        </p>
      </div>

      <UiButton to="/teach" variant="secondary" size="sm" icon="i-ph-graduation-cap">
        Ajarkan Skill
      </UiButton>
    </div>

    <!-- Search & Filter Ribbon -->
    <search class="block space-y-3 pb-4 border-b border-[#E5E0D5]">
      <div class="flex flex-col lg:flex-row lg:items-center gap-2.5">
        <div class="relative flex-1 flex items-center gap-2">
          <div class="relative flex-1">
            <label for="explore-search" class="sr-only">Cari topik, skill, atau nama mentor</label>
            <UIcon
              name="i-ph-magnifying-glass"
              class="w-4 h-4 text-[#526071] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="explore-search"
              v-model="search"
              name="q"
              type="search"
              autocomplete="off"
              placeholder="Cari topik, skill, atau nama mentor..."
              class="w-full pl-10 pr-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
            />
          </div>

          <button
            type="button"
            class="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-xs font-semibold text-[#1D4ED8] min-h-[44px] shrink-0"
            @click="mobileFilterOpen = true"
          >
            <UIcon name="i-ph-sliders-horizontal" class="w-4 h-4" aria-hidden="true" />
            <span>Filter{{ advancedFilterCount > 0 ? ` (${advancedFilterCount})` : '' }}</span>
          </button>
        </div>

        <div class="hidden lg:flex items-center gap-2 shrink-0">
          <select
            v-model="selectedDuration"
            aria-label="Filter durasi"
            class="px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-xs font-medium text-[#14181F] min-h-[44px]"
          >
            <option value="">Durasi: Semua</option>
            <option value="30">30 Menit</option>
            <option value="60">60 Menit</option>
          </select>

          <select
            v-model="selectedMode"
            aria-label="Filter mode"
            class="px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-xs font-medium text-[#14181F] min-h-[44px]"
          >
            <option value="">Mode: 1-on-1 &amp; Grup</option>
            <option value="1on1">1-on-1</option>
            <option value="group">Grup (2–5)</option>
          </select>

          <select
            v-model="selectedFormat"
            aria-label="Filter format"
            class="px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-xs font-medium text-[#14181F] min-h-[44px]"
          >
            <option value="">Format: Online &amp; Kampus</option>
            <option value="online">Online</option>
            <option value="in_person">Kampus</option>
          </select>

          <label class="inline-flex items-center gap-1.5 text-xs font-medium text-[#14181F] cursor-pointer pl-1">
            <input v-model="availableOnly" type="checkbox" class="accent-[#1D4ED8] w-4 h-4" />
            <span>Ada Slot</span>
          </label>

          <button
            v-if="activeFilterCount > 0"
            type="button"
            class="text-xs font-semibold text-[#1D4ED8] hover:underline pl-1 min-h-[36px]"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Horizontal Scrollable Category Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-colors min-h-[38px] whitespace-nowrap shrink-0',
            selectedCategory === cat
              ? 'bg-[#14181F] text-white border-[#14181F]'
              : 'bg-white text-[#475569] border-[#E5E0D5] hover:border-[#94A3B8]'
          ]"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </search>

    <!-- Loading / Error / Empty -->
    <div v-if="status === 'pending'" aria-busy="true" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-7 space-y-3">
        <div v-for="n in 4" :key="n" class="h-24 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      </div>
      <div class="hidden lg:block lg:col-span-5 h-96 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat direktori mentor"
      description="Periksa koneksi lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <div v-else-if="!data?.items?.length" class="p-10 bg-white border border-[#E5E0D5] rounded-[8px] text-center space-y-3">
      <p class="text-sm font-bold text-[#14181F]">Tidak ada skill yang cocok dengan filter pencarianmu.</p>
      <UiButton variant="secondary" size="sm" @click="resetFilters">
        Reset Filter
      </UiButton>
    </div>

    <!-- Master-Detail Split View -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="min-w-0 lg:col-span-7 space-y-3">
        <button
          v-for="item in data.items"
          :key="item.skill.id"
          type="button"
          :class="[
            'w-full text-left p-4 sm:p-5 rounded-[8px] border bg-white transition-colors space-y-1.5',
            activeItem?.skill.id === item.skill.id
              ? 'border-[#1D4ED8]'
              : 'border-[#E5E0D5] hover:border-[#94A3B8]'
          ]"
          @click="selectItem(item, true)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-semibold text-[#1D4ED8]">{{ item.skill.category }}</span>
            <UiBadge
              :tone="item.slots.length > 0 ? 'success' : 'warning'"
              :icon="item.slots.length > 0 ? 'i-ph-calendar-check' : 'i-ph-clock'"
            >
              {{ item.slots.length > 0 ? `${item.slots.length} Slot Tersedia` : 'Daftar Tunggu 48j' }}
            </UiBadge>
          </div>

          <h2 class="text-base font-bold text-[#14181F] leading-snug">{{ item.skill.title }}</h2>

          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526071] tabular-nums">
            <span class="font-semibold text-[#14181F]">{{ item.tutor.name }}</span>
            <VerifiedUkswBadge v-if="item.tutor.isVerifiedUksw" />
            <span v-if="item.tutor.major || item.tutor.campus">
              | {{ [item.tutor.major, item.tutor.campus].filter(Boolean).join(', ') }}
            </span>
            <span v-if="item.tutor.isVerifiedMentor">| Verified Peer Mentor</span>
            <span v-if="item.tutor.reviewCount > 0" class="font-mono text-[#14181F]">
              | {{ item.tutor.avgRating.toFixed(1) }}/5 ({{ item.tutor.reviewCount }} ulasan)
            </span>
          </div>

          <p v-if="item.slots[0]" class="font-mono text-xs text-[#526071] pt-1 tabular-nums">
            {{ item.slots[0].durationMinutes }}m | {{ item.slots[0].mode === 'group' ? `Grup (maks ${item.slots[0].maxLearners})` : '1-on-1' }} | {{ item.slots[0].format === 'online' ? 'Online' : 'Tatap Muka' }}
          </p>
        </button>
      </div>

      <!-- Desktop Sticky Detail Panel -->
      <aside
        v-if="activeItem"
        class="hidden lg:block min-w-0 lg:col-span-5 lg:sticky lg:top-20 bg-white border border-[#E5E0D5] rounded-[8px] p-6"
      >
        <SkillBookingPanel
          :item="activeItem"
          :my-user-id="myUserId"
          :credit-balance="creditBalance"
          @booked="handleBooked"
        />
      </aside>
    </div>

    <!-- Mobile Filter Drawer -->
    <USlideover v-model:open="mobileFilterOpen" title="Filter Lanjutan Direktori">
      <template #body>
        <div class="space-y-4">
          <UiField id="m-dur" label="Durasi Sesi">
            <select id="m-dur" v-model="selectedDuration" class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option value="">Semua Durasi</option>
              <option value="30">Micro-session 30 Menit</option>
              <option value="60">Standar 60 Menit</option>
            </select>
          </UiField>

          <UiField id="m-mode" label="Mode Pertemuan">
            <select id="m-mode" v-model="selectedMode" class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option value="">1-on-1 &amp; Grup</option>
              <option value="1on1">1-on-1</option>
              <option value="group">Grup (2–5 Peserta)</option>
            </select>
          </UiField>

          <UiField id="m-fmt" label="Format">
            <select id="m-fmt" v-model="selectedFormat" class="w-full px-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option value="">Online &amp; Kampus</option>
              <option value="online">Online (Meet/Zoom)</option>
              <option value="in_person">Tatap Muka Kampus</option>
            </select>
          </UiField>

          <label class="flex items-center gap-2.5 py-2 text-sm font-medium text-[#14181F] cursor-pointer">
            <input v-model="availableOnly" type="checkbox" class="accent-[#1D4ED8] w-4 h-4" />
            <span>Hanya tampilkan yang punya slot terbuka</span>
          </label>

          <div class="pt-3 border-t border-[#E5E0D5] flex items-center justify-between gap-3">
            <UiButton variant="secondary" size="md" @click="resetFilters">
              Reset Semua
            </UiButton>
            <UiButton variant="primary" size="md" @click="mobileFilterOpen = false">
              Terapkan Filter
            </UiButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Mobile Detail Drawer -->
    <USlideover v-model:open="mobileDrawerOpen" title="Detail &amp; Pemesanan Mentor">
      <template #body>
        <SkillBookingPanel
          v-if="activeItem"
          :item="activeItem"
          :my-user-id="myUserId"
          :credit-balance="creditBalance"
          @booked="handleBooked"
        />
      </template>
    </USlideover>
  </div>
</template>
