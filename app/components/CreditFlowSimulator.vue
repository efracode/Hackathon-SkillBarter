<script setup lang="ts">
type ScenarioKey = '1on1' | 'group' | 'refund'

interface SimStep {
  code: string
  shortLabel: string
  title: string
  detail: string
  badge: string
  badgeTone: 'cobalt' | 'amber' | 'emerald' | 'rose'
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
        badgeTone: 'cobalt',
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
        badgeTone: 'emerald',
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
        badgeTone: 'emerald',
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
        badgeTone: 'cobalt',
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
        badgeTone: 'emerald',
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
        shortLabel: 'Cap 2 Kredit',
        title: 'Pengajar menerima maksimal flat 2 Kredit',
        detail:
          'Meski diikuti 3–5 peserta, pendapatan pengajar dibatasi maksimal 2 kredit untuk mencegah inflasi kredit.',
        badge: 'Cair +2 Kredit (Cap)',
        badgeTone: 'emerald',
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
        title: '1 Kredit dikunci saat sesi dijadwalkan',
        detail:
          'Pembelajar memesan slot atau masuk Hold Queue 48 jam. Kredit ditahan aman di escrow.',
        badge: 'Escrow Terkunci',
        badgeTone: 'amber',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: '+0 Kredit',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 33,
        coreIcon: 'lock',
        activeArc: 'left',
        tokenLabel: '1K'
      },
      {
        code: '02',
        shortLabel: 'Kendala',
        title: 'Batal >= 12 jam atau Pengajar No-Show',
        detail:
          'Jika pembelajar batal >= 12 jam sebelum sesi atau pengajar tidak membuka check-in hingga T+15m.',
        badge: 'Proteksi Aktif',
        badgeTone: 'rose',
        learnerBalance: '1 Kredit',
        escrowBalance: '1 Terkunci',
        tutorDelta: 'Cooldown',
        tokenCoord: { x: 230, y: 36 },
        ringPercent: 66,
        coreIcon: 'alert',
        activeArc: 'none',
        tokenLabel: 'T+15m'
      },
      {
        code: '03',
        shortLabel: 'Refund Penuh',
        title: '1 Kredit kembali utuh & Cooldown 1-3-7 hari',
        detail:
          'Kredit pembelajar dikembalikan 100% tanpa potongan. Pengajar No-Show mendapat cooldown bertingkat tanpa saldo minus.',
        badge: 'Refund 100%',
        badgeTone: 'emerald',
        learnerBalance: '2 Kredit',
        escrowBalance: '0 Terkunci',
        tutorDelta: 'Cooldown',
        tokenCoord: { x: 70, y: 80 },
        ringPercent: 100,
        coreIcon: 'check',
        activeArc: 'refund',
        tokenLabel: 'Refund'
      }
    ]
  }
}

const activeScenario = ref<ScenarioKey>('1on1')
const activeStepIdx = ref(0)
const isPlaying = ref(false)
let playTimer: ReturnType<typeof setInterval> | null = null

const currentScenario = computed<{ label: string; steps: SimStep[] }>(
  () => scenarios[activeScenario.value as ScenarioKey]
)
const currentStep = computed<SimStep>(() => currentScenario.value.steps[activeStepIdx.value]!)

const badgeClassMap: Record<SimStep['badgeTone'], string> = {
  cobalt: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  amber: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  emerald: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
  rose: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
}

const currentStepBadgeClass = computed(() => {
  const tone = currentStep.value.badgeTone as SimStep['badgeTone']
  return badgeClassMap[tone]
})

const ringDashOffset = computed(() => {
  const circumference = 2 * Math.PI * 44
  return circumference * (1 - currentStep.value.ringPercent / 100)
})

function selectScenario(key: ScenarioKey) {
  stopAutoPlay()
  activeScenario.value = key
  activeStepIdx.value = 0
}

function selectStep(idx: number) {
  stopAutoPlay()
  activeStepIdx.value = idx
}

