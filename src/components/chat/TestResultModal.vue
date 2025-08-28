<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- 头部 -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            工作流测试结果
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- 测试结果内容 -->
        <div class="mt-6">
          <!-- 工作流信息 -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 class="text-sm font-medium text-gray-900 mb-2">工作流信息</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">名称:</span>
                <span class="ml-2 text-gray-900">{{ result.workflow?.workflow_name }}</span>
              </div>
              <div>
                <span class="text-gray-500">类型:</span>
                <span class="ml-2 text-gray-900">{{ result.workflow?.workflow_type }}</span>
              </div>
              <div class="md:col-span-2">
                <span class="text-gray-500">URL:</span>
                <span class="ml-2 text-gray-900 break-all">{{ result.workflow?.webhook_url }}</span>
              </div>
            </div>
          </div>

          <!-- 测试状态 -->
          <div class="mb-6">
            <div class="flex items-center mb-4">
              <div class="flex items-center">
                <CheckCircleIcon v-if="result.success" class="h-8 w-8 text-green-500" />
                <XCircleIcon v-else class="h-8 w-8 text-red-500" />
                <div class="ml-3">
                  <h4 class="text-lg font-medium" :class="{
                    'text-green-900': result.success,
                    'text-red-900': !result.success
                  }">
                    {{ result.success ? '测试成功' : '测试失败' }}
                  </h4>
                  <p class="text-sm" :class="{
                    'text-green-700': result.success,
                    'text-red-700': !result.success
                  }">
                    {{ result.message || (result.success ? '工作流响应正常' : '工作流无响应或出错') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 详细信息 -->
          <div class="space-y-4">
            <!-- 响应状态 -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h5 class="text-sm font-medium text-gray-900 mb-3">响应状态</h5>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">状态码:</span>
                  <span class="ml-2 font-mono" :class="{
                    'text-green-600': result.status_code >= 200 && result.status_code < 300,
                    'text-red-600': result.status_code >= 400,
                    'text-yellow-600': result.status_code >= 300 && result.status_code < 400
                  }">
                    {{ result.status_code || 'N/A' }}
                  </span>
                </div>
                <div v-if="result.response_time">
                  <span class="text-gray-500">响应时间:</span>
                  <span class="ml-2 font-mono text-gray-900">{{ result.response_time }}ms</span>
                </div>
                <div v-if="result.error_type">
                  <span class="text-gray-500">错误类型:</span>
                  <span class="ml-2 text-red-600">{{ result.error_type }}</span>
                </div>
                <div>
                  <span class="text-gray-500">时间:</span>
                  <span class="ml-2 text-gray-900">{{ formatTime(result.timestamp) }}</span>
                </div>
              </div>
            </div>

            <!-- 响应内容 -->
            <div v-if="result.test_response || result.response" class="bg-white border border-gray-200 rounded-lg p-4">
              <h5 class="text-sm font-medium text-gray-900 mb-3">响应内容</h5>
              <div class="bg-gray-50 rounded p-3 overflow-x-auto">
                <pre class="text-xs text-gray-800 whitespace-pre-wrap">{{ formatResponse(result.test_response || result.response) }}</pre>
              </div>
            </div>

            <!-- 错误详情 -->
            <div v-if="!result.success && result.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 class="text-sm font-medium text-red-900 mb-3">错误详情</h5>
              <div class="bg-red-100 rounded p-3">
                <pre class="text-xs text-red-800 whitespace-pre-wrap">{{ result.error }}</pre>
              </div>
            </div>

            <!-- 建议 -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 class="text-sm font-medium text-blue-900 mb-3">
                <InformationCircleIcon class="h-4 w-4 inline mr-1" />
                建议
              </h5>
              <div class="text-sm text-blue-800">
                <ul class="space-y-1">
                  <li v-if="result.success">
                    • 工作流连接正常，可以正常使用
                  </li>
                  <li v-else-if="result.status_code >= 400 && result.status_code < 500">
                    • 请检查Webhook URL是否正确
                  </li>
                  <li v-else-if="result.status_code >= 500">
                    • n8n服务器可能出现问题，请稍后重试
                  </li>
                  <li v-else-if="result.error_type === 'timeout'">
                    • 请求超时，请检查网络连接或增加超时时间
                  </li>
                  <li v-else>
                    • 请检查n8n工作流是否正确配置并已激活
                  </li>
                  <li>• 确保工作流返回正确的JSON格式响应</li>
                  <li>• 检查工作流的Webhook触发器配置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            @click="retryTest"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            重新测试
          </button>
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { chatAIService } from '../../services/chat-ai.service.js'
import { useNotification } from '../../composables/useNotification.js'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'retry'])

const { showNotification } = useNotification()

// 格式化响应内容
const formatResponse = (response) => {
  if (!response) return 'N/A'
  
  if (typeof response === 'string') {
    try {
      return JSON.stringify(JSON.parse(response), null, 2)
    } catch {
      return response
    }
  }
  
  return JSON.stringify(response, null, 2)
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  try {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timestamp
  }
}

// 重新测试
const retryTest = async () => {
  if (!props.result.workflow?.webhook_url) {
    showNotification('缺少Webhook URL', 'error')
    return
  }

  try {
    showNotification('正在重新测试...', 'info')
    emit('retry', props.result.workflow)
  } catch (error) {
    showNotification('重新测试失败: ' + error.message, 'error')
  }
}
</script>

<style scoped>
/* 模态框动画 */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

/* 代码块样式 */
pre {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
}

/* 状态指示器动画 */
.status-icon {
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式优化 */
@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .md\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>