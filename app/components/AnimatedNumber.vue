<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    duration?: number
    prefix?: string
    suffix?: string
  }>(),
  {
    decimals: 0,
    duration: 520,
    prefix: '',
    suffix: ''
  }
)

const displayed = ref(props.value)
let rafId: number | null = null

function animateTo(target: number) {
  if (rafId !== null && import.meta.client) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (!import.meta.client || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayed.value = target
    return
  }

  const from = displayed.value
  const start = performance.now()
  const duration = Math.max(120, props.duration)

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayed.value = from + (target - from) * eased
    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      displayed.value = target
      rafId = null
    }
  }

  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (props.value > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayed.value = 0
    animateTo(props.value)
  } else {
    displayed.value = props.value
  }
})

watch(
  () => props.value,
  (next: number) => {
    animateTo(next)
  }
)

onUnmounted(() => {
  if (rafId !== null && import.meta.client) {
    cancelAnimationFrame(rafId)
  }
})

const formatted = computed(() => {
  const num = props.decimals > 0 ? displayed.value.toFixed(props.decimals) : String(Math.round(displayed.value))
  return `${props.prefix}${num}${props.suffix}`
})
</script>

<template>
  <span class="tabular-nums">{{ formatted }}</span>
</template>
