<script setup lang="ts">
import { getUserInitials } from '~/utils/designTokens'

definePageMeta({
  layout: false
})

interface PreviewItem {
  id: string
  category: string
  title: string
  description: string | null
  tutorName: string
  tutorMeta: string
  isVerifiedUksw: boolean
  isVerifiedMentor: boolean
  completedSessions: number
  avgRating: number
  reviewCount: number
  latestReview: {
    rating: number
    comment: string
    reviewerName: string
  } | null
  hasOpenSlot: boolean
  slotBadge: string
}

interface PreviewPayload {
  stats: {
    activeSkills: number
    completedSessions: number
    verifiedReviews: number
  }
  previews: PreviewItem[]
}

const { loggedIn } = useUserSession()
const { data: previewData, status: previewStatus, refresh: refreshPreview } =
  useLazyFetch<PreviewPayload>('/api/preview')

const selectedCategory = ref('Semua')
const activeSpotlightId = ref<string | null>(null)

const categories = computed(() => {
  const list = previewData.value?.previews || []
  const unique = Array.from(new Set(list.map((p: PreviewItem) => p.category)))
  return ['Semua', ...unique]
})

const directoryList = computed(() => {
  const list = previewData.value?.previews || []
  if (selectedCategory.value === 'Semua') return list
  return list.filter((p: PreviewItem) => p.category === selectedCategory.value)
})

const spotlightItem = computed(() => {
  const list = directoryList.value
  if (activeSpotlightId.value) {
    const found = list.find((p: PreviewItem) => p.id === activeSpotlightId.value)
    if (found) return found
  }
  return list[0] || previewData.value?.previews?.[0] || null
})

