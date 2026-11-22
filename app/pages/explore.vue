<script setup lang="ts">
const { data: meData } = await useFetch('/api/me', { key: 'me-profile' })
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Jelajah Skill</h1>
        <p class="text-sm text-slate-600">
          Temukan mentor mahasiswa dengan ulasan terverifikasi. Saldo saat ini:
          <span class="font-semibold text-teal-700 tabular-nums">{{ creditBalance }} Kredit</span>.
        </p>
      </div>
      <NuxtLink
        to="/teach"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
      >
        <UIcon name="i-ph-chalkboard-teacher" class="w-4 h-4" aria-hidden="true" />
        <span>Tawarkan Micro-Session</span>
      </NuxtLink>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <UIcon name="i-ph-compass" class="w-10 h-10 text-indigo-600 mx-auto mb-3" aria-hidden="true" />
      <h2 class="text-base font-semibold text-slate-900">Direktori Skill siap dibangun di Fase 2</h2>
      <p class="mt-1 text-sm text-slate-600 max-w-md mx-auto">
        Fondasi autentikasi, onboarding 1 langkah, dan saldo awal 2 kredit sudah aktif.
      </p>
    </div>
  </div>
</template>
