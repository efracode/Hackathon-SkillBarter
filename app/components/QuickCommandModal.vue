<script setup lang="ts">
const props = defineProps<{
  open: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

interface QuickRouteItem {
  label: string
  desc: string
  to: string
  icon: string
  tag: string
}

const quickRoutes = computed<QuickRouteItem[]>(() => {
  const base: QuickRouteItem[] = [
    { label: 'Beranda', desc: 'Ringkasan kredit, jadwal belajar & rekomendasi mentor', to: '/dashboard', icon: 'i-ph-house', tag: 'Utama' },
    { label: 'Jelajah Skill', desc: 'Cari topik, filter jadwal & booking sesi', to: '/explore', icon: 'i-ph-compass', tag: 'Direktori' },
    { label: 'Jadwal & Sesi', desc: 'Kelola sesi aktif, Daftar Tunggu 48j & check-in', to: '/sessions', icon: 'i-ph-calendar-check', tag: 'Sesi' },
    { label: 'Ajarkan Skill', desc: 'Publikasikan sesi 30m atau grup 60m', to: '/teach', icon: 'i-ph-graduation-cap', tag: 'Mengajar' },
    { label: 'Kredit Saya', desc: 'Pantau Kredit Saya, Kredit dalam Pemesanan & Riwayat', to: '/wallet', icon: 'i-ph-wallet', tag: 'Kredit' },
    { label: 'Profil Publik', desc: 'Identitas kampus, skill & ulasan terverifikasi', to: '/profile', icon: 'i-ph-user', tag: 'Profil' },
    { label: 'Pengaturan Akun', desc: 'Informasi akun privat, preferensi & keluar akun', to: '/settings', icon: 'i-ph-gear', tag: 'Akun' }
  ]
  if (props.isAdmin) {
    base.push({
      label: 'Konsol Admin',
      desc: 'Metrik evaluasi v1, sengketa & simulasi demo',
      to: '/admin',
      icon: 'i-ph-shield-check',
      tag: 'Admin'
    })
  }
  return base
})

const filteredRoutes = computed<QuickRouteItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return quickRoutes.value
  return quickRoutes.value.filter(
    (item: QuickRouteItem) =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q)
  )
})

function goTo(path: string) {
  isOpen.value = false
  query.value = ''
  navigateTo(path)
}

function searchInExplore() {
  const q = query.value.trim()
  isOpen.value = false
  query.value = ''
  navigateTo(q ? { path: '/explore', query: { q } } : '/explore')
}

watch(isOpen, (next: boolean) => {
  if (next) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  } else {
    query.value = ''
  }
})
</script>

<template>
  <UiDialog v-model:open="isOpen" title="Pencarian Cepat & Navigasi">
    <div class="space-y-4">
      <div class="relative">
        <UIcon
          name="i-ph-magnifying-glass"
          class="w-4 h-4 text-[#526071] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <label for="quick-cmd-input" class="sr-only">Cari halaman atau topik mentor</label>
        <input
          id="quick-cmd-input"
          ref="inputRef"
          v-model="query"
          type="search"
          autocomplete="off"
          placeholder="Ketik halaman atau topik skill (mis. Figma, TypeScript)..."
          class="w-full pl-10 pr-3 py-2.5 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
          @keydown.enter.prevent="filteredRoutes[0] ? goTo(filteredRoutes[0].to) : searchInExplore()"
        />
      </div>

      <div v-if="query.trim()">
        <button
          type="button"
          class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[6px] border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-blue-100/70 text-left transition-colors min-h-[44px]"
          @click="searchInExplore"
        >
          <span class="inline-flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1D4ED8]">
            <UIcon name="i-ph-compass" class="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Cari mentor "{{ query.trim() }}" di Jelajah Skill</span>
          </span>
          <UIcon name="i-ph-arrow-right" class="w-4 h-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
        </button>
      </div>

      <div class="space-y-1.5">
        <p class="text-xs font-semibold text-[#526071]">
          Indeks Halaman
        </p>
        <ul class="divide-y divide-[#E5E0D5] border-y border-[#E5E0D5] bg-white">
          <li v-for="item in filteredRoutes" :key="item.to">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-2 py-2.5 text-left hover:bg-[#FAF8F4] transition-colors min-h-[44px]"
              @click="goTo(item.to)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <UIcon :name="item.icon" class="w-4 h-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-[#14181F] truncate">{{ item.label }}</p>
                  <p class="text-xs text-[#526071] truncate">{{ item.desc }}</p>
                </div>
              </div>
              <UiBadge tone="neutral">{{ item.tag }}</UiBadge>
            </button>
          </li>
        </ul>
        <p v-if="filteredRoutes.length === 0" class="text-xs text-[#526071] text-center py-4">
          Tekan Enter untuk mencari topik tersebut di Jelajah Skill.
        </p>
      </div>
    </div>
  </UiDialog>
</template>
