<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          AI学习推荐
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          基于您的学习目标和进度的个性化推荐
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <button
          @click="generateRecommendations"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mr-2"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
          </svg>
          {{ loading ? '生成中...' : 'AI智能推荐' }}
        </button>
        <button
          @click="showProgressAnalysis = true"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-2"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          进度分析
        </button>
        <button
          @click="testAIConnection"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          测试AI连接
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  待处理推荐
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.pending }}
                </dd>
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
                <dt class="text-sm font-medium text-gray-500 truncate">
                  已完成推荐
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.completed }}
                </dd>
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
                <dt class="text-sm font-medium text-gray-500 truncate">
                  完成率
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ completionRate }}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  总推荐数
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.total }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐列表 -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div v-if="loadingRecommendations" class="space-y-4">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="recommendations.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无推荐</h3>
          <p class="mt-1 text-sm text-gray-500">点击"生成新推荐"获取个性化学习建议</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="recommendation in recommendations"
            :key="recommendation.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getTypeColor(recommendation.type)"
                  >
                    {{ getTypeLabel(recommendation.type) }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getPriorityColor(recommendation.priority)"
                  >
                    {{ getPriorityLabel(recommendation.priority) }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusColor(recommendation.status)"
                  >
                    {{ getStatusLabel(recommendation.status) }}
                  </span>
                  <span
                    v-if="recommendation.ai_generated"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                    AI推荐
                  </span>
                </div>
                
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                  {{ recommendation.title }}
                </h3>
                
                <p class="text-sm text-gray-600 mb-3">
                  {{ recommendation.content }}
                </p>
                
                <div class="flex items-center text-xs text-gray-500 space-x-4">
                  <span>{{ formatDate(recommendation.created_at) }}</span>
                  <span v-if="recommendation.expires_at">
                    过期时间: {{ formatDate(recommendation.expires_at) }}
                  </span>
                </div>
              </div>

              <div class="ml-4 flex-shrink-0">
                <div class="flex items-center space-x-2">
                  <button
                    v-if="recommendation.status === 'pending'"
                    @click="markAsCompleted(recommendation.id)"
                    class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    完成
                  </button>
                  
                  <button
                    v-if="recommendation.status === 'pending'"
                    @click="dismissRecommendation(recommendation.id)"
                    class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    忽略
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度分析模态框 -->
    <div v-if="showProgressAnalysis" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              学习进度智能分析
            </h3>
            <button @click="showProgressAnalysis = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 时间范围选择 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">分析时间范围</label>
            <select v-model="analysisTimeRange" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="week">最近一周</option>
              <option value="month">最近一个月</option>
              <option value="quarter">最近三个月</option>
            </select>
          </div>

          <!-- 分析按钮 -->
          <div class="mb-4">
            <button
              @click="analyzeProgress"
              :disabled="analyzingProgress"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <svg v-if="analyzingProgress" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ analyzingProgress ? '分析中...' : '开始AI分析' }}
            </button>
          </div>

          <!-- 分析结果 -->
          <div v-if="analysisResult" class="space-y-4">
            <!-- 整体评估 -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-2">整体进度评估</h4>
              <p class="text-sm text-blue-700">{{ analysisResult.analysis?.overallProgress || '暂无评估' }}</p>
            </div>

            <!-- 优势和改进建议 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-green-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-green-900 mb-2">优势表现</h4>
                <ul class="text-sm text-green-700 space-y-1">
                  <li v-for="strength in analysisResult.analysis?.strengths || []" :key="strength">
                    • {{ strength }}
                  </li>
                </ul>
              </div>
              
              <div class="bg-yellow-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-yellow-900 mb-2">改进空间</h4>
                <ul class="text-sm text-yellow-700 space-y-1">
                  <li v-for="weakness in analysisResult.analysis?.weaknesses || []" :key="weakness">
                    • {{ weakness }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- AI建议 -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2">智能建议</h4>
              <div class="space-y-2">
                <div v-for="suggestion in analysisResult.suggestions || []" :key="suggestion.title" class="border-l-4 border-indigo-400 pl-4">
                  <h5 class="text-sm font-medium text-gray-900">{{ suggestion.title }}</h5>
                  <p class="text-sm text-gray-600">{{ suggestion.content }}</p>
                  <span class="inline-block px-2 py-1 text-xs rounded-full" :class="getPriorityColorForSuggestion(suggestion.priority)">
                    {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 激励话语 -->
            <div v-if="analysisResult.motivation" class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-purple-900 mb-2">专属激励</h4>
              <p class="text-sm text-purple-700">{{ analysisResult.motivation }}</p>
            </div>

            <!-- 下一步行动 -->
            <div v-if="analysisResult.nextSteps" class="bg-indigo-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-indigo-900 mb-2">下一步行动建议</h4>
              <ul class="text-sm text-indigo-700 space-y-1">
                <li v-for="step in analysisResult.nextSteps" :key="step">
                  • {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { recommendationService } from '../../services/recommendation.service.js'
import { useNotification } from '../../composables/useNotification.js'

const { showNotification } = useNotification()

// 响应式数据
const loading = ref(false)
const loadingRecommendations = ref(false)
const showProgressAnalysis = ref(false)
const analyzingProgress = ref(false)
const analysisTimeRange = ref('month')
const analysisResult = ref(null)
const recommendations = ref([])
const stats = ref({
  total: 0,
  pending: 0,
  completed: 0,
  dismissed: 0
})

const filters = reactive({
  status: 'pending',
  type: ''
})

// 计算属性
const completionRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.completed / stats.value.total) * 100)
})

