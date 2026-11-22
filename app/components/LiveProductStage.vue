<script setup lang="ts">
export interface StagePreviewMentor {
  id: string
  category: string
  title: string
  description: string | null
  tutorName: string
  tutorMeta: string
  isVerifiedUksw: boolean
  isVerifiedMentor: boolean
  avgRating: number
  reviewCount: number
  latestReview: {
    rating: number
    comment: string
    reviewerName: string
  } | null
  slotBadge: string
}

const props = defineProps<{
  mentor: StagePreviewMentor | null
}>()

type ScenarioKey = '1on1' | 'group' | 'refund'

const activeScenario = ref<ScenarioKey>('1on1')
const activeStep = ref(0)
const demoCode = ref('482910')
const isPlaying = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null

const stepTabs = [
  { code: '01', label: 'Pilih Mentor' },
  { code: '02', label: 'Escrow 1K' },
  { code: '03', label: 'Check-in QR' },
  { code: '04', label: 'Ulasan & Cair' }
]

const scenarioOptions: Array<{ key: ScenarioKey; label: string }> = [
  { key: '1on1', label: '1-on-1 (1:1)' },
  { key: 'group', label: 'Grup (Cap 2)' },
  { key: 'refund', label: 'Refund 100%' }
]

const displayMentor = computed(() => ({
  title: props.mentor?.title || 'Bedah CV & Portofolio UI/UX untuk Magang',
  category: props.mentor?.category || 'Desain & UI/UX',
  tutorName: props.mentor?.tutorName || 'Nadhira Putri',
  tutorMeta: props.mentor?.tutorMeta || 'DKV · Kampus Terverifikasi',
  isVerifiedUksw: props.mentor?.isVerifiedUksw ?? true,
  isVerifiedMentor: props.mentor?.isVerifiedMentor ?? true,
  slotBadge: props.mentor?.slotBadge || '30m · 1-on-1 · Online',
  reviewComment:
    props.mentor?.latestReview?.comment ||
    'Masukannya konkret dan langsung bisa dipakai untuk perbaikan portofolio.',
  reviewerName: props.mentor?.latestReview?.reviewerName || 'Bima Santoso',
  reviewRating: props.mentor?.latestReview?.rating || 5
}))

const telemetry = computed(() => {
  if (activeScenario.value === 'group') {
    const map = [
      { learner: '2 Kredit', escrow: '0 Terkunci', tutor: '+0K', status: 'Kuorum 3 Peserta' },
      { learner: '1 / Orang', escrow: '3 Terkunci', tutor: '+0K', status: 'Escrow 3K Aktif' },
      { learner: '1 / Orang', escrow: '3 Terkunci', tutor: '+0K', status: 'Check-in Per Peserta' },
      { learner: '1 / Orang', escrow: '0 Terkunci', tutor: '+2K (Cap)', status: 'Cair Maks +2 Kredit' }
    ]
    return map[activeStep.value] || map[0]!
  }
  if (activeScenario.value === 'refund') {
    const map = [
      { learner: '2 Kredit', escrow: '0 Terkunci', tutor: '+0K', status: 'Sesi Terjadwal' },
      { learner: '1 Kredit', escrow: '1 Terkunci', tutor: '+0K', status: 'Escrow Terkunci' },
      { learner: '1 Kredit', escrow: '1 Terkunci', tutor: 'Jeda 1-7h', status: 'Tutor No-Show T+15m' },
      { learner: '2 Kredit', escrow: '0 Terkunci', tutor: '+0K', status: 'Refund 100% Otomatis' }
    ]
    return map[activeStep.value] || map[0]!
  }
  const map = [
    { learner: '2 Kredit', escrow: '0 Terkunci', tutor: '+0K', status: 'Siap Booking' },
    { learner: '1 Kredit', escrow: '1 Terkunci', tutor: '+0K', status: 'Escrow Terkunci' },
    { learner: '1 Kredit', escrow: '1 Terkunci', tutor: '+0K', status: 'Kode QR Aktif' },
    { learner: '1 Kredit', escrow: '0 Terkunci', tutor: '+1K', status: 'Ulasan Terbuka & Cair' }
  ]
  return map[activeStep.value] || map[0]!
})

