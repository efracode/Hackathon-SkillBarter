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

const { data, status, refresh } = useLazyFetch<AdminOverviewPayload>('/api/admin/overview')
const actionMessage = ref('')
const actionError = ref('')
const simulating = ref(false)

const confirmModalOpen = ref(false)
const pendingResolve = ref<{ id: string; decision: 'refund' | 'release' | 'penalize'; label: string } | null>(null)
const adminNoteInput = ref('')
const resolving = ref(false)

function askResolveReport(reportId: string, decision: 'refund' | 'release' | 'penalize', label: string) {
  pendingResolve.value = { id: reportId, decision, label }
  adminNoteInput.value = ''
  confirmModalOpen.value = true
}

async function confirmResolveReport() {
  if (!pendingResolve.value) return
  resolving.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/admin/reports/${pendingResolve.value.id}/resolve`, {
      method: 'POST',
      body: {
        decision: pendingResolve.value.decision,
        adminNote: adminNoteInput.value.trim() || null
      }
    })
    actionMessage.value = `Laporan sengketa berhasil diproses (${pendingResolve.value.label}).`
    confirmModalOpen.value = false
    pendingResolve.value = null
    adminNoteInput.value = ''
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value = fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal memproses sengketa.'
  } finally {
    resolving.value = false
  }
}

async function runSimulation(action: 'release_disputes' | 'expire_queues' | 'run_lazy_checks') {
  simulating.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    await $fetch('/api/admin/simulate', {
      method: 'POST',
      body: { action }
    })
    actionMessage.value = `Simulasi (${action}) selesai dijalankan.`
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value = fetchErr?.data?.statusMessage || fetchErr?.message || 'Simulasi gagal.'
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
  <div class="space-y-8">
    <!-- Console Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
          Konsol Operasional Admin
        </h1>
        <p class="text-sm text-[#475569]">
          Metrik evaluasi v1 dari database, alat simulasi demo juri, dan penyelesaian antrean sengketa per booking.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <UiButton variant="secondary" size="sm" icon="i-ph-download-simple" :disabled="!data" @click="exportCsv">
          Ekspor CSV
        </UiButton>
        <UiButton variant="secondary" size="sm" icon="i-ph-download-simple" :disabled="!data" @click="exportJson">
          Ekspor JSON
        </UiButton>
      </div>
    </div>

    <UiAlert v-if="actionMessage" tone="success" :title="actionMessage" />
    <UiAlert v-if="actionError" tone="danger" :title="actionError" />

    <div v-if="status === 'pending'" aria-busy="true" class="h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat konsol admin"
      description="Pastikan akun memiliki hak admin lalu muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Grouped Metrics (01 Operational vs 02 Credit Circulation) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section class="min-w-0 lg:col-span-6 space-y-2">
          <h2 class="text-sm font-bold text-[#14181F] pb-2 border-b border-[#E5E0D5]">
            01. Operasional Sesi &amp; Ulasan
          </h2>
          <dl class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5] tabular-nums text-sm">
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Total Sesi Selesai</dt>
              <dd class="font-mono font-bold text-[#1D4ED8]">{{ data.metrics.totalCompleted }}</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Rincian Mode (1-on-1 / Grup)</dt>
              <dd class="font-mono font-bold text-[#1D4ED8]">{{ data.metrics.count1on1 }} / {{ data.metrics.countGroup }}</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Rincian Durasi (30m / 60m)</dt>
              <dd class="font-mono font-bold text-[#1D4ED8]">{{ data.metrics.count30m }} / {{ data.metrics.count60m }}</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Rata-rata Rating Check-in QR ({{ data.metrics.reviewCount }})</dt>
              <dd class="font-mono font-bold text-[#1D4ED8]">{{ data.metrics.avgRating.toFixed(1) }} / 5</dd>
            </div>
          </dl>
        </section>

        <section class="min-w-0 lg:col-span-6 lg:border-l lg:border-[#E5E0D5] lg:pl-8 space-y-2">
          <h2 class="text-sm font-bold text-[#14181F] pb-2 border-b border-[#E5E0D5]">
            02. Sirkulasi Ekonomi Kredit
          </h2>
          <dl class="divide-y divide-[#E5E0D5] border-b border-[#E5E0D5] tabular-nums text-sm">
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Total Kredit dalam Pemesanan (Escrow)</dt>
              <dd class="font-mono font-bold text-[#92400E]">{{ data.metrics.totalEscrowed }} Kredit</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Total Kredit Cair ke Pengajar</dt>
              <dd class="font-mono font-bold text-[#047857]">{{ data.metrics.totalDisbursed }} Kredit</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Total Refund ke Pembelajar</dt>
              <dd class="font-mono font-bold text-[#047857]">{{ data.metrics.totalRefunded }} Kredit</dd>
            </div>
            <div class="py-3 flex items-baseline justify-between gap-4">
              <dt class="text-[#475569]">Daftar Tunggu 48 Jam Kedaluwarsa</dt>
              <dd class="font-mono font-bold text-[#14181F]">{{ data.metrics.totalExpired }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- Judge Fast-Forward Simulation -->
      <section class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-4">
        <div class="space-y-1">
          <h2 class="text-base font-bold text-[#14181F]">
            Simulasi Fast-Forward Siklus Kredit (Demo Juri)
          </h2>
          <p class="text-xs text-[#475569]">
            Jalankan pencairan jeda 24 jam, kedaluwarsa Daftar Tunggu 48 jam, atau pengecekan kuorum dan no-show secara instan.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UiButton variant="primary" size="sm" :disabled="simulating" @click="runSimulation('release_disputes')">
            Cairkan Jeda Sengketa 24j
          </UiButton>
          <UiButton variant="secondary" size="sm" :disabled="simulating" @click="runSimulation('expire_queues')">
            Kedaluwarsakan Daftar Tunggu 48j
          </UiButton>
          <UiButton variant="secondary" size="sm" :disabled="simulating" @click="runSimulation('run_lazy_checks')">
            Jalankan Lazy Check Kuorum &amp; No-Show
          </UiButton>
        </div>
      </section>

      <!-- Dispute Queue -->
      <section class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-4">
        <h2 class="text-base font-bold text-[#14181F] pb-3 border-b border-[#E5E0D5]">
          Antrean Laporan Sengketa per Booking ({{ data.reports.length }})
        </h2>

        <div v-if="data.reports.length === 0" class="py-8 text-center text-sm text-[#526071]">
          Tidak ada laporan sengketa dalam antrean.
        </div>

        <ul v-else class="divide-y divide-[#E5E0D5]">
          <li
            v-for="item in data.reports"
            :key="item.report.id"
            class="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UiBadge :tone="item.report.status === 'open' ? 'danger' : 'success'">
                  {{ item.report.status === 'open' ? 'Menunggu Tinjauan' : item.report.status }}
                </UiBadge>
                <span class="text-xs font-bold text-[#14181F]">{{ item.skillTitle }}</span>
                <span class="text-xs text-[#526071]">| Pelapor: {{ item.reporterName }}</span>
              </div>
              <p class="text-sm text-[#14181F]">"{{ item.report.reason }}"</p>
              <p v-if="item.report.adminNote" class="text-xs text-[#475569] bg-[#FAF8F4] px-3 py-1.5 rounded-[6px] border border-[#E5E0D5]">
                Catatan Admin: {{ item.report.adminNote }}
              </p>
            </div>

            <div v-if="item.report.status === 'open'" class="flex flex-wrap gap-2 shrink-0">
              <UiButton
                variant="secondary"
                size="sm"
                @click="askResolveReport(item.report.id, 'refund', 'Refund Pembelajar')"
              >
                Refund Pembelajar
              </UiButton>
              <UiButton
                variant="secondary"
                size="sm"
                @click="askResolveReport(item.report.id, 'release', 'Cairkan ke Pengajar')"
              >
                Cairkan Pengajar
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                @click="askResolveReport(item.report.id, 'penalize', 'Penalti Cooldown Tutor')"
              >
                Cooldown Tutor
              </UiButton>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- Risky Admin Action Confirmation Modal -->
    <UiDialog v-model:open="confirmModalOpen" title="Konfirmasi Keputusan Sengketa">
      <div class="space-y-4">
        <p class="text-sm text-[#475569]">
          Apakah kamu yakin ingin menjalankan keputusan <strong class="text-[#14181F]">{{ pendingResolve?.label }}</strong>? Aksi ini langsung memutasi kredit dalam pemesanan dan status booking.
        </p>
        <UiField id="admin-note-input" label="Catatan Admin (Opsional)">
          <textarea
            id="admin-note-input"
            v-model="adminNoteInput"
            rows="2"
            maxlength="300"
            placeholder="Tambahkan alasan keputusan untuk arsip sengketa..."
            class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F]"
          />
        </UiField>
        <div class="flex justify-end gap-2.5">
          <UiButton variant="secondary" size="sm" @click="confirmModalOpen = false">
            Batal
          </UiButton>
          <UiButton variant="primary" size="sm" :loading="resolving" @click="confirmResolveReport">
            {{ resolving ? 'Memproses…' : 'Ya, Terapkan Keputusan' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
