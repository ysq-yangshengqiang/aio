<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="large" />
    </div>
    
    <!-- 主应用界面 -->
    <div v-else class="flex h-screen">
      <!-- 侧边栏 -->
      <AppSidebar 
        v-if="isAuthenticated" 
        :open="sidebarOpen" 
        @toggle="toggleSidebar"
        class="hidden lg:block"
      />
      
      <!-- 移动端侧边栏遮罩 -->
      <div 
        v-if="sidebarOpen && isAuthenticated" 
        class="fixed inset-0 z-40 lg:hidden"
        @click="toggleSidebar"
      >
        <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
      </div>
      
      <!-- 移动端侧边栏 -->
      <AppSidebar 
        v-if="isAuthenticated"
        :open="sidebarOpen" 
        @toggle="toggleSidebar"
        class="lg:hidden"
      />
      
      <!-- 主内容区域 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- 顶部导航 -->
        <AppHeader 
          v-if="isAuthenticated"
          :user="user"
          @toggle-sidebar="toggleSidebar"
        />
        
        <!-- 页面内容 -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div class="container mx-auto px-6 py-8">
            <router-view />
          </div>
        </main>
        
        <!-- 底部 -->
        <AppFooter v-if="isAuthenticated" />
      </div>
    </div>
    
    <!-- 全局通知 -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center"
                :class="{
                  'bg-green-100 text-green-600': notification.type === 'success',
                  'bg-red-100 text-red-600': notification.type === 'error',
                  'bg-yellow-100 text-yellow-600': notification.type === 'warning',
                  'bg-blue-100 text-blue-600': notification.type === 'info'
                }"
              >
                <span class="text-sm">
                  {{ notification.type === 'success' ? '✓' : 
                     notification.type === 'error' ? '✗' : 
                     notification.type === 'warning' ? '⚠' : 'ℹ' }}
                </span>
              </div>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-sm text-gray-500">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeNotification(notification.id)"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">关闭</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './lib/supabase.js'
import { authService } from './services/auth.service.js'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import LoadingSpinner from './components/common/LoadingSpinner.vue'

const router = useRouter()
const isLoading = ref(true)
const sidebarOpen = ref(false)
const user = ref(null)
const isAuthenticated = ref(false)
const notifications = ref([])

// 监听认证状态变化
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.id)
  
  if (session?.user) {
    user.value = session.user
    isAuthenticated.value = true
    
    // 确保用户在数据库中有记录
    try {
      await authService.ensureUserProfile(session.user)
    } catch (error) {
      console.error('Error ensuring user profile:', error)
    }
  } else {
    user.value = null
    isAuthenticated.value = false
  }
})

onMounted(async () => {
  try {
    // 检查当前会话
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      user.value = session.user
      isAuthenticated.value = true
    }
    
    // 如果未认证且不在登录/注册页面，重定向到登录页
    const publicRoutes = ['login', 'register', 'forgot-password']
    const currentRoute = router.currentRoute.value.name
    
    if (!isAuthenticated.value && !publicRoutes.includes(currentRoute)) {
      router.push('/login')
    }
  } catch (error) {
    console.error('App initialization error:', error)
  } finally {
    isLoading.value = false
  }
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 通知管理
const addNotification = (notification) => {
  const id = Date.now()
  notifications.value.push({ ...notification, id })
  
  // 自动移除通知
  setTimeout(() => {
    removeNotification(id)
  }, 5000)
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  addNotification({
    type: 'error',
    title: '系统错误',
    message: '发生了未预期的错误，请刷新页面重试'
  })
})

// 提供全局通知方法
window.$notify = addNotification
</script>

<style scoped>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>