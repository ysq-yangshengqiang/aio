<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        v-show="notification.visible"
        class="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
        :class="[notification.bgColor, notification.borderColor]"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                :class="notification.iconColor">
                {{ notification.icon }}
              </div>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium" :class="notification.textColor">
                {{ notification.message }}
              </p>
              <div v-if="notification.description" class="mt-1 text-sm" :class="notification.textColor">
                {{ notification.description }}
              </div>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeNotification(notification.id)"
                class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">关闭</span>
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div v-if="notification.duration > 0" class="h-1 bg-gray-200">
          <div 
            class="h-full transition-all ease-linear"
            :class="{
              'bg-green-400': notification.type === 'success',
              'bg-red-400': notification.type === 'error',
              'bg-yellow-400': notification.type === 'warning',
              'bg-blue-400': notification.type === 'info'
            }"
            :style="{
              width: '100%',
              animation: `shrink ${notification.duration}ms linear forwards`
            }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { globalNotification } from '../../composables/useNotification.js'

const { notifications, removeNotification } = globalNotification
</script>

<style scoped>
/* 通知动画 */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 进度条动画 */
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 悬停暂停动画 */
.notification-item:hover .progress-bar {
  animation-play-state: paused;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .notification-container {
    left: 1rem;
    right: 1rem;
    top: 1rem;
  }
  
  .notification-item {
    max-width: none;
  }
}
</style>