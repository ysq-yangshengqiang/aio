<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <!-- 卡片头部 -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- 状态指示器 -->
          <div class="flex-shrink-0">
            <div class="w-3 h-3 rounded-full" :class="{
              'bg-green-400': workflow.is_active && workflow.status === 'healthy',
              'bg-yellow-400': workflow.is_active && workflow.status === 'warning',
              'bg-red-400': workflow.is_active && workflow.status === 'error',
              'bg-gray-400': !workflow.is_active
            }"></div>
          </div>
          
          <!-- 工作流信息 -->
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ workflow.workflow_name }}
            </h3>
            <p class="text-sm text-gray-500">
              {{ workflow.workflow_id }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center space-x-2">
          <!-- 测试按钮 -->
          <button
            @click="$emit('test', workflow)"
            :disabled="testing"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            title="测试连接"
          >
            <PlayIcon v-if="!testing" class="h-3 w-3 mr-1" />
            <LoadingSpinner v-else class="h-3 w-3 mr-1" />
            测试
          </button>

          <!-- 更多操作菜单 -->
          <div class="relative" ref="menuRef">
            <button
              @click="showMenu = !showMenu"
              class="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EllipsisVerticalIcon class="h-4 w-4" />
            </button>

            <!-- 下拉菜单 -->
            <div
              v-if="showMenu"
              class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
            >
              <div class="py-1">
                <button
                  @click="handleEdit"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PencilIcon class="h-4 w-4 mr-3" />
                  编辑
                </button>
                <button
                  @click="handleToggleActive"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <component :is="workflow.is_active ? PauseIcon : PlayIcon" class="h-4 w-4 mr-3" />
                  {{ workflow.is_active ? '停用' : '启用' }}
                </button>
                <button
                  @click="handleViewLogs"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DocumentTextIcon class="h-4 w-4 mr-3" />
                  查看日志
                </button>
                <div class="border-t border-gray-100"></div>
                <button
                  @click="handleDelete"
                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <TrashIcon class="h-4 w-4 mr-3" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="p-4">
      <!-- 工作流类型和URL -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">类型:</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
            'bg-blue-100 text-blue-800': workflow.workflow_type === 'chat',
            'bg-green-100 text-green-800': workflow.workflow_type === 'stream',
            'bg-purple-100 text-purple-800': workflow.workflow_type === 'analysis',
            'bg-gray-100 text-gray-800': workflow.workflow_type === 'custom'
          }">
            {{ getWorkflowTypeLabel(workflow.workflow_type) }}
          </span>
        </div>

        <div>
          <span class="text-sm text-gray-500">Webhook URL:</span>
          <p class="text-sm text-gray-900 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
            {{ workflow.webhook_url }}
          </p>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-lg font-semibold text-gray-900">
            {{ workflow.total_calls || 0 }}
          </div>
          <div class="text-xs text-gray-500">总调用</div>
        </div>
        <div>
          <div class="text-lg font-semibold" :class="{
            'text-green-600': (workflow.success_rate || 0) >= 95,
            'text-yellow-600': (workflow.success_rate || 0) >= 80,
            'text-red-600': (workflow.success_rate || 0) < 80
          }">
            {{ Math.round(workflow.success_rate || 0) }}%
          </div>
          <div class="text-xs text-gray-500">成功率</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-gray-900">
            {{ workflow.avg_response_time || 0 }}ms
          </div>
          <div class="text-xs text-gray-500">平均响应</div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div v-if="workflow.last_called_at" class="mt-4 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">最近调用:</span>
          <span class="text-gray-900">{{ formatLastCalled(workflow.last_called_at) }}</span>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="workflow.last_error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div class="flex items-start">
          <ExclamationTriangleIcon class="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-red-800">最近错误</p>
            <p class="text-xs text-red-700 mt-1">{{ workflow.last_error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 text-xs text-gray-500">
          <span>创建: {{ formatDate(workflow.created_at) }}</span>
          <span v-if="workflow.updated_at !== workflow.created_at">
            更新: {{ formatDate(workflow.updated_at) }}
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- 配置指示器 -->
          <div class="flex items-center space-x-1 text-xs text-gray-500">
            <ClockIcon class="h-3 w-3" />
            <span>{{ workflow.timeout_seconds }}s</span>
          </div>
          <div class="flex items-center space-x-1 text-xs text-gray-500">
            <ArrowPathIcon class="h-3 w-3" />
            <span>{{ workflow.retry_attempts }}次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotification } from '../../composables/useNotification.js'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import {
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  workflow: {
    type: Object,
    required: true
  },
  testing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active', 'test', 'view-logs'])

const { showNotification } = useNotification()

// 响应式数据
const showMenu = ref(false)
const menuRef = ref(null)

// 获取工作流类型标签
const getWorkflowTypeLabel = (type) => {
  const labels = {
    chat: '聊天处理',
    stream: '流式聊天',
    analysis: '数据分析',
    custom: '自定义'
  }
  return labels[type] || type
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

// 格式化最近调用时间
const formatLastCalled = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    
    return date.toLocaleDateString('zh-CN')
  } catch {
    return 'N/A'
  }
}

// 处理编辑
const handleEdit = () => {
  showMenu.value = false
  emit('edit', props.workflow)
}

// 处理删除
const handleDelete = () => {
  showMenu.value = false
  if (confirm(`确定要删除工作流 "${props.workflow.workflow_name}" 吗？此操作不可撤销。`)) {
    emit('delete', props.workflow)
  }
}

// 处理启用/停用
const handleToggleActive = () => {
  showMenu.value = false
  emit('toggle-active', props.workflow)
}

// 处理查看日志
const handleViewLogs = () => {
  showMenu.value = false
  emit('view-logs', props.workflow)
}

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 卡片悬停效果 */
.workflow-card {
  transition: all 0.2s ease;
}

.workflow-card:hover {
  transform: translateY(-1px);
}

/* 状态指示器动画 */
.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 菜单动画 */
.menu-enter-active, .menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .grid-cols-3 {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .grid-cols-3 > div {
    text-align: left;
  }
}

/* 工具提示样式 */
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}
</style>