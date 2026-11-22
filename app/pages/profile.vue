<script setup lang="ts">
const { data: meData, refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })
const { clear: clearSession } = useUserSession()

const user = computed(() => meData.value?.user)
const teachSkills = computed(() =>
  (meData.value?.skills || []).filter((s: { direction: string }) => s.direction === 'teach')
)
const learnSkills = computed(() =>
  (meData.value?.skills || []).filter((s: { direction: string }) => s.direction === 'learn')
)

const campusInput = ref('')
const majorInput = ref('')
const saving = ref(false)
const saveMessage = ref('')

watch(
  user,
  (u: { campus?: string | null; major?: string | null } | undefined) => {
    if (u) {
      campusInput.value = u.campus || ''
      majorInput.value = u.major || ''
    }
  },
  { immediate: true }
)

const inCooldown = computed(() => {
  if (!user.value?.teachingCooldownUntil) return false
  return new Date(user.value.teachingCooldownUntil).getTime() > Date.now()
})

async function saveProfile() {
  saving.value = true
  saveMessage.value = ''
  try {
    await $fetch('/api/profile', {
      method: 'PATCH',
      body: { campus: campusInput.value, major: majorInput.value }
    })
    await refreshMe()
    saveMessage.value = 'Identitas kampus dan jurusan berhasil diperbarui.'
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
      <p class="text-sm text-slate-600">Identitas kampus, daftar skill, status akun, dan pintasan navigasi.</p>
    </div>

    <UAlert
      v-if="inCooldown && user?.teachingCooldownUntil"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Status Cooldown Mengajar Aktif"
      :description="`Berakhir pada ${new Date(user.teachingCooldownUntil).toLocaleString('id-ID')}`"
    />

    <section v-if="user" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      <div class="flex items-center gap-4">
        <UAvatar :src="user.avatarUrl || undefined" :alt="user.name" size="lg" />
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ user.name }}</h2>
          <p class="text-sm text-slate-600">{{ user.email }}</p>
        </div>
      </div>

      <form class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200" @submit.prevent="saveProfile">
        <div>
          <label for="profile-campus" class="block text-xs font-medium text-slate-700 mb-1">
            Kampus (Opsional)
          </label>
          <input
            id="profile-campus"
            v-model="campusInput"
            type="text"
            placeholder="Nama kampus"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
          />
        </div>
        <div>
          <label for="profile-major" class="block text-xs font-medium text-slate-700 mb-1">
            Jurusan (Opsional)
          </label>
          <input
            id="profile-major"
            v-model="majorInput"
            type="text"
            placeholder="Nama jurusan"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
          />
        </div>
        <div class="sm:col-span-2 flex items-center justify-between gap-3">
          <span v-if="saveMessage" class="text-xs font-medium text-teal-700">{{ saveMessage }}</span>
          <button
            type="submit"
            :disabled="saving"
            class="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold min-h-[40px]"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan Profil' }}
          </button>
        </div>
      </form>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
        <div>
          <p class="text-xs font-semibold text-slate-700 mb-1.5">Skill Mengajar</p>
          <ul class="space-y-1">
            <li
              v-for="skill in teachSkills"
              :key="skill.id"
              class="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {{ skill.title }}
            </li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-700 mb-1.5">Minat Belajar</p>
          <ul class="space-y-1">
            <li
              v-for="skill in learnSkills"
              :key="skill.id"
              class="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {{ skill.title }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLink
        to="/wallet"
        class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[52px]"
      >
        <span class="inline-flex items-center gap-2.5 text-sm font-medium text-slate-900">
          <UIcon name="i-ph-wallet" class="w-5 h-5 text-teal-700" aria-hidden="true" />
          Dompet Kredit &amp; Ledger
        </span>
        <UIcon name="i-ph-caret-right" class="w-4 h-4 text-slate-500" aria-hidden="true" />
      </NuxtLink>

      <NuxtLink
        v-if="user?.role === 'admin'"
        to="/admin"
        class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[52px]"
      >
        <span class="inline-flex items-center gap-2.5 text-sm font-medium text-slate-900">
          <UIcon name="i-ph-shield-check" class="w-5 h-5 text-indigo-600" aria-hidden="true" />
          Dashboard Admin
        </span>
        <UIcon name="i-ph-caret-right" class="w-4 h-4 text-slate-500" aria-hidden="true" />
      </NuxtLink>
    </section>

    <div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold min-h-[44px]"
        @click="handleLogout"
      >
        <UIcon name="i-ph-sign-out" class="w-4 h-4" aria-hidden="true" />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  </div>
</template>
