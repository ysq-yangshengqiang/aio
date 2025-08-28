<template>
  <div class="workflow-manager">
    <!-- 页面头部 -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">n8n工作流管理</h1>
              <p class="mt-1 text-sm text-gray-500">
                配置和管理您的AI聊天工作流
              </p>
            </div>
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              新建工作流
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">加载失败</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
            <button
              @click="loadWorkflows"
              class="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              重试
            </button>
          </div>
        </div>
      </div>

      <!-- 工作流列表 -->
      <div v-else>
        <!-- 空状态 -->
        <div v-if="workflows.length === 0" class="text-center py-12">
          <CogIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">暂无工作流</h3>
          <p class="mt-1 text-sm text-gray-500">
            创建您的第一个n8n工作流来开始使用AI聊天功能
          </p>
          <div class="mt-6">
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              新建工作流
            </button>
          </div>
        </div>

        <!-- 工作流卡片 -->
        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            class="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'h-8 w-8 rounded-full flex items-center justify-center',
                        workflow.is_active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      ]"
                    >
                      <CogIcon class="h-5 w-5" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900">
                      {{ workflow.workflow_name }}
                    </h3>
                    <p class="text-sm text-gray-500">
                      {{ workflow.workflow_type }} · {{ formatDate(workflow.created_at) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      workflow.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ workflow.is_active ? '活跃' : '停用' }}
                  </span>
                </div>
              </div>

              <div class="mt-4">
                <div class="text-sm text-gray-600">
                  <p class="truncate">
                    <span class="font-medium">Webhook:</span>
                    {{ workflow.webhook_url }}
                  </p>
                  <div class="mt-2 flex items-center justify-between">
                    <span>超时: {{ workflow.timeout_seconds }}s</span>
                    <span>限制: {{ workflow.rate_limit }}/h</span>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex items-center justify-between">
                <div class="flex space-x-2">
                  <button
                    @click="testWorkflow(workflow)"
                    :disabled="testingWorkflows.has(workflow.id)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <PlayIcon v-if="!testingWorkflows.has(workflow.id)" class="h-3 w-3 mr-1" />
                    <LoadingSpinner v-else class="h-3 w-3 mr-1" />
                    测试
                  </button>
                  <button
                    @click="editWorkflow(workflow)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon class="h-3 w-3 mr-1" />
                    编辑
                  </button>
                </div>
                <button
                  @click="confirmDelete(workflow)"
                  class="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon class="h-3 w-3 mr-1" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑工作流模态框 -->
    <WorkflowModal
      v-if="showCreateModal || showEditModal"
      :workflow="editingWorkflow"
      :is-editing="showEditModal"
      @close="closeModal"
      @save="handleSaveWorkflow"
    />

    <!-- 测试结果模态框 -->
    <TestResultModal
      v-if="showTestResult"
      :result="testResult"
      @close="showTestResult = false"
    />

    <!-- 删除确认模态框 -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="删除工作流"
              :message="`确定要删除工作流 '${deletingWorkflow?.workflow_name}' 吗？此操作不可撤销。`"
      confirm-text="删除"
      confirm-class="bg-red-600 hover:bg-red-700"
      @confirm="handleDeleteWorkflow"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification.js'
import { chatAIService } from '../../services/chat-ai.service.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import WorkflowModal from '../../components/chat/WorkflowModal.vue'
import TestResultModal from '../../components/chat/TestResultModal.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import {
  PlusIcon,
  CogIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// 响应式数据
const workflows = ref([])
const loading = ref(false)
const error = ref(null)

// 模态框状态
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showTestResult = ref(false)
const showDeleteConfirm = ref(false)

// 编辑和删除状态
const editingWorkflow = ref(null)
const deletingWorkflow = ref(null)
const testResult = ref(null)
const testingWorkflows = ref(new Set())

const { showNotification } = useNotification()

// 加载工作流列表
const loadWorkflows = async () => {
  try {
    loading.value = true
    error.value = null
    
    const result = await chatAIService.manageN8NWorkflows('get')
    
    if (result.success) {
      workflows.value = result.data || []
    } else {
      throw new Error(result.error || '加载工作流失败')
    }
  } catch (err) {
    error.value = err.message
    console.error('加载工作流失败:', err)
  } finally {
    loading.value = false
  }
}

// 测试工作流
const testWorkflow = async (workflow) => {
  try {
    testingWorkflows.value.add(workflow.id)
    
    const result = await chatAIService.testN8NWorkflow(workflow.webhook_url)
    
    testResult.value = {
      workflow: workflow,
      ...result
    }
    showTestResult.value = true
    
    if (result.success) {
      showNotification('测试成功', 'success')
    } else {
      showNotification('测试失败: ' + result.error, 'error')
    }
  } catch (err) {
    showNotification('测试失败: ' + err.message, 'error')
  } finally {
    testingWorkflows.value.delete(workflow.id)
  }
}

// 编辑工作流
const editWorkflow = (workflow) => {
  editingWorkflow.value = { ...workflow }
  showEditModal.value = true
}

// 确认删除
const confirmDelete = (workflow) => {
  deletingWorkflow.value = workflow
  showDeleteConfirm.value = true
}

// 处理保存工作流
const handleSaveWorkflow = async (workflowData) => {
  try {
    let result
    
    if (showEditModal.value) {
      // 更新工作流
      result = await chatAIService.manageN8NWorkflows('update', {
        id: editingWorkflow.value.id,
        ...workflowData
      })
    } else {
      // 创建工作流
      result = await chatAIService.manageN8NWorkflows('create', workflowData)
    }
    
    if (result.success) {
      showNotification(
        showEditModal.value ? '工作流更新成功' : '工作流创建成功',
        'success'
      )
      closeModal()
      await loadWorkflows()
    } else {
      throw new Error(result.error || '保存失败')
    }
  } catch (err) {
    showNotification('保存失败: ' + err.message, 'error')
  }
}

// 处理删除工作流
const handleDeleteWorkflow = async () => {
  try {
    const result = await chatAIService.manageN8NWorkflows('delete', {
      workflow_id: deletingWorkflow.value.id
    })
    
    if (result.success) {
      showNotification('工作流删除成功', 'success')
      showDeleteConfirm.value = false
      deletingWorkflow.value = null
      await loadWorkflows()
    } else {
      throw new Error(result.error || '删除失败')
    }
  } catch (err) {
    showNotification('删除失败: ' + err.message, 'error')
  }
}

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingWorkflow.value = null
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadWorkflows()
})
</script>

<style scoped>
.workflow-manager {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>