function stopAutoPlay() {
  isPlaying.value = false
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

function togglePlay() {
  if (isPlaying.value) {
    stopAutoPlay()
    return
  }
  isPlaying.value = true
  playTimer = setInterval(() => {
    const total = currentScenario.value.steps.length
    activeStepIdx.value = (activeStepIdx.value + 1) % total
  }, 2400)
}

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <div class="bg-[#FAF8F4] border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5">
    <!-- Masthead -->
    <div class="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E5E0D5]">
      <div>
        <p class="text-xs font-semibold text-[#526071]">
          Simulasi Ekonomi Kredit
        </p>
        <h3 class="text-lg font-bold text-[#14181F] mt-0.5">
          Alur Escrow &amp; Verifikasi Sesi
        </h3>
      </div>

      <div class="flex items-center gap-2">
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-[4px] border', currentStepBadgeClass]">
          {{ currentStep.badge }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#94A3B8] bg-white hover:border-[#14181F] text-xs font-semibold text-[#14181F] min-h-[38px] transition-colors"
          @click="togglePlay"
        >
          <UIcon :name="isPlaying ? 'i-ph-pause' : 'i-ph-play'" class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ isPlaying ? 'Jeda' : 'Putar' }}</span>
        </button>
      </div>
    </div>

    <!-- Scenario Switcher -->
    <div class="inline-flex flex-wrap gap-1 p-1 rounded-[6px] bg-[#F3EFE6] border border-[#E5E0D5]" role="tablist" aria-label="Pilih skenario ekonomi kredit">
      <button
        v-for="(item, key) in scenarios"
        :key="key"
        type="button"
        role="tab"
        :aria-selected="activeScenario === key"
        :class="[
          'px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors min-h-[34px]',
          activeScenario === key
            ? 'bg-[#14181F] text-white'
            : 'text-[#475569] hover:text-[#14181F]'
        ]"
        @click="selectScenario(key as ScenarioKey)"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- Editorial Vector Diagram -->
    <div class="bg-white border border-[#E5E0D5] rounded-[6px] p-4">
      <svg viewBox="0 0 460 166" class="w-full h-auto" role="img" aria-label="Diagram alur kredit pembelajar ke escrow dan pengajar">
        <!-- Connection paths -->
        <path
          d="M 116 86 C 142 86, 156 86, 180 86"
          fill="none"
          :stroke="currentStep.activeArc === 'left' ? '#B45309' : currentStep.activeArc === 'refund' ? '#047857' : '#CBD5E1'"
          stroke-width="2"
          stroke-dasharray="4 4"
        />
        <path
          d="M 280 86 C 304 86, 318 86, 344 86"
          fill="none"
          :stroke="currentStep.activeArc === 'right' ? '#047857' : '#CBD5E1'"
          stroke-width="2"
          stroke-dasharray="4 4"
        />

        <!-- Learner Node -->
        <g transform="translate(20, 52)">
          <rect width="96" height="68" rx="6" fill="#FFFFFF" stroke="#D6D3CD" stroke-width="1.5" />
          <text x="48" y="24" text-anchor="middle" fill="#64748B" font-size="10" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">
            Pembelajar
          </text>
          <text x="48" y="46" text-anchor="middle" fill="#14181F" font-size="12" font-weight="700" font-family="JetBrains Mono, monospace">
            {{ currentStep.learnerBalance }}
          </text>
        </g>

        <!-- Center Escrow Vault Node -->
        <g transform="translate(230, 86)">
          <circle r="49" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5" />
          <circle
            r="44"
            fill="none"
            stroke="#F3EFE6"
            stroke-width="5"
          />
          <circle
            r="44"
            fill="none"
            :stroke="currentStep.badgeTone === 'rose' ? '#BE123C' : currentStep.badgeTone === 'emerald' ? '#047857' : currentStep.badgeTone === 'amber' ? '#B45309' : '#1D4ED8'"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="2 * Math.PI * 44"
            :stroke-dashoffset="ringDashOffset"
            transform="rotate(-90)"
            style="transition: stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1)"
          />
          <text y="-6" text-anchor="middle" fill="#64748B" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace">
            ESCROW
          </text>
          <text y="12" text-anchor="middle" fill="#14181F" font-size="10.5" font-weight="700" font-family="JetBrains Mono, monospace">
            {{ currentStep.escrowBalance }}
          </text>
        </g>

        <!-- Tutor Node -->
        <g transform="translate(344, 52)">
          <rect width="96" height="68" rx="6" fill="#FFFFFF" stroke="#D6D3CD" stroke-width="1.5" />
          <text x="48" y="24" text-anchor="middle" fill="#64748B" font-size="10" font-weight="600" font-family="Plus Jakarta Sans, sans-serif">
            Pengajar
          </text>
          <text
            x="48"
            y="46"
            text-anchor="middle"
            :fill="currentStep.tutorDelta.startsWith('+') && currentStep.tutorDelta !== '+0 Kredit' ? '#047857' : currentStep.tutorDelta === 'Cooldown' ? '#BE123C' : '#14181F'"
            font-size="12"
            font-weight="700"
            font-family="JetBrains Mono, monospace"
          >
            {{ currentStep.tutorDelta }}
          </text>
        </g>

        <!-- Moving Token Pill -->
        <g
          :transform="`translate(${currentStep.tokenCoord.x}, ${currentStep.tokenCoord.y})`"
          style="transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1)"
        >
          <rect x="-26" y="-12" width="52" height="24" rx="4" fill="#14181F" />
          <text y="4" text-anchor="middle" fill="#FAF8F4" font-size="10" font-weight="700" font-family="JetBrains Mono, monospace">
            {{ currentStep.tokenLabel }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Step Buttons (Hairline Tabular) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="(step, idx) in currentScenario.steps"
        :key="step.code"
        type="button"
        :class="[
          'text-left p-2.5 rounded-[6px] border transition-colors min-h-[54px]',
          activeStepIdx === idx
            ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#14181F]'
            : 'border-[#E5E0D5] bg-white text-[#475569] hover:border-[#94A3B8]'
        ]"
        @click="selectStep(idx)"
      >
        <p class="font-mono text-[10px] font-bold" :class="activeStepIdx === idx ? 'text-[#1D4ED8]' : 'text-[#526071]'">
          {{ step.code }}
        </p>
        <p class="text-xs font-semibold mt-0.5">{{ step.shortLabel }}</p>
      </button>
    </div>

    <!-- Current Step Narrative -->
    <Transition name="panel-slide" mode="out-in">
      <div :key="`${activeScenario}-${activeStepIdx}`" class="pt-3 border-t border-[#E5E0D5] space-y-1">
        <p class="text-sm font-bold text-[#14181F]">{{ currentStep.title }}</p>
        <p class="text-xs sm:text-sm text-[#475569] leading-relaxed">{{ currentStep.detail }}</p>
      </div>
    </Transition>
  </div>
</template>
