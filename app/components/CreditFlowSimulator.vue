<script setup lang="ts">
type ScenarioKey = '1on1' | 'group' | 'refund'

interface SimStep {
  code: string
  shortLabel: string
  title: string
  detail: string
  badge: string
  badgeTone: 'indigo' | 'amber' | 'teal' | 'rose'
  learnerBalance: number
  escrowBalance: number
  tutorDelta: string
  tokenPosition: 'learner' | 'escrow' | 'tutor' | 'refunded'
  flowPath: 'to-escrow' | 'hold' | 'to-tutor' | 'to-learner'
  tokenLabel: string
}

const scenarios: Record<
  ScenarioKey,
  {
    label: string
    subLabel: string
    steps: SimStep[]
  }
> = {
  '1on1': {
    label: '1-on-1 (1:1)',
    subLabel: 'Pertukaran adil 1 kredit',
    steps: [
      {
        code: '01',
        shortLabel: 'Booking',
        title: '1 Kredit dikunci aman di Brankas Escrow',
        detail:
          'Pembelajar memilih slot micro-session 30 menit. 1 kredit langsung dipindahkan ke escrow agar pengajar yakin pemesan hadir.',
        badge: 'Escrow Terkunci',
        badgeTone: 'amber',
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'to-escrow',
        tokenLabel: '1K'
      },
      {
        code: '02',
        shortLabel: 'Sesi 30m',
        title: 'Micro-session berlangsung sesuai template',
        detail:
          'Sesi tanya-jawab atau review tugas 30 menit berjalan lewat Meet atau tatap muka kampus tanpa perlu materi berat.',
        badge: 'Sesi Berlangsung',
        badgeTone: 'indigo',
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'hold',
        tokenLabel: '1K'
      },
      {
        code: '03',
        shortLabel: 'Check-in',
        title: 'Kehadiran dicatat via Kode 6-Digit / QR',
        detail:
          'Pengajar memunculkan kode QR di workspace. Pembelajar memindai untuk membuka form ulasan terverifikasi.',
        badge: 'Hadir Terverifikasi',
        badgeTone: 'teal',
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'hold',
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
        learnerBalance: 1,
        escrowBalance: 0,
        tutorDelta: '+1',
        tokenPosition: 'tutor',
        flowPath: 'to-tutor',
        tokenLabel: '+1K'
      }
    ]
  },
  group: {
    label: 'Grup (Cap 2)',
    subLabel: 'Anti-inflasi sesi grup',
    steps: [
      {
        code: '01',
        shortLabel: 'Kuorum',
        title: '3 Pembelajar masuk dengan masing-masing 1 Kredit',
        detail:
          'Sesi grup 60 menit butuh kuorum minimal 2 peserta pada T-2 jam. 3 kredit dari peserta dikunci di escrow.',
        badge: '3 Peserta (Kuorum OK)',
        badgeTone: 'amber',
        learnerBalance: 1,
        escrowBalance: 3,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'to-escrow',
        tokenLabel: '3K'
      },
      {
        code: '02',
        shortLabel: 'Sesi 60m',
        title: 'Diskusi kelompok berjalan paralel',
        detail:
          'Ruang chat grup dan tautan Meet terikat ke sesi. Semua peserta berkoordinasi dalam satu workspace.',
        badge: 'Grup Berlangsung',
        badgeTone: 'indigo',
        learnerBalance: 1,
        escrowBalance: 3,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'hold',
        tokenLabel: '3K'
      },
      {
        code: '03',
        shortLabel: 'Check-in',
        title: 'Check-in dilacak per peserta secara independen',
        detail:
          'Setiap peserta memindai kode QR yang sama, namun ulasan dan potensi sengketa tercatat per booking masing-masing.',
        badge: 'Check-in Per Booking',
        badgeTone: 'teal',
        learnerBalance: 1,
        escrowBalance: 3,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'hold',
        tokenLabel: 'QR'
      },
      {
        code: '04',
        shortLabel: 'Cap +2K',
        title: 'Pengajar menerima flat maksimal 2 Kredit',
        detail:
          'Walaupun 3 peserta bergabung, pendapatan pengajar dibatasi maksimal 2 kredit agar tidak terjadi farming kredit.',
        badge: 'Cair Maks +2 Kredit',
        badgeTone: 'teal',
        learnerBalance: 1,
        escrowBalance: 0,
        tutorDelta: '+2',
        tokenPosition: 'tutor',
        flowPath: 'to-tutor',
        tokenLabel: '+2K'
      }
    ]
  },
  refund: {
    label: 'Refund 100%',
    subLabel: 'Proteksi batal & no-show',
    steps: [
      {
        code: '01',
        shortLabel: 'Booking',
        title: '1 Kredit terkunci aman selama menunggu sesi',
        detail:
          'Pembelajar membooking slot atau masuk Hold Queue 48 jam. Saldo pembelajar terlindungi di escrow.',
        badge: 'Escrow Terkunci',
        badgeTone: 'amber',
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'to-escrow',
        tokenLabel: '1K'
      },
      {
        code: '02',
        shortLabel: 'T+15m',
        title: 'Pengajar tidak hadir & kode tidak dibuat',
        detail:
          'Melewati 15 menit dari jadwal tanpa kode check-in, sistem mendeteksi Tutor No-Show secara otomatis.',
        badge: 'No-Show Terdeteksi',
        badgeTone: 'rose',
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '+0',
        tokenPosition: 'escrow',
        flowPath: 'hold',
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
        learnerBalance: 1,
        escrowBalance: 1,
        tutorDelta: '0 (Jeda)',
        tokenPosition: 'escrow',
        flowPath: 'hold',
        tokenLabel: 'Jeda'
      },
      {
        code: '04',
        shortLabel: 'Refund',
        title: '1 Kredit kembali 100% ke saldo Pembelajar',
        detail:
          'Escrow dibatalkan dan 1 kredit langsung dikembalikan penuh ke dompet pembelajar beserta catatan di ledger.',
        badge: 'Refund +1 Kredit',
        badgeTone: 'teal',
        learnerBalance: 2,
        escrowBalance: 0,
        tutorDelta: '+0',
        tokenPosition: 'refunded',
        flowPath: 'to-learner',
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
const currentStep = computed(() => currentScenario.value.steps[activeStep.value] || currentScenario.value.steps[0]!)

const tokenTranslateX = computed(() => {
  switch (currentStep.value.tokenPosition) {
    case 'learner':
    case 'refunded':
      return 58
    case 'escrow':
      return 210
    case 'tutor':
      return 362
  }
})

const badgeClasses = computed(() => {
  switch (currentStep.value.badgeTone) {
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'teal':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
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
  <div class="bg-[#F7F5F0] border border-stone-300 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
    <!-- Top Header & Scenario Switcher -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600">
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
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold text-slate-800 min-h-[36px]"
          :aria-label="isPlaying ? 'Jeda simulasi otomatis' : 'Putar ulang simulasi'"
          @click="togglePlay"
        >
          <UIcon
            :name="isPlaying ? 'i-ph-pause' : 'i-ph-play'"
            class="w-3.5 h-3.5 text-indigo-600"
            aria-hidden="true"
          />
          <span>{{ isPlaying ? 'Jeda' : 'Putar' }}</span>
        </button>
      </div>
    </div>

    <!-- Scenario Pills -->
    <div class="flex flex-wrap gap-2" role="group" aria-label="Pilih skenario ekonomi kredit">
      <button
        v-for="(sc, key) in scenarios"
        :key="key"
        type="button"
        :aria-pressed="activeScenario === key"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
          activeScenario === key
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-stone-300 text-slate-700 hover:bg-stone-100'
        ]"
        @click="selectScenario(key)"
      >
        {{ sc.label }}
      </button>
    </div>

    <!-- Animated SVG Credit Flow Diagram -->
    <div class="bg-white border border-stone-200 rounded-xl p-4 overflow-hidden">
      <svg
        viewBox="0 0 420 128"
        class="w-full h-auto block"
        role="img"
        aria-label="Diagram alur perpindahan token kredit antara Pembelajar, Escrow, dan Pengajar"
      >
        <!-- Connecting Rails -->
        <line
          x1="84"
          y1="54"
          x2="180"
          y2="54"
          stroke="#CBD5E1"
          stroke-width="2.5"
          stroke-dasharray="5 5"
        />
        <line
          x1="240"
          y1="54"
          x2="336"
          y2="54"
          stroke="#CBD5E1"
          stroke-width="2.5"
          stroke-dasharray="5 5"
        />

        <!-- Active Highlighted Path -->
        <line
          v-if="currentStep.flowPath === 'to-escrow' || currentStep.flowPath === 'to-learner'"
          x1="84"
          y1="54"
          x2="180"
          y2="54"
          :stroke="currentStep.flowPath === 'to-learner' ? '#0F766E' : '#B45309'"
          stroke-width="3"
          stroke-dasharray="6 6"
          :class="currentStep.flowPath === 'to-learner' ? 'flow-rail-reverse' : 'flow-rail-forward'"
        />
        <line
          v-if="currentStep.flowPath === 'to-tutor'"
          x1="240"
          y1="54"
          x2="336"
          y2="54"
          stroke="#0F766E"
          stroke-width="3"
          stroke-dasharray="6 6"
          class="flow-rail-forward"
        />

        <!-- Node 1: Pembelajar -->
        <g transform="translate(58, 54)">
          <rect
            x="-38"
            y="-28"
            width="76"
            height="56"
            rx="12"
            :fill="currentStep.tokenPosition === 'refunded' ? '#F0FDFA' : '#F8FAFC'"
            :stroke="currentStep.tokenPosition === 'refunded' ? '#0F766E' : '#CBD5E1'"
            stroke-width="1.5"
          />
          <text
            x="0"
            y="-4"
            text-anchor="middle"
            class="fill-slate-600 text-[10px] font-semibold"
          >
            Pembelajar
          </text>
          <text
            x="0"
            y="16"
            text-anchor="middle"
            class="fill-slate-900 text-[14px] font-bold font-mono"
          >
            {{ currentStep.learnerBalance }} Kredit
          </text>
        </g>

        <!-- Node 2: Escrow Vault -->
        <g transform="translate(210, 54)">
          <rect
            x="-42"
            y="-32"
            width="84"
            height="64"
            rx="14"
            :fill="currentStep.escrowBalance > 0 ? '#FFFBEB' : '#F8FAFC'"
            :stroke="currentStep.escrowBalance > 0 ? '#B45309' : '#CBD5E1'"
            stroke-width="1.75"
          />
          <text
            x="0"
            y="-7"
            text-anchor="middle"
            :class="currentStep.escrowBalance > 0 ? 'fill-amber-700' : 'fill-slate-500'"
            class="text-[10px] font-semibold"
          >
            Brankas Escrow
          </text>
          <text
            x="0"
            y="16"
            text-anchor="middle"
            :class="currentStep.escrowBalance > 0 ? 'fill-amber-800' : 'fill-slate-400'"
            class="text-[15px] font-bold font-mono"
          >
            {{ currentStep.escrowBalance }} Terkunci
          </text>
        </g>

        <!-- Node 3: Pengajar -->
        <g transform="translate(362, 54)">
          <rect
            x="-38"
            y="-28"
            width="76"
            height="56"
            rx="12"
            :fill="currentStep.tokenPosition === 'tutor' ? '#F0FDFA' : '#F8FAFC'"
            :stroke="currentStep.tokenPosition === 'tutor' ? '#0F766E' : '#CBD5E1'"
            stroke-width="1.5"
          />
          <text
            x="0"
            y="-4"
            text-anchor="middle"
            class="fill-slate-600 text-[10px] font-semibold"
          >
            Pengajar
          </text>
          <text
            x="0"
            y="16"
            text-anchor="middle"
            :class="currentStep.tokenPosition === 'tutor' ? 'fill-teal-700' : 'fill-slate-700'"
            class="text-[14px] font-bold font-mono"
          >
            {{ currentStep.tutorDelta }}
          </text>
        </g>

        <!-- Moving Animated Credit Token -->
        <g
          :style="{
            transform: `translate(${tokenTranslateX}px, 108px)`,
            transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)'
          }"
        >
          <rect
            x="-22"
            y="-13"
            width="44"
            height="24"
            rx="12"
            :fill="currentStep.badgeTone === 'rose' ? '#E11D48' : currentStep.tokenPosition === 'tutor' || currentStep.tokenPosition === 'refunded' ? '#0F766E' : '#4F46E5'"
          />
          <text
            x="0"
            y="3"
            text-anchor="middle"
            class="fill-white text-[10px] font-bold font-mono"
          >
            {{ currentStep.tokenLabel }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Step Selector Pills (Zero Truncation) -->
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
            ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
            : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-100'
        ]"
        @click="selectStep(idx)"
      >
        <span class="font-mono text-[11px] block opacity-80">{{ step.code }}</span>
        <span class="block leading-tight">{{ step.shortLabel }}</span>
      </button>
    </div>

    <!-- Active Step Explanation with Smooth Transition -->
    <Transition name="panel-slide" mode="out-in">
      <div
        :key="`${activeScenario}-${activeStep}`"
        class="bg-white border border-stone-200 rounded-xl p-4 space-y-1"
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

.flow-rail-reverse {
  animation: rail-dash-reverse 0.9s linear infinite;
}

@keyframes rail-dash {
  to {
    stroke-dashoffset: -24;
  }
}

@keyframes rail-dash-reverse {
  to {
    stroke-dashoffset: 24;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-rail-forward,
  .flow-rail-reverse {
    animation: none;
  }
}
</style>
