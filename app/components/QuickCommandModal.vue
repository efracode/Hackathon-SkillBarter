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
    { label: 'Dashboard Aktivitas', desc: 'Ringkasan saldo, agenda & rekomendasi mentor', to: '/dashboard', icon: 'i-ph-house', tag: 'Utama' },
    { label: 'Jelajah Mentor & Skill', desc: 'Cari topik, filter jadwal & booking sesi', to: '/explore', icon: 'i-ph-compass', tag: 'Belajar' },
    { label: 'Sesi Saya & Hold Queue', desc: 'Kelola jadwal aktif, antrean 48j & check-in', to: '/sessions', icon: 'i-ph-calendar-check', tag: 'Sesi' },
    { label: 'Mengajar & Buat Slot', desc: 'Publikasikan micro-session 30m atau grup 60m', to: '/teach', icon: 'i-ph-chalkboard-teacher', tag: 'Mengajar' },
    { label: 'Dompet Kredit & Ledger', desc: 'Pantau mutasi kredit dan saldo escrow', to: '/wallet', icon: 'i-ph-wallet', tag: 'Akun' },
    { label: 'Profil & Reputasi', desc: 'Edit nama tampilan, foto profil, bio & ulasan', to: '/profile', icon: 'i-ph-user', tag: 'Akun' }
  ]
  if (props.isAdmin) {
    base.push({
      label: 'Dashboard Admin',
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
  <UModal v-model:open="isOpen" title="Pencarian Cepat & Navigasi">
    <template #body>
      <div class="space-y-3">
        <div class="relative">
          <UIcon
            name="i-ph-magnifying-glass"
            class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label for="quick-cmd-input" class="sr-only">Cari halaman atau topik mentor</label>
          <input
            id="quick-cmd-input"
            ref="inputRef"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="Ketik nama halaman atau topik skill (mis. Figma, TypeScript)…"
            class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 min-h-[44px]"
            @keydown.enter.prevent="filteredRoutes[0] ? goTo(filteredRoutes[0].to) : searchInExplore()"
          />
        </div>

        <div v-if="query.trim()" class="pt-1">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-50 text-left transition-colors"
            @click="searchInExplore"
          >
            <span class="inline-flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-700">
              <UIcon name="i-ph-compass" class="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cari mentor "{{ query.trim() }}" di Direktori Jelajah</span>
            </span>
            <UIcon name="i-ph-arrow-right" class="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-1 pt-1">
          <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
            Navigasi Cepat
          </p>
          <ul class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            <li v-for="item in filteredRoutes" :key="item.to">
              <button
                type="button"
                class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-blue-50/60 transition-colors"
                @click="goTo(item.to)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    <UIcon :name="item.icon" class="w-4 h-4 text-blue-600" aria-hidden="true" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ item.label }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ item.desc }}</p>
                  </div>
                </div>
                <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 text-slate-600 shrink-0">
                  {{ item.tag }}
                </span>
              </button>
            </li>
          </ul>
          <p v-if="filteredRoutes.length === 0" class="text-xs text-slate-500 text-center py-4">
            Tekan Enter untuk mencari topik tersebut di Jelajah Mentor.
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
