<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
  <div class="space-y-8 p-6 max-w-7xl mx-auto">
    <!-- 美化的页面标题 -->
    <div class="bg-white rounded-xl shadow p-6 border border-gray-100">
      <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p class="text-base text-gray-600">
              🎯 管理和跟踪您的目标与关键结果
            </p>
          </div>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建新OKR
          </button>
        </div>
      </div>
    </div>

    <!-- 美化的统计卡片 -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 总数卡片 -->
      <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-600 truncate">📊 总OKR数</dt>
                <dd class="text-3xl font-bold text-gray-900">{{ stats.total }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">活跃中</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.active }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">已完成</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.completed }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="relative w-6 h-6">
                <svg class="w-6 h-6 text-gray-400" viewBox="0 0 36 36">
                  <path class="text-gray-300" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845 Z" stroke="currentColor" stroke-width="3" fill="none"/>
                  <path class="text-indigo-600" :stroke-dasharray="`${stats.averageProgress}, 100`" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845 Z" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-medium text-gray-900">{{ stats.averageProgress }}%</span>
                </div>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">平均进度</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.averageProgress }}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 美化的筛选和搜索 -->
    <div class="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div class="sm:col-span-2">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">搜索</label>
          <div class="relative">
            <input
              type="text"
              name="search"
              id="search"
              v-model="filters.search"
              @input="debouncedSearch"
              class="block w-full h-10 pl-4 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 hover:shadow-md"
              placeholder="搜索OKR标题或描述..."
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <select
            id="status"
            name="status"
            v-model="filters.status"
            @change="loadOKRs"
            class="block w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 hover:shadow-md"
          >
            <option value="">全部状态</option>
            <option value="active">活跃中</option>
            <option value="completed">已完成</option>
            <option value="paused">已暂停</option>
          </select>
        </div>

        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-2">类别</label>
          <select
            id="category"
            name="category"
            v-model="filters.category"
            @change="loadOKRs"
            class="block w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 hover:shadow-md"
          >
            <option value="">全部类别</option>
            <option value="learning">学习成长</option>
            <option value="career">职业发展</option>
            <option value="personal">个人发展</option>
            <option value="health">健康生活</option>
            <option value="project">项目管理</option>
          </select>
        </div>

        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">优先级</label>
          <select
            id="priority"
            name="priority"
            v-model="filters.priority"
            @change="loadOKRs"
            class="block w-full h-10 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200 hover:shadow-md"
          >
            <option value="">全部优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            type="button"
            @click="clearFilters"
            class="w-full h-10 inline-flex justify-center items-center px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md"
          >
            清除筛选
          </button>
        </div>
      </div>
    </div>

    <!-- OKR列表 -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          加载中...
        </div>
      </div>

      <div v-else-if="okrs.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无OKR</h3>
        <p class="mt-1 text-sm text-gray-500">开始创建您的第一个目标与关键结果</p>
        <div class="mt-6">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建OKR
          </button>
        </div>
      </div>

      <ul v-else role="list" class="divide-y divide-gray-200">
        <li v-for="okr in okrs" :key="okr.id" class="px-6 py-4 hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <router-link
                      :to="`/okr/${okr.id}`"
                      class="text-sm font-medium text-gray-900 hover:text-indigo-600 cursor-pointer"
                    >
                      {{ okr.title }}
                    </router-link>
                    <span
                      :class="{
                        'bg-green-100 text-green-800': okr.status === 'completed',
                        'bg-blue-100 text-blue-800': okr.status === 'active',
                        'bg-yellow-100 text-yellow-800': okr.status === 'paused',
                        'bg-gray-100 text-gray-800': okr.status === 'draft'
                      }"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{
                        okr.status === 'completed' ? '已完成' :
                        okr.status === 'active' ? '活跃中' :
                        okr.status === 'paused' ? '已暂停' : '草稿'
                      }}
                    </span>
                    <span
                      :class="{
                        'bg-red-100 text-red-800': okr.priority === 'urgent',
                        'bg-orange-100 text-orange-800': okr.priority === 'high',
                        'bg-yellow-100 text-yellow-800': okr.priority === 'medium',
                        'bg-gray-100 text-gray-800': okr.priority === 'low'
                      }"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{
                        okr.priority === 'urgent' ? '紧急' :
                        okr.priority === 'high' ? '高' :
                        okr.priority === 'medium' ? '中' : '低'
                      }}
                    </span>
                  </div>
                  <p v-if="okr.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
                    {{ okr.description }}
                  </p>
                  <div class="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    <span>
                      {{ getCategoryName(okr.category) }}
                    </span>
                    <span v-if="okr.target_date">
                      目标日期: {{ formatDate(okr.target_date) }}
                    </span>
                    <span>
                      创建于 {{ formatDate(okr.created_at) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center space-x-4">
                  <!-- 进度条 -->
                  <div class="w-32">
                    <div class="flex items-center">
                      <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          :style="{ width: okr.progress + '%' }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-gray-900 min-w-0 w-12">
                        {{ okr.progress }}%
                      </span>
                    </div>
                  </div>

                  <!-- 关键结果数量 -->
                  <div class="text-sm text-gray-500">
                    <span>{{ okr.key_results?.length || 0 }} 个关键结果</span>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex space-x-2">
                    <router-link
                      :to="`/okr/${okr.id}`"
                      class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      查看
                    </router-link>
                    <button
                      @click="openEditModal(okr.id)"
                      class="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      编辑
                    </button>
                    <button
                      @click="deleteOKR(okr)"
                      class="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- OKR创建/编辑弹窗 -->
    <OKRCreateModal
      :is-visible="showCreateModal"
      :edit-okr-id="editingOkrId"
      @close="closeModal"
      @created="onOKRCreated"
      @updated="onOKRUpdated"
    />
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { okrService } from '@/services/okr.service.js'
import { useNotification } from '@/composables/useNotification.js'
import OKRCreateModal from '@/components/OKRCreateModal.vue'

const { showNotification } = useNotification()

const loading = ref(true)
const okrs = ref([])
const showCreateModal = ref(false)
const editingOkrId = ref(null)
const stats = reactive({
  total: 0,
  active: 0,
  completed: 0,
  paused: 0,
  averageProgress: 0
})

const filters = reactive({
  search: '',
  status: '',
  category: '',
  priority: ''
})

// 防抖搜索
let searchTimer = null
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadOKRs()
  }, 500)
}

