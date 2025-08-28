<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- 背景遮罩 -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="handleCancel"
      ></div>

      <!-- 对话框 -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <!-- 图标 -->
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
              :class="iconClasses">
              <component :is="iconComponent" class="h-6 w-6" />
            </div>
            
            <!-- 内容 -->
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ title }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 按钮区域 -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            :class="confirmButtonClasses"
            @click="handleConfirm"
            :disabled="loading"
          >
            <LoadingSpinner v-if="loading" class="w-4 h-4 mr-2" />
            {{ confirmText }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="handleCancel"
            :disabled="loading"
          >
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: '您确定要执行此操作吗？'
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info, success
    validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

// 图标配置
const iconConfig = {
  warning: {
    component: ExclamationTriangleIcon,
    classes: 'bg-yellow-100 text-yellow-600'
  },
  danger: {
    component: XCircleIcon,
    classes: 'bg-red-100 text-red-600'
  },
  info: {
    component: InformationCircleIcon,
    classes: 'bg-blue-100 text-blue-600'
  },
  success: {
    component: CheckCircleIcon,
    classes: 'bg-green-100 text-green-600'
  }
}

// 按钮配置
const buttonConfig = {
  warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
}

const iconComponent = computed(() => iconConfig[props.type].component)
const iconClasses = computed(() => iconConfig[props.type].classes)
const confirmButtonClasses = computed(() => buttonConfig[props.type])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<style scoped>
/* 动画效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>