<script setup lang="ts">
import type { BookingSkillItem } from '~/components/SkillBookingPanel.vue'

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

const { data, status, error, refresh } = useLazyFetch<{ items: BookingSkillItem[] }>('/api/explore', {
  query: queryParams,
  watch: [queryParams]
})

const { data: meData, refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const myUserId = computed(() => meData.value?.user?.id || '')
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)

const activeSkillId = ref<string | null>(null)
const mobileDrawerOpen = ref(false)

const activeItem = computed<BookingSkillItem | null>(() => {
  const items = data.value?.items || []
  if (items.length === 0) return null
  if (activeSkillId.value) {
    const found = items.find((i) => i.skill.id === activeSkillId.value)
    if (found) return found
  }
  return items[0] || null
})

const activeFilterCount = computed(() => {
  let count = 0
  if (search.value.trim()) count += 1
  if (selectedCategory.value !== 'Semua') count += 1
  if (selectedDuration.value) count += 1
  if (selectedMode.value) count += 1
  if (selectedFormat.value) count += 1
  if (availableOnly.value) count += 1
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
  <div class="space-y-5">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
          Direktori Skill Terverifikasi
        </p>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
          Jelajah Mentor
        </h1>
        <p class="text-sm text-slate-600 mt-0.5">
          Pilih penawaran di kiri untuk meninjau profil mentor, slot jadwal, dan ulasan check-in di kanan.
        </p>
      </div>
      <NuxtLink
        to="/teach"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[42px] transition-colors shrink-0"
      >
        <UIcon name="i-ph-chalkboard-teacher" class="w-4 h-4" aria-hidden="true" />
        <span>Tawarkan Micro-Session</span>
      </NuxtLink>
    </div>

    <!-- Compact Technical Filter Ribbon -->
    <search class="block bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
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
              class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 min-h-[42px]"
            />
          </div>
        </div>

        <div>
          <label for="filter-category" class="sr-only">Filter Kategori</label>
          <select
            id="filter-category"
            v-model="selectedCategory"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 min-h-[42px]"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label for="filter-duration" class="sr-only">Filter Durasi</label>
          <select
            id="filter-duration"
            v-model="selectedDuration"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 min-h-[42px]"
          >
            <option value="">Semua Durasi</option>
            <option value="30">Micro 30 Menit</option>
            <option value="60">Standar 60 Menit</option>
          </select>
        </div>

        <div>
          <label for="filter-mode" class="sr-only">Filter Tipe Sesi</label>
          <select
            id="filter-mode"
            v-model="selectedMode"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 min-h-[42px]"
          >
            <option value="">Semua Tipe Sesi</option>
            <option value="1on1">1-on-1</option>
            <option value="group">Grup (2-5 Orang)</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold border min-h-[34px] transition-colors',
              selectedFormat === 'online'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
            ]"
            @click="selectedFormat = selectedFormat === 'online' ? '' : 'online'"
          >
            Online Meet
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold border min-h-[34px] transition-colors',
              selectedFormat === 'in_person'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
            ]"
            @click="selectedFormat = selectedFormat === 'in_person' ? '' : 'in_person'"
          >
            Tatap Muka Kampus
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold border min-h-[34px] transition-colors',
              availableOnly
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
            ]"
            @click="availableOnly = !availableOnly"
          >
            Slot Tersedia Saja
          </button>
        </div>

        <button
          v-if="activeFilterCount > 0"
          type="button"
          class="text-xs font-semibold text-blue-700 hover:underline px-2 py-1"
          @click="resetFilters"
        >
          Reset Filter ({{ activeFilterCount }})
        </button>
      </div>
    </search>

    <!-- Loading State -->
    <div v-if="status === 'pending'" class="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-busy="true">
      <div class="lg:col-span-7 space-y-2.5">
        <div v-for="n in 4" :key="n" class="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
      <div class="hidden lg:block lg:col-span-5 h-96 bg-white border-2 border-blue-200 rounded-2xl animate-pulse" />
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
      class="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3"
    >
      <UIcon name="i-ph-compass" class="w-10 h-10 text-slate-400 mx-auto" aria-hidden="true" />
      <h2 class="text-base font-bold text-slate-900">Tidak ada mentor yang cocok</h2>
      <p class="text-sm text-slate-600">
        Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh penawaran skill yang tersedia.
      </p>
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-sm font-semibold text-blue-700 min-h-[42px]"
        @click="resetFilters"
      >
        Reset Semua Filter
      </button>
    </div>

    <!-- Master-Detail Split Layout (Desktop: 7/5 Split, Mobile: List -> Slideover) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Master List (Left 58%) -->
      <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <header class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span class="font-bold text-slate-900">
            Hasil Direktori
            <span class="font-mono text-blue-700 ml-1 tabular-nums">({{ data.items.length }})</span>
          </span>
          <span class="text-slate-500 hidden lg:inline">Klik baris untuk melihat detail di kanan</span>
          <span class="text-slate-500 lg:hidden">Ketuk mentor untuk booking</span>
        </header>

        <ul class="divide-y divide-slate-200">
          <li v-for="item in data.items" :key="item.skill.id">
            <button
              type="button"
              :aria-pressed="activeItem?.skill.id === item.skill.id"
              :class="[
                'w-full text-left p-4 sm:p-5 transition-colors border-l-4 flex items-start justify-between gap-3',
                activeItem?.skill.id === item.skill.id
                  ? 'border-l-blue-600 bg-blue-50/40'
                  : 'border-l-transparent hover:bg-slate-50'
              ]"
              @click="selectItem(item, true)"
            >
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <UAvatar :src="item.tutor.avatarUrl || undefined" :alt="item.tutor.name" size="sm" class="mt-0.5 shrink-0" />
                <div class="min-w-0 flex-1 space-y-1.5">
                  <!-- Tier 1: Title + Single Status Pill -->
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {{ item.skill.title }}
                    </h2>
                    <span
                      :class="[
                        'text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0',
                        item.slots.length > 0
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-600 border-slate-300'
                      ]"
                    >
                      {{ item.slots.length > 0 ? 'Slot Tersedia' : 'Hold Queue 48j' }}
                    </span>
                  </div>

                  <!-- Tier 2: Mentor Name & Badges -->
                  <div class="flex flex-wrap items-center gap-1.5 text-xs">
                    <span class="font-semibold text-slate-800">{{ item.tutor.name }}</span>
                    <VerifiedUkswBadge v-if="item.tutor.isVerifiedUksw" />
                    <span
                      v-if="item.tutor.isVerifiedMentor"
                      class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-600 px-1.5 py-0.5 rounded-md"
                    >
                      <UIcon name="i-ph-seal-check-duotone" class="w-3 h-3" aria-hidden="true" />
                      Verified Peer Mentor
                    </span>
                  </div>

                  <!-- Tier 3: Quiet Metadata -->
                  <p class="text-xs text-slate-500 tabular-nums">
                    {{
                      [
                        item.skill.category,
                        item.slots[0]
                          ? `${item.slots[0].durationMinutes}m · ${item.slots[0].mode === 'group' ? `Grup ${item.slots[0].bookedCount}/${item.slots[0].maxLearners}` : '1-on-1'} · ${item.slots[0].format === 'online' ? 'Online' : 'Kampus'}`
                          : 'Antrean 48 Jam',
                        item.tutor.major,
                        item.tutor.reviewCount > 0 ? `Rating ${item.tutor.avgRating}/5 (${item.tutor.reviewCount})` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    }}
                  </p>
                </div>
              </div>

              <div class="shrink-0 flex flex-col items-end justify-between gap-2 self-stretch">
                <span class="font-mono text-xs font-bold text-blue-700 tabular-nums">1 Kredit</span>
                <span class="lg:hidden inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                  <span>Detail</span>
                  <UIcon name="i-ph-caret-right" class="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          </li>
        </ul>
      </section>

      <!-- Desktop Sticky Detail & Booking Panel (Right 42%) -->
      <aside class="hidden lg:block lg:col-span-5 sticky top-20">
        <Transition name="panel-slide" mode="out-in">
          <div
            v-if="activeItem"
            :key="activeItem.skill.id"
            class="bg-white border-2 border-blue-600 rounded-2xl p-5"
          >
            <SkillBookingPanel
              :item="activeItem"
              :my-user-id="myUserId"
              :credit-balance="creditBalance"
              @booked="handleBooked"
            />
          </div>
        </Transition>
      </aside>
    </div>

    <!-- Mobile Detail & Booking Slideover -->
    <USlideover v-model:open="mobileDrawerOpen" :title="activeItem?.skill.title || 'Detail Sesi'">
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
