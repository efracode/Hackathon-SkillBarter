<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'light' | 'dark'
  }>(),
  {
    tone: 'light'
  }
)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-[4px] border leading-tight',
      tone === 'dark'
        ? 'bg-[#1D4ED8] text-white border-blue-500'
        : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
    ]"
  >
    <UIcon name="i-ph-check-circle" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <span>Verified UKSW</span>
  </span>
</template>
