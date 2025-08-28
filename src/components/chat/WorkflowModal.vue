<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- 头部 -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? '编辑工作流' : '新建工作流' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="mt-6 space-y-6">
          <!-- 工作流名称 -->
          <div>
            <label for="workflow_name" class="block text-sm font-medium text-gray-700">
              工作流名称 *
            </label>
            <input
              id="workflow_name"
              v-model="formData.workflow_name"
              type="text"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入工作流名称"
            />
          </div>

          <!-- Webhook URL -->
          <div>
            <label for="webhook_url" class="block text-sm font-medium text-gray-700">
              Webhook URL *
            </label>
            <input
              id="webhook_url"
              v-model="formData.webhook_url"
              type="url"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://your-n8n-instance.com/webhook/..."
            />
            <p class="mt-1 text-sm text-gray-500">
              请输入您的n8n工作流Webhook URL
            </p>
          </div>

          <!-- 工作流类型 -->
          <div>
            <label for="workflow_type" class="block text-sm font-medium text-gray-700">
              工作流类型
            </label>
            <select
              id="workflow_type"
              v-model="formData.workflow_type"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="chat">聊天处理</option>
              <option value="stream">流式聊天</option>
              <option value="analysis">数据分析</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <!-- 工作流ID -->
          <div>
            <label for="workflow_id" class="block text-sm font-medium text-gray-700">
              工作流ID
            </label>
            <input
              id="workflow_id"
              v-model="formData.workflow_id"
              type="text"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="留空将自动生成"
            />
          </div>

          <!-- 高级配置 -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">高级配置</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 超时时间 -->
              <div>
                <label for="timeout_seconds" class="block text-sm font-medium text-gray-700">
                  超时时间 (秒)
                </label>
                <input
                  id="timeout_seconds"
                  v-model.number="formData.timeout_seconds"
                  type="number"
                  min="5"
                  max="300"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <!-- 速率限制 -->
              <div>
                <label for="rate_limit" class="block text-sm font-medium text-gray-700">
                  速率限制 (次/小时)
                </label>
                <input
                  id="rate_limit"
                  v-model.number="formData.rate_limit"
                  type="number"
                  min="1"
                  max="1000"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <!-- 重试次数 -->
              <div>
                <label for="retry_attempts" class="block text-sm font-medium text-gray-700">
                  重试次数
                </label>
                <input
                  id="retry_attempts"
                  v-model.number="formData.retry_attempts"
                  type="number"
                  min="0"
                  max="10"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <!-- 是否激活 -->
              <div class="flex items-center">
                <input
                  id="is_active"
                  v-model="formData.is_active"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="is_active" class="ml-2 block text-sm text-gray-900">
                  激活工作流
                </label>
              </div>
            </div>
          </div>

          <!-- 测试连接 -->
          <div v-if="formData.webhook_url" class="border-t border-gray-200 pt-6">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-md font-medium text-gray-900">连接测试</h4>
                <p class="text-sm text-gray-500">保存前测试Webhook连接</p>
              </div>
              <button
                type="button"
                @click="testConnection"
                :disabled="testing"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <PlayIcon v-if="!testing" class="h-4 w-4 mr-2" />
                <LoadingSpinner v-else class="h-4 w-4 mr-2" />
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="testResult" class="mt-4 p-4 rounded-md" :class="{
              'bg-green-50 border border-green-200': testResult.success,
              'bg-red-50 border border-red-200': !testResult.success
            }">
              <div class="flex">
                <CheckCircleIcon v-if="testResult.success" class="h-5 w-5 text-green-400" />
                <XCircleIcon v-else class="h-5 w-5 text-red-400" />
                <div class="ml-3">
                  <h3 class="text-sm font-medium" :class="{
                    'text-green-800': testResult.success,
                    'text-red-800': !testResult.success
                  }">
                    {{ testResult.success ? '连接成功' : '连接失败' }}
                  </h3>
                  <p class="mt-1 text-sm" :class="{
                    'text-green-700': testResult.success,
                    'text-red-700': !testResult.success
                  }">
                    {{ testResult.message || testResult.error }}
                  </p>
                  <div v-if="testResult.status_code" class="mt-1 text-xs" :class="{
                    'text-green-600': testResult.success,
                    'text-red-600': !testResult.success
                  }">
                    状态码: {{ testResult.status_code }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="loading || !formData.workflow_name || !formData.webhook_url"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <LoadingSpinner v-if="loading" class="h-4 w-4 mr-2" />
              {{ loading ? '保存中...' : (isEditing ? '更新' : '创建') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { chatAIService } from '../../services/chat-ai.service.js'
import { useNotification } from '../../composables/useNotification.js'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import {
  XMarkIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  workflow: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const { showNotification } = useNotification()

// 响应式数据
const loading = ref(false)
const testing = ref(false)
const testResult = ref(null)

// 表单数据
const formData = reactive({
  workflow_name: '',
  workflow_id: '',
  webhook_url: '',
  workflow_type: 'chat',
  timeout_seconds: 30,
  rate_limit: 100,
  retry_attempts: 3,
  is_active: true
})

// 监听props变化，初始化表单数据
watch(() => props.workflow, (workflow) => {
  if (workflow) {
    Object.assign(formData, {
      workflow_name: workflow.workflow_name || '',
      workflow_id: workflow.workflow_id || '',
      webhook_url: workflow.webhook_url || '',
      workflow_type: workflow.workflow_type || 'chat',
      timeout_seconds: workflow.timeout_seconds || 30,
      rate_limit: workflow.rate_limit || 100,
      retry_attempts: workflow.retry_attempts || 3,
      is_active: workflow.is_active !== false
    })
  }
}, { immediate: true })

// 测试连接
const testConnection = async () => {
  if (!formData.webhook_url) {
    showNotification('请先输入Webhook URL', 'warning')
    return
  }

  try {
    testing.value = true
    testResult.value = null

    const result = await chatAIService.testN8NWorkflow(formData.webhook_url)
    testResult.value = result

    if (result.success) {
      showNotification('连接测试成功', 'success')
    } else {
      showNotification('连接测试失败: ' + result.error, 'error')
    }
  } catch (error) {
    testResult.value = {
      success: false,
      error: error.message,
      message: '测试连接时发生错误'
    }
    showNotification('测试连接失败: ' + error.message, 'error')
  } finally {
    testing.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true

    // 验证必填字段
    if (!formData.workflow_name.trim()) {
      showNotification('请输入工作流名称', 'warning')
      return
    }

    if (!formData.webhook_url.trim()) {
      showNotification('请输入Webhook URL', 'warning')
      return
    }

    // 验证URL格式
    try {
      new URL(formData.webhook_url)
    } catch {
      showNotification('请输入有效的Webhook URL', 'warning')
      return
    }

    // 发送数据
    emit('save', { ...formData })
  } catch (error) {
    showNotification('保存失败: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

// 重置测试结果
watch(() => formData.webhook_url, () => {
  testResult.value = null
})
</script>

<style scoped>
/* 模态框动画 */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(-20px);
}

/* 表单样式 */
.form-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 测试结果动画 */
.test-result-enter-active {
  transition: all 0.3s ease;
}

.test-result-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
</style>