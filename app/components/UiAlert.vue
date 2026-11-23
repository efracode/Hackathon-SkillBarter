<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: 'info' | 'warning' | 'danger' | 'success'
    title: string
    description?: string
    icon?: string
  }>(),
  {
    tone: 'info',
    description: undefined,
    icon: undefined
  }
)

const toneMap = {
  info: {
    wrap: 'bg-[#EFF6FF] border-[#BFDBFE]',
    title: 'text-[#1D4ED8]',
    desc: 'text-[#475569]',
    defaultIcon: 'i-ph-info'
  },
  warning: {
    wrap: 'bg-[#FFFBEB] border-[#FDE68A]',
    title: 'text-[#92400E]',
    desc: 'text-[#475569]',
    defaultIcon: 'i-ph-clock'
  },
  danger: {
    wrap: 'bg-[#FFF1F2] border-[#FECDD3]',
    title: 'text-[#BE123C]',
    desc: 'text-[#475569]',
    defaultIcon: 'i-ph-warning-circle'
  },
  success: {
    wrap: 'bg-[#ECFDF5] border-[#A7F3D0]',
    title: 'text-[#047857]',
    desc: 'text-[#475569]',
    defaultIcon: 'i-ph-check-circle'
  }
} as const

const style = computed(() => toneMap[props.tone])
</script>

<template>
  <div
    :role="tone === 'danger' ? 'alert' : 'status'"
    :class="['rounded-[8px] border p-3.5 flex items-start justify-between gap-3', style.wrap]"
  >
    <div class="flex items-start gap-2.5 min-w-0">
      <UIcon
        :name="icon || style.defaultIcon"
        :class="['w-4 h-4 mt-0.5 shrink-0', style.title]"
        aria-hidden="true"
      />
      <div class="space-y-0.5 min-w-0">
        <p :class="['text-[13px] font-bold leading-snug', style.title]">{{ title }}</p>
        <p v-if="description" :class="['text-xs leading-relaxed', style.desc]">{{ description }}</p>
        <slot />
      </div>
    </div>
    <div v-if="$slots.action" class="shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
