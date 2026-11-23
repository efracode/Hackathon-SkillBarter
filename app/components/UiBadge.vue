<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
    icon?: string
    mono?: boolean
  }>(),
  {
    tone: 'neutral',
    icon: undefined,
    mono: false
  }
)

const toneClasses: Record<NonNullable<typeof props.tone>, string> = {
  primary: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  success: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
  warning: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  danger: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
  neutral: 'bg-[#F3EFE6] text-[#475569] border-[#E5E0D5]'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-xs font-semibold leading-tight',
      mono ? 'font-mono tabular-nums' : '',
      toneClasses[tone]
    ]"
  >
    <UIcon v-if="icon" :name="icon" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <slot />
  </span>
</template>
