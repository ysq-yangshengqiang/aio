<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">快速配置 N8N Webhook</h1>
      <p class="text-gray-600">快速添加您提供的n8n webhook URL到系统中</p>
    </div>

    <!-- 预设配置卡片 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-start space-x-3">
        <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">检测到 N8N Webhook</h3>
          <p class="text-blue-800 text-sm mb-4">我们检测到您想要配置以下webhook:</p>
          <code class="bg-blue-100 text-blue-900 px-3 py-2 rounded-md text-sm break-all block">
            {{ defaultWebhookUrl }}
          </code>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <form @submit.prevent="addWebhook">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">工作流名称</label>
          <input
            v-model="webhookConfig.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如: AI聊天助手 - GPT"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
          <input
            v-model="webhookConfig.webhook_url"
            type="url"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://your-n8n-instance.com/webhook/..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">工作流类型</label>
          <select
            v-model="webhookConfig.workflow_type"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="chat">聊天处理</option>
            <option value="chat_stream">流式聊天</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">描述 (可选)</label>
          <textarea
            v-model="webhookConfig.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="这个工作流的用途和功能描述..."
          ></textarea>
        </div>

        <div class="flex items-center">
          <input
            v-model="webhookConfig.is_active"
            type="checkbox"
            id="is_active"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="is_active" class="ml-2 text-sm text-gray-700">
            立即激活此工作流
          </label>
        </div>
      </div>

      <div class="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          @click="testWebhook"
          :disabled="!webhookConfig.webhook_url || testing"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <svg v-if="testing" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ testing ? '测试中...' : '测试连接' }}
        </button>

        <div class="flex space-x-3">
          <button
            type="button"
            @click="$router.back()"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="submitting || !webhookConfig.name || !webhookConfig.webhook_url"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ submitting ? '添加中...' : '添加工作流' }}
          </button>
        </div>
      </div>
    </form>

    <!-- 测试结果 -->
    <div v-if="testResult" class="mt-6 p-4 rounded-lg" :class="{
      'bg-green-50 border border-green-200': testResult.success,
      'bg-red-50 border border-red-200': !testResult.success
    }">
      <div class="flex items-start space-x-2">
        <svg v-if="testResult.success" class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <div>
          <h4 class="font-medium" :class="{
            'text-green-800': testResult.success,
            'text-red-800': !testResult.success
          }">
            {{ testResult.success ? '连接测试成功' : '连接测试失败' }}
          </h4>
          <p class="text-sm mt-1" :class="{
            'text-green-700': testResult.success,
            'text-red-700': !testResult.success
          }">
            {{ testResult.message }}
          </p>
          <div v-if="testResult.details" class="mt-2 text-xs opacity-75">
            <pre class="whitespace-pre-wrap">{{ testResult.details }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功添加提示 -->
    <div v-if="addSuccess" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <h4 class="font-medium text-green-800">工作流添加成功!</h4>
          <p class="text-sm text-green-700 mt-1">
            现在您可以在聊天界面中使用AI助手了。
          </p>
          <div class="mt-3 space-x-3">
            <router-link 
              to="/chat" 
              class="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              开始聊天
            </router-link>
            <router-link 
              to="/chat/workflow-manager" 
              class="inline-flex items-center px-3 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50"
            >
              管理工作流
            </router-link>
          </div>
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

// 默认的webhook URL
const defaultWebhookUrl = 'https://ysq123.app.n8n.cloud/webhook/66695751-ef1a-4f40-b901-b6fd7ca'

// 响应式数据
const testing = ref(false)
const submitting = ref(false)
const testResult = ref(null)
const addSuccess = ref(false)

// 工作流配置
const webhookConfig = reactive({
  name: 'AI聊天助手 - 用户提供',
  webhook_url: defaultWebhookUrl,
  workflow_type: 'chat_stream',
  description: '用户提供的n8n工作流，支持AI聊天功能',
  timeout_seconds: 60,
  is_active: true
})

// 方法
const testWebhook = async () => {
  if (!webhookConfig.webhook_url) {
    showNotification('请输入Webhook URL', 'warning')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const result = await chatAIService.testN8NWorkflow(webhookConfig.webhook_url)
    
    testResult.value = {
      success: result.success,
      message: result.message || (result.success ? '连接正常' : '连接失败'),
      details: result.success 
        ? `响应状态: ${result.status_code}\n响应内容: ${JSON.stringify(result.response, null, 2)}`
        : result.error
    }

    if (result.success) {
      showNotification('Webhook连接测试成功', 'success')
    } else {
      showNotification(`连接测试失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('测试webhook失败:', error)
    testResult.value = {
      success: false,
      message: '测试连接时出现错误',
      details: error.message
    }
    showNotification('测试连接失败', 'error')
  } finally {
    testing.value = false
  }
}

const addWebhook = async () => {
  submitting.value = true

  try {
    const result = await chatAIService.manageN8NWorkflows('create', {
      ...webhookConfig
    })

    if (result.success) {
      addSuccess.value = true
      showNotification('N8N工作流添加成功', 'success')
    } else {
      showNotification(`添加失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('添加webhook失败:', error)
    showNotification('添加工作流失败', 'error')
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
  // 可以在这里执行初始化逻辑
})
</script>

<style scoped>
/* 添加一些自定义样式 */
pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace;
  font-size: 0.75rem;
  line-height: 1.4;
}
</style>