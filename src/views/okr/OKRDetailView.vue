<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载中...
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
      <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      <div class="mt-6">
        <button
          @click="loadOKR"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          重试
        </button>
      </div>
    </div>

    <template v-else-if="okr">
      <!-- 头部 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {{ okr.title }}
            </h2>
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
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ getCategoryName(okr.category) }} • 优先级：{{ getPriorityName(okr.priority) }}
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <router-link
            :to="`/okr/${okr.id}/edit`"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑
          </router-link>
          <router-link
            to="/okr"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            返回列表
          </router-link>
        </div>
      </div>

      <!-- 进度概览 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">进度概览</h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div class="text-center">
            <div class="relative w-24 h-24 mx-auto">
              <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path class="text-gray-300" fill="currentColor" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845 Z" stroke="currentColor" stroke-width="2" fill="none"/>
                <path class="text-indigo-600" :stroke-dasharray="`${okr.progress}, 100`" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845 Z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xl font-bold text-gray-900">{{ okr.progress }}%</span>
              </div>
            </div>
            <p class="mt-2 text-sm font-medium text-gray-900">总体进度</p>
          </div>

          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">{{ okr.key_results?.length || 0 }}</div>
            <p class="text-sm font-medium text-gray-500">关键结果总数</p>
          </div>

          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ okr.key_results?.filter(kr => kr.status === 'completed').length || 0 }}
            </div>
            <p class="text-sm font-medium text-gray-500">已完成结果</p>
          </div>
        </div>

        <div class="mt-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">整体进度</span>
            <span class="text-sm font-medium text-gray-900">{{ okr.progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: okr.progress + '%' }"
            ></div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div v-if="okr.start_date">
            <dt class="text-sm font-medium text-gray-500">开始日期</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDate(okr.start_date) }}</dd>
          </div>
          <div v-if="okr.target_date">
            <dt class="text-sm font-medium text-gray-500">目标日期</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDate(okr.target_date) }}</dd>
          </div>
          <div v-if="okr.completed_at">
            <dt class="text-sm font-medium text-gray-500">完成日期</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDate(okr.completed_at) }}</dd>
          </div>
        </div>
      </div>

      <!-- OKR详细信息 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">目标描述</h3>
        <div class="prose max-w-none">
          <p v-if="okr.description" class="text-gray-700 whitespace-pre-wrap">{{ okr.description }}</p>
          <p v-else class="text-gray-500 italic">暂无描述</p>
        </div>

        <div class="mt-6 border-t border-gray-200 pt-6">
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">类别</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ getCategoryName(okr.category) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">优先级</dt>
              <dd class="mt-1 text-sm text-gray-900">
                <span
                  :class="{
                    'bg-red-100 text-red-800': okr.priority === 'urgent',
                    'bg-orange-100 text-orange-800': okr.priority === 'high',
                    'bg-yellow-100 text-yellow-800': okr.priority === 'medium',
                    'bg-gray-100 text-gray-800': okr.priority === 'low'
                  }"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getPriorityName(okr.priority) }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">创建时间</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(okr.created_at) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">最后更新</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(okr.updated_at) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- 关键结果 -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">关键结果</h3>
          <button
            @click="showAddKeyResult = true"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加关键结果
          </button>
        </div>

        <div v-if="!okr.key_results || okr.key_results.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无关键结果</h3>
          <p class="mt-1 text-sm text-gray-500">为这个目标添加关键结果来追踪进度</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(kr, index) in okr.key_results"
            :key="kr.id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h4 class="text-sm font-medium text-gray-900">{{ kr.title }}</h4>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': kr.status === 'completed',
                      'bg-blue-100 text-blue-800': kr.status === 'active',
                      'bg-gray-100 text-gray-800': kr.status === 'paused'
                    }"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{
                      kr.status === 'completed' ? '已完成' :
                      kr.status === 'active' ? '进行中' : '已暂停'
                    }}
                  </span>
                </div>

                <p v-if="kr.description" class="text-sm text-gray-600 mb-3">{{ kr.description }}</p>

                <!-- 进度 -->
                <div v-if="kr.target_value && kr.target_value > 0" class="mb-3">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-medium text-gray-700">进度</span>
                    <span class="text-xs font-medium text-gray-900">
                      {{ kr.current_value || 0 }} / {{ kr.target_value }} {{ kr.unit }}
                      ({{ Math.round((kr.current_value || 0) / kr.target_value * 100) }}%)
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: Math.min((kr.current_value || 0) / kr.target_value * 100, 100) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- 更新进度 -->
                <div class="flex items-center space-x-2 mt-3">
                  <input
                    :id="`kr-progress-${kr.id}`"
                    type="number"
                    :value="kr.current_value || 0"
                    :max="kr.target_value"
                    min="0"
                    step="0.01"
                    @change="updateKeyResultProgress(kr, $event.target.value)"
                    class="w-24 border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span class="text-sm text-gray-500">{{ kr.unit }}</span>
                  <button
                    @click="updateKeyResultProgress(kr, kr.target_value)"
                    class="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    标记完成
                  </button>
                </div>
              </div>

              <div class="flex space-x-2 ml-4">
                <button
                  @click="editKeyResult(kr)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="deleteKeyResult(kr)"
                  class="text-red-400 hover:text-red-600"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { okrService } from '@/services/okr.service.js'
import { useNotification } from '@/composables/useNotification.js'

const route = useRoute()
const router = useRouter()
const { showNotification } = useNotification()

const loading = ref(true)
const error = ref('')
const okr = ref(null)
const showAddKeyResult = ref(false)

const loadOKR = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await okrService.getOKRById(route.params.id)
    if (result.success) {
      okr.value = result.data
    } else {
      error.value = result.error || 'OKR不存在'
      if (result.error?.includes('无权访问')) {
        router.push('/okr')
      }
    }
  } catch (err) {
    console.error('加载OKR失败:', err)
    error.value = '系统错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const updateKeyResultProgress = async (keyResult, newValue) => {
  try {
    const result = await okrService.updateKeyResult(keyResult.id, {
      current_value: parseFloat(newValue) || 0
    })
    
    if (result.success) {
      showNotification('进度更新成功', 'success')
      await loadOKR() // 重新加载以获取最新数据
    } else {
      showNotification(result.error || '更新失败', 'error')
    }
  } catch (error) {
    console.error('更新关键结果失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
  }
}

const editKeyResult = (keyResult) => {
  // TODO: 实现编辑关键结果功能
  showNotification('编辑功能开发中', 'info')
}

const deleteKeyResult = async (keyResult) => {
  if (!confirm(`确定要删除关键结果 "${keyResult.title}" 吗？`)) {
    return
  }
  
  try {
    // TODO: 实现删除关键结果功能
    showNotification('删除功能开发中', 'info')
  } catch (error) {
    console.error('删除关键结果失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
  }
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

const getPriorityName = (priority) => {
  const priorities = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return priorities[priority] || priority
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

onMounted(() => {
  loadOKR()
})
</script>