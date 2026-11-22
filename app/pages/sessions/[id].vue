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

const { data, status, error, refresh } = useLazyFetch<WorkspacePayload>(
  `/api/sessions/${sessionId}`
)
const { data: chatData, refresh: refreshChat } = useLazyFetch<ChatPayload>(
  `/api/sessions/${sessionId}/messages`
)

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

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  pollTimer = setInterval(() => {
    refreshChat()
  }, 4000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
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
  if (!open) {
    stopQrScanner()
  }
})

async function openQrScanner() {
  scannerError.value = ''
  scannerOpen.value = true
  await nextTick()

  if (!navigator.mediaDevices?.getUserMedia) {
    scannerError.value = 'Browser ini tidak mendukung akses kamera. Silakan masukkan kode 6 digit secara manual.'
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
    scannerError.value = 'Izin kamera ditolak atau kamera tidak tersedia. Masukkan kode 6 digit secara manual.'
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

const canGenerateCode = computed(() => {
  if (!data.value?.session) return false
  const start = new Date(data.value.session.scheduledAt).getTime()
  const now = Date.now()
  return (
    data.value.session.status === 'confirmed' &&
    now >= start - 10 * 60 * 1000 &&
    now <= start + 15 * 60 * 1000
  )
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
    checkinError.value = 'Masukkan 6 digit angka check-in dari pengajar.'
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

async function sendMessage() {
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
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <NuxtLink
        to="/sessions"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 min-h-[40px]"
      >
        <UIcon name="i-ph-arrow-left" class="w-4 h-4" aria-hidden="true" />
        <span>Kembali ke Sesi Saya</span>
      </NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
      <p class="text-sm text-slate-600">Memuat Session Workspace...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat Session Workspace"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Left Panel: Info, Status & Check-in (35% on desktop) -->
      <section class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
        <div>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
            {{ data.roleInSession === 'tutor' ? 'Pengajar' : 'Pembelajar' }} · {{ data.session.durationMinutes }}m ·
            {{ data.session.mode === 'group' ? 'Grup' : '1-on-1' }}
          </span>
          <h1 class="text-lg font-bold text-slate-900 mt-2">{{ data.skill.title }}</h1>
          <p class="text-sm text-slate-600 mt-1">
            {{ formatDateTime(data.session.scheduledAt) }}
          </p>
          <div class="mt-2 flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <UIcon
              :name="data.session.format === 'online' ? 'i-ph-video-camera' : 'i-ph-map-pin'"
              class="w-4 h-4 text-indigo-600 shrink-0"
              aria-hidden="true"
            />
            <span class="break-all">{{ data.session.locationOrLink }}</span>
          </div>
        </div>

        <!-- Tutor Check-in Generator -->
        <div
          v-if="data.roleInSession === 'tutor' && data.session.status === 'confirmed'"
          class="pt-4 border-t border-slate-200 space-y-3"
        >
          <h2 class="text-sm font-semibold text-slate-900">Verifikasi Kehadiran (Check-in)</h2>
          <UAlert v-if="codeError" color="error" variant="subtle" :title="codeError" />

          <div
            v-if="data.session.checkinCode"
            class="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-3"
          >
            <p class="text-xs font-medium text-teal-800">
              Bagikan kode 6 digit atau QR ini ke pembelajar:
            </p>
            <p class="text-3xl font-bold font-mono tracking-widest text-teal-900 tabular-nums">
              {{ data.session.checkinCode }}
            </p>
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              width="180"
              height="180"
              alt="QR Code Check-in Sesi"
              class="mx-auto rounded-lg border border-teal-200 bg-white p-2"
            />
          </div>

          <div v-else class="space-y-2">
            <p class="text-xs text-slate-600">
              Kode check-in dapat dibuat mulai 10 menit sebelum sesi hingga 15 menit setelah jadwal mulai.
            </p>
            <button
              type="button"
              :disabled="codeLoading || !canGenerateCode"
              class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold min-h-[44px]"
              @click="generateCheckinCode"
            >
              {{ codeLoading ? 'Membuat Kode...' : 'Buat Kode Check-in 6 Digit & QR' }}
            </button>
          </div>
        </div>

        <!-- Learner Check-in & Attendance-Gated Review -->
        <div v-if="data.roleInSession === 'learner' && data.myBooking" class="pt-4 border-t border-slate-200 space-y-4">
          <div v-if="data.myBooking.status === 'confirmed'" class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Check-in Kehadiran</h2>
            <p class="text-xs text-slate-600">
              Masukkan kode 6 digit yang ditampilkan pengajar untuk memverifikasi kehadiran.
            </p>
            <UAlert v-if="checkinError" color="error" variant="subtle" :title="checkinError" />
            <div class="flex flex-wrap gap-2">
              <label for="checkin-code-input" class="sr-only">Kode Check-in 6 Digit</label>
              <input
                id="checkin-code-input"
                v-model="checkinInput"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456"
                class="flex-1 min-w-[140px] rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-widest tabular-nums min-h-[44px]"
              />
              <button
                type="button"
                :disabled="checkinLoading"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
                @click="submitCheckin"
              >
                {{ checkinLoading ? 'Validasi...' : 'Check-in' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold min-h-[44px]"
                @click="openQrScanner"
              >
                <UIcon name="i-ph-qr-code" class="w-4 h-4" aria-hidden="true" />
                <span>Scan QR</span>
              </button>
            </div>
          </div>

          <div
            v-else-if="data.myBooking.status === 'checked_in' || data.myBooking.status === 'completed'"
            class="space-y-4"
          >
            <UAlert
              color="secondary"
              variant="subtle"
              icon="i-ph-seal-check-duotone"
              title="Kehadiran Terverifikasi!"
              :description="
                data.myBooking.status === 'completed'
                  ? 'Sesi selesai dan kredit telah dicairkan ke pengajar.'
                  : 'Kredit sedang dalam jeda sengketa 24 jam sebelum dicairkan ke pengajar.'
              "
            />

            <!-- Attendance-Gated Review -->
            <div v-if="data.myReview" class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p class="text-xs font-semibold text-teal-700">Ulasan Terverifikasi Terkirim ({{ data.myReview.rating }}/5)</p>
              <p class="text-sm text-slate-800">{{ data.myReview.comment }}</p>
            </div>

            <form v-else class="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200" @submit.prevent="submitReview">
              <h3 class="text-sm font-semibold text-slate-900">Beri Ulasan Terverifikasi</h3>
              <p class="text-xs text-slate-600">
                Ulasanmu hanya bisa dikirim karena kehadiranmu sudah terverifikasi lewat Check-in.
              </p>
              <UAlert v-if="reviewError" color="error" variant="subtle" :title="reviewError" />

              <div>
                <label for="review-rating" class="block text-xs font-medium text-slate-700 mb-1">
                  Rating (1 sampai 5)
                </label>
                <select
                  id="review-rating"
                  v-model.number="reviewRating"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[44px]"
                >
                  <option :value="5">5 - Sangat Membantu</option>
                  <option :value="4">4 - Membantu</option>
                  <option :value="3">3 - Cukup</option>
                  <option :value="2">2 - Kurang</option>
                  <option :value="1">1 - Tidak Sesuai</option>
                </select>
              </div>

              <div>
                <label for="review-comment" class="block text-xs font-medium text-slate-700 mb-1">
                  Komentar Singkat
                </label>
                <textarea
                  id="review-comment"
                  v-model="reviewComment"
                  rows="2"
                  required
                  placeholder="Bagikan pengalaman belajarmu di sesi ini..."
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                :disabled="reviewLoading"
                class="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold min-h-[44px]"
              >
                {{ reviewLoading ? 'Mengirim...' : 'Kirim Ulasan Terverifikasi' }}
              </button>
            </form>
          </div>

          <UAlert
            v-else-if="data.myBooking.status === 'disputed' || data.myReport"
            color="error"
            variant="subtle"
            icon="i-ph-warning-circle"
            title="Laporan Sengketa Sedang Ditinjau Admin"
          />

          <div v-if="!data.myReport && data.myBooking.status !== 'completed'" class="pt-1">
            <button
              type="button"
              class="text-xs font-medium text-rose-600 hover:underline"
              @click="reportModalOpen = true"
            >
              Laporkan Masalah / Sengketa
            </button>
          </div>
        </div>

        <!-- Participants Summary -->
        <div class="pt-4 border-t border-slate-200 space-y-2">
          <p class="text-xs font-semibold text-slate-700">Peserta ({{ data.participants.length }})</p>
          <ul class="space-y-1.5">
            <li
              v-for="p in data.participants"
              :key="p.bookingId"
              class="flex items-center justify-between text-xs text-slate-700"
            >
              <span>{{ p.learner.name }}</span>
              <span class="font-medium text-slate-500">{{ p.status }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Right Panel: Session-Bound Chat (65% on desktop) -->
      <section class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-[520px]">
        <header class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-ph-chat-circle-text" class="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <h2 class="text-sm font-semibold text-slate-900">Ruang Chat Sesi</h2>
          </div>
          <span class="text-xs text-slate-500">Sinkronisasi otomatis</span>
        </header>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          <div v-if="!chatData?.messages?.length" class="text-center py-12 text-sm text-slate-500">
            Belum ada pesan. Koordinasikan link Meet atau titik temu kampus di sini.
          </div>

          <div
            v-for="msg in chatData?.messages || []"
            :key="msg.id"
            :class="[
              'flex flex-col max-w-[85%]',
              msg.senderId === authUser?.id ? 'ml-auto items-end' : 'mr-auto items-start'
            ]"
          >
            <span class="text-xs text-slate-500 mb-1">{{ msg.senderName }}</span>
            <div
              :class="[
                'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
                msg.senderId === authUser?.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-900'
              ]"
            >
              <template v-for="(part, i) in splitMessageParts(msg.body)" :key="i">
                <a
                  v-if="part.isUrl"
                  :href="part.text"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline font-medium"
                >
                  {{ part.text }}
                </a>
                <span v-else>{{ part.text }}</span>
              </template>
            </div>
          </div>
        </div>

        <form class="p-3 border-t border-slate-200 flex gap-2 bg-white rounded-b-2xl" @submit.prevent="sendMessage">
          <label for="chat-input" class="sr-only">Tulis pesan koordinasi sesi</label>
          <input
            id="chat-input"
            v-model="messageInput"
            type="text"
            placeholder="Tulis pesan atau tempel tautan Meet/lokasi kampus..."
            class="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm min-h-[44px]"
          />
          <button
            type="submit"
            :disabled="sendingMessage || !messageInput.trim()"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold min-h-[44px]"
          >
            Kirim
          </button>
        </form>
      </section>
    </div>

    <!-- QR Scanner Modal -->
    <UModal v-model:open="scannerOpen" title="Scan QR Check-in Pengajar">
      <template #body>
        <div class="space-y-3">
          <UAlert v-if="scannerError" color="error" variant="subtle" :title="scannerError" />
          <div class="relative rounded-xl overflow-hidden bg-slate-900 aspect-square max-h-[300px] mx-auto">
            <video ref="videoRef" playsinline muted class="w-full h-full object-cover" />
            <canvas ref="canvasRef" class="hidden" />
          </div>
          <p class="text-xs text-slate-600 text-center">
            Arahkan kamera ke QR Code di layar pengajar. Check-in otomatis berjalan saat kode terbaca.
          </p>
        </div>
      </template>
    </UModal>

    <!-- Dispute Report Modal -->
    <UModal v-model:open="reportModalOpen" title="Laporkan Masalah / Sengketa">
      <template #body>
        <form class="space-y-4" @submit.prevent="submitReport">
          <UAlert v-if="reportError" color="error" variant="subtle" :title="reportError" />
          <div>
            <label for="report-reason" class="block text-sm font-medium text-slate-800 mb-1">
              Kronologi Masalah
            </label>
            <textarea
              id="report-reason"
              v-model="reportReason"
              rows="3"
              required
              placeholder="Contoh: Pengajar membuat kode check-in tetapi tidak hadir di Meet selama 15 menit."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="reportLoading"
            class="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold min-h-[44px]"
          >
            {{ reportLoading ? 'Mengirim...' : 'Kirim Laporan ke Admin' }}
          </button>
        </form>
      </template>
    </UModal>
  </div>
</template>
