<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
  }>(),
  {
    description: undefined
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :ui="{
      content: 'bg-white border border-[#E5E0D5] rounded-[8px] shadow-popover'
    }"
  >
    <template #body>
      <slot />
    </template>
  </UModal>
</template>
