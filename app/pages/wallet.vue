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

const { data, status, error, refresh } = useLazyFetch<WalletPayload>('/api/wallet')

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-6">
    <div class="pb-4 border-b border-stone-300">
      <p class="font-mono text-xs font-semibold uppercase tracking-wider text-teal-700">
        Transparansi Ekonomi Kredit
      </p>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
        Dompet Kredit &amp; Ledger
      </h1>
      <p class="text-sm text-slate-600 mt-1">
        Setiap mutasi kredit dan penguncian escrow tercatat atomik di database.
      </p>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-stone-200 rounded-2xl p-6 animate-pulse" aria-busy="true">
      <p class="text-sm text-slate-600">Memuat saldo dan riwayat ledger…</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat dompet kredit"
      description="Terjadi kendala saat membaca ledger kredit. Coba muat ulang."
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <section class="bg-white border border-stone-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
        <div class="p-5 sm:p-6">
          <p class="text-xs font-medium text-slate-600">Saldo Tersedia</p>
          <p class="mt-1 text-3xl font-bold text-teal-700 font-mono tabular-nums">
            {{ data.creditBalance }} <span class="text-base font-sans font-medium">Kredit</span>
          </p>
          <p class="mt-1 text-xs text-slate-500">Dapat langsung dipakai untuk booking sesi baru.</p>
        </div>
        <div class="p-5 sm:p-6">
          <p class="text-xs font-medium text-slate-600">Terkunci di Escrow</p>
          <p class="mt-1 text-3xl font-bold text-amber-700 font-mono tabular-nums">
            {{ data.escrowBalance }} <span class="text-base font-sans font-medium">Kredit</span>
          </p>
          <p class="mt-1 text-xs text-slate-500">Menunggu sesi selesai atau batas antrean Hold Queue.</p>
        </div>
      </section>

      <section class="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <header class="px-5 py-4 border-b border-stone-200">
          <h2 id="ledger-caption" class="text-base font-semibold text-slate-900">
            Riwayat Mutasi Kredit (Ledger)
          </h2>
        </header>

        <div v-if="data.ledger.length === 0" class="p-8 text-center text-sm text-slate-600">
          Belum ada catatan mutasi kredit.
        </div>

        <div
          v-else
          tabindex="0"
          role="region"
          aria-labelledby="ledger-caption"
          class="ledger-table-wrapper"
        >
          <table class="ledger-table text-left text-sm">
            <caption class="sr-only">Riwayat mutasi saldo kredit dan escrow SkillBarter</caption>
            <thead class="bg-[#F7F5F0] border-b border-stone-200 text-xs text-slate-600">
              <tr>
                <th scope="col" class="px-5 py-3 font-semibold">Keterangan</th>
                <th scope="col" class="px-5 py-3 font-semibold">Waktu</th>
                <th scope="col" class="px-5 py-3 font-semibold text-right">Mutasi</th>
                <th scope="col" class="px-5 py-3 font-semibold text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="row in data.ledger" :key="row.id">
                <th scope="row" data-label="Keterangan" class="px-5 py-3.5 font-medium text-slate-900">
                  {{ row.reason }}
                </th>
                <td data-label="Waktu" class="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap tabular-nums">
                  {{ formatDateTime(row.createdAt) }}
                </td>
                <td
                  data-label="Mutasi"
                  :class="[
                    'px-5 py-3.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap',
                    row.delta >= 0 ? 'text-teal-700' : 'text-amber-700'
                  ]"
                >
                  {{ row.delta >= 0 ? `+${row.delta}` : row.delta }}
                </td>
                <td data-label="Saldo Akhir" class="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
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
