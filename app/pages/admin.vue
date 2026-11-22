<script setup lang="ts">
interface AdminOverviewPayload {
  metrics: {
    totalCompleted: number
    count1on1: number
    countGroup: number
    count30m: number
    count60m: number
    totalEscrowed: number
    totalDisbursed: number
    totalRefunded: number
    totalExpired: number
    reviewCount: number
    avgRating: number
  }
  reviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewerName: string
  }>
  reports: Array<{
    report: {
      id: string
      reason: string
      status: string
      adminNote: string | null
      createdAt: string
    }
    reporterName: string
    session: { id: string; scheduledAt: string }
    skillTitle: string
  }>
}

const { data, status, error, refresh } = useLazyFetch<AdminOverviewPayload>('/api/admin/overview')
const activeTab = ref<'metrics' | 'disputes'>('metrics')
const actionMessage = ref('')
const simulating = ref(false)

async function resolveReport(reportId: string, decision: 'refund' | 'release' | 'penalize') {
  actionMessage.value = ''
  await $fetch(`/api/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    body: { decision }
  })
  actionMessage.value = `Laporan berhasil diproses (${decision}).`
  await refresh()
}

async function runSimulation(action: 'release_disputes' | 'expire_queues' | 'run_lazy_checks') {
  simulating.value = true
  actionMessage.value = ''
  try {
    await $fetch('/api/admin/simulate', {
      method: 'POST',
      body: { action }
    })
    actionMessage.value = `Simulasi (${action}) selesai dijalankan.`
    await refresh()
  } finally {
    simulating.value = false
  }
}

function exportJson() {
  if (!data.value) return
  const blob = new Blob([JSON.stringify(data.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'skillbarter-metrics-v1.json'
  a.click()
  URL.revokeObjectURL(url)
}

function exportCsv() {
  if (!data.value) return
  const m = data.value.metrics
  const rows = [
    ['metric', 'value'],
    ['total_completed_sessions', String(m.totalCompleted)],
    ['completed_1on1', String(m.count1on1)],
    ['completed_group', String(m.countGroup)],
    ['completed_30m', String(m.count30m)],
    ['completed_60m', String(m.count60m)],
    ['total_escrowed_credits', String(m.totalEscrowed)],
    ['total_disbursed_credits', String(m.totalDisbursed)],
    ['total_refunded_credits', String(m.totalRefunded)],
    ['total_expired_hold_queues', String(m.totalExpired)],
    ['verified_review_count', String(m.reviewCount)],
    ['average_verified_rating', String(m.avgRating)]
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'skillbarter-metrics-v1.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
        <p class="text-sm text-slate-600">
          Metrik evaluasi v1, antrean sengketa, dan alat simulasi demo juri.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="!data"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 min-h-[40px]"
          @click="exportCsv"
        >
          <UIcon name="i-ph-download-simple" class="w-4 h-4" aria-hidden="true" />
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          :disabled="!data"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 min-h-[40px]"
          @click="exportJson"
        >
          <UIcon name="i-ph-download-simple" class="w-4 h-4" aria-hidden="true" />
          <span>Export JSON</span>
        </button>
      </div>
    </div>

    <UAlert v-if="actionMessage" color="secondary" variant="subtle" :title="actionMessage" />

    <div role="tablist" aria-label="Menu Admin" class="flex gap-2 border-b border-slate-200 pb-3">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'metrics'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px]',
          activeTab === 'metrics'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
        ]"
        @click="activeTab = 'metrics'"
      >
        Metrik Evaluasi v1
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'disputes'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px]',
          activeTab === 'disputes'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
        ]"
        @click="activeTab = 'disputes'"
      >
        Antrean Sengketa ({{ data?.reports?.filter((r) => r.report.status === 'open').length || 0 }})
      </button>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
      <p class="text-sm text-slate-600">Memuat data admin...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat dashboard admin"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <template v-else-if="data">
      <!-- Tab 1: Metrics & Demo Controls -->
      <div v-if="activeTab === 'metrics'" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p class="text-xs font-medium text-slate-600">Total Sesi Selesai</p>
            <p class="mt-1 text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {{ data.metrics.totalCompleted }}
            </p>
            <p class="mt-1 text-xs text-slate-500 tabular-nums">
              1-on-1: {{ data.metrics.count1on1 }} · Grup: {{ data.metrics.countGroup }}
            </p>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p class="text-xs font-medium text-slate-600">Rasio 30m vs 60m</p>
            <p class="mt-1 text-3xl font-bold text-blue-600 font-mono tabular-nums">
              {{ data.metrics.count30m }} / {{ data.metrics.count60m }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Micro-session 30m vs Standar 60m</p>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p class="text-xs font-medium text-slate-600">Total Kredit Berputar</p>
            <p class="mt-1 text-3xl font-bold text-sky-700 font-mono tabular-nums">
              {{ data.metrics.totalEscrowed }}
            </p>
            <p class="mt-1 text-xs text-slate-500 tabular-nums">
              Cair: {{ data.metrics.totalDisbursed }} · Refund: {{ data.metrics.totalRefunded }} · Exp: {{ data.metrics.totalExpired }}
            </p>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p class="text-xs font-medium text-slate-600">Rata-rata Rating Terverifikasi</p>
            <p class="mt-1 text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {{ data.metrics.reviewCount > 0 ? data.metrics.avgRating : '0.0' }}
            </p>
            <p class="mt-1 text-xs text-slate-500 tabular-nums">
              Dari {{ data.metrics.reviewCount }} ulasan check-in
            </p>
          </div>
        </div>

        <!-- Demo Fast-Forward Controls -->
        <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h2 class="text-base font-semibold text-slate-900">Panel Simulasi Demo Juri (Fast-Forward Waktu)</h2>
          <p class="text-xs text-slate-600">
            Mempercepat evaluasi jeda sengketa 24 jam atau kedaluwarsa Hold Queue 48 jam pada data uji coba saat demo langsung.
          </p>
          <div class="flex flex-wrap gap-2.5">
            <button
              type="button"
              :disabled="simulating"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[40px]"
              @click="runSimulation('release_disputes')"
            >
              Selesaikan Jeda Sengketa 24 Jam
            </button>
            <button
              type="button"
              :disabled="simulating"
              class="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold min-h-[40px]"
              @click="runSimulation('expire_queues')"
            >
              Kedaluwarsakan Hold Queue 48 Jam
            </button>
            <button
              type="button"
              :disabled="simulating"
              class="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold min-h-[40px]"
              @click="runSimulation('run_lazy_checks')"
            >
              Jalankan Evaluasi Lazy-Check Sekarang
            </button>
          </div>
        </section>
      </div>

      <!-- Tab 2: Disputes -->
      <div v-else class="space-y-3">
        <div
          v-if="data.reports.length === 0"
          class="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600"
        >
          Tidak ada laporan sengketa saat ini.
        </div>

        <article
          v-for="row in data.reports"
          :key="row.report.id"
          class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span
                :class="[
                  'text-xs font-semibold px-2.5 py-0.5 rounded-md',
                  row.report.status === 'open'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
                ]"
              >
                {{ row.report.status }}
              </span>
              <h2 class="text-base font-semibold text-slate-900 mt-1.5">{{ row.skillTitle }}</h2>
              <p class="text-xs text-slate-600">Pelapor: {{ row.reporterName }}</p>
              <p class="text-sm text-slate-800 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {{ row.report.reason }}
              </p>
            </div>

            <div v-if="row.report.status === 'open'" class="flex flex-wrap gap-2">
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold min-h-[40px]"
                @click="resolveReport(row.report.id, 'refund')"
              >
                Refund Pembelajar
              </button>
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[40px]"
                @click="resolveReport(row.report.id, 'release')"
              >
                Cairkan ke Pengajar
              </button>
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold min-h-[40px]"
                @click="resolveReport(row.report.id, 'penalize')"
              >
                Terapkan Cooldown Tutor
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
