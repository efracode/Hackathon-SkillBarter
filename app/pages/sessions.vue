<script setup lang="ts">
interface SessionsPayload {
  learnerBookings: Array<{
    booking: {
      id: string
      sessionId: string | null
      status: string
      creditsHeld: number
      preferredTimeNote: string | null
      holdExpiresAt: string | null
      createdAt: string
    }
    skill: { id: string; title: string; category: string }
    tutor: { id: string; name: string; avatarUrl: string | null }
    session: {
      id: string
      mode: string
      durationMinutes: number
      format: string
      locationOrLink: string
      scheduledAt: string
      maxLearners: number
      status: string
    } | null
    confirmedCount: number
  }>
  tutorSessions: Array<{
    session: {
      id: string
      mode: string
      durationMinutes: number
      format: string
      locationOrLink: string
      scheduledAt: string
      maxLearners: number
      status: string
    }
    skill: { id: string; title: string; category: string }
    confirmedCount: number
  }>
  incomingHoldQueue: Array<{
    booking: {
      id: string
      preferredTimeNote: string | null
      holdExpiresAt: string | null
      createdAt: string
    }
    skill: { id: string; title: string }
    learner: {
      id: string
      name: string
      avatarUrl: string | null
      campus: string | null
      major: string | null
    }
  }>
}

const route = useRoute()
const router = useRouter()

const { data, status, refresh } = useLazyFetch<SessionsPayload>('/api/sessions')
const { refresh: refreshMe } = useLazyFetch('/api/me', { key: 'me-profile' })

const validTabs = ['active', 'queue', 'history'] as const
type SessionTab = (typeof validTabs)[number]
const initialTab = validTabs.includes(route.query.tab as SessionTab)
  ? (route.query.tab as SessionTab)
  : 'active'

const activeTab = ref<SessionTab>(initialTab)
watch(activeTab, (tab: SessionTab) => {
  router.replace({ query: tab === 'active' ? {} : { tab } })
})

const actionError = ref('')

const cancelConfirmOpen = ref(false)
const pendingCancelBookingId = ref<string | null>(null)
const pendingCancelIsLate = ref(false)
const cancellingBooking = ref(false)

const acceptModalOpen = ref(false)
const targetQueueId = ref<string | null>(null)
const acceptDuration = ref<30 | 60>(30)
const acceptFormat = ref<'online' | 'in_person'>('online')
const acceptLocation = ref('')
const acceptScheduledAt = ref('')
const submittingAccept = ref(false)

const declineConfirmOpen = ref(false)
const pendingDeclineQueueId = ref<string | null>(null)
const pendingDeclineLearnerName = ref('')
const decliningQueue = ref(false)

const activeLearnerBookings = computed(() =>
  (data.value?.learnerBookings || []).filter((r) =>
    ['confirmed', 'checked_in', 'disputed'].includes(r.booking.status)
  )
)

const activeTutorSessions = computed(() =>
  (data.value?.tutorSessions || []).filter((t) => t.session.status === 'confirmed')
)

const myQueuedBookings = computed(() =>
  (data.value?.learnerBookings || []).filter((r) => r.booking.status === 'queued')
)

const historyBookings = computed(() =>
  (data.value?.learnerBookings || []).filter((r) =>
    ['completed', 'cancelled_free', 'forfeited_to_tutor', 'tutor_penalized', 'expired'].includes(
      r.booking.status
    )
  )
)

const historyTutorSessions = computed(() =>
  (data.value?.tutorSessions || []).filter((t) =>
    ['completed', 'cancelled', 'tutor_penalized'].includes(t.session.status)
  )
)

function isWithin12Hours(scheduledAt: string) {
  return new Date(scheduledAt).getTime() - Date.now() < 12 * 60 * 60 * 1000
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

function statusBadgeTone(s: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (['checked_in', 'completed'].includes(s)) return 'success'
  if (['queued'].includes(s)) return 'warning'
  if (['confirmed'].includes(s)) return 'primary'
  if (['disputed', 'forfeited_to_tutor', 'tutor_penalized'].includes(s)) return 'danger'
  return 'neutral'
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    confirmed: 'Terjadwal (1 Kredit Dipesan)',
    checked_in: 'Sudah Check-in',
    disputed: 'Dalam Tinjauan Sengketa',
    queued: 'Daftar Tunggu 48j',
    completed: 'Selesai',
    cancelled_free: 'Dibatalkan (Refund 100%)',
    forfeited_to_tutor: 'Kredit ke Pengajar',
    tutor_penalized: 'Tutor No-Show (Refund 100%)',
    expired: 'Kedaluwarsa (Refund 100%)',
    cancelled: 'Dibatalkan'
  }
  return map[s] || s
}

