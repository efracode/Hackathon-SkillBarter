<script setup lang="ts">
type ScenarioKey = '1on1' | 'group' | 'refund'

interface SimStep {
  code: string
  shortLabel: string
  title: string
  detail: string
  badge: string
  badgeTone: 'indigo' | 'amber' | 'teal' | 'rose'
  learnerBalance: string
  escrowBalance: string
  tutorDelta: string
  tokenCoord: { x: number; y: number }
  ringPercent: number
  coreIcon: 'lock' | 'clock' | 'qr' | 'check' | 'alert'
  activeArc: 'left' | 'right' | 'refund' | 'none'
  tokenLabel: string
}

const scenarios: Record<
  ScenarioKey,
  {
    label: string
    steps: SimStep[]
  }
> = {
  '1on1': {
    label: '1-on-1 (1:1)',
    steps: [
      {
        code: '01',
        shortLabel: 'Booking',
        title: '1 Kredit dikunci di Brankas Escrow',
        detail:
          'Pembelajar memesan micro-session 30 menit. 1 kredit langsung berpindah ke escrow agar pengajar yakin pemesan serius.',
        badge: 'Escrow Terkunci',
        badgeTone: 'amber',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 25,
        coreIcon: 'lock',
        activeArc: 'left',
        tokenLabel: '1K'
      },
      {
        code: '02',
        shortLabel: 'Sesi 30m',
        title: 'Micro-session berlangsung sesuai template',
        detail:
          'Sesi tanya-jawab atau review tugas 30 menit berjalan lewat Meet atau tatap muka kampus tanpa materi kuliah berat.',
        badge: 'Sesi Berlangsung',
        badgeTone: 'indigo',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 50,
        coreIcon: 'clock',
        activeArc: 'none',
        tokenLabel: '30m'
      },
      {
        code: '03',
        shortLabel: 'Check-in',
        title: 'Kehadiran dicatat via Kode 6-Digit / QR',
        detail:
          'Pengajar memunculkan kode QR di workspace. Pembelajar memindai untuk membuka form ulasan terverifikasi.',
        badge: 'Hadir Terverifikasi',
        badgeTone: 'teal',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 75,
        coreIcon: 'qr',
        activeArc: 'none',
        tokenLabel: 'QR'
      },
      {
        code: '04',
        shortLabel: 'Selesai',
        title: 'Ulasan terbit & 1 Kredit cair ke Pengajar',
        detail:
          'Setelah jeda sengketa 24 jam tanpa laporan masalah, 1 kredit dilepas dari escrow ke saldo pengajar.',
        badge: 'Cair +1 Kredit',
        badgeTone: 'teal',
        learnerBalance: '1 Kredit',
        escrowBalance: '0 Terkunci',
        tutorDelta: '+1 Kredit',
        tokenCoord: { x: 390, y: 80 },
        ringPercent: 100,
        coreIcon: 'check',
        activeArc: 'right',
        tokenLabel: '+1K'
      }
    ]
  },
  group: {
    label: 'Grup (Cap 2)',
    steps: [
      {
        code: '01',
        shortLabel: 'Kuorum',
        title: '3 Pembelajar mengunci masing-masing 1 Kredit',
        detail:
          'Sesi grup 60 menit butuh kuorum minimal 2 peserta pada T-2 jam. 3 kredit dikunci di brankas escrow.',
        badge: '3 Peserta (Kuorum OK)',
        badgeTone: 'amber',
        learnerBalance: '1 / Orang',
        escrowBalance: '3 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 25,
        coreIcon: 'lock',
        activeArc: 'left',
        tokenLabel: '3K'
      },
      {
        code: '02',
        shortLabel: 'Sesi 60m',
        title: 'Diskusi kelompok berjalan dalam satu workspace',
        detail:
          'Ruang chat grup dan tautan Meet terikat otomatis ke sesi. Semua peserta berkoordinasi di satu tempat.',
        badge: 'Grup Berlangsung',
        badgeTone: 'indigo',
        learnerBalance: '1 / Orang',
        escrowBalance: '3 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 50,
        coreIcon: 'clock',
        activeArc: 'none',
        tokenLabel: '60m'
      },
      {
        code: '03',
        shortLabel: 'Check-in',
        title: 'Check-in & sengketa dilacak per peserta',
        detail:
          'Setiap peserta memindai QR yang sama, namun ulasan dan laporan sengketa tercatat per booking.',
        badge: 'Per Booking',
        badgeTone: 'teal',
        learnerBalance: '1 / Orang',
        escrowBalance: '3 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 75,
        coreIcon: 'qr',
        activeArc: 'none',
        tokenLabel: 'QR'
      },
      {
        code: '04',
        shortLabel: 'Cap +2K',
        title: 'Pengajar menerima flat maksimal 2 Kredit',
        detail:
          'Walaupun 3 peserta bergabung, pendapatan pengajar dibatasi maksimal 2 kredit agar bebas inflasi.',
        badge: 'Cair Maks +2K',
        badgeTone: 'teal',
        learnerBalance: '1 / Orang',
        escrowBalance: '0 Terkunci',
        tutorDelta: '+2 Kredit',
        tokenCoord: { x: 390, y: 80 },
        ringPercent: 100,
        coreIcon: 'check',
        activeArc: 'right',
        tokenLabel: '+2K'
      }
    ]
  },
  refund: {
    label: 'Refund 100%',
    steps: [
      {
        code: '01',
        shortLabel: 'Booking',
        title: '1 Kredit aman selama menunggu sesi',
        detail:
          'Pembelajar membooking slot atau masuk Hold Queue 48 jam. Kredit tidak pernah hangus sepihak.',
        badge: 'Escrow Terkunci',
        badgeTone: 'amber',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 25,
        coreIcon: 'lock',
        activeArc: 'left',
        tokenLabel: '1K'
      },
      {
        code: '02',
        shortLabel: 'T+15m',
        title: 'Pengajar tidak hadir & kode tidak dibuat',
        detail:
          'Melewati 15 menit dari jadwal tanpa kode check-in, lazy-check mendeteksi Tutor No-Show otomatis.',
        badge: 'No-Show Terdeteksi',
        badgeTone: 'rose',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 50,
        coreIcon: 'alert',
        activeArc: 'none',
        tokenLabel: '!'
      },
      {
        code: '03',
        shortLabel: 'Cooldown',
        title: 'Penalti Cooldown 1-7 Hari untuk Pengajar',
        detail:
          'Alih-alih saldo minus yang bisa dieksploitasi, pengajar dikenai jeda mengajar 1, 3, hingga 7 hari.',
        badge: 'Cooldown Aktif',
        badgeTone: 'rose',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: 'Jeda 1-7h',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 75,
        coreIcon: 'alert',
        activeArc: 'none',
        tokenLabel: 'Jeda'
      },
      {
        code: '04',
        shortLabel: 'Refund',
        title: '1 Kredit kembali 100% ke Pembelajar',
        detail:
          'Escrow dilepas balik ke dompet pembelajar beserta catatan transparan di ledger transaksi.',
        badge: 'Refund +1 Kredit',
        badgeTone: 'teal',
        learnerBalance: '2 Kredit',
        escrowBalance: '0 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 70, y: 80 },
        ringPercent: 100,
        coreIcon: 'check',
        activeArc: 'refund',
        tokenLabel: '+1K'
      }
    ]
  }
}

