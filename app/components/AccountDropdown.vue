<script setup lang="ts">
import { getUserInitials } from '~/utils/designTokens'

const props = withDefaults(
  defineProps<{
    name: string
    email: string
    avatarUrl?: string | null
    isVerifiedUksw: boolean
    isAdmin?: boolean
    compact?: boolean
  }>(),
  {
    avatarUrl: null,
    isAdmin: false,
    compact: false
  }
)

const emit = defineEmits<{
  signOut: []
}>()

const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const route = useRoute()

const firstName = computed(() => props.name.trim().split(/\s+/)[0] || 'Profil')
const initials = computed(() => getUserInitials(props.name))

watch(
  () => route.fullPath,
  () => {
    open.value = false
  }
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})

function triggerSignOut() {
  open.value = false
  emit('signOut')
}
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      :aria-expanded="open"
      aria-haspopup="menu"
      aria-label="Menu Akun"
      :class="[
        'inline-flex items-center gap-2 rounded-[6px] border transition-colors min-h-[40px] sm:min-h-[42px]',
        open
          ? 'border-[#1D4ED8] bg-[#EFF6FF]/40'
          : 'border-[#94A3B8] bg-white hover:border-[#14181F]',
        compact ? 'px-2 py-1.5' : 'pl-2 pr-2.5 py-1.5'
      ]"
      @click="open = !open"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="name"
        class="w-7 h-7 rounded-[4px] object-cover shrink-0 border border-[#E5E0D5]"
      />
      <span
        v-else
        class="w-7 h-7 rounded-[4px] bg-[#14181F] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0"
      >
        {{ initials }}
      </span>
      <span v-if="!compact" class="text-[13px] font-semibold text-[#14181F] max-w-[96px] truncate">
        {{ firstName }}
      </span>
      <UIcon
        v-if="!compact"
        name="i-ph-caret-down"
        :class="['w-3.5 h-3.5 text-[#526071] transition-transform', open ? 'rotate-180' : '']"
        aria-hidden="true"
      />
    </button>

    <Transition name="panel-slide">
      <div
        v-if="open"
        role="menu"
        aria-label="Menu Akun Pengguna"
        class="absolute right-0 mt-2 w-[300px] max-w-[calc(100vw-2rem)] bg-white border border-[#E5E0D5] rounded-[8px] shadow-popover z-50 overflow-hidden"
      >
        <!-- Header Identity -->
        <div class="p-4 border-b border-[#E5E0D5] space-y-2.5">
          <div class="flex items-center gap-3">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="name"
              class="w-10 h-10 rounded-[6px] object-cover shrink-0 border border-[#E5E0D5]"
            />
            <span
              v-else
              class="w-10 h-10 rounded-[6px] bg-[#14181F] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0"
            >
              {{ initials }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[#14181F] truncate">{{ name }}</p>
              <p class="text-xs text-[#526071] truncate">{{ email }}</p>
            </div>
          </div>

          <div>
            <VerifiedUkswBadge v-if="isVerifiedUksw" />
            <UiBadge v-else tone="neutral" icon="i-ph-user-circle">
              Akun Standar (Gmail / Kampus)
            </UiBadge>
          </div>
        </div>

        <!-- Navigation Group -->
        <div class="p-1.5 border-b border-[#E5E0D5] space-y-0.5">
          <NuxtLink
            to="/profile"
            role="menuitem"
            class="flex items-start gap-3 px-3 py-2.5 rounded-[6px] hover:bg-[#FAF8F4] transition-colors min-h-[44px]"
            @click="open = false"
          >
            <UIcon name="i-ph-user" class="w-4 h-4 text-[#475569] mt-0.5 shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-[13px] font-semibold text-[#14181F]">Lihat Profil</p>
              <p class="text-[11px] text-[#526071]">Identitas publik, skill &amp; ulasan</p>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/settings"
            role="menuitem"
            class="flex items-start gap-3 px-3 py-2.5 rounded-[6px] hover:bg-[#FAF8F4] transition-colors min-h-[44px]"
            @click="open = false"
          >
            <UIcon name="i-ph-gear" class="w-4 h-4 text-[#475569] mt-0.5 shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-[13px] font-semibold text-[#14181F]">Pengaturan</p>
              <p class="text-[11px] text-[#526071]">Akun, preferensi &amp; keamanan</p>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            role="menuitem"
            class="flex items-start gap-3 px-3 py-2.5 rounded-[6px] hover:bg-[#FAF8F4] transition-colors min-h-[44px]"
            @click="open = false"
          >
            <UIcon name="i-ph-shield-check" class="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-[13px] font-semibold text-[#14181F]">Konsol Admin</p>
              <p class="text-[11px] text-[#526071]">Metrik evaluasi, sengketa &amp; simulasi</p>
            </div>
          </NuxtLink>
        </div>

        <!-- Account Switch (Unavailable) + Sign Out -->
        <div class="p-1.5 space-y-1">
          <div
            aria-disabled="true"
            class="px-3 py-2 rounded-[6px] bg-[#FAF8F4] border border-transparent opacity-75 select-none"
          >
            <p class="text-[12px] font-semibold text-[#526071]">Ganti Akun Google (Segera hadir)</p>
            <p class="text-[11px] text-[#526071]">Butuh OAuth prompt=select_account</p>
          </div>

          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] bg-[#FFF1F2]/70 hover:bg-[#FFF1F2] text-[#BE123C] text-[13px] font-semibold min-h-[44px] transition-colors"
            @click="triggerSignOut"
          >
            <UIcon name="i-ph-sign-out" class="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
