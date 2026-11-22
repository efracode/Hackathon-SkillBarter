<script setup lang="ts">
withDefaults(
  defineProps<{
    showWordmark?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    showWordmark: true,
    size: 'md'
  }
)

const sizeMap = {
  sm: { box: 28, text: 'text-base' },
  md: { box: 32, text: 'text-lg' },
  lg: { box: 40, text: 'text-2xl' }
}
</script>

<template>
  <span class="inline-flex items-center gap-2.5 select-none">
    <svg
      :width="sizeMap[size].box"
      :height="sizeMap[size].box"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" fill="#EFF6FF" />
      <path
        d="M10 13.5H23.5L19.5 9.5"
        stroke="#2563EB"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M26 22.5H12.5L16.5 26.5"
        stroke="#0284C7"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span
      v-if="showWordmark"
      :class="['font-semibold tracking-tight text-slate-900', sizeMap[size].text]"
    >
      Skill<span class="text-blue-600">Barter</span>
    </span>
  </span>
</template>
