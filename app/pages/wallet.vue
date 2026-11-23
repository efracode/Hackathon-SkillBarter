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
const filterMode = ref<'all' | 'in' | 'out'>('all')

const totalPool = computed(() => {
  const c = data.value?.creditBalance ?? 0
  const e = data.value?.escrowBalance ?? 0
  return Math.max(1, c + e)
})

const availableRatio = computed(() =>
  Math.round(((data.value?.creditBalance ?? 0) / totalPool.value) * 100)
)

const filteredLedger = computed(() => {
  const list = data.value?.ledger || []
  if (filterMode.value === 'in') return list.filter((row) => row.delta > 0)
  if (filterMode.value === 'out') return list.filter((row) => row.delta < 0)
  return list
})

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
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
          Kredit Saya &amp; Riwayat Kredit
        </h1>
        <p class="text-sm text-[#475569]">
          Lihat kredit yang siap dipakai dan kredit yang sedang dilindungi dalam pemesanan aktif.
        </p>
      </div>

      <UiButton to="/teach" variant="primary" size="md">
        Ajarkan Skill (+1 s.d. +2 Kredit)
      </UiButton>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-[#E5E0D5] rounded-[8px] p-6 animate-pulse" aria-busy="true">
      <p class="text-sm text-[#526071]">Memuat saldo dan riwayat kredit…</p>
    </div>

    <UiAlert
      v-else-if="error"
      tone="danger"
      title="Gagal memuat Kredit Saya"
      description="Periksa koneksi lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Available vs Escrow Balance Split + Proportion Bar -->
      <section class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2 tabular-nums">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-[#526071]">Kredit Saya (Siap Dipakai)</p>
            <p class="font-mono text-3xl font-bold text-[#1D4ED8]">
              <AnimatedNumber :value="data.creditBalance" suffix=" Kredit" />
            </p>
            <p class="text-xs text-[#475569]">
              Bisa langsung dipakai memesan sesi belajar atau masuk Daftar Tunggu.
            </p>
          </div>

          <div class="space-y-1 sm:border-l sm:border-[#E5E0D5] sm:pl-6">
            <p class="text-xs font-semibold text-[#526071]">Kredit dalam Pemesanan (Dilindungi)</p>
            <p class="font-mono text-3xl font-bold text-[#92400E]">
              <AnimatedNumber :value="data.escrowBalance" suffix=" Kredit" />
            </p>
            <p class="text-xs text-[#475569]">
              Ditahan aman hingga sesi selesai (jeda 24j) atau batas Daftar Tunggu 48j.
            </p>
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="h-2.5 w-full rounded-[4px] bg-[#F3EFE6] border border-[#E5E0D5] overflow-hidden flex">
            <div class="bg-[#1D4ED8] transition-[width] duration-300" :style="{ width: `${availableRatio}%` }" />
            <div
              v-if="data.escrowBalance > 0"
              class="bg-[#B45309] transition-[width] duration-300"
              :style="{ width: `${100 - availableRatio}%` }"
            />
          </div>
          <div class="flex items-center justify-between text-[11px] font-mono text-[#526071] tabular-nums">
            <span>Siap Dipakai: {{ availableRatio }}%</span>
            <span v-if="data.escrowBalance > 0">Dalam Pemesanan: {{ 100 - availableRatio }}%</span>
            <span v-else>Tidak ada kredit terkunci</span>
          </div>
        </div>
      </section>

      <!-- Ledger Table -->
      <section class="bg-white border border-[#E5E0D5] rounded-[8px] overflow-hidden">
        <header class="px-5 py-4 border-b border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3">
          <h2 id="ledger-caption" class="text-base font-bold text-[#14181F]">
            Riwayat Kredit
          </h2>

          <div class="inline-flex rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F4] p-0.5 text-xs font-semibold">
            <button
              v-for="tab in [
                { id: 'all', label: 'Semua' },
                { id: 'in', label: 'Masuk (+)' },
                { id: 'out', label: 'Dipesan / Keluar (-)' }
              ]"
              :key="tab.id"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-[4px] transition-colors min-h-[34px]',
                filterMode === tab.id ? 'bg-[#14181F] text-white' : 'text-[#475569] hover:text-[#14181F]'
              ]"
              @click="filterMode = tab.id as 'all' | 'in' | 'out'"
            >
              {{ tab.label }}
            </button>
          </div>
        </header>

        <div v-if="filteredLedger.length === 0" class="p-8 text-center text-sm text-[#526071]">
          Belum ada catatan riwayat kredit untuk filter ini.
        </div>

        <div v-else tabindex="0" role="region" aria-labelledby="ledger-caption" class="ledger-table-wrapper">
          <table class="ledger-table text-sm">
            <thead class="bg-[#F3EFE6] border-b border-[#E5E0D5] text-left text-xs font-semibold text-[#475569]">
              <tr>
                <th class="px-5 py-3">Waktu</th>
                <th class="px-5 py-3">Keterangan</th>
                <th class="px-5 py-3 text-right">Mutasi</th>
                <th class="px-5 py-3 text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E0D5]">
              <tr v-for="row in filteredLedger" :key="row.id" class="hover:bg-[#FAF8F4]/70">
                <td data-label="Waktu" class="px-5 py-3.5 font-mono text-xs text-[#526071] tabular-nums whitespace-nowrap">
                  {{ formatDateTime(row.createdAt) }}
                </td>
                <td data-label="Keterangan" class="px-5 py-3.5 font-medium text-[#14181F]">
                  {{ row.reason }}
                </td>
                <td
                  data-label="Mutasi"
                  :class="[
                    'px-5 py-3.5 font-mono font-bold text-right tabular-nums whitespace-nowrap',
                    row.delta > 0 ? 'text-[#047857]' : 'text-[#92400E]'
                  ]"
                >
                  {{ row.delta > 0 ? `+${row.delta}` : row.delta }} Kredit
                </td>
                <td data-label="Saldo Akhir" class="px-5 py-3.5 font-mono font-semibold text-right text-[#14181F] tabular-nums whitespace-nowrap">
                  {{ row.balanceAfter }} Kredit
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
