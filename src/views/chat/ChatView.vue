<template>
  <div class="flex h-full">
    <!-- 侧边栏 - 会话列表 -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">AI聊天助手</h2>
          <button
            @click="createNewSession"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="新建对话"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="p-4">
          <div class="animate-pulse space-y-3">
            <div v-for="i in 3" :key="i" class="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div v-else-if="sessions.length === 0" class="p-4 text-center text-gray-500">
          <p>暂无对话记录</p>
          <button
            @click="createNewSession"
            class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            开始新对话
          </button>
        </div>

        <div v-else class="p-2">
          <div
            v-for="session in sessions"
            :key="session.id"
            @click="selectSession(session)"
            class="p-3 rounded-lg cursor-pointer transition-colors mb-2"
            :class="{
              'bg-blue-50 border border-blue-200': currentSession?.id === session.id,
              'hover:bg-gray-50': currentSession?.id !== session.id
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ session.title }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatDate(session.updated_at) }}
                </p>
              </div>
              <button
                @click.stop="deleteSession(session.id)"
                class="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="flex-1 flex flex-col">
      <div v-if="!currentSession" class="flex-1 flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">选择或创建对话</h3>
          <p class="mt-1 text-sm text-gray-500">开始与AI助手的智能对话</p>
          <button
            @click="createNewSession"
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            新建对话
          </button>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <!-- 聊天头部 -->
        <div class="bg-white border-b border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ currentSession.title }}</h3>
              <p class="text-sm text-gray-500">AI智能助手</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="clearMessages"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                title="清空对话"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 消息区域 -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
            <p>开始对话吧！我是您的AI学习助手。</p>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="{
              'justify-end': message.role === 'user',
              'justify-start': message.role === 'assistant'
            }"
          >
            <div
              class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
              :class="{
                'bg-blue-600 text-white': message.role === 'user',
                'bg-white text-gray-900 shadow-sm border': message.role === 'assistant'
              }"
            >
              <div class="flex items-start space-x-2" v-if="message.role === 'assistant'">
                <div class="flex-shrink-0">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-sm">{{ message.content }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatTime(message.created_at) }}</p>
                </div>
              </div>
              <div v-else>
                <p class="text-sm">{{ message.content }}</p>
                <p class="text-xs text-blue-200 mt-1">{{ formatTime(message.created_at) }}</p>
              </div>
            </div>
          </div>

          <!-- AI正在输入指示器 -->
          <div v-if="isTyping" class="flex justify-start">
            <div class="bg-white text-gray-900 shadow-sm border max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div class="flex items-center space-x-2">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
                <span class="text-sm text-gray-500">AI正在思考...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="bg-white border-t border-gray-200 p-4">
          <form @submit.prevent="sendMessage" class="flex space-x-4">
            <div class="flex-1">
              <textarea
                v-model="newMessage"
                @keydown.enter.prevent="handleEnterKey"
                placeholder="输入您的问题..."
                rows="1"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                :disabled="isTyping"
              ></textarea>
            </div>
            <button
              type="submit"
              :disabled="!newMessage.trim() || isTyping"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { chatService } from '../../services/chat.service.js'
import { useNotification } from '../../composables/useNotification.js'

const { showNotification } = useNotification()

// 响应式数据
const loading = ref(false)
const sessions = ref([])
const currentSession = ref(null)
const messages = ref([])
const newMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)

// 生命周期
onMounted(() => {
  loadSessions()
})

// 监听当前会话变化，加载消息
watch(currentSession, (newSession) => {
  if (newSession) {
    loadMessages(newSession.id)
  }
})

// 方法
const loadSessions = async () => {
  loading.value = true
  try {
    const result = await chatService.getUserSessions({ limit: 50 })
    if (result.success) {
      sessions.value = result.data
    } else {
      showNotification('加载会话列表失败', 'error')
    }
  } catch (error) {
    showNotification('加载会话列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const createNewSession = async () => {
  try {
    const result = await chatService.createSession({
      title: `对话 ${new Date().toLocaleString()}`
    })
    
    if (result.success) {
      sessions.value.unshift(result.data)
      currentSession.value = result.data
      messages.value = []
    } else {
      showNotification('创建会话失败', 'error')
    }
  } catch (error) {
    showNotification('创建会话失败', 'error')
  }
}

const selectSession = (session) => {
  currentSession.value = session
}

const deleteSession = async (sessionId) => {
  if (!confirm('确定要删除这个对话吗？')) return
  
  try {
    const result = await chatService.deleteSession(sessionId)
    if (result.success) {
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      if (currentSession.value?.id === sessionId) {
        currentSession.value = null
        messages.value = []
      }
      showNotification('对话已删除', 'success')
    } else {
      showNotification('删除对话失败', 'error')
    }
  } catch (error) {
    showNotification('删除对话失败', 'error')
  }
}

const loadMessages = async (sessionId) => {
  try {
    const result = await chatService.getSessionMessages(sessionId)
    if (result.success) {
      messages.value = result.data
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    showNotification('加载消息失败', 'error')
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentSession.value) return
  
  const messageContent = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    // 发送用户消息
    const userMessageResult = await chatService.sendMessage(
      currentSession.value.id,
      messageContent,
      'user'
    )
    
    if (userMessageResult.success) {
      messages.value.push(userMessageResult.data)
      await nextTick()
      scrollToBottom()
      
      // 显示AI正在输入
      isTyping.value = true
      
      // 生成AI回复
      const aiResponse = await chatService.generateAIResponse(
        currentSession.value.id,
        messageContent
      )
      
      if (aiResponse.success) {
        // 发送AI回复消息
        const assistantMessageResult = await chatService.sendMessage(
          currentSession.value.id,
          aiResponse.data.content,
          'assistant',
          aiResponse.data.metadata
        )
        
        if (assistantMessageResult.success) {
          messages.value.push(assistantMessageResult.data)
          await nextTick()
          scrollToBottom()
        }
      }
    } else {
      showNotification('发送消息失败', 'error')
    }
  } catch (error) {
    showNotification('发送消息失败', 'error')
  } finally {
    isTyping.value = false
  }
}

const clearMessages = async () => {
  if (!confirm('确定要清空当前对话吗？')) return
  
  // 这里可以实现清空消息的逻辑
  // 暂时只清空本地显示
  messages.value = []
  showNotification('对话已清空', 'success')
}

const handleEnterKey = (event) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
