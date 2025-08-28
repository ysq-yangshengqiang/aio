<template>
  <div class="flex items-center justify-center" :class="containerClasses">
    <div class="relative">
      <!-- 主要加载动画 -->
      <div 
        class="animate-spin rounded-full border-solid border-t-transparent"
        :class="spinnerClasses"
      ></div>
      
      <!-- 内部装饰圆点 -->
      <div 
        v-if="showDots"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex space-x-1">
          <div 
            v-for="i in 3" 
            :key="i"
            class="rounded-full bg-current animate-pulse"
            :class="dotClasses"
            :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- 加载文本 -->
    <span 
      v-if="text" 
      class="ml-3 font-medium"
      :class="textClasses"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'extra-large'].includes(value)
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'red', 'yellow', 'purple', 'gray', 'white'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  showDots: {
    type: Boolean,
    default: false
  },
  fullScreen: {
    type: Boolean,
    default: false
  }
})

// 尺寸配置
const sizeConfig = {
  small: {
    spinner: 'w-4 h-4 border-2',
    dot: 'w-1 h-1',
    text: 'text-sm',
    container: 'p-2'
  },
  medium: {
    spinner: 'w-6 h-6 border-2',
    dot: 'w-1.5 h-1.5',
    text: 'text-base',
    container: 'p-3'
  },
  large: {
    spinner: 'w-8 h-8 border-3',
    dot: 'w-2 h-2',
    text: 'text-lg',
    container: 'p-4'
  },
  'extra-large': {
    spinner: 'w-12 h-12 border-4',
    dot: 'w-3 h-3',
    text: 'text-xl',
    container: 'p-6'
  }
}

// 颜色配置
const colorConfig = {
  blue: {
    spinner: 'border-blue-200 border-t-blue-600 text-blue-600',
    text: 'text-blue-600'
  },
  green: {
    spinner: 'border-green-200 border-t-green-600 text-green-600',
    text: 'text-green-600'
  },
  red: {
    spinner: 'border-red-200 border-t-red-600 text-red-600',
    text: 'text-red-600'
  },
  yellow: {
    spinner: 'border-yellow-200 border-t-yellow-600 text-yellow-600',
    text: 'text-yellow-600'
  },
  purple: {
    spinner: 'border-purple-200 border-t-purple-600 text-purple-600',
    text: 'text-purple-600'
  },
  gray: {
    spinner: 'border-gray-200 border-t-gray-600 text-gray-600',
    text: 'text-gray-600'
  },
  white: {
    spinner: 'border-white/30 border-t-white text-white',
    text: 'text-white'
  }
}

// 计算样式类
const containerClasses = computed(() => {
  const classes = [sizeConfig[props.size].container]
  
  if (props.fullScreen) {
    classes.push('fixed inset-0 bg-white/80 backdrop-blur-sm z-50')
  }
  
  return classes
})

const spinnerClasses = computed(() => {
  return [
    sizeConfig[props.size].spinner,
    colorConfig[props.color].spinner
  ]
})

const dotClasses = computed(() => {
  return [
    sizeConfig[props.size].dot,
    colorConfig[props.color].spinner.includes('text-') ? 
      colorConfig[props.color].spinner.split(' ').find(c => c.startsWith('text-')) : 
      'text-current'
  ]
})

const textClasses = computed(() => {
  return [
    sizeConfig[props.size].text,
    colorConfig[props.color].text
  ]
})
</script>

<style scoped>
/* 自定义动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 脉冲动画优化 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 边框宽度工具类 */
.border-3 {
  border-width: 3px;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .fixed.inset-0 {
    padding: 1rem;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .animate-spin {
    border-width: 3px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  
  .animate-pulse {
    animation: none;
  }
  
  /* 静态指示器 */
  .animate-spin {
    border-left-color: transparent;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .bg-white\/80 {
    background-color: rgba(17, 24, 39, 0.8);
  }
}
</style>