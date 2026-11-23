<script setup lang="ts">
import QRCode from 'qrcode'
import jsQR from 'jsqr'

interface WorkspacePayload {
  roleInSession: 'tutor' | 'learner'
  session: {
    id: string
    mode: string
    durationMinutes: number
    format: string
    locationOrLink: string
    scheduledAt: string
    maxLearners: number
    checkinCode: string | null
    hasCheckinCode: boolean
    status: string
  }
  skill: { id: string; title: string; category: string }
  tutor: {
    id: string
    name: string
    avatarUrl: string | null
    campus: string | null
    major: string | null
  }
  myBooking: {
    id: string
    status: string
    checkedInAt: string | null
    disputeEndsAt: string | null
  } | null
  participants: Array<{
    bookingId: string
    status: string
    checkedInAt: string | null
    learner: { id: string; name: string; avatarUrl: string | null }
  }>
  myReview: { id: string; rating: number; comment: string } | null
  myReport: { id: string; reason: string; status: string } | null
}

interface ChatPayload {
  messages: Array<{
    id: string
    senderId: string
    body: string
    createdAt: string
    senderName: string
    senderAvatar: string | null
  }>
}

const route = useRoute()
const sessionId = String(route.params.id)
const { user: authUser } = useUserSession()

const { data, status, refresh } = useLazyFetch<WorkspacePayload>(`/api/sessions/${sessionId}`)
const { data: chatData, refresh: refreshChat } = useLazyFetch<ChatPayload>(
  `/api/sessions/${sessionId}/messages`
)

const mobilePane = ref<'actions' | 'chat'>('actions')

const qrDataUrl = ref('')
const codeLoading = ref(false)
const codeError = ref('')

const checkinInput = ref('')
const checkinLoading = ref(false)
const checkinError = ref('')

const scannerOpen = ref(false)
const scannerError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let cameraStream: MediaStream | null = null
let scanRafId: number | null = null

const reviewRating = ref(5)
const reviewComment = ref('')
const reviewLoading = ref(false)
const reviewError = ref('')

const reportModalOpen = ref(false)
const reportReason = ref('')
const reportLoading = ref(false)
const reportError = ref('')

const messageInput = ref('')
const sendingMessage = ref(false)

const nowMs = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  nowMs.value = Date.now()
  pollTimer = setInterval(() => {
    refreshChat()
  }, 4000)
  clockTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 10_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (clockTimer) clearInterval(clockTimer)
  pollTimer = null
  clockTimer = null
  stopQrScanner()
})

function stopQrScanner() {
  if (scanRafId !== null) {
    cancelAnimationFrame(scanRafId)
    scanRafId = null
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
  }
}

watch(scannerOpen, (open: boolean) => {
  if (!open) stopQrScanner()
})

async function openQrScanner() {
  scannerError.value = ''
  scannerOpen.value = true
  await nextTick()

  if (!navigator.mediaDevices?.getUserMedia) {
    scannerError.value = 'Browser ini tidak mendukung kamera. Masukkan kode 6 digit secara manual.'
    return
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    if (videoRef.value) {
      videoRef.value.srcObject = cameraStream
      await videoRef.value.play()
      scanRafId = requestAnimationFrame(scanFrame)
    }
  } catch {
    scannerError.value = 'Izin kamera ditolak. Masukkan kode 6 digit secara manual.'
  }
}

function scanFrame() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || !scannerOpen.value) return

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const decoded = jsQR(imageData.data, imageData.width, imageData.height)
      if (decoded?.data) {
        const match = decoded.data.match(/\d{6}/)
        if (match) {
          checkinInput.value = match[0]
          scannerOpen.value = false
          submitCheckin()
          return
        }
      }
    }
  }
  scanRafId = requestAnimationFrame(scanFrame)
}

watch(
  () => data.value?.session?.checkinCode,
  async (code: string | null | undefined) => {
    if (code) {
      qrDataUrl.value = await QRCode.toDataURL(code, { width: 180, margin: 1 })
    }
  },
  { immediate: true }
)

const isInCheckinWindow = computed(() => {
  if (!data.value?.session || nowMs.value === 0) return false
  const start = new Date(data.value.session.scheduledAt).getTime()
  const now = nowMs.value
  return (
    data.value.session.status === 'confirmed' &&
    now >= start - 10 * 60 * 1000 &&
    now <= start + 15 * 60 * 1000
  )
})

