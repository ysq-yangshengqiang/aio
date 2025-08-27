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
    <AppNotifications />
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
import AppNotifications from './components/ui/AppNotifications.vue'

const router = useRouter()
const isLoading = ref(true)
const sidebarOpen = ref(false)
const user = ref(null)
const isAuthenticated = ref(false)

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