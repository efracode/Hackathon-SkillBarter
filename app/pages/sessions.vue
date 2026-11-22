<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sesi Saya</h1>
      <p class="text-sm text-slate-600">
        Pantau sesi mendatang, antrean Hold Queue, dan riwayat check-in.
      </p>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <UIcon name="i-ph-calendar-check" class="w-10 h-10 text-indigo-600 mx-auto mb-3" aria-hidden="true" />
      <h2 class="text-base font-semibold text-slate-900">Belum ada sesi terjadwal</h2>
      <p class="mt-1 text-sm text-slate-600 mb-4">
        Booking sesi dari direktori Jelajah atau buka penawaran mengajar baru.
      </p>
      <NuxtLink
        to="/explore"
        class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
      >
        Cari Mentor di Jelajah
      </NuxtLink>
    </div>
  </div>
</template>