const canGenerateCode = isInCheckinWindow

const canReport = computed(() => {
  if (!data.value || data.value.myReport) return false
  if (data.value.roleInSession === 'tutor') {
    return data.value.session.status === 'confirmed'
  }
  return Boolean(
    data.value.myBooking && ['confirmed', 'checked_in'].includes(data.value.myBooking.status)
  )
})

const terminalOrExceptionBanner = computed(() => {
  const bStatus = data.value?.myBooking?.status
  const sStatus = data.value?.session?.status
  if (bStatus === 'disputed') {
    return {
      tone: 'danger' as const,
      label: 'Sengketa Sedang Ditinjau Admin',
      desc: 'Kredit dalam pemesanan ditahan aman hingga admin menetapkan keputusan.'
    }
  }
  if (bStatus === 'tutor_penalized' || sStatus === 'tutor_penalized') {
    return {
      tone: 'danger' as const,
      label: 'Sesi Ditutup (Penalti Tutor No-Show)',
      desc: 'Kredit pembelajar dikembalikan 100% dan pengajar menerima cooldown.'
    }
  }
  if (bStatus === 'forfeited_to_tutor') {
    return {
      tone: 'warning' as const,
      label: 'Kredit Diserahkan ke Pengajar',
      desc: 'Pembatalan terlambat (< 12 jam) atau melewati batas check-in T+15m.'
    }
  }
  if (bStatus === 'cancelled_free' || sStatus === 'cancelled') {
    return {
      tone: 'info' as const,
      label: 'Sesi Dibatalkan (Refund 100%)',
      desc: 'Kredit dalam pemesanan sudah dikembalikan penuh ke pembelajar.'
    }
  }
  return null
})

const timelineStepIndex = computed(() => {
  const s = data.value?.session?.status
  const b = data.value?.myBooking?.status
  if (s === 'completed' || b === 'completed') return 4
  if (b === 'checked_in' || b === 'disputed' || s === 'disputed') return 3
  if (data.value?.session?.hasCheckinCode) return 2
  return 1
})

async function generateCheckinCode() {
  codeLoading.value = true
  codeError.value = ''
  try {
    await $fetch(`/api/sessions/${sessionId}/checkin-code`, { method: 'POST' })
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    codeError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal membuat kode check-in.'
  } finally {
    codeLoading.value = false
  }
}

async function submitCheckin() {
  checkinError.value = ''
  if (!/^\d{6}$/.test(checkinInput.value.trim())) {
    checkinError.value = 'Masukkan 6 digit angka check-in dari pengajar sebelum T+15 menit.'
    return
  }
  checkinLoading.value = true
  try {
    await $fetch(`/api/sessions/${sessionId}/checkin`, {
      method: 'POST',
      body: { code: checkinInput.value.trim() }
    })
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    checkinError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Kode check-in tidak valid.'
  } finally {
    checkinLoading.value = false
  }
}

async function submitReview() {
  reviewError.value = ''
  if (reviewComment.value.trim().length < 5) {
    reviewError.value = 'Tulis ulasan singkat minimal 5 karakter.'
    return
  }
  reviewLoading.value = true
  try {
    await $fetch(`/api/sessions/${sessionId}/reviews`, {
      method: 'POST',
      body: { rating: reviewRating.value, comment: reviewComment.value }
    })
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    reviewError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal mengirim ulasan.'
  } finally {
    reviewLoading.value = false
  }
}

async function submitReport() {
  reportError.value = ''
  if (reportReason.value.trim().length < 5) {
    reportError.value = 'Jelaskan masalah minimal 5 karakter.'
    return
  }
  reportLoading.value = true
  try {
    await $fetch(`/api/sessions/${sessionId}/report`, {
      method: 'POST',
      body: { reason: reportReason.value }
    })
    reportModalOpen.value = false
    reportReason.value = ''
    await refresh()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    reportError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal mengirim laporan.'
  } finally {
    reportLoading.value = false
  }
}

async function sendMessage(e?: KeyboardEvent) {
  if (e?.isComposing) return
  const body = messageInput.value.trim()
  if (!body || sendingMessage.value) return
  sendingMessage.value = true
  try {
    await $fetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { body }
    })
    messageInput.value = ''
    await refreshChat()
  } finally {
    sendingMessage.value = false
  }
}

