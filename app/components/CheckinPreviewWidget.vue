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
  <div class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-700">
          Demo Interaktif Pembeda Utama
        </p>
        <h3 class="text-base font-bold text-slate-900">
          Uji Alur Ulasan Terverifikasi QR
        </h3>
      </div>
      <button
        v-if="stage !== 'idle'"
        type="button"
        class="text-xs font-semibold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/70"
        @click="resetDemo"
      >
        Ulangi
      </button>
    </div>

    <Transition name="panel-slide" mode="out-in">
      <div v-if="stage === 'idle'" key="stage-idle" class="space-y-4">
        <div class="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
          <p class="text-xs font-semibold text-blue-950">Status Form Ulasan: Terkunci</p>
          <p class="text-xs text-slate-600 leading-relaxed">
            Di SkillBarter, mahasiswa tidak bisa mengirim ulasan palsu sebelum hadir dan memindai kode Check-in dari pengajar.
          </p>
        </div>

        <button
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[46px] transition-colors"
          @click="generateDemoCode"
        >
          <UIcon name="i-ph-qr-code" class="w-4 h-4" aria-hidden="true" />
          <span>1. Simulasi Pengajar: Buat Kode Check-in</span>
        </button>
      </div>

      <div v-else-if="stage === 'code_ready'" key="stage-code" class="space-y-4">
        <div class="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-blue-800">Kode Check-in Aktif (T-10m s.d. T+15m)</p>
            <p class="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-blue-950 tabular-nums">
              {{ demoCode }}
            </p>
          </div>
          <!-- Crisp geometric QR preview mark -->
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true" class="shrink-0 bg-white p-1.5 rounded-lg border border-blue-200">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="#1D4ED8" stroke-width="3" />
            <rect x="9" y="9" width="6" height="6" fill="#1D4ED8" />
            <rect x="36" y="4" width="16" height="16" rx="2" stroke="#1D4ED8" stroke-width="3" />
            <rect x="41" y="9" width="6" height="6" fill="#1D4ED8" />
            <rect x="4" y="36" width="16" height="16" rx="2" stroke="#1D4ED8" stroke-width="3" />
            <rect x="9" y="41" width="6" height="6" fill="#1D4ED8" />
            <rect x="26" y="26" width="6" height="6" fill="#0F172A" />
            <rect x="36" y="28" width="6" height="6" fill="#0F172A" />
            <rect x="28" y="38" width="10" height="6" fill="#0F172A" />
            <rect x="44" y="40" width="8" height="12" fill="#2563EB" />
          </svg>
        </div>

        <button
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold min-h-[46px] transition-colors"
          @click="verifyDemoCheckin"
        >
          <UIcon name="i-ph-check-circle" class="w-4 h-4" aria-hidden="true" />
          <span>2. Simulasi Pembelajar: Validasi Check-in</span>
        </button>
      </div>

      <div v-else key="stage-verified" class="space-y-3 verified-reveal">
        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <UIcon name="i-ph-seal-check-duotone" class="w-4 h-4 text-blue-700" aria-hidden="true" />
              Kehadiran Terverifikasi · Form Ulasan Terbuka
            </span>
            <span class="font-mono text-xs font-semibold text-blue-700 tabular-nums">5 / 5</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">
            Kredit masuk jeda sengketa 24 jam, dan ulasan terverifikasi langsung tercatat ke reputasi mentor.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>
