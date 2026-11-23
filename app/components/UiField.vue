<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    label: string
    required?: boolean
    hint?: string
    error?: string
  }>(),
  {
    id: undefined,
    required: false,
    hint: undefined,
    error: undefined
  }
)
</script>

<template>
  <div class="space-y-1.5">
    <label
      :for="id"
      class="block text-[13px] font-semibold text-[#14181F]"
    >
      {{ label }}
      <span v-if="required" class="text-[#BE123C]" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs font-medium text-[#BE123C]" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-[#526071]">
      {{ hint }}
    </p>
  </div>
</template>
