<script setup lang="ts">
const stage = ref<'idle' | 'code_ready' | 'verified'>('idle')
const demoCode = ref('482910')

function generateDemoCode() {
  demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
  stage.value = 'code_ready'
}

function verifyDemoCheckin() {
  stage.value = 'verified'
}

function resetDemo() {
  stage.value = 'idle'
}
</script>

<template>
  <div class="bg-[#FAF8F4] border border-[#E5E0D5] rounded-[8px] p-5 sm:p-6 space-y-5">
    <div class="flex items-start justify-between gap-2 pb-4 border-b border-[#E5E0D5]">
      <div>
        <p class="text-xs font-semibold text-[#526071]">
          Ulasan Terikat Kehadiran
        </p>
        <h3 class="text-lg font-bold text-[#14181F] mt-0.5">
          Uji Verifikasi Check-in QR
        </h3>
      </div>
      <button
        v-if="stage !== 'idle'"
        type="button"
        class="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] px-2.5 py-1 rounded-[4px] border border-[#BFDBFE] bg-[#EFF6FF] min-h-[36px]"
        @click="resetDemo"
      >
        Ulangi
      </button>
    </div>

    <Transition name="panel-slide" mode="out-in">
      <div v-if="stage === 'idle'" key="stage-idle" class="space-y-4">
        <div class="p-4 rounded-[6px] bg-white border border-[#E5E0D5] space-y-1.5">
          <p class="text-xs font-bold text-[#14181F]">Form Ulasan Terkunci Secara Default</p>
          <p class="text-xs text-[#475569] leading-relaxed">
            Mahasiswa tidak dapat mengirim rating palsu sebelum hadir di sesi dan memindai kode 6-digit dari pengajar.
          </p>
        </div>

        <UiButton variant="primary" size="lg" block icon="i-ph-qr-code" @click="generateDemoCode">
          1. Simulasi Pengajar: Terbitkan Kode
        </UiButton>
      </div>

      <div v-else-if="stage === 'code_ready'" key="stage-code" class="space-y-4">
        <div class="p-4 rounded-[6px] bg-white border border-[#E5E0D5] flex items-center justify-between gap-4">
          <div class="space-y-1">
            <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1D4ED8]">
              Window T-10m s.d. T+15m
            </p>
            <p class="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-[#14181F] tabular-nums">
              {{ demoCode }}
            </p>
          </div>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true" class="shrink-0 bg-white p-1.5 rounded-[4px] border border-[#E5E0D5]">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="#14181F" stroke-width="3" />
            <rect x="9" y="9" width="6" height="6" fill="#14181F" />
            <rect x="36" y="4" width="16" height="16" rx="2" stroke="#14181F" stroke-width="3" />
            <rect x="41" y="9" width="6" height="6" fill="#14181F" />
            <rect x="4" y="36" width="16" height="16" rx="2" stroke="#14181F" stroke-width="3" />
            <rect x="9" y="41" width="6" height="6" fill="#14181F" />
            <rect x="26" y="26" width="6" height="6" fill="#1D4ED8" />
            <rect x="36" y="28" width="6" height="6" fill="#14181F" />
            <rect x="28" y="38" width="10" height="6" fill="#14181F" />
            <rect x="44" y="40" width="8" height="12" fill="#1D4ED8" />
          </svg>
        </div>

        <UiButton variant="secondary" size="lg" block icon="i-ph-check-circle" @click="verifyDemoCheckin">
          2. Simulasi Pembelajar: Validasi Hadir
        </UiButton>
      </div>

      <div v-else key="stage-verified" class="space-y-3 verified-reveal">
        <div class="p-4 rounded-[6px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857]">
              <UIcon name="i-ph-check-circle" class="w-4 h-4 text-[#047857]" aria-hidden="true" />
              Hadir Terverifikasi | Ulasan Terbuka
            </span>
            <span class="font-mono text-xs font-bold text-[#047857] tabular-nums">5 / 5</span>
          </div>
          <p class="text-xs text-[#475569] leading-relaxed">
            Kredit masuk jeda sengketa 24 jam, dan rating tercatat permanen ke reputasi pengajar.
          </p>
        </div>
      </div>
    </Transition>

    <div class="pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-[11px] text-[#526071]">
      <span>100% ulasan terikat booking ID</span>
      <span class="font-mono font-semibold text-[#14181F]">Anti-Fake Review</span>
    </div>
  </div>
</template>
