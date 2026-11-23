<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { clear: clearSession } = useUserSession()
const signingOut = ref(false)
const signOutError = ref('')

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => {
    if (!signingOut.value) {
      signOutError.value = ''
      emit('update:open', val)
    }
  }
})

async function confirmSignOut() {
  signingOut.value = true
  signOutError.value = ''
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clearSession()
    emit('update:open', false)
    await navigateTo('/login')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    signOutError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal keluar dari sesi. Coba lagi.'
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <UiDialog v-model:open="isOpen" title="Keluar dari SkillBarter?">
    <div class="space-y-5">
      <p class="text-sm text-[#475569] leading-relaxed">
        Kamu akan keluar dari sesi akun ini. Kredit dan jadwal belajarmu tetap tersimpan. Tekan Esc atau Batal untuk kembali.
      </p>

      <UiAlert
        v-if="signOutError"
        tone="danger"
        title="Gagal keluar dari akun"
        :description="signOutError"
      />

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
        <UiButton
          variant="secondary"
          :disabled="signingOut"
          @click="isOpen = false"
        >
          Batal
        </UiButton>
        <UiButton
          variant="danger"
          icon="i-ph-sign-out"
          :loading="signingOut"
          @click="confirmSignOut"
        >
          {{ signingOut ? 'Keluar…' : 'Ya, Keluar' }}
        </UiButton>
      </div>
    </div>
  </UiDialog>
</template>
