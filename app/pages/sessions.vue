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

const { data, status, error, refresh } = useLazyFetch<SessionsPayload>('/api/sessions')
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

// Confirmation modal state for destructive late cancellation (< 12h)
const cancelConfirmOpen = ref(false)
const pendingCancelBookingId = ref<string | null>(null)
const pendingCancelIsLate = ref(false)
const cancellingBooking = ref(false)

// Tutor Hold Queue Accept Modal state
const acceptModalOpen = ref(false)
const targetQueueId = ref<string | null>(null)
const acceptDuration = ref<30 | 60>(30)
const acceptFormat = ref<'online' | 'in_person'>('online')
const acceptLocation = ref('')
const acceptScheduledAt = ref('')
const submittingAccept = ref(false)

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
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal membatalkan booking.'
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
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menerima Hold Queue.'
  } finally {
    submittingAccept.value = false
  }
}

async function declineQueue(bookingId: string) {
  actionError.value = ''
  try {
    await $fetch(`/api/bookings/${bookingId}/respond`, {
      method: 'POST',
      body: { action: 'decline' }
    })
    await Promise.all([refresh(), refreshMe()])
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    actionError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal menolak Hold Queue.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sesi Saya</h1>
      <p class="text-sm text-slate-600">
        Pantau sesi terjadwal, kelola Hold Queue, serta akses check-in dan ruang chat.
      </p>
    </div>

    <UAlert v-if="actionError" color="error" variant="subtle" :title="actionError" />

    <!-- Tabs -->
    <div role="tablist" aria-label="Kategori Sesi" class="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'active'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors duration-150',
          activeTab === 'active'
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        ]"
        @click="activeTab = 'active'"
      >
        Aktif &amp; Mendatang ({{ activeLearnerBookings.length + activeTutorSessions.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'queue'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors duration-150',
          activeTab === 'queue'
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        ]"
        @click="activeTab = 'queue'"
      >
        Hold Queue ({{ myQueuedBookings.length + (data?.incomingHoldQueue?.length || 0) }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'history'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-colors duration-150',
          activeTab === 'history'
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        ]"
        @click="activeTab = 'history'"
      >
        Selesai &amp; Dibatalkan
      </button>
    </div>

    <div v-if="status === 'pending'" class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
      <p class="text-sm text-slate-600">Memuat daftar sesi...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Gagal memuat daftar sesi"
    >
      <template #actions>
        <UButton color="error" variant="soft" size="sm" @click="() => refresh()">Coba Lagi</UButton>
      </template>
    </UAlert>

    <!-- Tab 1: Active & Upcoming -->
    <Transition v-else name="panel-slide" mode="out-in">
      <div v-if="activeTab === 'active'" key="tab-active" class="space-y-4">
      <div
        v-if="activeLearnerBookings.length === 0 && activeTutorSessions.length === 0"
        class="bg-white border border-slate-200 rounded-2xl p-8 text-center"
      >
        <UIcon name="i-ph-calendar-check" class="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
        <h2 class="text-base font-semibold text-slate-900">Belum ada sesi aktif</h2>
        <p class="mt-1 text-sm text-slate-600 mb-4">
          Mulai dengan membooking mentor di direktori Jelajah atau buka slot mengajar.
        </p>
        <NuxtLink
          to="/explore"
          class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold min-h-[44px]"
        >
          Cari Mentor di Jelajah
        </NuxtLink>
      </div>

      <article
        v-for="row in activeLearnerBookings"
        :key="row.booking.id"
        class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
              Sebagai Pembelajar · {{ row.booking.status }}
            </span>
            <h2 class="text-base font-semibold text-slate-900 mt-1.5">{{ row.skill.title }}</h2>
            <p class="text-sm text-slate-600">
              Pengajar: {{ row.tutor.name }}
              <template v-if="row.session"> · {{ formatDateTime(row.session.scheduledAt) }}</template>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-if="row.session"
              :to="`/sessions/${row.session.id}`"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px] inline-flex items-center"
            >
              Buka Workspace
            </NuxtLink>
            <button
              v-if="row.booking.status === 'confirmed' && row.session"
              type="button"
              :disabled="cancellingBooking"
              :class="[
                'px-3.5 py-2 rounded-xl border text-xs font-semibold min-h-[44px]',
                isWithin12Hours(row.session.scheduledAt)
                  ? 'border-rose-600 text-rose-600 hover:bg-rose-50'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              ]"
              @click="requestCancelBooking(row.booking.id, isWithin12Hours(row.session.scheduledAt))"
            >
              {{ isWithin12Hours(row.session.scheduledAt) ? 'Batal (<12j, Hangus 1 Kredit)' : 'Batal Gratis' }}
            </button>
          </div>
        </div>

        <p
          v-if="row.session?.mode === 'group'"
          class="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 tabular-nums"
        >
          Kuorum: {{ row.confirmedCount }}/2 terkonfirmasi · Auto-batal jika &lt; 2 pada T-2 jam
        </p>
      </article>

      <article
        v-for="t in activeTutorSessions"
        :key="t.session.id"
        class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
              Sebagai Pengajar · {{ t.confirmedCount }}/{{ t.session.maxLearners }} Peserta
            </span>
            <h2 class="text-base font-semibold text-slate-900 mt-1.5">{{ t.skill.title }}</h2>
            <p class="text-sm text-slate-600">
              {{ formatDateTime(t.session.scheduledAt) }} · {{ t.session.durationMinutes }}m ·
              {{ t.session.format === 'online' ? 'Online' : t.session.locationOrLink }}
            </p>
          </div>

          <NuxtLink
            :to="`/sessions/${t.session.id}`"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px] inline-flex items-center"
          >
            Buka Workspace &amp; Check-in
          </NuxtLink>
        </div>

        <p
          v-if="t.session.mode === 'group'"
          class="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 tabular-nums"
        >
          Kuorum: {{ t.confirmedCount }}/2 terkonfirmasi · Auto-batal jika &lt; 2 pada T-2 jam
        </p>
      </article>
    </div>

    <!-- Tab 2: Hold Queue -->
    <div v-else-if="activeTab === 'queue'" key="tab-queue" class="space-y-4">
      <div
        v-if="myQueuedBookings.length === 0 && (!data?.incomingHoldQueue || data.incomingHoldQueue.length === 0)"
        class="bg-white border border-slate-200 rounded-2xl p-8 text-center"
      >
        <UIcon name="i-ph-clock" class="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
        <h2 class="text-base font-semibold text-slate-900">Antrean Hold Queue kosong</h2>
        <p class="mt-1 text-sm text-slate-600">
          Hold Queue muncul saat kamu mengantre slot penuh atau menerima permintaan belajar dari mahasiswa lain.
        </p>
      </div>

      <!-- Incoming Queue for Tutor -->
      <article
        v-for="q in data?.incomingHoldQueue || []"
        :key="q.booking.id"
        class="bg-white border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
              Permintaan Masuk (Tutor)
            </span>
            <h2 class="text-base font-semibold text-slate-900 mt-1.5">{{ q.skill.title }}</h2>
            <p class="text-sm text-slate-600">
              Pemohon: {{ q.learner.name }}
              <template v-if="q.learner.major"> ({{ q.learner.major }})</template>
            </p>
            <p v-if="q.booking.preferredTimeNote" class="text-xs text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg">
              Catatan waktu: "{{ q.booking.preferredTimeNote }}"
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
              @click="openAcceptModal(q.booking.id)"
            >
              Terima &amp; Jadwalkan
            </button>
            <button
              type="button"
              class="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-semibold min-h-[44px]"
              @click="declineQueue(q.booking.id)"
            >
              Tolak
            </button>
          </div>
        </div>
      </article>

      <!-- Outgoing Queue for Learner -->
      <article
        v-for="row in myQueuedBookings"
        :key="row.booking.id"
        class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
            Menunggu Pengajar · 1 Kredit Terkunci di Escrow
          </span>
          <h2 class="text-base font-semibold text-slate-900 mt-1.5">{{ row.skill.title }}</h2>
          <p class="text-xs text-slate-600">
            Pengajar: {{ row.tutor.name }}
            <template v-if="row.booking.holdExpiresAt">
              · Auto-refund jika tidak direspons sebelum {{ formatDateTime(row.booking.holdExpiresAt) }}
            </template>
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-800 min-h-[44px]"
          @click="cancelBooking(row.booking.id)"
        >
          Batalkan &amp; Refund
        </button>
      </article>
    </div>

    <!-- Tab 3: History -->
    <div v-else key="tab-history" class="space-y-3">
      <div
        v-if="historyBookings.length === 0 && historyTutorSessions.length === 0"
        class="bg-white border border-slate-200 rounded-2xl p-8 text-center"
      >
        <p class="text-sm text-slate-600">Belum ada riwayat sesi selesai atau dibatalkan.</p>
      </div>

      <article
        v-for="row in historyBookings"
        :key="row.booking.id"
        class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ row.skill.title }}</p>
          <p class="text-xs text-slate-600">
            Pengajar: {{ row.tutor.name }} · Status: <span class="font-medium">{{ row.booking.status }}</span>
          </p>
        </div>
        <NuxtLink
          v-if="row.session"
          :to="`/sessions/${row.session.id}`"
          class="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Lihat Detail
        </NuxtLink>
      </article>

      <article
        v-for="t in historyTutorSessions"
        :key="t.session.id"
        class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ t.skill.title }} (Mengajar)</p>
          <p class="text-xs text-slate-600">
            {{ formatDateTime(t.session.scheduledAt) }} · Status: <span class="font-medium">{{ t.session.status }}</span>
          </p>
        </div>
        <NuxtLink
          :to="`/sessions/${t.session.id}`"
          class="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Lihat Detail
        </NuxtLink>
      </article>
      </div>
    </Transition>

    <!-- Late Cancellation Confirmation Modal -->
    <UModal v-model:open="cancelConfirmOpen" title="Konfirmasi Pembatalan Terlambat">
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-ph-warning-circle"
            title="1 Kredit Escrow Akan Hangus"
            description="Karena pembatalan dilakukan kurang dari 12 jam sebelum jadwal sesi, 1 kredit akan diserahkan ke pengajar sebagai kompensasi waktu."
          />
          <div class="flex justify-end gap-2.5">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-slate-800 min-h-[44px]"
              @click="cancelConfirmOpen = false"
            >
              Tetap Ikut Sesi
            </button>
            <button
              type="button"
              :disabled="cancellingBooking"
              class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold min-h-[44px]"
              @click="confirmLateCancel"
            >
              {{ cancellingBooking ? 'Membatalkan…' : 'Ya, Batalkan Sesi' }}
            </button>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Tutor Accept & Schedule Modal -->
    <UModal v-model:open="acceptModalOpen" title="Terima &amp; Jadwalkan Hold Queue">
      <template #body>
        <form class="space-y-4" @submit.prevent="submitAcceptQueue">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="accept-dur" class="block text-sm font-medium text-slate-800 mb-1">Durasi</label>
              <select
                id="accept-dur"
                v-model="acceptDuration"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
              >
                <option :value="30">30 Menit</option>
                <option :value="60">60 Menit</option>
              </select>
            </div>
            <div>
              <label for="accept-fmt" class="block text-sm font-medium text-slate-800 mb-1">Format</label>
              <select
                id="accept-fmt"
                v-model="acceptFormat"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
              >
                <option value="online">Online Meet</option>
                <option value="in_person">Tatap Muka</option>
              </select>
            </div>
          </div>

          <div>
            <label for="accept-time" class="block text-sm font-medium text-slate-800 mb-1">
              Tanggal &amp; Jam Sesi
            </label>
            <input
              id="accept-time"
              v-model="acceptScheduledAt"
              type="datetime-local"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label for="accept-loc" class="block text-sm font-medium text-slate-800 mb-1">
              {{ acceptFormat === 'online' ? 'Tautan Meeting' : 'Lokasi Kampus' }}
            </label>
            <input
              id="accept-loc"
              v-model="acceptLocation"
              type="text"
              required
              placeholder="https://meet.google.com/... atau Gedung A Lt. 2"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            :disabled="submittingAccept"
            class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
          >
            {{ submittingAccept ? 'Menjadwalkan...' : 'Konfirmasi & Buka Chat Sesi' }}
          </button>
        </form>
      </template>
    </UModal>
  </div>
</template>