function requestCancelBooking(bookingId: string, isLate: boolean) {
  if (!isLate) {
    cancelBooking(bookingId)
    return
  }
  pendingCancelBookingId.value = bookingId
  pendingCancelIsLate.value = true
  cancelConfirmOpen.value = true
}

async function confirmLateCancel() {
  if (!pendingCancelBookingId.value) return
  await cancelBooking(pendingCancelBookingId.value)
  cancelConfirmOpen.value = false
  pendingCancelBookingId.value = null
}

async function cancelBooking(bookingId: string) {
  actionError.value = ''
  cancellingBooking.value = true
  try {
    await $fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
    await Promise.all([refresh(), refreshMe()])
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal membatalkan pemesanan.'
  } finally {
    cancellingBooking.value = false
  }
}

function openAcceptModal(bookingId: string) {
  targetQueueId.value = bookingId
  acceptDuration.value = 30
  acceptFormat.value = 'online'
  acceptLocation.value = ''
  acceptScheduledAt.value = ''
  acceptModalOpen.value = true
}

async function submitAcceptQueue() {
  if (!targetQueueId.value || !acceptScheduledAt.value || acceptLocation.value.trim().length < 3) {
    return
  }
  submittingAccept.value = true
  actionError.value = ''
  try {
    const res = await $fetch<{ sessionId: string }>(`/api/bookings/${targetQueueId.value}/respond`, {
      method: 'POST',
      body: {
        action: 'accept',
        durationMinutes: acceptDuration.value,
        format: acceptFormat.value,
        locationOrLink: acceptLocation.value,
        scheduledAt: new Date(acceptScheduledAt.value).toISOString()
      }
    })
    acceptModalOpen.value = false
    await Promise.all([refresh(), refreshMe()])
    if (res.sessionId) {
      await navigateTo(`/sessions/${res.sessionId}`)
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menerima Daftar Tunggu.'
  } finally {
    submittingAccept.value = false
  }
}

function askDeclineQueue(bookingId: string, learnerName: string) {
  pendingDeclineQueueId.value = bookingId
  pendingDeclineLearnerName.value = learnerName
  declineConfirmOpen.value = true
}

async function confirmDeclineQueue() {
  if (!pendingDeclineQueueId.value) return
  decliningQueue.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/bookings/${pendingDeclineQueueId.value}/respond`, {
      method: 'POST',
      body: { action: 'decline' }
    })
    declineConfirmOpen.value = false
    pendingDeclineQueueId.value = null
    await Promise.all([refresh(), refreshMe()])
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menolak Daftar Tunggu.'
  } finally {
    decliningQueue.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-[28px] font-bold text-[#14181F] tracking-tight">
          Jadwal &amp; Sesi Saya
        </h1>
        <p class="text-sm text-[#475569]">
          Pisahkan aksi sebagai Pembelajar dan Pengajar, pantau Daftar Tunggu 48 jam, dan buka ruang check-in.
        </p>
      </div>
      <UiButton to="/explore" variant="primary" size="md">
        Cari Skill Baru
      </UiButton>
    </div>

    <UiAlert v-if="actionError" tone="danger" :title="actionError" />

    <!-- Underlined Editorial Tabs -->
    <div role="tablist" aria-label="Kategori Sesi" class="flex flex-wrap gap-6 border-b border-[#E5E0D5]">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'active'"
        :class="[
          'pb-3 text-sm font-semibold border-b-2 transition-colors min-h-[42px]',
          activeTab === 'active'
            ? 'border-[#1D4ED8] text-[#14181F]'
            : 'border-transparent text-[#526071] hover:text-[#14181F]'
        ]"
        @click="activeTab = 'active'"
      >
        Jadwal Aktif ({{ activeLearnerBookings.length + activeTutorSessions.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'queue'"
        :class="[
          'pb-3 text-sm font-semibold border-b-2 transition-colors min-h-[42px]',
          activeTab === 'queue'
            ? 'border-[#1D4ED8] text-[#14181F]'
            : 'border-transparent text-[#526071] hover:text-[#14181F]'
        ]"
        @click="activeTab = 'queue'"
      >
        Daftar Tunggu (48 jam) ({{ (data?.incomingHoldQueue?.length || 0) + myQueuedBookings.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'history'"
        :class="[
          'pb-3 text-sm font-semibold border-b-2 transition-colors min-h-[42px]',
          activeTab === 'history'
            ? 'border-[#1D4ED8] text-[#14181F]'
            : 'border-transparent text-[#526071] hover:text-[#14181F]'
        ]"
        @click="activeTab = 'history'"
      >
        Riwayat Sesi ({{ historyBookings.length + historyTutorSessions.length }})
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="status === 'pending'" aria-busy="true" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-24 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
    </div>

    <UiAlert
      v-else-if="status === 'error'"
      tone="danger"
      title="Gagal memuat daftar sesi"
      description="Periksa koneksi lalu coba muat ulang."
    >
      <template #action>
        <UiButton variant="danger-soft" size="sm" @click="refresh()">
          Muat Ulang
        </UiButton>
      </template>
    </UiAlert>

    <!-- Tab 1: Active Sessions -->
    <div v-else-if="activeTab === 'active'" class="space-y-8">
      <section class="space-y-3">
        <h2 class="text-sm font-bold text-[#14181F]">
          Sebagai Pembelajar ({{ activeLearnerBookings.length }})
        </h2>

        <div v-if="activeLearnerBookings.length === 0" class="p-8 bg-white border border-[#E5E0D5] rounded-[8px] text-center text-sm text-[#526071]">
          Belum ada jadwal belajar aktif.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="row in activeLearnerBookings"
            :key="row.booking.id"
            class="bg-white border border-[#E5E0D5] rounded-[8px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UiBadge :tone="statusBadgeTone(row.booking.status)" icon="i-ph-calendar-check">
                  {{ statusLabel(row.booking.status) }}
                </UiBadge>
                <span class="font-mono text-xs text-[#526071] tabular-nums">
                  {{ row.session ? `${formatDateTime(row.session.scheduledAt)} | ${row.session.durationMinutes}m ${row.session.format === 'online' ? 'Online' : 'Kampus'}` : 'Belum terjadwal' }}
                </span>
              </div>
              <p class="text-base font-bold text-[#14181F]">{{ row.skill.title }}</p>
              <p class="text-xs text-[#475569]">
                Mentor: <strong class="text-[#14181F]">{{ row.tutor.name }}</strong> | Pembatalan gratis jika &gt;= 12 jam sebelum mulai
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <UiButton
                v-if="row.booking.sessionId"
                :to="`/sessions/${row.booking.sessionId}`"
                variant="primary"
                size="sm"
              >
                Buka Ruang Sesi
              </UiButton>
              <UiButton
                v-if="row.booking.status === 'confirmed' && row.session"
                variant="danger-soft"
                size="sm"
                :disabled="cancellingBooking"
                @click="requestCancelBooking(row.booking.id, isWithin12Hours(row.session.scheduledAt))"
              >
                Batalkan
              </UiButton>
            </div>
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-bold text-[#14181F]">
          Sebagai Pengajar ({{ activeTutorSessions.length }})
        </h2>

        <div v-if="activeTutorSessions.length === 0" class="p-8 bg-white border border-[#E5E0D5] rounded-[8px] text-center text-sm text-[#526071]">
          Belum ada jadwal mengajar yang sedang aktif.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="item in activeTutorSessions"
            :key="item.session.id"
            class="bg-white border border-[#E5E0D5] rounded-[8px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UiBadge :tone="item.session.mode === 'group' ? 'success' : 'primary'" icon="i-ph-users">
                  {{
                    item.session.mode === 'group'
                      ? `Grup ${item.session.durationMinutes}m | Kuorum min 2 peserta pada T-2j (${item.confirmedCount}/${item.session.maxLearners})`
                      : `1-on-1 ${item.session.durationMinutes}m (${item.confirmedCount}/${item.session.maxLearners} Peserta)`
                  }}
                </UiBadge>
                <span class="font-mono text-xs text-[#526071] tabular-nums">
                  {{ formatDateTime(item.session.scheduledAt) }} | {{ item.session.locationOrLink }}
                </span>
              </div>
              <p class="text-base font-bold text-[#14181F]">{{ item.skill.title }}</p>
              <p class="text-xs text-[#475569]">
                {{ item.session.mode === 'group' ? 'Pendapatan grup dibatasi maksimal 2 kredit' : 'Pendapatan 1 kredit setelah jeda 24 jam check-in' }}
              </p>
            </div>

            <UiButton
              :to="`/sessions/${item.session.id}`"
              variant="dark"
              size="sm"
              icon="i-ph-qr-code"
            >
              Kelola &amp; Check-in
            </UiButton>
          </li>
        </ul>
      </section>
    </div>

    <!-- Tab 2: Hold Queue 48h -->
    <div v-else-if="activeTab === 'queue'" class="space-y-8">
      <section class="space-y-3">
        <h2 class="text-sm font-bold text-[#92400E]">
          Permintaan Masuk Untukmu (Pengajar) · {{ data?.incomingHoldQueue?.length || 0 }}
        </h2>

        <div v-if="!data?.incomingHoldQueue?.length" class="p-8 bg-white border border-[#E5E0D5] rounded-[8px] text-center text-sm text-[#526071]">
          Tidak ada permintaan Daftar Tunggu yang menunggu responsmu.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="q in data.incomingHoldQueue"
            :key="q.booking.id"
            class="bg-white border border-[#FDE68A] rounded-[8px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="font-bold text-[#14181F]">{{ q.learner.name }}</span>
                <span v-if="q.learner.major" class="text-[#526071]">| {{ q.learner.major }}</span>
                <span v-if="q.booking.holdExpiresAt" class="font-mono text-[#92400E]">
                  Batas 48j: {{ formatDateTime(q.booking.holdExpiresAt) }}
                </span>
              </div>
              <p class="text-sm font-bold text-[#14181F]">{{ q.skill.title }}</p>
              <p v-if="q.booking.preferredTimeNote" class="text-xs text-[#475569] bg-[#FAF8F4] px-3 py-2 rounded-[6px] border border-[#E5E0D5]">
                Catatan waktu: "{{ q.booking.preferredTimeNote }}"
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <UiButton variant="primary" size="sm" @click="openAcceptModal(q.booking.id)">
                Terima &amp; Jadwalkan
              </UiButton>
              <UiButton variant="danger-soft" size="sm" @click="askDeclineQueue(q.booking.id, q.learner.name)">
                Tolak
              </UiButton>
            </div>
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-bold text-[#14181F]">
          Daftar Tunggu Saya (Pembelajar) · {{ myQueuedBookings.length }}
        </h2>

        <div v-if="myQueuedBookings.length === 0" class="p-8 bg-white border border-[#E5E0D5] rounded-[8px] text-center text-sm text-[#526071]">
          Kamu tidak sedang berada di Daftar Tunggu mana pun.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="row in myQueuedBookings"
            :key="row.booking.id"
            class="bg-white border border-[#E5E0D5] rounded-[8px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <p class="text-sm font-bold text-[#14181F]">{{ row.skill.title }}</p>
              <p class="text-xs text-[#475569]">
                Mentor: {{ row.tutor.name }} | Dalam Pemesanan: <span class="font-mono font-semibold text-[#92400E]">1 Kredit</span>
              </p>
              <p v-if="row.booking.preferredTimeNote" class="text-xs text-[#526071]">
                Catatan: "{{ row.booking.preferredTimeNote }}"
              </p>
            </div>
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="cancellingBooking"
              @click="cancelBooking(row.booking.id)"
            >
              Batalkan &amp; Refund 100%
            </UiButton>
          </li>
        </ul>
      </section>
    </div>

    <!-- Tab 3: History -->
    <div v-else class="space-y-6">
      <div
        v-if="historyBookings.length === 0 && historyTutorSessions.length === 0"
        class="p-8 bg-white border border-[#E5E0D5] rounded-[8px] text-center text-sm text-[#526071]"
      >
        Belum ada riwayat sesi yang selesai atau dibatalkan.
      </div>

      <ul v-else class="bg-white border border-[#E5E0D5] rounded-[8px] divide-y divide-[#E5E0D5]">
        <li
          v-for="row in historyBookings"
          :key="row.booking.id"
          class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <UiBadge :tone="statusBadgeTone(row.booking.status)">
                {{ statusLabel(row.booking.status) }}
              </UiBadge>
              <span class="font-mono text-xs text-[#526071]">Belajar</span>
            </div>
            <p class="text-sm font-bold text-[#14181F]">{{ row.skill.title }}</p>
            <p class="text-xs text-[#526071]">Mentor: {{ row.tutor.name }}</p>
          </div>
          <NuxtLink
            v-if="row.booking.sessionId"
            :to="`/sessions/${row.booking.sessionId}`"
            class="text-xs font-semibold text-[#1D4ED8] hover:underline"
          >
            Lihat Detail -&gt;
          </NuxtLink>
        </li>

        <li
          v-for="item in historyTutorSessions"
          :key="item.session.id"
          class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <UiBadge :tone="statusBadgeTone(item.session.status)">
                {{ statusLabel(item.session.status) }}
              </UiBadge>
              <span class="font-mono text-xs text-[#526071]">Mengajar</span>
            </div>
            <p class="text-sm font-bold text-[#14181F]">{{ item.skill.title }}</p>
            <p class="font-mono text-xs text-[#526071] tabular-nums">{{ formatDateTime(item.session.scheduledAt) }}</p>
          </div>
          <NuxtLink
            :to="`/sessions/${item.session.id}`"
            class="text-xs font-semibold text-[#1D4ED8] hover:underline"
          >
            Lihat Detail -&gt;
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Late Cancel Confirmation Modal -->
    <UiDialog v-model:open="cancelConfirmOpen" title="Konfirmasi Pembatalan Kurang dari 12 Jam">
      <div class="space-y-4">
        <UiAlert
          tone="danger"
          title="1 Kredit dalam Pemesanan Akan Diserahkan ke Pengajar"
          description="Karena pembatalan dilakukan kurang dari 12 jam sebelum jadwal sesi dimulai, aturan anti-eksploitasi menyerahkan 1 kredit ke pengajar."
        />
        <div class="flex justify-end gap-2.5">
          <UiButton variant="secondary" size="sm" @click="cancelConfirmOpen = false">
            Batal
          </UiButton>
          <UiButton variant="danger" size="sm" :loading="cancellingBooking" @click="confirmLateCancel">
            Ya, Batalkan Sesi
          </UiButton>
        </div>
      </div>
    </UiDialog>

    <!-- Tutor Accept Hold Queue Modal -->
    <UiDialog v-model:open="acceptModalOpen" title="Jadwalkan Sesi dari Daftar Tunggu">
      <form class="space-y-4" @submit.prevent="submitAcceptQueue">
        <div class="grid grid-cols-2 gap-3">
          <UiField id="accept-dur" label="Durasi">
            <select id="accept-dur" v-model="acceptDuration" class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option :value="30">30 Menit</option>
              <option :value="60">60 Menit</option>
            </select>
          </UiField>
          <UiField id="accept-fmt" label="Format">
            <select id="accept-fmt" v-model="acceptFormat" class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]">
              <option value="online">Online (Meet/Zoom)</option>
              <option value="in_person">Tatap Muka Kampus</option>
            </select>
          </UiField>
        </div>

        <UiField id="accept-time" label="Waktu Mulai" required>
          <input
            id="accept-time"
            v-model="acceptScheduledAt"
            type="datetime-local"
            required
            class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
          />
        </UiField>

        <UiField id="accept-loc" label="Tautan Meet / Lokasi Kampus" required>
          <input
            id="accept-loc"
            v-model="acceptLocation"
            type="text"
            required
            placeholder="Mis. https://meet.google.com/abc-defg-hij atau Perpustakaan Lantai 2"
            class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-sm min-h-[44px]"
          />
        </UiField>

        <div class="flex justify-end gap-2.5 pt-2">
          <UiButton variant="secondary" size="sm" @click="acceptModalOpen = false">
            Tutup
          </UiButton>
          <UiButton type="submit" variant="primary" size="sm" :loading="submittingAccept">
            {{ submittingAccept ? 'Menyimpan…' : 'Konfirmasi Jadwal' }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Tutor Decline Hold Queue Confirmation Modal -->
    <UiDialog v-model:open="declineConfirmOpen" title="Konfirmasi Penolakan Daftar Tunggu">
      <div class="space-y-4">
        <UiAlert
          tone="warning"
          title="1 Kredit dalam Pemesanan Dikembalikan 100%"
          :description="`Menolak permintaan dari ${pendingDeclineLearnerName || 'pembelajar'} akan mengembalikan 1 kredit mereka secara penuh dan menghapus antrean ini.`"
        />
        <div class="flex justify-end gap-2.5">
          <UiButton variant="secondary" size="sm" @click="declineConfirmOpen = false">
            Batal
          </UiButton>
          <UiButton variant="danger" size="sm" :loading="decliningQueue" @click="confirmDeclineQueue">
            {{ decliningQueue ? 'Memproses…' : 'Ya, Tolak &amp; Refund 100%' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