function splitMessageParts(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part) => ({
    text: part,
    isUrl: /^https?:\/\//.test(part)
  }))
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="status === 'pending'" aria-busy="true" class="space-y-4">
      <div class="h-24 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 h-80 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
        <div class="lg:col-span-7 h-80 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
      </div>
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat ruang sesi"
      description="Pastikan kamu peserta sesi ini lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Coba Lagi
        </UiButton>
      </template>
    </UiAlert>

    <template v-else-if="data">
      <!-- Session Header -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <NuxtLink to="/sessions" class="font-semibold text-[#1D4ED8] hover:underline">
              &lt;- Kembali ke Jadwal &amp; Sesi
            </NuxtLink>
            <span class="text-[#E5E0D5]" aria-hidden="true">|</span>
            <span class="font-semibold text-[#1D4ED8]">{{ data.skill.category }}</span>
          </div>

          <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
            {{ data.skill.title }}
          </h1>

          <p class="text-xs sm:text-sm text-[#475569] tabular-nums break-words">
            {{ formatDateTime(data.session.scheduledAt) }} | {{ data.session.durationMinutes }} menit |
            {{ data.session.mode === 'group' ? 'Grup' : '1-on-1' }}
            {{ data.session.format === 'online' ? 'Online' : 'Tatap Muka' }} |
            <strong class="text-[#14181F]">{{ data.session.locationOrLink }}</strong>
          </p>
        </div>

        <UiBadge tone="primary" icon="i-ph-user" class="shrink-0">
          Peran: {{ data.roleInSession === 'tutor' ? 'Pengajar' : 'Pembelajar' }}
        </UiBadge>
      </div>

      <!-- Terminal / Exception Banner -->
      <UiAlert
        v-if="terminalOrExceptionBanner"
        :tone="terminalOrExceptionBanner.tone"
        :title="terminalOrExceptionBanner.label"
        :description="terminalOrExceptionBanner.desc"
      />

      <!-- Desktop 4-Step Timeline Strip + Mobile Compact Switcher -->
      <section aria-label="Progres Status Sesi">
        <div class="hidden lg:grid grid-cols-4 bg-white border border-[#E5E0D5] rounded-[8px] divide-x divide-[#E5E0D5] overflow-hidden">
          <div
            v-for="step in [
              { idx: 1, code: '01', label: 'Terjadwal', desc: '1 kredit dalam pemesanan' },
              { idx: 2, code: '02', label: 'Check-in Kehadiran', desc: 'Window T-10m s.d. T+15m' },
              { idx: 3, code: '03', label: 'Hadir & Jeda 24j', desc: 'Ulasan terverifikasi terbuka' },
              { idx: 4, code: '04', label: 'Selesai', desc: 'Kredit cair ke pengajar' }
            ]"
            :key="step.idx"
            :class="[
              'p-4 space-y-1',
              timelineStepIndex > step.idx
                ? 'bg-[#ECFDF5]'
                : timelineStepIndex === step.idx
                  ? 'bg-[#EFF6FF]'
                  : 'bg-white'
            ]"
          >
            <p
              class="font-mono text-xs font-bold"
              :class="
                timelineStepIndex > step.idx
                  ? 'text-[#047857]'
                  : timelineStepIndex === step.idx
                    ? 'text-[#1D4ED8]'
                    : 'text-[#526071]'
              "
            >
              {{ step.code }} |
              {{
                timelineStepIndex > step.idx
                  ? 'Selesai'
                  : timelineStepIndex === step.idx
                    ? 'Aktif'
                    : step.idx === 4
                      ? 'Akhir'
                      : 'Berikutnya'
              }}
            </p>
            <p class="text-[13px] font-bold text-[#14181F]">{{ step.label }}</p>
            <p class="text-xs text-[#526071]">{{ step.desc }}</p>
          </div>
        </div>

        <!-- Mobile Stage Bar + Tab Switcher -->
        <div class="lg:hidden space-y-3">
          <div class="flex items-center justify-between px-3.5 py-2.5 rounded-[8px] bg-white border border-[#E5E0D5] text-xs">
            <span class="font-mono font-bold text-[#1D4ED8]">Tahap {{ timelineStepIndex }}/4</span>
            <span class="font-semibold text-[#14181F]">
              {{
                timelineStepIndex === 1
                  ? 'Terjadwal'
                  : timelineStepIndex === 2
                    ? 'Check-in'
                    : timelineStepIndex === 3
                      ? 'Hadir & Jeda 24j'
                      : 'Selesai'
              }}
            </span>
          </div>

          <div class="grid grid-cols-2 p-1 rounded-[6px] bg-[#F3EFE6] border border-[#E5E0D5]" role="tablist" aria-label="Panel Sesi Mobile">
            <button
              type="button"
              role="tab"
              :aria-selected="mobilePane === 'actions'"
              :class="[
                'py-2 rounded-[4px] text-xs font-semibold transition-colors min-h-[40px]',
                mobilePane === 'actions' ? 'bg-[#14181F] text-white' : 'text-[#475569]'
              ]"
              @click="mobilePane = 'actions'"
            >
              Check-in &amp; Aksi
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mobilePane === 'chat'"
              :class="[
                'py-2 rounded-[4px] text-xs font-semibold transition-colors min-h-[40px]',
                mobilePane === 'chat' ? 'bg-[#14181F] text-white' : 'text-[#475569]'
              ]"
              @click="mobilePane = 'chat'"
            >
              Chat Sesi ({{ chatData?.messages?.length || 0 }})
            </button>
          </div>
        </div>
      </section>

      <!-- Split Workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section :class="['min-w-0 lg:col-span-5 space-y-5', mobilePane === 'actions' ? 'block' : 'hidden lg:block']">
          <!-- Tutor Check-in Generator -->
          <div v-if="data.roleInSession === 'tutor'" class="bg-white border border-[#1D4ED8] rounded-[8px] p-5 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-bold text-[#14181F]">Tampilan Pengajar: Kode Check-in &amp; QR</h2>
              <button
                v-if="canReport"
                type="button"
                class="text-xs font-semibold text-[#BE123C] hover:underline shrink-0"
                @click="reportModalOpen = true"
              >
                Laporkan Masalah
              </button>
            </div>

            <UiAlert
              v-if="data.myReport"
              tone="danger"
              title="Laporan sengketa terkirim"
              :description="`Status tinjauan admin: ${data.myReport.status}`"
            />

            <div v-if="data.session.checkinCode" class="p-4 rounded-[8px] bg-[#FAF8F4] border border-[#E5E0D5] flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold text-[#1D4ED8]">Kode Check-in Sesi</p>
                <p class="font-mono text-3xl font-bold tracking-widest text-[#14181F] tabular-nums mt-1">
                  {{ data.session.checkinCode.slice(0, 3) }} {{ data.session.checkinCode.slice(3) }}
                </p>
              </div>
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code Check-in" class="w-20 h-20 rounded-[6px] border border-[#E5E0D5] bg-white p-1 shrink-0" />
            </div>

            <UiAlert v-if="codeError" tone="danger" :title="codeError" />

            <UiButton
              v-if="!data.session.checkinCode"
              variant="primary"
              block
              :loading="codeLoading"
              :disabled="!canGenerateCode"
              @click="generateCheckinCode"
            >
              {{
                codeLoading
                  ? 'Membuat Kode…'
                  : canGenerateCode
                    ? 'Terbitkan Kode Check-in & QR'
                    : 'Window Check-in Terbuka pada T-10m s.d. T+15m'
              }}
            </UiButton>

            <p class="text-xs text-[#047857] leading-relaxed">
              Sesudah Check-in: Form Ulasan Terverifikasi (rating 1–5 + komentar) otomatis terbuka bagi pembelajar.
            </p>

            <div class="pt-3 border-t border-[#E5E0D5] space-y-2">
              <p class="text-xs font-semibold text-[#526071]">
                Daftar Peserta ({{ data.participants.length }})
              </p>
              <ul class="divide-y divide-[#E5E0D5] text-xs">
                <li v-for="p in data.participants" :key="p.bookingId" class="py-2.5 flex items-center justify-between gap-2">
                  <span class="font-semibold text-[#14181F]">{{ p.learner.name }}</span>
                  <UiBadge :tone="p.status === 'checked_in' || p.status === 'completed' ? 'success' : 'warning'">
                    {{ p.status === 'checked_in' ? 'Sudah Check-in' : p.status === 'completed' ? 'Selesai' : p.status }}
                  </UiBadge>
                </li>
              </ul>
            </div>
          </div>

          <!-- Learner Check-in, Review & Report -->
          <div v-else class="space-y-5">
            <div v-if="data.myBooking?.status === 'confirmed'" class="bg-white border border-[#1D4ED8] rounded-[8px] p-5 space-y-4">
              <div class="flex items-start justify-between gap-2">
                <h2 class="text-base font-bold text-[#14181F]">Check-in Kehadiran</h2>
                <UiBadge :tone="isInCheckinWindow ? 'success' : 'neutral'" icon="i-ph-check-circle">
                  {{ isInCheckinWindow ? 'Jendela Aktif' : 'T-10m s.d. T+15m' }}
                </UiBadge>
              </div>

              <p class="text-[13px] text-[#475569] leading-relaxed">
                Masukkan kode 6 digit dari pengajar {{ data.tutor.name }} atau pindai QR lewat kamera untuk membuka ulasan terverifikasi.
              </p>

              <UiAlert
                v-if="data.myReport"
                tone="danger"
                title="Laporan sengketa terkirim"
                :description="`Status: ${data.myReport.status}`"
              />

              <UiAlert v-if="checkinError" tone="danger" :title="checkinError" />

              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="checkinInput"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  aria-label="Kode check-in 6 digit"
                  placeholder="482910"
                  class="flex-1 px-3.5 py-2.5 rounded-[6px] border border-[#94A3B8] bg-[#FAF8F4] font-mono text-lg font-bold tracking-widest text-[#14181F] min-h-[44px]"
                />
                <UiButton
                  variant="primary"
                  size="md"
                  :loading="checkinLoading"
                  @click="submitCheckin"
                >
                  {{ checkinLoading ? 'Validasi…' : 'Check-In' }}
                </UiButton>
              </div>

              <UiButton
                variant="secondary"
                size="md"
                block
                icon="i-ph-camera"
                @click="openQrScanner"
              >
                Pindai QR Lewat Kamera
              </UiButton>

              <button
                v-if="canReport"
                type="button"
                class="text-left text-xs font-semibold text-[#BE123C] hover:underline pt-1"
                @click="reportModalOpen = true"
              >
                Ada kendala kehadiran? Laporkan Masalah (tahan kredit untuk tinjauan admin)
              </button>
            </div>

            <!-- Post-Check-in Verified Review Panel -->
            <div
              v-if="data.myBooking && ['checked_in', 'completed', 'disputed'].includes(data.myBooking.status)"
              class="bg-white border border-[#E5E0D5] rounded-[8px] p-5 space-y-4"
            >
              <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E0D5]">
                <UiBadge tone="success" icon="i-ph-check-circle">
                  Kehadiran Terverifikasi
                </UiBadge>
                <button
                  v-if="canReport"
                  type="button"
                  class="text-xs font-semibold text-[#BE123C] hover:underline"
                  @click="reportModalOpen = true"
                >
                  Laporkan Masalah
                </button>
              </div>

              <UiAlert
                v-if="data.myReport"
                tone="danger"
                title="Laporan sengketa terkirim"
                :description="`Status: ${data.myReport.status}`"
              />

              <div v-if="data.myReview" class="p-3.5 rounded-[6px] bg-[#FAF8F4] border border-[#E5E0D5] space-y-1">
                <p class="text-xs font-bold text-[#14181F]">Ulasan Terverifikasimu ({{ data.myReview.rating }}/5)</p>
                <p class="text-xs text-[#475569]">"{{ data.myReview.comment }}"</p>
              </div>

              <form v-else class="space-y-3" @submit.prevent="submitReview">
                <p class="text-sm font-bold text-[#14181F]">Kirim Ulasan Terverifikasi</p>
                <UiAlert v-if="reviewError" tone="danger" :title="reviewError" />
                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    v-for="star in [1, 2, 3, 4, 5]"
                    :key="star"
                    type="button"
                    :class="[
                      'px-3 py-1.5 rounded-[4px] border font-mono text-xs font-bold min-h-[38px]',
                      reviewRating === star
                        ? 'bg-[#14181F] text-white border-[#14181F]'
                        : 'bg-[#FAF8F4] text-[#475569] border-[#E5E0D5]'
                    ]"
                    @click="reviewRating = star"
                  >
                    {{ star }}/5
                  </button>
                </div>
                <textarea
                  v-model="reviewComment"
                  rows="3"
                  placeholder="Bagikan pengalaman belajarmu selama sesi..."
                  class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-xs text-[#14181F]"
                />
                <UiButton type="submit" variant="primary" block :loading="reviewLoading">
                  {{ reviewLoading ? 'Mengirim…' : 'Terbitkan Ulasan' }}
                </UiButton>
              </form>
            </div>
          </div>
        </section>

        <!-- Chat Panel -->
        <section
          :class="[
            'min-w-0 lg:col-span-7 bg-white border border-[#E5E0D5] rounded-[8px] flex-col h-[460px] lg:h-[520px] overflow-hidden',
            mobilePane === 'chat' ? 'flex' : 'hidden lg:flex'
          ]"
        >
          <div class="px-5 py-3.5 border-b border-[#E5E0D5] flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-[#14181F]">
                Ruang Koordinasi Sesi (Pembaruan tiap 4 detik)
              </h2>
            </div>
            <UiBadge tone="success">Terikat Sesi</UiBadge>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FAF8F4]/50">
            <p v-if="!chatData?.messages?.length" class="text-xs text-[#526071] text-center py-10">
              Belum ada pesan. Gunakan ruang ini untuk membagikan tautan Meet atau lokasi titik temu.
            </p>
            <div
              v-for="msg in chatData?.messages || []"
              :key="msg.id"
              :class="[
                'max-w-[85%] p-3.5 rounded-[8px] border text-xs space-y-1',
                msg.senderId === authUser?.id
                  ? 'ml-auto bg-[#1D4ED8] text-white border-[#1D4ED8]'
                  : 'bg-white text-[#14181F] border-[#E5E0D5]'
              ]"
            >
              <div class="flex items-center justify-between gap-3 text-[11px] opacity-85">
                <span class="font-semibold">{{ msg.senderName }}</span>
                <span class="font-mono tabular-nums">{{ formatDateTime(msg.createdAt) }}</span>
              </div>
              <p class="leading-relaxed break-words">
                <template v-for="(part, idx) in splitMessageParts(msg.body)" :key="idx">
                  <a
                    v-if="part.isUrl"
                    :href="part.text"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline font-semibold"
                  >
                    {{ part.text }}
                  </a>
                  <span v-else>{{ part.text }}</span>
                </template>
              </p>
            </div>
          </div>

          <form class="p-3.5 border-t border-[#E5E0D5] bg-white flex gap-2" @submit.prevent="sendMessage()">
            <input
              v-model="messageInput"
              type="text"
              aria-label="Tulis pesan ruang sesi"
              placeholder="Tulis pesan atau tempel tautan Meet / lokasi..."
              class="flex-1 px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F] min-h-[44px]"
              @keydown.enter.prevent="sendMessage($event)"
            />
            <UiButton
              type="submit"
              variant="primary"
              size="md"
              :disabled="sendingMessage || !messageInput.trim()"
            >
              Kirim
            </UiButton>
          </form>
        </section>
      </div>
    </template>

    <!-- QR Scanner Modal -->
    <UiDialog v-model:open="scannerOpen" title="Pindai QR Check-in">
      <div class="space-y-3">
        <UiAlert v-if="scannerError" tone="danger" :title="scannerError" />
        <video ref="videoRef" class="w-full rounded-[6px] bg-black aspect-video object-cover" playsinline muted />
        <canvas ref="canvasRef" class="hidden" />
      </div>
    </UiDialog>

    <!-- Report Modal -->
    <UiDialog v-model:open="reportModalOpen" title="Laporkan Sengketa Sesi">
      <form class="space-y-4" @submit.prevent="submitReport">
        <UiAlert v-if="reportError" tone="danger" :title="reportError" />
        <UiField id="report-reason" label="Jelaskan kendala sesi secara spesifik">
          <textarea
            id="report-reason"
            v-model="reportReason"
            rows="3"
            placeholder="Jelaskan kendala sesi untuk ditinjau admin..."
            class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm text-[#14181F]"
          />
        </UiField>
        <div class="flex justify-end gap-2.5">
          <UiButton variant="secondary" size="sm" @click="reportModalOpen = false">
            Batal
          </UiButton>
          <UiButton type="submit" variant="danger" size="sm" :loading="reportLoading">
            {{ reportLoading ? 'Mengirim…' : 'Kirim Laporan' }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>
