<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          仪表板
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          欢迎回来，{{ user?.user_metadata?.full_name || user?.email || '用户' }}！
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新建OKR
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 总OKR数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">总OKR数</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.totalOkrs }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 进行中的OKR -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">进行中</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.activeOkrs }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 已完成的OKR -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">已完成</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.completedOkrs }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 平均完成率 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">平均完成率</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.averageProgress }}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近的OKR -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">最近的OKR</h3>
        
        <div v-if="loading" class="flex justify-center py-8">
          <LoadingSpinner text="加载中..." />
        </div>
        
        <div v-else-if="recentOkrs.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无OKR</h3>
          <p class="mt-1 text-sm text-gray-500">开始创建你的第一个OKR吧！</p>
          <div class="mt-6">
            <router-link
              to="/okr/create"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建OKR
            </router-link>
          </div>
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="okr in recentOkrs"
            :key="okr.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-medium text-gray-900">{{ okr.title }}</h4>
                <p class="text-sm text-gray-500 mt-1">{{ okr.description }}</p>
                <div class="mt-2 flex items-center space-x-4">
                  <span class="text-sm text-gray-500">
                    {{ formatDate(okr.start_date) }} - {{ formatDate(okr.end_date) }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(okr.status)"
                  >
                    {{ getStatusText(okr.status) }}
                  </span>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-right">
                  <div class="text-2xl font-bold text-gray-900">{{ okr.progress }}%</div>
                  <div class="text-sm text-gray-500">完成度</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase.js'
import { okrService } from '../services/okr.service.js'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const loading = ref(true)
const user = ref(null)
const recentOkrs = ref([])

const stats = reactive({
  totalOkrs: 0,
  activeOkrs: 0,
  completedOkrs: 0,
  averageProgress: 0
})

onMounted(async () => {
  try {
    // 获取当前用户
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser

    // 加载数据
    await Promise.all([
      loadStats(),
      loadRecentOkrs()
    ])
  } catch (error) {
    console.error('Dashboard initialization error:', error)
  } finally {
    loading.value = false
  }
})

const loadStats = async () => {
  try {
    const result = await okrService.getStats()
    if (result.success) {
      Object.assign(stats, result.data)
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const loadRecentOkrs = async () => {
  try {
    const result = await okrService.getRecentOkrs(5)
    if (result.success) {
      recentOkrs.value = result.data
    }
  } catch (error) {
    console.error('Error loading recent OKRs:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusClass = (status) => {
  const classes = {
    'active': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'paused': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const texts = {
    'active': '进行中',
    'completed': '已完成',
    'paused': '已暂停',
    'cancelled': '已取消'
  }
  return texts[status] || '未知'
}
</script>