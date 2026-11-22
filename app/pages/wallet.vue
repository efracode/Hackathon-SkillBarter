<script setup lang="ts">
const { data: meData } = await useFetch('/api/me', { key: 'me-profile' })
const creditBalance = computed(() => meData.value?.user?.creditBalance ?? 0)
const escrowBalance = computed(() => meData.value?.user?.escrowBalance ?? 0)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Dompet Kredit</h1>
      <p class="text-sm text-slate-600">
        Transparansi saldo tersedia, kredit terkunci di escrow, dan mutasi ledger.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <p class="text-xs font-medium text-slate-600">Saldo Tersedia</p>
        <p class="mt-1 text-3xl font-bold text-teal-700 font-mono tabular-nums">
          {{ creditBalance }} <span class="text-base font-sans font-medium">Kredit</span>
        </p>
      </div>
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <p class="text-xs font-medium text-slate-600">Terkunci di Escrow</p>
        <p class="mt-1 text-3xl font-bold text-amber-700 font-mono tabular-nums">
          {{ escrowBalance }} <span class="text-base font-sans font-medium">Kredit</span>
        </p>
      </div>
    </div>
  </div>
</template>