const activeScenario = ref<ScenarioKey>('1on1')
const activeStep = ref(0)
const isPlaying = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null

const currentScenario = computed(() => scenarios[activeScenario.value as ScenarioKey])
const currentStep = computed(
  () => currentScenario.value.steps[activeStep.value] || currentScenario.value.steps[0]!
)

const RING_RADIUS = 50
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const ringDashOffset = computed(
  () => RING_CIRCUMFERENCE * (1 - currentStep.value.ringPercent / 100)
)

const ringStrokeColor = computed(() => {
  if (currentStep.value.badgeTone === 'rose') return '#E11D48'
  return '#2563EB'
})

const badgeClasses = computed(() => {
  if (currentStep.value.badgeTone === 'rose') {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return 'bg-blue-50 text-blue-700 border-blue-200'
})

function stopPlayback() {
  isPlaying.value = false
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function startCycle(fromStart = false) {
  stopPlayback()
  if (fromStart) {
    activeStep.value = 0
  }
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    activeStep.value = currentScenario.value.steps.length - 1
    return
  }
  isPlaying.value = true
  timerId = setInterval(() => {
    if (activeStep.value < currentScenario.value.steps.length - 1) {
      activeStep.value += 1
    } else {
      stopPlayback()
    }
  }, 2200)
}

function selectScenario(key: ScenarioKey) {
  activeScenario.value = key
  startCycle(true)
}

function selectStep(idx: number) {
  stopPlayback()
  activeStep.value = idx
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    const atEnd = activeStep.value >= currentScenario.value.steps.length - 1
    startCycle(atEnd)
  }
}

