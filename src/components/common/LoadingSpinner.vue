<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div
      class="animate-spin rounded-full border-solid border-current"
      :class="spinnerClass"
      :style="{ borderTopColor: 'transparent' }"
    >
    </div>
    <span v-if="text" class="ml-3 text-gray-600" :class="textClass">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'indigo'
  }
})

const spinnerClass = computed(() => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-4'
  }
  
  const colorClasses = {
    indigo: 'text-indigo-600',
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600'
  }
  
  return `${sizeClasses[props.size]} ${colorClasses[props.color] || colorClasses.indigo}`
})

const textClass = computed(() => {
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }
  
  return sizeClasses[props.size]
})

const containerClass = computed(() => {
  return props.size === 'large' ? 'p-8' : 'p-4'
})
</script>