const progressPercent = computed(() => ((activeStep.value + 1) / stepTabs.length) * 100)
const isAlertStep = computed(() => activeScenario.value === 'refund' && activeStep.value === 2)

function stopPlayback() {
  isPlaying.value = false
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function startPlayback(reset = false) {
  stopPlayback()
  if (reset) activeStep.value = 0
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  isPlaying.value = true
  timerId = setInterval(() => {
    if (activeStep.value < stepTabs.length - 1) {
      activeStep.value += 1
    } else {
      stopPlayback()
    }
  }, 2600)
}

function selectScenario(key: ScenarioKey) {
  activeScenario.value = key
  demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
  startPlayback(true)
}

function selectStep(idx: number) {
  stopPlayback()
  if (idx === 2) {
    demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
  }
  activeStep.value = idx
}

function advanceStep() {
  stopPlayback()
  if (activeStep.value < stepTabs.length - 1) {
    activeStep.value += 1
    if (activeStep.value === 2) {
      demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
    }
  } else {
    activeStep.value = 0
  }
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback(activeStep.value >= stepTabs.length - 1)
  }
}

onUnmounted(() => {
  stopPlayback()
})
</script>

<template>
  <div class="bg-white border-2 border-blue-600 rounded-2xl overflow-hidden shadow-xs">
    <!-- App-Window Chrome Bar -->
    <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1" aria-hidden="true">
          <span class="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white" />
          <span class="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white" />
          <span class="w-2.5 h-2.5 rounded-full border border-blue-600 bg-blue-600" />
        </span>
        <span class="font-mono text-[11px] font-semibold text-slate-600">
          skillbarter.app/workspace
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Pilih skenario">
          <button
            v-for="sc in scenarioOptions"
            :key="sc.key"
            type="button"
            :aria-pressed="activeScenario === sc.key"
            :class="[
              'px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap',
              activeScenario === sc.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-blue-700'
            ]"
            @click="selectScenario(sc.key)"
          >
            {{ sc.label }}
          </button>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-blue-600 text-[11px] font-semibold text-blue-700 min-h-[30px]"
          :aria-label="isPlaying ? 'Jeda simulasi' : 'Putar simulasi'"
          @click="togglePlay"
        >
          <UIcon :name="isPlaying ? 'i-ph-pause' : 'i-ph-play'" class="w-3 h-3" aria-hidden="true" />
          <span class="hidden sm:inline">{{ isPlaying ? 'Jeda' : 'Putar' }}</span>
        </button>
      </div>
    </div>

    <!-- Stepper Navigation + Progress Rail -->
    <div class="border-b border-slate-200 bg-white">
      <div class="grid grid-cols-4 divide-x divide-slate-200" role="tablist" aria-label="Alur Kerja SkillBarter">
        <button
          v-for="(tab, idx) in stepTabs"
          :key="tab.code"
          type="button"
          role="tab"
          :aria-selected="activeStep === idx"
          :class="[
            'px-2.5 py-2.5 text-left transition-colors min-h-[48px]',
            activeStep === idx
              ? 'bg-blue-50/80 text-blue-700 font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          ]"
          @click="selectStep(idx)"
        >
          <span class="font-mono text-[10px] block text-slate-500">{{ tab.code }}</span>
          <span class="text-[11px] sm:text-xs block leading-tight truncate">{{ tab.label }}</span>
        </button>
      </div>
      <div class="h-1 w-full bg-slate-100">
        <div
          :class="[
            'h-full transition-[width] duration-300 ease-out',
            isAlertStep ? 'bg-rose-600' : 'bg-blue-600'
          ]"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Interactive Stage Body -->
    <div class="p-4 sm:p-5 space-y-4">
      <Transition name="panel-slide" mode="out-in">
        <!-- STEP 0: Pick Real Mentor -->
        <div v-if="activeStep === 0" key="stage-0" class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Langkah 01 · Pilih Micro-Session
            </span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
              {{ displayMentor.slotBadge }}
            </span>
          </div>

          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <p class="text-xs font-semibold text-blue-700">{{ displayMentor.category }}</p>
            <h3 class="text-base font-bold text-slate-900 leading-snug">
              {{ displayMentor.title }}
            </h3>
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="font-semibold text-slate-800">{{ displayMentor.tutorName }}</span>
              <VerifiedUkswBadge v-if="displayMentor.isVerifiedUksw" />
              <span
                v-if="displayMentor.isVerifiedMentor"
                class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-600 px-1.5 py-0.5 rounded"
              >
                <UIcon name="i-ph-seal-check-duotone" class="w-3 h-3" aria-hidden="true" />
                Verified Mentor
              </span>
            </div>
          </div>

          <button
            type="button"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[44px] transition-colors"
            @click="advanceStep"
          >
            <span>Coba: Kunci {{ activeScenario === 'group' ? '3 Kredit (Grup)' : '1 Kredit' }} di Escrow</span>
            <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- STEP 1: Escrow Locked -->
        <div v-else-if="activeStep === 1" key="stage-1" class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Langkah 02 · Brankas Escrow Aktif
            </span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
              Transaksi Atomik
            </span>
          </div>

          <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UIcon name="i-ph-lock-simple-duotone" class="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
              <span>
                {{
                  activeScenario === 'group'
                    ? '3 Kredit Pembelajar Terkunci (Kuorum >= 2 Terpenuhi)'
                    : '1 Kredit Aman di Brankas Escrow'
                }}
              </span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Ruang chat sesi terbuka otomatis. Batal &ge; 12 jam sebelum jadwal mengembalikan kredit 100% tanpa penalti.
            </p>
          </div>

          <button
            type="button"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[44px] transition-colors"
            @click="advanceStep"
          >
            <span>{{ activeScenario === 'refund' ? 'Simulasi: Tutor Tidak Hadir (T+15m)' : 'Lanjut: Buat Kode Check-in QR 6-Digit' }}</span>
            <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- STEP 2: QR Check-in OR No-Show Alert -->
        <div v-else-if="activeStep === 2" key="stage-2" class="space-y-4">
          <template v-if="activeScenario === 'refund'">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                Langkah 03 · Lazy-Check T+15 Menit
              </span>
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700">
                Cooldown 1-7 Hari
              </span>
            </div>
            <div class="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-1.5">
              <p class="text-sm font-bold text-rose-700">Tutor No-Show Terdeteksi Otomatis</p>
              <p class="text-xs text-slate-700 leading-relaxed">
                Kode check-in tidak dibuat hingga 15 menit setelah mulai. Tutor dikenai cooldown bertingkat 1, 3, hingga 7 hari (bukan saldo minus).
              </p>
            </div>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold min-h-[44px] transition-colors"
              @click="advanceStep"
            >
              <span>Lanjut: Refund 100% ke Pembelajar</span>
              <UIcon name="i-ph-arrow-right" class="w-4 h-4" aria-hidden="true" />
            </button>
          </template>

          <template v-else>
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                Langkah 03 · Verifikasi Kehadiran (T-10m s.d. T+15m)
              </span>
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                Attendance-Gated
              </span>
            </div>

            <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-4">
              <div class="space-y-1">
                <p class="text-xs font-semibold text-blue-700">Kode Check-in 6-Digit Pengajar</p>
                <p class="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-slate-900 tabular-nums">
                  {{ demoCode }}
                </p>
              </div>
              <svg width="54" height="54" viewBox="0 0 56 56" fill="none" aria-hidden="true" class="shrink-0 bg-white p-1.5 rounded-lg border border-blue-200">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#2563EB" stroke-width="3" />
                <rect x="9" y="9" width="6" height="6" fill="#2563EB" />
                <rect x="36" y="4" width="16" height="16" rx="2" stroke="#2563EB" stroke-width="3" />
                <rect x="41" y="9" width="6" height="6" fill="#2563EB" />
                <rect x="4" y="36" width="16" height="16" rx="2" stroke="#2563EB" stroke-width="3" />
                <rect x="9" y="41" width="6" height="6" fill="#2563EB" />
                <rect x="26" y="26" width="6" height="6" fill="#0F172A" />
                <rect x="36" y="28" width="6" height="6" fill="#0F172A" />
                <rect x="28" y="38" width="10" height="6" fill="#0F172A" />
                <rect x="44" y="40" width="8" height="12" fill="#2563EB" />
              </svg>
            </div>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-600 bg-white hover:bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold min-h-[44px] transition-colors"
              @click="advanceStep"
            >
              <UIcon name="i-ph-check-circle" class="w-4 h-4" aria-hidden="true" />
              <span>Simulasi Pembelajar: Validasi Check-in &amp; Buka Ulasan</span>
            </button>
          </template>
        </div>

        <!-- STEP 3: Verified Review Unlocked & Payout -->
        <div v-else key="stage-3" class="space-y-4 verified-reveal">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Langkah 04 · {{ activeScenario === 'refund' ? 'Escrow Dikembalikan' : 'Ulasan Terverifikasi & Cair' }}
            </span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-600 bg-white text-blue-700">
              {{ telemetry.status }}
            </span>
          </div>

          <div v-if="activeScenario === 'refund'" class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
            <p class="text-sm font-bold text-slate-900">1 Kredit Kembali 100% ke Dompet Pembelajar</p>
            <p class="text-xs text-slate-600 leading-relaxed">
              Mutasi refund tercatat otomatis di ledger atomik tanpa perlu menghubungi admin secara manual.
            </p>
          </div>
          <blockquote v-else class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="inline-flex items-center gap-1 font-semibold text-blue-700">
                <UIcon name="i-ph-seal-check-duotone" class="w-4 h-4" aria-hidden="true" />
                Verified Attendance · {{ displayMentor.reviewRating }}/5
              </span>
              <span class="font-mono font-bold text-blue-700">
                {{ activeScenario === 'group' ? 'Cap +2 Kredit' : 'Cair +1 Kredit' }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-800 leading-relaxed">
              "{{ displayMentor.reviewComment }}"
            </p>
            <footer class="text-[11px] text-slate-500">Oleh {{ displayMentor.reviewerName }}</footer>
          </blockquote>

          <button
            type="button"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-blue-600 hover:text-blue-700 text-slate-700 text-xs sm:text-sm font-semibold min-h-[42px] transition-colors"
            @click="advanceStep"
          >
            <UIcon name="i-ph-arrow-counter-clockwise" class="w-4 h-4" aria-hidden="true" />
            <span>Ulangi Simulasi dari Awal</span>
          </button>
        </div>
      </Transition>

      <!-- Live Telemetry Ledger Footer -->
      <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 tabular-nums">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p class="text-[10px] font-mono uppercase text-slate-500">Pembelajar</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-slate-900 mt-0.5">{{ telemetry.learner }}</p>
        </div>
        <div class="p-2.5 rounded-lg bg-white border border-blue-200 text-center">
          <p class="text-[10px] font-mono uppercase text-blue-700">Escrow</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-blue-700 mt-0.5">{{ telemetry.escrow }}</p>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-center">
          <p class="text-[10px] font-mono uppercase text-blue-700">Pengajar</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-blue-700 mt-0.5">{{ telemetry.tutor }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
