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
const hasInsufficientCredits = computed(() => props.creditBalance < 1)

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
        ? 'Pemesanan berhasil! 1 Kredit ditahan aman hingga sesi selesai.'
        : 'Masuk Daftar Tunggu 48 jam! 1 Kredit ditahan aman dan kembali 100% jika tidak dijadwalkan.'
    emit('booked')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    bookingError.value =
      fetchErr?.data?.statusMessage || fetchErr?.message || 'Gagal memproses pemesanan.'
  } finally {
    bookingLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Top Header & Status Badge -->
    <div class="space-y-2 pb-4 border-b border-[#E5E0D5]">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <UiBadge
          :tone="item.slots.length > 0 ? 'success' : 'warning'"
          :icon="item.slots.length > 0 ? 'i-ph-calendar-check' : 'i-ph-clock'"
        >
          {{ item.slots.length > 0 ? `${item.slots.length} Slot Tersedia | 1 Kredit` : 'Daftar Tunggu 48 Jam | 1 Kredit' }}
        </UiBadge>
        <span class="text-xs font-semibold text-[#1D4ED8]">{{ item.skill.category }}</span>
      </div>

      <h2 class="text-xl font-bold text-[#14181F] leading-snug">
        {{ item.skill.title }}
      </h2>
      <p v-if="item.skill.description" class="text-[13px] text-[#475569] leading-relaxed">
        {{ item.skill.description }}
      </p>
    </div>

    <!-- Mentor Identity -->
    <div class="p-3.5 rounded-[6px] bg-[#FAF8F4] border border-[#E5E0D5] space-y-2">
      <div class="flex items-start gap-3">
        <UAvatar :src="item.tutor.avatarUrl || undefined" :alt="item.tutor.name" size="md" />
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <p class="text-sm font-bold text-[#14181F] truncate">{{ item.tutor.name }}</p>
            <VerifiedUkswBadge v-if="item.tutor.isVerifiedUksw" />
          </div>
          <p v-if="item.tutor.major || item.tutor.campus" class="text-xs text-[#526071]">
            {{ [item.tutor.major, item.tutor.campus].filter(Boolean).join(' | ') }}
          </p>
          <div class="flex flex-wrap items-center gap-2 text-xs text-[#475569] tabular-nums">
            <span v-if="item.tutor.isVerifiedMentor" class="font-semibold text-[#1D4ED8]">
              Verified Peer Mentor
            </span>
            <span>{{ item.tutor.completedCount }} sesi selesai</span>
            <span v-if="item.tutor.reviewCount > 0" class="font-mono font-semibold text-[#14181F]">
              | {{ item.tutor.avgRating.toFixed(1) }}/5 ({{ item.tutor.reviewCount }})
            </span>
          </div>
        </div>
      </div>
      <p v-if="item.tutor.bio" class="text-xs text-[#475569] leading-relaxed pt-2 border-t border-[#E5E0D5]">
        {{ item.tutor.bio }}
      </p>
    </div>

    <!-- Slot Selection or Hold Queue 48h -->
    <div class="space-y-3">
      <template v-if="item.slots.length > 0">
        <p class="text-xs font-semibold text-[#526071]">
          Pilih Jadwal Tersedia
        </p>
        <div class="space-y-2">
          <label
            v-for="slot in item.slots"
            :key="slot.id"
            :class="[
              'flex items-start gap-3 p-3.5 rounded-[6px] border transition-colors cursor-pointer',
              selectedSlotId === slot.id
                ? 'border-[#1D4ED8] bg-[#EFF6FF]/40'
                : 'border-[#E5E0D5] bg-white hover:border-[#94A3B8]'
            ]"
          >
            <input
              v-model="selectedSlotId"
              type="radio"
              :value="slot.id"
              class="mt-1 accent-[#1D4ED8]"
            />
            <div class="min-w-0 flex-1 space-y-1 text-xs">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-[#14181F] tabular-nums">
                  {{ formatDateTime(slot.scheduledAt) }} | {{ slot.durationMinutes }}m | {{ slot.mode === 'group' ? 'Grup' : '1-on-1' }}
                </span>
                <span class="font-mono text-xs font-bold text-[#047857] tabular-nums">
                  Sisa {{ slot.remainingSpots }}/{{ slot.maxLearners }}
                </span>
              </div>
              <p class="text-[#526071]">
                {{ slot.format === 'online' ? 'Online (tautan tersedia di Ruang Sesi)' : 'Tatap Muka Kampus' }}
              </p>
            </div>
          </label>
        </div>
      </template>

      <template v-else>
        <div class="p-4 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] space-y-2.5">
          <p class="text-[13px] font-bold text-[#92400E]">Slot penuh? Masuk Daftar Tunggu 48 jam</p>
          <p class="text-xs text-[#475569] leading-relaxed">
            Tulis waktu pilihanmu. 1 kredit ditahan sementara dan kembali 100% otomatis jika tidak dijadwalkan dalam 48 jam.
          </p>
          <label for="hold-time-note" class="sr-only">Catatan waktu belajar yang diinginkan</label>
          <textarea
            id="hold-time-note"
            v-model="preferredTimeNote"
            rows="2"
            placeholder="Mis. Tersedia Selasa atau Kamis pukul 19:00 WIB via Meet."
            class="w-full px-3 py-2 rounded-[6px] border border-[#94A3B8] bg-white text-xs text-[#14181F]"
          />
        </div>
      </template>
    </div>

    <UiAlert v-if="bookingError" tone="danger" :title="bookingError" />
    <UiAlert v-if="bookingSuccess" tone="success" :title="bookingSuccess" />

    <!-- Action Bar -->
    <div class="pt-2 border-t border-[#E5E0D5] space-y-3">
      <UiAlert
        v-if="!isOwnSkill && hasInsufficientCredits"
        tone="danger"
        title="Kredit Saya 0 (Tidak Cukup)"
        description="Ajar 1 sesi 30 menit di Ajarkan Skill untuk mendapat +1 kredit belajar."
      >
        <template #action>
          <UiButton to="/teach" variant="danger-soft" size="sm">
            Ajarkan Skill
          </UiButton>
        </template>
      </UiAlert>

      <UiButton
        variant="primary"
        size="lg"
        block
        :loading="bookingLoading"
        :disabled="isOwnSkill || hasInsufficientCredits || (item.slots.length > 0 && !selectedSlotId)"
        @click="confirmBooking"
      >
        {{
          isOwnSkill
            ? 'Ini Penawaranmu Sendiri'
            : hasInsufficientCredits
              ? 'Kredit Saya Tidak Cukup'
              : bookingLoading
                ? 'Memproses Pemesanan…'
                : item.slots.length > 0
                  ? 'Pesan Sesi Ini (1 Kredit)'
                  : 'Ajukan Daftar Tunggu (1 Kredit)'
        }}
      </UiButton>

      <p class="text-xs text-[#526071] text-center leading-relaxed">
        1 kredit ditahan aman dalam pemesanan. Batal &gt;= 12 jam kembali 100%.
      </p>
    </div>

    <!-- Verified Reviews -->
    <div v-if="item.reviews.length > 0" class="pt-3 border-t border-[#E5E0D5] space-y-2.5">
      <p class="text-xs font-semibold text-[#526071]">
        Ulasan Terverifikasi Check-in QR ({{ item.reviews.length }})
      </p>
      <ul class="divide-y divide-[#E5E0D5]">
        <li v-for="rev in item.reviews.slice(0, 3)" :key="rev.id" class="py-2.5 space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-[#14181F]">{{ rev.reviewerName }}</span>
            <span class="font-mono font-bold text-[#047857] tabular-nums">{{ rev.rating }}/5</span>
          </div>
          <p class="text-xs text-[#475569] leading-relaxed">"{{ rev.comment }}"</p>
        </li>
      </ul>
    </div>
  </div>
</template>