const loadOKRs = async () => {
  loading.value = true
  try {
    let result

    if (filters.search) {
      result = await okrService.searchOKRs(filters.search, { limit: 50 })
    } else {
      result = await okrService.getUserOKRs({
        status: filters.status || null,
        category: filters.category || null,
        limit: 50,
        includeKeyResults: true
      })
    }

    if (result.success) {
      let data = result.data || []
      
      // 应用其他筛选条件
      if (filters.priority) {
        data = data.filter(okr => okr.priority === filters.priority)
      }
      
      okrs.value = data
    } else {
      showNotification(result.error || '加载OKR失败', 'error')
      okrs.value = []
    }
  } catch (error) {
    console.error('加载OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
    okrs.value = []
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const result = await okrService.getStats()
    if (result.success) {
      Object.assign(stats, result.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const deleteOKR = async (okr) => {
  if (!confirm(`确定要删除OKR "${okr.title}" 吗？此操作不可撤销。`)) {
    return
  }

  try {
    const result = await okrService.deleteOKR(okr.id)
    if (result.success) {
      showNotification('OKR删除成功', 'success')
      await loadOKRs()
      await loadStats()
    } else {
      showNotification(result.error || 'OKR删除失败', 'error')
    }
  } catch (error) {
    console.error('删除OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
  }
}

const clearFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.category = ''
  filters.priority = ''
  loadOKRs()
}

const getCategoryName = (category) => {
  const categories = {
    learning: '学习成长',
    career: '职业发展',
    personal: '个人发展',
    health: '健康生活',
    project: '项目管理'
  }
  return categories[category] || category
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

// 弹窗相关函数
const openCreateModal = () => {
  console.log('Opening create modal') // 调试日志
  editingOkrId.value = null
  showCreateModal.value = true
  console.log('showCreateModal:', showCreateModal.value) // 调试日志
}

const openEditModal = (okrId) => {
  console.log('Opening edit modal for OKR:', okrId) // 调试日志
  editingOkrId.value = okrId
  showCreateModal.value = true
}

const closeModal = () => {
  console.log('Closing modal') // 调试日志
  showCreateModal.value = false
  editingOkrId.value = null
}

const onOKRCreated = () => {
  loadOKRs()
  loadStats()
}

const onOKRUpdated = () => {
  loadOKRs()
  loadStats()
}

onMounted(() => {
  Promise.all([
    loadOKRs(),
    loadStats()
  ])
})
</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>