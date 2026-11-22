<script setup lang="ts">
export interface BookingSlotOption {
  id: string
  mode: string
  durationMinutes: number
  format: string
  locationOrLink: string
  scheduledAt: string
  maxLearners: number
  bookedCount: number
  remainingSpots: number
}

export interface BookingSkillItem {
  skill: {
    id: string
    userId: string
    category: string
    title: string
    description: string | null
    templateTag: string | null
  }
  tutor: {
    id: string
    name: string
    avatarUrl: string | null
    bio?: string | null
    campus: string | null
    major: string | null
    completedCount: number
    avgRating: number
    reviewCount: number
    isVerifiedMentor: boolean
    isVerifiedUksw: boolean
  }
  slots: BookingSlotOption[]
  reviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    reviewerName: string
  }>
}

const props = defineProps<{
  item: BookingSkillItem
  myUserId: string
  creditBalance: number
}>()

const emit = defineEmits<{
  booked: []
}>()

const selectedSlotId = ref<string | null>(props.item.slots[0]?.id ?? null)
const preferredTimeNote = ref('')
const bookingLoading = ref(false)
const bookingError = ref('')
const bookingSuccess = ref('')

watch(
  () => props.item.skill.id,
  () => {
    selectedSlotId.value = props.item.slots[0]?.id ?? null
    preferredTimeNote.value = ''
    bookingError.value = ''
    bookingSuccess.value = ''
  }
)

const isOwnSkill = computed(() => props.item.tutor.id === props.myUserId)

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