onMounted(() => {
  startCycle(true)
})

onUnmounted(() => {
  stopPlayback()
})
</script>

<template>
  <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
    <!-- Top Header & Controls -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
          Simulasi Langsung Ekonomi Kredit
        </p>
        <h2 class="text-base sm:text-lg font-bold text-slate-900">
          Alur Escrow &amp; Verifikasi Sesi
        </h2>
      </div>

      <div class="flex items-center gap-2">
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-md border', badgeClasses]">
          {{ currentStep.badge }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:border-blue-600 text-xs font-semibold text-blue-700 min-h-[36px] transition-colors"
          :aria-label="isPlaying ? 'Jeda simulasi otomatis' : 'Putar ulang simulasi'"
          @click="togglePlay"
        >
          <UIcon
            :name="isPlaying ? 'i-ph-pause' : 'i-ph-play'"
            class="w-3.5 h-3.5 text-blue-600"
            aria-hidden="true"
          />
          <span>{{ isPlaying ? 'Jeda' : 'Putar' }}</span>
        </button>
      </div>
    </div>

    <!-- Scenario Switcher -->
    <div class="flex flex-wrap gap-2" role="group" aria-label="Pilih skenario ekonomi kredit">
      <button
        v-for="(sc, key) in scenarios"
        :key="key"
        type="button"
        :aria-pressed="activeScenario === key"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
          activeScenario === key
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
        ]"
        @click="selectScenario(key)"
      >
        {{ sc.label }}
      </button>
    </div>

    <!-- Sculptural Exchange Ring SVG + Clean HTML Telemetry Strip -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3 overflow-hidden">
      <svg
        viewBox="0 0 460 198"
        class="w-full h-auto block"
        role="img"
        aria-label="Orbital diagram alur escrow kredit antara Pembelajar, Brankas Escrow, dan Pengajar"
      >
        <!-- Curved Guide Arcs -->
        <path
          d="M 96 112 Q 140 52 178 88"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="2.5"
          stroke-dasharray="5 5"
        />
        <path
          d="M 282 88 Q 320 52 364 112"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="2.5"
          stroke-dasharray="5 5"
        />
        <path
          d="M 184 136 Q 140 178 92 142"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="2"
          stroke-dasharray="4 5"
        />

        <!-- Active Animated Curved Flow Arc -->
        <path
          v-if="currentStep.activeArc === 'left'"
          d="M 96 112 Q 140 52 178 88"
          fill="none"
          stroke="#2563EB"
          stroke-width="3"
          stroke-dasharray="6 6"
          class="flow-rail-forward"
        />
        <path
          v-if="currentStep.activeArc === 'right'"
          d="M 282 88 Q 320 52 364 112"
          fill="none"
          stroke="#2563EB"
          stroke-width="3"
          stroke-dasharray="6 6"
          class="flow-rail-forward"
        />
        <path
          v-if="currentStep.activeArc === 'refund'"
          d="M 184 136 Q 140 178 92 142"
          fill="none"
          stroke="#2563EB"
          stroke-width="3"
          stroke-dasharray="6 6"
          class="flow-rail-forward"
        />

        <!-- Left Node: Pembelajar Emblem -->
        <g transform="translate(70, 124)">
          <circle
            cx="0"
            cy="0"
            r="28"
            :fill="currentStep.activeArc === 'refund' ? '#EFF6FF' : '#FFFFFF'"
            :stroke="currentStep.activeArc === 'refund' ? '#2563EB' : '#CBD5E1'"
            stroke-width="2"
          />
          <circle cx="0" cy="-6" r="7" fill="none" stroke="#334155" stroke-width="2" />
          <path d="M -12 13 C -12 6 12 6 12 13" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Center Node: Sculptural Escrow Progress Vault -->
        <g transform="translate(230, 108)">
          <!-- Outer Progress Track -->
          <circle cx="0" cy="0" r="50" fill="none" stroke="#E2E8F0" stroke-width="5" />
          <!-- Animated Progress Ring -->
          <circle
            cx="0"
            cy="0"
            r="50"
            fill="none"
            :stroke="ringStrokeColor"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringDashOffset"
            transform="rotate(-90)"
            style="transition: stroke-dashoffset 480ms cubic-bezier(0.22, 1, 0.36, 1), stroke 250ms ease"
          />
          <!-- Primary Stroke Vault Core -->
          <circle
            cx="0"
            cy="0"
            r="39"
            :fill="currentStep.coreIcon === 'alert' ? '#FFF1F2' : '#EFF6FF'"
            :stroke="currentStep.coreIcon === 'alert' ? '#E11D48' : '#2563EB'"
            stroke-width="2"
            style="transition: fill 250ms ease, stroke 250ms ease"
          />

          <!-- Crisp Vector Icon Inside Vault -->
          <g v-if="currentStep.coreIcon === 'lock'">
            <rect x="-11" y="-2" width="22" height="16" rx="4" fill="none" stroke="#2563EB" stroke-width="2.4" />
            <path d="M -6 -2 V -7 A 6 6 0 0 1 6 -7 V -2" fill="none" stroke="#2563EB" stroke-width="2.4" />
            <circle cx="0" cy="6" r="2" fill="#2563EB" />
          </g>
          <g v-else-if="currentStep.coreIcon === 'clock'">
            <circle cx="0" cy="0" r="14" fill="none" stroke="#2563EB" stroke-width="2.4" />
            <path d="M 0 -7 V 1 L 6 4" fill="none" stroke="#2563EB" stroke-width="2.4" stroke-linecap="round" />
          </g>
          <g v-else-if="currentStep.coreIcon === 'qr'">
            <rect x="-12" y="-12" width="9" height="9" rx="1.5" fill="none" stroke="#2563EB" stroke-width="2.2" />
            <rect x="3" y="-12" width="9" height="9" rx="1.5" fill="none" stroke="#2563EB" stroke-width="2.2" />
            <rect x="-12" y="3" width="9" height="9" rx="1.5" fill="none" stroke="#2563EB" stroke-width="2.2" />
            <rect x="4" y="4" width="7" height="7" rx="1" fill="#2563EB" />
          </g>
          <g v-else-if="currentStep.coreIcon === 'alert'">
            <path d="M 0 -13 L 13 10 H -13 Z" fill="none" stroke="#E11D48" stroke-width="2.4" stroke-linejoin="round" />
            <line x1="0" y1="-5" x2="0" y2="2" stroke="#E11D48" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="0" cy="6" r="1.5" fill="#E11D48" />
          </g>
          <g v-else>
            <circle cx="0" cy="0" r="15" fill="none" stroke="#2563EB" stroke-width="2.2" />
            <path d="M -7 0 L -2 5 L 8 -5" fill="none" stroke="#2563EB" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          </g>
        </g>

        <!-- Right Node: Pengajar Emblem -->
        <g transform="translate(390, 124)">
          <circle
            cx="0"
            cy="0"
            r="28"
            :fill="currentStep.activeArc === 'right' ? '#EFF6FF' : '#FFFFFF'"
            :stroke="currentStep.activeArc === 'right' ? '#2563EB' : '#CBD5E1'"
            stroke-width="2"
          />
          <rect x="-12" y="-10" width="24" height="16" rx="3" fill="none" stroke="#334155" stroke-width="2" />
          <path d="M -5 12 L 0 6 L 5 12" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- Moving Credit Coin -->
        <g
          :style="{
            transform: `translate(${currentStep.tokenCoord.x}px, ${currentStep.tokenCoord.y}px)`,
            transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)'
          }"
        >
          <rect
            x="-23"
            y="-13"
            width="46"
            height="26"
            rx="13"
            :fill="currentStep.badgeTone === 'rose' ? '#E11D48' : '#2563EB'"
          />
          <text
            x="0"
            y="4"
            text-anchor="middle"
            class="fill-white text-[11px] font-bold font-mono"
          >
            {{ currentStep.tokenLabel }}
          </text>
        </g>
      </svg>

      <!-- Clean HTML Telemetry Readout (Never Clips) -->
      <div class="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 tabular-nums">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p class="text-[11px] font-medium text-slate-600">Pembelajar</p>
          <p class="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
            {{ currentStep.learnerBalance }}
          </p>
        </div>
        <div class="p-2.5 rounded-lg bg-white border border-blue-200 text-center">
          <p class="text-[11px] font-medium text-blue-700">Brankas Escrow</p>
          <p class="text-sm sm:text-base font-bold font-mono text-blue-700 mt-0.5">
            {{ currentStep.escrowBalance }}
          </p>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-center">
          <p class="text-[11px] font-medium text-blue-700">Pengajar</p>
          <p class="text-sm sm:text-base font-bold font-mono text-blue-700 mt-0.5">
            {{ currentStep.tutorDelta }}
          </p>
        </div>
      </div>
    </div>

    <!-- Step Selector Pills -->
    <div
      class="grid grid-cols-2 sm:grid-cols-4 gap-2"
      role="tablist"
      aria-label="Tahapan Simulasi Kredit"
    >
      <button
        v-for="(step, idx) in currentScenario.steps"
        :key="step.code"
        type="button"
        role="tab"
        :aria-selected="activeStep === idx"
        :class="[
          'text-left px-3 py-2 rounded-xl border text-xs transition-colors min-h-[48px]',
          activeStep === idx
            ? 'bg-blue-600 border-blue-600 text-white font-semibold'
            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700'
        ]"
        @click="selectStep(idx)"
      >
        <span class="font-mono text-[11px] block opacity-80">{{ step.code }}</span>
        <span class="block leading-tight">{{ step.shortLabel }}</span>
      </button>
    </div>

    <!-- Active Step Explanation -->
    <Transition name="panel-slide" mode="out-in">
      <div
        :key="`${activeScenario}-${activeStep}`"
        class="bg-white border border-slate-200 rounded-xl p-4 space-y-1"
      >
        <h3 class="text-sm font-bold text-slate-900">{{ currentStep.title }}</h3>
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {{ currentStep.detail }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.flow-rail-forward {
  animation: rail-dash 0.9s linear infinite;
}

@keyframes rail-dash {
  to {
    stroke-dashoffset: -24;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-rail-forward {
    animation: none;
  }
}
</style>
