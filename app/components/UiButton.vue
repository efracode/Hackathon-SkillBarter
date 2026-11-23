<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'dark' | 'secondary' | 'danger' | 'danger-soft' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    to?: string
    href?: string
    disabled?: boolean
    loading?: boolean
    block?: boolean
    icon?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    to: undefined,
    href: undefined,
    disabled: false,
    loading: false,
    block: false,
    icon: undefined
  }
)

const variantClasses: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border border-transparent',
  dark: 'bg-[#14181F] hover:bg-slate-800 text-white border border-transparent',
  secondary: 'bg-white hover:border-[#14181F] text-[#14181F] border border-[#94A3B8]',
  danger: 'bg-[#BE123C] hover:bg-[#9F1239] text-white border border-transparent',
  'danger-soft': 'bg-[#FFF1F2] hover:bg-rose-100 text-[#BE123C] border border-[#FECDD3]',
  ghost: 'bg-transparent hover:bg-[#F3EFE6] text-[#14181F] border border-transparent'
}

const sizeClasses: Record<NonNullable<typeof props.size>, string> = {
  sm: 'px-3.5 py-2 text-xs min-h-[40px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-5 py-3 text-sm min-h-[48px]'
}

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold transition-colors whitespace-nowrap select-none',
  'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
  isDisabled.value ? 'opacity-60 pointer-events-none' : '',
  props.block ? 'w-full' : '',
  variantClasses[props.variant],
  sizeClasses[props.size]
])
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
    :aria-disabled="isDisabled ? 'true' : undefined"
  >
    <UIcon
      v-if="loading"
      name="i-ph-spinner-gap"
      class="w-4 h-4 animate-spin shrink-0"
      aria-hidden="true"
    />
    <UIcon
      v-else-if="icon"
      :name="icon"
      class="w-4 h-4 shrink-0"
      aria-hidden="true"
    />
    <slot />
  </NuxtLink>

  <a
    v-else-if="href"
    :href="href"
    :class="classes"
    :aria-disabled="isDisabled ? 'true' : undefined"
  >
    <UIcon
      v-if="loading"
      name="i-ph-spinner-gap"
      class="w-4 h-4 animate-spin shrink-0"
      aria-hidden="true"
    />
    <UIcon
      v-else-if="icon"
      :name="icon"
      class="w-4 h-4 shrink-0"
      aria-hidden="true"
    />
    <slot />
  </a>

  <button
    v-else
    :type="type"
    :disabled="isDisabled"
    :class="classes"
  >
    <UIcon
      v-if="loading"
      name="i-ph-spinner-gap"
      class="w-4 h-4 animate-spin shrink-0"
      aria-hidden="true"
    />
    <UIcon
      v-else-if="icon"
      :name="icon"
      class="w-4 h-4 shrink-0"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