async function confirmBooking() {
  if (isOwnSkill.value) return
  bookingError.value = ''
  bookingSuccess.value = ''
  bookingLoading.value = true

  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        skillId: props.item.skill.id,
        sessionId: props.item.slots.length > 0 ? selectedSlotId.value : null,
        preferredTimeNote: props.item.slots.length === 0 ? preferredTimeNote.value : null
      }
    })
    bookingSuccess.value =
      props.item.slots.length > 0
        ? 'Booking berhasil! 1 kredit terkunci di escrow.'
        : 'Masuk Hold Queue 48 jam! 1 kredit terkunci di escrow.'
    emit('booked')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    bookingError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal memproses booking.'
  } finally {
    bookingLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Top Header & Category -->
    <div class="space-y-2 pb-4 border-b border-slate-200">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
          {{ item.skill.category }}
        </span>
        <span
          :class="[
            'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
            item.slots.length > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-600 border-slate-300'
          ]"
        >
          {{ item.slots.length > 0 ? `${item.slots.length} Slot Tersedia` : 'Hold Queue 48 Jam' }}
        </span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ item.skill.title }}
      </h2>
      <p v-if="item.skill.description" class="text-sm text-slate-600 leading-relaxed">
        {{ item.skill.description }}
      </p>
    </div>

    <!-- Mentor Identity Card -->
    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
      <div class="flex items-start gap-3">
        <UAvatar :src="item.tutor.avatarUrl || undefined" :alt="item.tutor.name" size="md" />
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <p class="text-sm font-bold text-slate-900 truncate">{{ item.tutor.name }}</p>
            <VerifiedUkswBadge v-if="item.tutor.isVerifiedUksw" />
          </div>
          <p v-if="item.tutor.major || item.tutor.campus" class="text-xs text-slate-500">
            {{ [item.tutor.major, item.tutor.campus].filter(Boolean).join(' · ') }}
          </p>
          <div class="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            <span
              v-if="item.tutor.isVerifiedMentor"
              class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-600 px-2 py-0.5 rounded-md"
            >
              <UIcon name="i-ph-seal-check-duotone" class="w-3.5 h-3.5" aria-hidden="true" />
              Verified Peer Mentor
            </span>
            <span class="font-mono text-slate-600 tabular-nums">
              {{ item.tutor.completedCount }} sesi ·
              {{ item.tutor.reviewCount > 0 ? `Rating ${item.tutor.avgRating}/5` : 'Belum ada ulasan' }}
            </span>
          </div>
        </div>
      </div>
      <p v-if="item.tutor.bio" class="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
        {{ item.tutor.bio }}
      </p>
    </div>

    <!-- Slot Picker OR Hold Queue Note -->
    <div v-if="item.slots.length > 0" class="space-y-2.5">
      <p class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
        Pilih Jadwal Tersedia
      </p>
      <div class="space-y-2">
        <label
          v-for="slot in item.slots"
          :key="slot.id"
          :for="`panel-slot-${slot.id}`"
          :class="[
            'flex items-start gap-3 p-3 rounded-xl border transition-colors duration-150',
            selectedSlotId === slot.id
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-200 bg-white hover:border-blue-300'
          ]"
        >
          <input
            :id="`panel-slot-${slot.id}`"
            v-model="selectedSlotId"
            type="radio"
            :value="slot.id"
            class="mt-1 accent-blue-600"
          />
          <div class="text-xs sm:text-sm min-w-0">
            <p class="font-semibold text-slate-900 tabular-nums">{{ formatDateTime(slot.scheduledAt) }}</p>
            <p class="text-xs text-slate-600 mt-0.5">
              {{ slot.durationMinutes }} menit ·
              {{ slot.mode === 'group' ? `Grup (sisa ${slot.remainingSpots} kursi)` : '1-on-1' }}
              · {{ slot.format === 'online' ? 'Online Meet' : `Kampus: ${slot.locationOrLink}` }}
            </p>
          </div>
        </label>
      </div>
    </div>

    <div v-else class="space-y-2.5">
      <div class="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 space-y-1">
        <p class="font-semibold text-blue-700">Slot pengajar sedang penuh (Hold Queue 48 Jam)</p>
        <p>Masuk antrean mengunci 1 kredit di escrow. Jika tidak direspons 48 jam, kredit otomatis kembali 100%.</p>
      </div>
      <div>
        <label :for="`panel-pref-${item.skill.id}`" class="block text-xs font-semibold text-slate-800 mb-1">
          Usulan Waktu Pilihan (Opsional)
        </label>
        <textarea
          :id="`panel-pref-${item.skill.id}`"
          v-model="preferredTimeNote"
          rows="2"
          placeholder="Contoh: Bisa Selasa atau Kamis sore jam 16.00 WIB via Google Meet."
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white"
        />
      </div>
    </div>

    <!-- Escrow Summary Strip -->
    <div class="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs tabular-nums">
      <span class="text-slate-600">Biaya Escrow · Batal &ge; 12j refund 100%</span>
      <span class="font-mono font-bold text-slate-900">
        1 Kredit <span class="text-slate-500 font-normal">(Sisa {{ Math.max(0, creditBalance - 1) }})</span>
      </span>
    </div>

    <!-- Live Feedback -->
    <div aria-live="polite" class="space-y-2">
      <UAlert
        v-if="bookingError"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        :title="bookingError"
      />
      <UAlert
        v-if="bookingSuccess"
        color="primary"
        variant="subtle"
        icon="i-ph-check-circle"
        :title="bookingSuccess"
      />
    </div>

    <!-- Primary Action -->
    <button
      v-if="isOwnSkill"
      type="button"
      disabled
      class="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-semibold min-h-[46px]"
    >
      Ini Penawaran Skill Milikmu
    </button>
    <button
      v-else
      type="button"
      :disabled="bookingLoading || creditBalance < 1"
      class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold min-h-[46px] transition-colors"
      @click="confirmBooking"
    >
      {{
        creditBalance < 1
          ? 'Saldo Kredit Tidak Cukup (0 Kredit)'
          : bookingLoading
            ? 'Memproses Escrow…'
            : item.slots.length > 0
              ? 'Kunci 1 Kredit di Escrow & Booking'
              : 'Kunci 1 Kredit & Masuk Hold Queue'
      }}
    </button>

    <!-- Attendance-Gated Verified Reviews -->
    <div class="pt-4 border-t border-slate-200 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
          Ulasan Terverifikasi ({{ item.reviews.length }})
        </h3>
        <span class="text-[11px] font-semibold text-blue-700">Attendance-Gated</span>
      </div>
      <p v-if="item.reviews.length === 0" class="text-xs text-slate-500">
        Belum ada ulasan terverifikasi untuk pengajar ini.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="rev in item.reviews"
          :key="rev.id"
          class="p-3 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-1"
        >
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="font-semibold text-slate-900">{{ rev.reviewerName }}</span>
            <span class="font-mono font-semibold text-blue-700 tabular-nums">
              {{ rev.rating }}/5 · Verified
            </span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">{{ rev.comment }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