// 生命周期
onMounted(() => {
  loadRecommendations()
  loadStats()
})

// 方法
const loadRecommendations = async () => {
  loadingRecommendations.value = true
  try {
    const result = await recommendationService.getUserRecommendations({
      status: filters.status || undefined,
      type: filters.type || undefined,
      limit: 50
    })
    
    if (result.success) {
      recommendations.value = result.data
    } else {
      showNotification('加载推荐失败', 'error')
    }
  } catch (error) {
    showNotification('加载推荐失败', 'error')
  } finally {
    loadingRecommendations.value = false
  }
}

const loadStats = async () => {
  try {
    const result = await recommendationService.getRecommendationStats()
    if (result.success) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const generateRecommendations = async () => {
  loading.value = true
  try {
    const result = await recommendationService.generateSmartRecommendations()
    if (result.success) {
      const count = result.data.length
      showNotification(`AI智能分析完成，生成了 ${count} 个个性化推荐！`, 'success')
      await loadRecommendations()
      await loadStats()
    } else {
      showNotification('生成推荐失败: ' + result.error, 'error')
    }
  } catch (error) {
    showNotification('生成推荐失败', 'error')
  } finally {
    loading.value = false
  }
}

const analyzeProgress = async () => {
  analyzingProgress.value = true
  try {
    const result = await recommendationService.analyzeProgressAndSuggest(analysisTimeRange.value)
    if (result.success) {
      analysisResult.value = result.data
      showNotification('进度分析完成！', 'success')
    } else {
      showNotification('分析失败: ' + result.error, 'error')
    }
  } catch (error) {
    showNotification('分析过程中发生错误', 'error')
  } finally {
    analyzingProgress.value = false
  }
}

const testAIConnection = async () => {
  try {
    const result = await recommendationService.testAIConnection()
    if (result.success) {
      showNotification('AI连接测试成功！' + result.message, 'success')
    } else {
      showNotification('AI连接测试失败: ' + result.message, 'error')
    }
  } catch (error) {
    showNotification('连接测试失败', 'error')
  }
}

const markAsCompleted = async (recommendationId) => {
  try {
    const result = await recommendationService.markAsCompleted(recommendationId)
    if (result.success) {
      showNotification('推荐已标记为完成', 'success')
      await loadRecommendations()
      await loadStats()
    } else {
      showNotification('操作失败', 'error')
    }
  } catch (error) {
    showNotification('操作失败', 'error')
  }
}

const dismissRecommendation = async (recommendationId) => {
  try {
    const result = await recommendationService.dismissRecommendation(recommendationId)
    if (result.success) {
      showNotification('推荐已忽略', 'success')
      await loadRecommendations()
      await loadStats()
    } else {
      showNotification('操作失败', 'error')
    }
  } catch (error) {
    showNotification('操作失败', 'error')
  }
}

const clearFilters = () => {
  filters.status = ''
  filters.type = ''
  loadRecommendations()
}

// 辅助方法
const getTypeColor = (type) => {
  const colors = {
    study_plan: 'bg-blue-100 text-blue-800',
    resource_recommendation: 'bg-green-100 text-green-800',
    practice_exercise: 'bg-purple-100 text-purple-800',
    progress_review: 'bg-yellow-100 text-yellow-800',
    motivation: 'bg-pink-100 text-pink-800',
    goal_setting: 'bg-indigo-100 text-indigo-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

const getTypeLabel = (type) => {
  const labels = {
    study_plan: '学习计划',
    resource_recommendation: '资源推荐',
    practice_exercise: '练习建议',
    progress_review: '进度回顾',
    motivation: '动力激励',
    goal_setting: '目标设定',
    milestone_planning: '里程碑规划',
    general_advice: '通用建议',
    final_push: '冲刺阶段',
    progress_boost: '进度提升',
    diversify_learning: '多样化学习',
    increase_frequency: '增加频率',
    start_learning: '开始学习',
    skill_development: '技能发展',
    daily_reflection: '每日反思'
  }
  return labels[type] || type
}

const getPriorityColor = (priority) => {
  const colors = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

const getPriorityLabel = (priority) => {
  const labels = {
    1: '低优先级',
    2: '中优先级',
    3: '高优先级'
  }
  return labels[priority] || '未知'
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    completed: '已完成',
    dismissed: '已忽略'
  }
  return labels[status] || status
}

const getPriorityColorForSuggestion = (priority) => {
  const colors = {
    'high': 'bg-red-100 text-red-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-gray-100 text-gray-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>