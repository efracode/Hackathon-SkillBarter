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
  sm: { box: 26, text: 'text-base' },
  md: { box: 30, text: 'text-lg' },
  lg: { box: 38, text: 'text-2xl' }
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
      <rect x="1" y="1" width="34" height="34" rx="5" fill="#14181F" />
      <path
        d="M10 13.5H23.5L19.5 9.5"
        stroke="#FAF8F4"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M26 22.5H12.5L16.5 26.5"
        stroke="#60A5FA"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span
      v-if="showWordmark"
      :class="['font-bold tracking-tight text-[#14181F]', sizeMap[size].text]"
    >
      Skill<span class="font-serif italic font-normal text-blue-700">Barter</span>
    </span>
  </span>
</template>