function selectSpotlight(id: string) {
  activeSpotlightId.value = id
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F4] text-[#14181F]">
    <!-- Editorial Public Masthead -->
    <header class="sticky top-0 z-30 bg-white border-b border-[#E5E0D5]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-14 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" aria-label="SkillBarter Beranda" class="inline-flex items-center min-h-[44px] shrink-0">
          <SkillBarterLogo size="md" />
        </NuxtLink>

        <nav aria-label="Navigasi Landing" class="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#475569]">
          <a href="#cara-kerja" class="hover:text-[#14181F] transition-colors whitespace-nowrap">Cara Kerja</a>
          <a href="#direktori" class="hover:text-[#14181F] transition-colors whitespace-nowrap">Jelajahi Skill</a>
          <a href="#keamanan" class="hover:text-[#14181F] transition-colors whitespace-nowrap">Keamanan</a>
        </nav>

        <div class="flex items-center gap-2.5 shrink-0">
          <template v-if="loggedIn">
            <UiButton to="/dashboard" variant="primary" size="sm">
              Buka Dashboard
            </UiButton>
          </template>
          <template v-else>
            <span class="hidden sm:inline-flex">
              <UiButton to="/login" variant="secondary" size="sm">
                Masuk
              </UiButton>
            </span>
            <UiButton to="/login" variant="primary" size="sm">
              <span class="sm:hidden">Masuk</span>
              <span class="hidden sm:inline">Mulai Belajar</span>
            </UiButton>
          </template>
        </div>
      </div>
    </header>

    <main>
      <!-- Section 1: Split Editorial Hero (Notebook Grid Left + Ringkasan Pertukaran 1:1 Right) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 border-b border-[#E5E0D5]">
        <!-- Left 7 Cols: Notebook Grid Hero -->
        <div class="min-w-0 lg:col-span-7 bg-editorial-grid lg:border-r border-[#E5E0D5] px-4 sm:px-8 lg:px-14 py-10 sm:py-14 lg:py-16 flex flex-col justify-center">
          <div class="max-w-2xl space-y-6">
            <h1 class="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[#14181F]">
              Belajar skill praktis
              <span class="font-serif italic font-normal text-[#1D4ED8]">tanpa uang,</span>
              mengajar untuk kredit belajar.
            </h1>

            <p class="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl">
              Kesulitan mencari teman kampus yang bisa mengajari tugas atau keahlian baru? Di SkillBarter, kamu langsung mulai dengan +2 kredit awal untuk belajar dari sesama mahasiswa, lalu mengajar 1 sesi singkat agar kreditmu terus bertambah.
            </p>

            <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <UiButton
                :to="loggedIn ? '/dashboard' : '/login'"
                variant="primary"
                size="lg"
                class="w-full sm:w-auto"
              >
                {{ loggedIn ? 'Lanjut ke Dashboard' : 'Mulai Belajar (+2 Kredit)' }}
              </UiButton>
              <UiButton
                href="#direktori"
                variant="secondary"
                size="lg"
                class="w-full sm:w-auto"
              >
                Jelajahi Skill
              </UiButton>
            </div>

            <p class="text-xs text-[#526071] leading-relaxed max-w-xl pt-1">
              Berdasarkan survei awal 30 mahasiswa: kebutuhan belajar lintas jurusan mencapai 4,3/5, sedangkan 23 dari 30 responden ragu langsung mengajar. Karena itu pengguna baru diberi +2 kredit untuk belajar dulu.
            </p>
          </div>
        </div>

        <!-- Right 5 Cols: Ringkasan Pertukaran 1:1 -->
        <div class="min-w-0 lg:col-span-5 bg-white px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16 flex flex-col justify-center">
          <div class="max-w-md space-y-5">
            <div class="space-y-1.5">
              <h2 class="text-xl font-bold text-[#14181F]">Ringkasan pertukaran 1:1</h2>
              <p class="text-[13px] text-[#526071]">
                Aturan sederhana tanpa uang tunai dan tanpa saldo minus.
              </p>
            </div>

            <dl class="divide-y divide-[#E5E0D5] border-y border-[#E5E0D5]">
              <div class="py-4 grid grid-cols-12 gap-3 items-start">
                <dt class="min-w-0 col-span-4 font-mono text-sm sm:text-base font-bold text-[#1D4ED8] tabular-nums">+2 Kredit</dt>
                <dd class="min-w-0 col-span-8 space-y-0.5">
                  <p class="text-[13px] font-bold text-[#14181F]">Modal awal setelah profil siap</p>
                  <p class="text-xs text-[#475569] leading-relaxed">
                    Langsung bisa pesan sesi belajar tanpa wajib mengajar dulu.
                  </p>
                </dd>
              </div>

              <div class="py-4 grid grid-cols-12 gap-3 items-start">
                <dt class="min-w-0 col-span-4 font-mono text-sm sm:text-base font-bold text-[#92400E] tabular-nums">1 Kredit</dt>
                <dd class="min-w-0 col-span-8 space-y-0.5">
                  <p class="text-[13px] font-bold text-[#14181F]">Biaya 1 sesi belajar (30 atau 60m)</p>
                  <p class="text-xs text-[#475569] leading-relaxed">
                    Kredit disimpan aman selama pemesanan dan cair usai sesi.
                  </p>
                </dd>
              </div>

              <div class="py-4 grid grid-cols-12 gap-3 items-start">
                <dt class="min-w-0 col-span-4 font-mono text-sm sm:text-base font-bold text-[#047857] tabular-nums">+1 s.d. +2</dt>
                <dd class="min-w-0 col-span-8 space-y-0.5">
                  <p class="text-[13px] font-bold text-[#14181F]">Pendapatan setiap sesi mengajar</p>
                  <p class="text-xs text-[#475569] leading-relaxed">
                    Sesi 1-on-1 mendapat 1 kredit, sesi grup 2–5 orang maksimal 2 kredit.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <!-- Section 2: Four-Step Explanation Strip -->
      <section id="cara-kerja" class="bg-white border-b border-[#E5E0D5]">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-14 space-y-7">
          <h2 class="text-2xl sm:text-[28px] font-bold tracking-tight text-[#14181F]">
            Cara kerja SkillBarter dalam empat tahap
          </h2>

          <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E0D5] border-y border-[#E5E0D5]">
            <li class="py-5 sm:pr-6 space-y-1.5">
              <p class="font-mono text-xs font-bold text-[#1D4ED8]">01</p>
              <h3 class="text-[15px] font-bold text-[#14181F]">Cari skill yang kamu butuhkan</h3>
              <p class="text-xs text-[#475569] leading-relaxed">
                Pilih topik praktis seperti Figma, TypeScript, presentasi, atau bedah CV dari mahasiswa lain.
              </p>
            </li>
            <li class="py-5 sm:px-6 space-y-1.5">
              <p class="font-mono text-xs font-bold text-[#1D4ED8]">02</p>
              <h3 class="text-[15px] font-bold text-[#14181F]">Pesan sesi pakai kredit</h3>
              <p class="text-xs text-[#475569] leading-relaxed">
                Gunakan +2 kredit awalmu untuk memilih jadwal terbuka atau mengajukan Daftar Tunggu 48 jam.
              </p>
            </li>
            <li class="py-5 sm:px-6 space-y-1.5">
              <p class="font-mono text-xs font-bold text-[#1D4ED8]">03</p>
              <h3 class="text-[15px] font-bold text-[#14181F]">Ajarkan skill untuk dapat kredit</h3>
              <p class="text-xs text-[#475569] leading-relaxed">
                Buka sesi singkat 30 menit atau grup 60 menit sesuai keahlianmu untuk memperoleh kredit.
              </p>
            </li>
            <li class="py-5 sm:pl-6 space-y-1.5">
              <p class="font-mono text-xs font-bold text-[#1D4ED8]">04</p>
              <h3 class="text-[15px] font-bold text-[#14181F]">Gunakan kredit untuk belajar lagi</h3>
              <p class="text-xs text-[#475569] leading-relaxed">
                Tukar kredit hasil mengajarmu untuk mempelajari skill baru lintas jurusan kapan saja.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Section 3: Master-Detail Public Mentor Directory -->
      <section id="direktori" class="bg-[#FAF8F4] border-b border-[#E5E0D5]">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16 space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div class="space-y-1">
              <h2 class="text-2xl sm:text-[28px] font-bold tracking-tight text-[#14181F]">
                Jelajahi mentor aktif sebelum masuk
              </h2>
              <p class="text-sm text-[#475569]">
                Data penawaran diambil langsung dari database aplikasi. Kamu bisa melihat profil, jadwal, dan ulasan tanpa login.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <p class="font-mono text-xs font-semibold text-[#14181F] tabular-nums">
                {{ previewData?.stats?.activeSkills ?? 0 }} Skill Aktif | {{ previewData?.stats?.completedSessions ?? 0 }} Sesi Selesai | {{ previewData?.stats?.verifiedReviews ?? 0 }} Ulasan QR
              </p>
            </div>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori pratinjau">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              role="tab"
              :aria-selected="selectedCategory === cat"
              :class="[
                'px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-colors min-h-[38px]',
                selectedCategory === cat
                  ? 'bg-[#14181F] text-white border-[#14181F]'
                  : 'bg-white text-[#475569] border-[#E5E0D5] hover:border-[#94A3B8]'
              ]"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="previewStatus === 'pending'" aria-busy="true" class="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
            <div class="lg:col-span-7 space-y-3">
              <p class="text-xs text-[#526071]">Memuat daftar pratinjau mentor...</p>
              <div v-for="n in 2" :key="n" class="h-24 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
            </div>
            <div class="lg:col-span-5 h-64 bg-white border border-[#E5E0D5] rounded-[8px] animate-pulse" />
          </div>

          <!-- Error State -->
          <UiAlert
            v-else-if="previewStatus === 'error'"
            tone="danger"
            title="Gagal memuat pratinjau direktori mentor"
            description="Periksa koneksi lalu coba lagi."
          >
            <template #action>
              <UiButton variant="danger-soft" size="sm" @click="refreshPreview()">
                Coba Lagi
              </UiButton>
            </template>
          </UiAlert>

          <!-- Empty State -->
          <div
            v-else-if="directoryList.length === 0"
            class="py-12 px-6 text-center bg-white border border-dashed border-[#E5E0D5] rounded-[8px] space-y-3"
          >
            <p class="text-sm font-semibold text-[#14181F]">Belum ada penawaran pada kategori ini.</p>
            <UiButton variant="secondary" size="sm" @click="selectedCategory = 'Semua'">
              Tampilkan Semua Kategori
            </UiButton>
          </div>

          <!-- Master-Detail List & Spotlight -->
          <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div class="min-w-0 lg:col-span-7 space-y-3">
              <button
                v-for="item in directoryList"
                :key="item.id"
                type="button"
                :class="[
                  'w-full text-left p-4 sm:p-5 rounded-[8px] border bg-white transition-colors space-y-2',
                  spotlightItem?.id === item.id
                    ? 'border-[#1D4ED8]'
                    : 'border-[#E5E0D5] hover:border-[#94A3B8]'
                ]"
                @click="selectSpotlight(item.id)"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-[#1D4ED8]">{{ item.category }}</span>
                  <UiBadge
                    :tone="item.hasOpenSlot ? 'success' : 'warning'"
                    :icon="item.hasOpenSlot ? 'i-ph-calendar-check' : 'i-ph-clock'"
                  >
                    {{ item.slotBadge }}
                  </UiBadge>
                </div>

                <h3 class="text-base font-bold text-[#14181F]">{{ item.title }}</h3>

                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526071] tabular-nums">
                  <span class="font-semibold text-[#14181F]">{{ item.tutorName }}</span>
                  <VerifiedUkswBadge v-if="item.isVerifiedUksw" />
                  <span v-if="item.tutorMeta">| {{ item.tutorMeta }}</span>
                  <span v-if="item.isVerifiedMentor">| Verified Peer Mentor</span>
                  <span v-if="item.reviewCount > 0" class="font-mono text-[#14181F]">
                    | {{ item.avgRating.toFixed(1) }}/5 ({{ item.reviewCount }} ulasan)
                  </span>
                </div>
              </button>
            </div>

            <aside
              v-if="spotlightItem"
              class="min-w-0 lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5"
            >
              <div class="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E0D5]">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-[6px] bg-[#14181F] text-[#FAF8F4] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {{ getUserInitials(spotlightItem.tutorName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <p class="text-sm font-bold text-[#14181F] truncate">{{ spotlightItem.tutorName }}</p>
                      <VerifiedUkswBadge v-if="spotlightItem.isVerifiedUksw" />
                    </div>
                    <p class="text-xs text-[#526071] truncate">
                      {{ spotlightItem.tutorMeta || 'Peer Mentor SkillBarter' }}
                    </p>
                  </div>
                </div>

                <UiBadge v-if="spotlightItem.isVerifiedMentor" tone="primary" icon="i-ph-medal">
                  Verified Mentor
                </UiBadge>
              </div>

              <div class="space-y-2">
                <h3 class="text-lg font-bold text-[#14181F] leading-snug">
                  {{ spotlightItem.title }}
                </h3>
                <p v-if="spotlightItem.description" class="text-[13px] text-[#475569] leading-relaxed">
                  {{ spotlightItem.description }}
                </p>
              </div>

              <div v-if="spotlightItem.latestReview" class="p-4 rounded-[6px] bg-[#FAF8F4] border border-[#E5E0D5] space-y-1.5">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-[#047857]">Ulasan terverifikasi check-in QR</span>
                  <span class="font-mono text-[#14181F] tabular-nums">{{ spotlightItem.latestReview.rating }}/5</span>
                </div>
                <p class="text-xs text-[#14181F] leading-relaxed">
                  "{{ spotlightItem.latestReview.comment }}"
                </p>
                <p class="text-[11px] text-[#526071]">
                  Oleh {{ spotlightItem.latestReview.reviewerName }}
                </p>
              </div>

              <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span class="font-mono text-xs font-bold text-[#14181F] tabular-nums">
                  1 Kredit / sesi
                </span>
                <UiButton :to="loggedIn ? '/explore' : '/login'" variant="primary" size="md">
                  {{ loggedIn ? 'Pesan di Jelajah' : 'Masuk untuk Pesan' }}
                </UiButton>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- Section 4: Verifiable Safety Rules -->
      <section id="keamanan" class="bg-white border-b border-[#E5E0D5]">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div class="min-w-0 lg:col-span-5 space-y-2.5">
              <h2 class="text-2xl sm:text-[28px] font-bold tracking-tight text-[#14181F]">
                Keamanan belajar yang bisa diverifikasi
              </h2>
              <p class="text-sm text-[#475569] leading-relaxed">
                Setiap aturan dirancang agar pembelajar tidak kehilangan kredit dan pengajar mendapat penghargaan yang adil.
              </p>
            </div>

            <dl class="min-w-0 lg:col-span-7 divide-y divide-[#E5E0D5] border-y border-[#E5E0D5] text-sm">
              <div class="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
                <dt class="sm:col-span-5 font-semibold text-[#14181F]">Verifikasi email kampus</dt>
                <dd class="sm:col-span-7 text-xs sm:text-[13px] text-[#475569] leading-relaxed">
                  Domain <code class="font-mono text-[#14181F]">@student.uksw.edu</code> dan <code class="font-mono text-[#14181F]">@uksw.edu</code> otomatis mendapat lencana Verified UKSW (Gmail umum tetap bisa ikut).
                </dd>
              </div>
              <div class="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
                <dt class="sm:col-span-5 font-semibold text-[#14181F]">Perlindungan kredit pemesanan</dt>
                <dd class="sm:col-span-7 text-xs sm:text-[13px] text-[#475569] leading-relaxed">
                  1 kredit ditahan aman saat memesan, lalu menunggu jeda perlindungan 24 jam setelah check-in sebelum cair ke pengajar.
                </dd>
              </div>
              <div class="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
                <dt class="sm:col-span-5 font-semibold text-[#14181F]">Check-in kehadiran &amp; ulasan asli</dt>
                <dd class="sm:col-span-7 text-xs sm:text-[13px] text-[#475569] leading-relaxed">
                  Pengajar menerbitkan kode 6 digit + QR pada T-10m s.d. T+15m. Form ulasan hanya terbuka setelah check-in berhasil.
                </dd>
              </div>
              <div class="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
                <dt class="sm:col-span-5 font-semibold text-[#14181F]">Aturan pembatalan &amp; no-show</dt>
                <dd class="sm:col-span-7 text-xs sm:text-[13px] text-[#475569] leading-relaxed">
                  Batal &gt;= 12 jam kembali 100%. Jika pengajar tidak hadir, kredit kembali 100% dan pengajar menerima cooldown 1, 3, atau 7 hari.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <!-- Section 5: Dark Bottom CTA Band -->
      <section class="bg-[#14181F] text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
              Mulai sesi belajar pertamamu tanpa biaya uang
            </h2>
            <p class="text-sm text-slate-300">
              Masuk dengan akun Google kampus atau Gmail dan langsung terima +2 kredit awal.
            </p>
          </div>

          <UiButton :to="loggedIn ? '/dashboard' : '/login'" variant="primary" size="lg">
            {{ loggedIn ? 'Buka Dashboard' : 'Masuk dengan Google' }}
          </UiButton>
        </div>
      </section>
    </main>

    <!-- Editorial Footer -->
    <footer class="bg-[#FAF8F4] border-t border-[#E5E0D5] py-7">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <SkillBarterLogo size="sm" />
          <span class="hidden sm:inline text-[#E5E0D5]" aria-hidden="true">|</span>
          <span class="text-xs text-[#526071]">Belajar tanpa uang, mengajar untuk kredit.</span>
        </div>

        <div class="flex flex-wrap items-center gap-5 text-xs font-medium text-[#475569]">
          <a href="#cara-kerja" class="hover:text-[#14181F] transition-colors">Cara Kerja</a>
          <a href="#direktori" class="hover:text-[#14181F] transition-colors">Jelajahi Skill</a>
          <a href="#keamanan" class="hover:text-[#14181F] transition-colors">Keamanan</a>
          <NuxtLink
            :to="loggedIn ? '/dashboard' : '/login'"
            class="font-semibold text-[#1D4ED8] hover:underline"
          >
            {{ loggedIn ? 'Buka Dashboard' : 'Masuk dengan Google' }}
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
