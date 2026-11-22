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
      'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border',
      tone === 'dark'
        ? 'bg-blue-950/90 text-blue-200 border-blue-700'
        : 'bg-blue-50 text-blue-800 border-blue-200'
    ]"
  >
    <UIcon name="i-ph-shield-check" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <span>Verified UKSW</span>
  </span>
</template>
