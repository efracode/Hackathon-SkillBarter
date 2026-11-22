<script setup lang="ts">
interface WalletPayload {
  creditBalance: number
  escrowBalance: number
  ledger: Array<{
    id: string
    delta: number
    balanceAfter: number
    reason: string
    createdAt: string
  }>
}

const { data, status, error, refresh } = await useFetch<WalletPayload>('/api/wallet')

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Dompet Kredit</h1>
      <p class="text-sm text-slate-600">
        Transparansi saldo tersedia, kredit terkunci di escrow, dan seluruh catatan ledger atomik.
      </p>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
      <p class="text-sm text-slate-600">Memuat saldo dan riwayat ledger...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat dompet kredit"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <p class="text-xs font-medium text-slate-600">Saldo Tersedia</p>
          <p class="mt-1 text-3xl font-bold text-teal-700 font-mono tabular-nums">
            {{ data.creditBalance }} <span class="text-base font-sans font-medium">Kredit</span>
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <p class="text-xs font-medium text-slate-600">Terkunci di Escrow</p>
          <p class="mt-1 text-3xl font-bold text-amber-700 font-mono tabular-nums">
            {{ data.escrowBalance }} <span class="text-base font-sans font-medium">Kredit</span>
          </p>
        </div>
      </div>

      <section class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <header class="px-5 py-4 border-b border-slate-200">
          <h2 class="text-base font-semibold text-slate-900">Riwayat Mutasi Kredit (Ledger)</h2>
        </header>

        <div v-if="data.ledger.length === 0" class="p-8 text-center text-sm text-slate-600">
          Belum ada catatan mutasi kredit.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th class="px-5 py-3 font-semibold">Waktu</th>
                <th class="px-5 py-3 font-semibold">Keterangan</th>
                <th class="px-5 py-3 font-semibold text-right">Mutasi</th>
                <th class="px-5 py-3 font-semibold text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in data.ledger" :key="row.id">
                <td class="px-5 py-3 text-xs text-slate-600 whitespace-nowrap tabular-nums">
                  {{ formatDateTime(row.createdAt) }}
                </td>
                <td class="px-5 py-3 text-slate-900">{{ row.reason }}</td>
                <td
                  :class="[
                    'px-5 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap',
                    row.delta >= 0 ? 'text-teal-700' : 'text-amber-700'
                  ]"
                >
                  {{ row.delta >= 0 ? `+${row.delta}` : row.delta }}
                </td>
                <td class="px-5 py-3 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                  {{ row.balanceAfter }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
