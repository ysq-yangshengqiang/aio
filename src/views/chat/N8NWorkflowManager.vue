<template>
  <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">N8N工作流配置</h1>
      <p class="text-gray-600">
        配置您的n8n工作流来启用AI聊天功能。n8n工作流将处理AI请求并返回智能回复。
      </p>
    </div>

    <!-- 工作流列表 -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">现有工作流</h2>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建工作流
        </button>
      </div>

      <!-- 工作流卡片 -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
      </div>

      <div v-else-if="workflows.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">暂无工作流配置</h3>
        <p class="text-gray-500 mb-4">创建您的第一个n8n工作流配置来启用AI功能</p>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          开始配置
        </button>
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="workflow in workflows"
          :key="workflow.id"
          class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <h3 class="text-lg font-medium text-gray-900 mr-3">{{ workflow.name }}</h3>
                <span
                  :class="{
                    'bg-green-100 text-green-800': workflow.is_active,
                    'bg-gray-100 text-gray-800': !workflow.is_active
                  }"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ workflow.is_active ? '活跃' : '停用' }}
                </span>
                <span
                  :class="{
                    'bg-blue-100 text-blue-800': workflow.workflow_type === 'chat',
                    'bg-purple-100 text-purple-800': workflow.workflow_type === 'chat_stream',
                    'bg-orange-100 text-orange-800': workflow.workflow_type === 'context',
                    'bg-gray-100 text-gray-800': workflow.workflow_type === 'custom'
                  }"
                  class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getWorkflowTypeLabel(workflow.workflow_type) }}
                </span>
              </div>
              
              <p v-if="workflow.description" class="text-gray-600 text-sm mb-3">
                {{ workflow.description }}
              </p>
              
              <div class="text-sm text-gray-500 space-y-1">
                <div>
                  <span class="font-medium">Webhook URL:</span>
                  <code class="ml-1 px-2 py-1 bg-gray-100 rounded text-xs">{{ workflow.webhook_url }}</code>
                </div>
                <div>
                  <span class="font-medium">超时时间:</span>
                  {{ workflow.timeout_seconds }}s
                </div>
                <div>
                  <span class="font-medium">创建时间:</span>
                  {{ formatDate(workflow.created_at) }}
                </div>
              </div>

              <!-- 连接状态 -->
              <div v-if="workflow.connection_status" class="mt-3">
                <div
                  :class="{
                    'text-green-600': workflow.connection_status.success,
                    'text-red-600': !workflow.connection_status.success
                  }"
                  class="flex items-center text-sm"
                >
                  <svg v-if="workflow.connection_status.success" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {{ workflow.connection_status.success ? '连接正常' : '连接失败' }}
                </div>
                <p v-if="!workflow.connection_status.success" class="text-red-600 text-xs mt-1">
                  {{ workflow.connection_status.error }}
                </p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click="testWorkflow(workflow)"
                :disabled="testingWorkflow === workflow.id"
                class="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <svg v-if="testingWorkflow === workflow.id" class="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                测试
              </button>
              
              <button
                @click="editWorkflow(workflow)"
                class="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑
              </button>
              
              <button
                @click="deleteWorkflow(workflow)"
                class="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑工作流弹窗 -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ showCreateModal ? '创建工作流' : '编辑工作流' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="submitWorkflow">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">工作流名称</label>
                <input
                  v-model="workflowForm.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入工作流名称"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  v-model="workflowForm.webhook_url"
                  type="url"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://your-n8n-instance.com/webhook/your-workflow"
                />
                <p class="text-xs text-gray-500 mt-1">
                  n8n工作流的Webhook触发器URL
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">工作流类型</label>
                <select
                  v-model="workflowForm.workflow_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="chat">聊天处理</option>
                  <option value="chat_stream">流式聊天</option>
                  <option value="context">上下文构建</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">描述 (可选)</label>
                <textarea
                  v-model="workflowForm.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="工作流描述"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">超时时间 (秒)</label>
                <input
                  v-model.number="workflowForm.timeout_seconds"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div class="flex items-center">
                <input
                  v-model="workflowForm.is_active"
                  type="checkbox"
                  id="is_active"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="is_active" class="ml-2 text-sm text-gray-700">
                  激活此工作流
                </label>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {{ submitting ? '保存中...' : (showCreateModal ? '创建' : '保存') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification.js'
import { chatAIService } from '../../services/chat-ai.service.js'

const { showNotification } = useNotification()

// 响应式数据
const loading = ref(false)
const workflows = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const submitting = ref(false)
const testingWorkflow = ref(null)

// 工作流表单
const workflowForm = reactive({
  id: null,
  name: '',
  webhook_url: '',
  workflow_type: 'chat',
  description: '',
  timeout_seconds: 30,
  is_active: false
})

// 生命周期
onMounted(async () => {
  await loadWorkflows()
})

// 方法
const loadWorkflows = async (testConnection = false) => {
  try {
    loading.value = true
    const result = await chatAIService.manageN8NWorkflows('get', {
      action: testConnection ? 'test' : undefined
    })
    
    if (result.success) {
      workflows.value = result.data || []
    } else {
      showNotification('加载工作流失败: ' + result.error, 'error')
    }
  } catch (error) {
    console.error('加载工作流失败:', error)
    showNotification('加载工作流失败', 'error')
  } finally {
    loading.value = false
  }
}

const submitWorkflow = async () => {
  try {
    submitting.value = true
    
    const action = showCreateModal.value ? 'create' : 'update'
    const result = await chatAIService.manageN8NWorkflows(action, {
      ...workflowForm,
      ...(showEditModal.value && { id: workflowForm.id })
    })
    
    if (result.success) {
      showNotification(
        `工作流${showCreateModal.value ? '创建' : '更新'}成功`,
        'success'
      )
      closeModal()
      await loadWorkflows()
    } else {
      showNotification(`操作失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('提交工作流失败:', error)
    showNotification('操作失败', 'error')
  } finally {
    submitting.value = false
  }
}

const editWorkflow = (workflow) => {
  Object.assign(workflowForm, {
    id: workflow.id,
    name: workflow.name,
    webhook_url: workflow.webhook_url,
    workflow_type: workflow.workflow_type,
    description: workflow.description || '',
    timeout_seconds: workflow.timeout_seconds || 30,
    is_active: workflow.is_active || false
  })
  showEditModal.value = true
}

const deleteWorkflow = async (workflow) => {
  if (!confirm(`确定要删除工作流"${workflow.name}"吗？此操作无法撤销。`)) return
  
  try {
    const result = await chatAIService.manageN8NWorkflows('delete', {
      workflow_id: workflow.id
    })
    
    if (result.success) {
      showNotification('工作流已删除', 'success')
      await loadWorkflows()
    } else {
      showNotification(`删除失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('删除工作流失败:', error)
    showNotification('删除失败', 'error')
  }
}

const testWorkflow = async (workflow) => {
  try {
    testingWorkflow.value = workflow.id
    const result = await chatAIService.testN8NWorkflow(workflow.webhook_url)
    
    if (result.success) {
      showNotification(`${workflow.name} 连接测试成功`, 'success')
    } else {
      showNotification(`${workflow.name} 连接测试失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('测试工作流失败:', error)
    showNotification('测试失败', 'error')
  } finally {
    testingWorkflow.value = null
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  // 重置表单
  Object.assign(workflowForm, {
    id: null,
    name: '',
    webhook_url: '',
    workflow_type: 'chat',
    description: '',
    timeout_seconds: 30,
    is_active: false
  })
}

// 辅助方法
const getWorkflowTypeLabel = (type) => {
  const labels = {
    chat: '聊天',
    chat_stream: '流式聊天',
    context: '上下文',
    custom: '自定义'
  }
  return labels[type] || type
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
/* 添加一些自定义样式 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>