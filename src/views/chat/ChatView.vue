<template>
  <div class="flex h-full bg-gray-50">
    <!-- 侧边栏 - 会话列表 -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <!-- 头部 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">AI聊天助手</h2>
            <p class="text-sm text-gray-500 mt-1">您的智能学习伙伴</p>
          </div>
          <button
            @click="createNewSession"
            class="p-2 text-gray-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 group"
            title="新建对话"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="p-4 border-b border-gray-100">
        <div class="grid grid-cols-2 gap-2">
          <button 
            @click="createNewSession"
            class="flex items-center justify-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            新对话
          </button>
          <button 
            @click="showSearchModal = true"
            class="flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            搜索
          </button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="chatStore.loading" class="p-4">
          <div class="animate-pulse space-y-4">
            <div v-for="i in 3" :key="i" class="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        
        <div v-else-if="chatStore.sessions.length === 0" class="p-6 text-center">
          <div class="text-gray-400 mb-3">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p class="text-gray-500 text-sm mb-3">暂无对话记录</p>
          <button
            @click="createNewSession"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            开始新对话
          </button>
        </div>

        <div v-else class="p-3">
          <div
            v-for="session in chatStore.sessions"
            :key="session.id"
            @click="selectSession(session)"
            class="group p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 relative"
            :class="{
              'bg-blue-50 border-2 border-blue-200 shadow-sm': chatStore.currentSession?.id === session.id,
              'hover:bg-gray-50 border-2 border-transparent': chatStore.currentSession?.id !== session.id
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center mb-2">
                  <div class="w-2 h-2 rounded-full mr-2"
                    :class="{
                      'bg-green-400': session.status === 'active',
                      'bg-gray-300': session.status !== 'active'
                    }"
                  ></div>
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ session.title || '新对话' }}
                  </h3>
                </div>
                <p class="text-xs text-gray-500">
                  {{ formatDate(session.updated_at) }}
                </p>
                <div v-if="session.lastMessage" class="text-xs text-gray-400 mt-1 truncate">
                  {{ session.lastMessage.content.substring(0, 30) }}...
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="editSessionTitle(session)"
                  class="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="编辑标题"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="deleteSession(session.id)"
                  class="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="删除对话"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 激活指示器 -->
            <div v-if="chatStore.currentSession?.id === session.id" 
              class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 空状态 -->
      <div v-if="!chatStore.currentSession" class="flex-1 flex items-center justify-center">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">启明星AI助手</h3>
          <p class="text-gray-500 mb-6 leading-relaxed">
            我是您的智能学习伙伴，可以帮助您制定学习目标、解答问题、提供个性化建议。让我们开始对话吧！
          </p>
          
          <!-- 快速开始选项 -->
          <div class="space-y-3 mb-6">
            <button
              v-for="prompt in quickStartPrompts"
              :key="prompt.title"
              @click="createSessionWithPrompt(prompt)"
              class="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-blue-600 text-lg">{{ prompt.icon }}</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ prompt.title }}</h4>
                  <p class="text-sm text-gray-500">{{ prompt.description }}</p>
                </div>
              </div>
            </button>
          </div>
          
          <button
            @click="createNewSession"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            开始新对话
          </button>
        </div>
      </div>

      <!-- 聊天界面 -->
      <div v-else class="flex-1 flex flex-col">
        <!-- 聊天头部 -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ chatStore.currentSession.title }}</h3>
                <p class="text-sm text-gray-500">AI智能助手 · 在线</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                @click="exportChat"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="导出对话"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                @click="clearMessages"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div ref="messagesContainer" class="flex-1 overflow-y-auto">
          <!-- 欢迎消息 -->
          <div v-if="chatStore.messages.length === 0" class="p-6">
            <div class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">开始新的对话</h4>
              <p class="text-gray-500 max-w-sm mx-auto">
                我可以帮助您制定学习目标、解答问题、提供个性化建议。请告诉我您需要什么帮助。
              </p>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-else class="p-6 space-y-6">
            <div v-for="(message, index) in chatStore.messages" :key="message.id" class="message-wrapper">
              <!-- 调试信息 -->
              <div v-if="isDev" class="text-xs text-gray-400 mb-1">
                [调试] ID: {{ message.id }} | 内容长度: {{ message.content?.length || 0 }} | 流式: {{ isStreamingMessage(message) }}
              </div>
              <ChatMessage
                :message="message"
                :is-streaming="isStreamingMessage(message)"
                @retry="retryMessage"
                @copy="copyMessage"
                @rate="rateMessage"
                @edit="editMessage"
              />
            </div>

            <!-- AI正在输入指示器 -->
            <div v-if="chatStore.isTyping" class="flex justify-start">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200 max-w-md">
                  <!-- 调用过程显示 -->
                  <div v-if="aiCallStatus.show" class="mb-3">
                    <div class="text-xs text-gray-500 mb-2">AI调用过程</div>
                    <div class="space-y-2">
                      <!-- 步骤1: 准备请求 -->
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 flex items-center justify-center">
                          <div v-if="aiCallStatus.step >= 1" class="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div v-else class="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <span class="text-xs" :class="aiCallStatus.step >= 1 ? 'text-green-600' : 'text-gray-500'">
                          准备AI配置
                        </span>
                      </div>
                      
                      <!-- 步骤2: 发送请求 -->
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 flex items-center justify-center">
                          <div v-if="aiCallStatus.step >= 2" class="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div v-else-if="aiCallStatus.step === 1" class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div v-else class="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                        <span class="text-xs" :class="aiCallStatus.step >= 2 ? 'text-green-600' : aiCallStatus.step === 1 ? 'text-blue-600' : 'text-gray-500'">
                          调用n8n Webhook
                        </span>
                      </div>
                      
                      <!-- 步骤3: 处理响应 -->
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 flex items-center justify-center">
                          <div v-if="aiCallStatus.step >= 3" class="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div v-else-if="aiCallStatus.step === 2" class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div v-else class="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                        <span class="text-xs" :class="aiCallStatus.step >= 3 ? 'text-green-600' : aiCallStatus.step === 2 ? 'text-blue-600' : 'text-gray-500'">
                          处理AI响应
                        </span>
                      </div>
                      
                      <!-- 当前状态信息 -->
                      <div v-if="aiCallStatus.message" class="flex items-center space-x-2">
                        <div class="w-4 h-4 flex items-center justify-center">
                          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <span class="text-xs text-blue-600">{{ aiCallStatus.message }}</span>
                      </div>
                      
                      <!-- 错误状态 -->
                      <div v-if="aiCallStatus.error" class="flex items-center space-x-2">
                        <div class="w-4 h-4 flex items-center justify-center">
                          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <span class="text-xs text-red-600">{{ aiCallStatus.error }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 默认思考状态 -->
                  <div v-else class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-sm text-gray-600">AI正在思考...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <ChatInput
          v-model="newMessage"
          :is-loading="chatStore.isTyping"
          :suggestions="inputSuggestions"
          @send="sendMessage"
          @suggestion="handleSuggestion"
        />
      </div>
    </div>
    
    <!-- 调试组件 -->
    <StreamDebugger v-if="isDev" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChatStore } from '../../stores/chat.js'
import { realtimeChatService } from '../../services/realtime-chat.service.js'
import { useNotification } from '../../composables/useNotification.js'
import ChatInput from '../../components/ui/ChatInput.vue'
import ChatMessage from '../../components/ui/ChatMessage.vue'
import StreamDebugger from '../../components/debug/StreamDebugger.vue'

const { showNotification } = useNotification()
const chatStore = useChatStore()

// 开发模式检测
const isDev = import.meta.env.DEV

// 响应式数据
const messagesContainer = ref(null)
const showSearchModal = ref(false)
const isRealtimeConnected = ref(false)
const newMessage = ref('')

// AI调用状态
const aiCallStatus = ref({
  show: false,
  step: 0,
  error: null
})

// 快速开始提示
const quickStartPrompts = ref([
  {
    icon: '🎯',
    title: '制定学习目标',
    description: '帮我制定一个有效的学习计划',
    prompt: '我想制定一个关于前端开发的学习目标，请帮我规划一下。'
  },
  {
    icon: '📊',
    title: '分析学习进度',
    description: '查看我的OKR完成情况',
    prompt: '请帮我分析一下当前的学习进度和OKR完成情况。'
  },
  {
    icon: '💡',
    title: '学习建议',
    description: '获取个性化的学习建议',
    prompt: '基于我的学习情况，给我一些个性化的学习建议。'
  },
  {
    icon: '🔍',
    title: '答疑解惑',
    description: '解答学习中的疑问',
    prompt: '我在学习过程中遇到了一些问题，希望得到帮助。'
  }
])

// 智能输入建议
const inputSuggestions = ref([
  '如何制定有效的学习目标？',
  '我的OKR进度如何？',
  '推荐一些前端学习资源',
  '分析我的学习习惯',
  '如何提高学习效率？',
  '制定本周的学习计划',
  'Vue 3和React该选择哪个？',
  '如何准备技术面试？'
])

// 生命周期
onMounted(async () => {
  // 初始化聊天系统
  await initializeChat()
})

onUnmounted(() => {
  // 清理资源
  cleanup()
})

// 监听当前会话变化，建立实时连接
watch(() => chatStore.currentSession, async (newSession, oldSession) => {
  if (oldSession && oldSession.id !== newSession?.id) {
    // 断开旧会话的实时连接
    await realtimeChatService.disconnectFromSession(oldSession.id)
  }
  
  if (newSession) {
    // 连接到新会话的实时通道
    await connectToRealtime(newSession.id)
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
})

// 方法
const isStreamingMessage = (message) => {
  const result = (message.metadata?.streaming === true) ||
         (message.id && message.id.startsWith('temp_'))
         
  console.log('ChatView流式检查:', {
    messageId: message.id,
    contentLength: message.content?.length,
    isStreaming: result
  })
  
  return result
}

const initializeChat = async () => {
  try {
    // 初始化聊天store
    const result = await chatStore.initialize()
    
    if (!result.success) {
      showNotification('初始化聊天系统失败', 'error')
      return
    }
    
    // 如果有当前会话，连接实时通道
    if (chatStore.currentSession) {
      await connectToRealtime(chatStore.currentSession.id)
    }
    
  } catch (error) {
    console.error('初始化聊天失败:', error)
    showNotification('初始化聊天系统失败', 'error')
  }
}

const connectToRealtime = async (sessionId) => {
  try {
    const result = await realtimeChatService.connectToSession(sessionId, {
      onNewMessage: handleRealtimeMessage,
      onMessageUpdate: handleMessageUpdate,
      onTypingUpdate: handleTypingUpdate,
      onPresenceUpdate: handlePresenceUpdate,
      onUserJoin: handleUserJoin,
      onUserLeave: handleUserLeave,
      onConnected: (sessionId) => {
        console.log(`已连接到会话 ${sessionId} 的实时通道`)
        isRealtimeConnected.value = true
        showNotification('实时连接已建立', 'success')
      },
      onError: (error) => {
        console.error('实时连接错误:', error)
        isRealtimeConnected.value = false
        showNotification('实时连接失败', 'error')
      }
    })
    
    if (!result.success) {
      console.error('连接实时通道失败:', result.error)
    }
  } catch (error) {
    console.error('连接实时通道失败:', error)
  }
}

const createNewSession = async () => {
  try {
    const result = await chatStore.createSession()
    
    if (result.success) {
      showNotification('新对话已创建', 'success')
    } else {
      showNotification(result.error || '创建会话失败', 'error')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    showNotification('创建会话失败', 'error')
  }
}

const createSessionWithPrompt = async (prompt) => {
  try {
    const result = await chatStore.createSession(prompt.title, prompt.prompt)
    
    if (result.success) {
      showNotification(`已创建"${prompt.title}"对话`, 'success')
    } else {
      showNotification(result.error || '创建会话失败', 'error')
    }
  } catch (error) {
    console.error('创建预设会话失败:', error)
    showNotification('创建会话失败', 'error')
  }
}

const selectSession = async (session) => {
  try {
    await chatStore.selectSession(session)
  } catch (error) {
    console.error('选择会话失败:', error)
    showNotification('切换会话失败', 'error')
  }
}

const deleteSession = async (sessionId) => {
  if (!confirm('确定要删除这个对话吗？此操作无法撤销。')) return
  
  try {
    const result = await chatStore.deleteSession(sessionId)
    if (result.success) {
      showNotification('对话已删除', 'success')
    } else {
      showNotification(result.error || '删除对话失败', 'error')
    }
  } catch (error) {
    console.error('删除对话失败:', error)
    showNotification('删除对话失败', 'error')
  }
}

const editSessionTitle = async (session) => {
  const newTitle = prompt('请输入新的标题:', session.title)
  if (!newTitle || newTitle === session.title) return
  
  try {
    const result = await chatStore.updateSessionTitle(session.id, newTitle)
    if (result.success) {
      showNotification('标题已更新', 'success')
    } else {
      showNotification(result.error || '更新标题失败', 'error')
    }
  } catch (error) {
    console.error('更新标题失败:', error)
    showNotification('更新标题失败', 'error')
  }
}

const sendMessage = async (content) => {
  if (!content?.trim()) return
  
  // 重置AI调用状态
  aiCallStatus.value = {
    show: true,
    step: 0,
    error: null
  }
  
  try {
    // 发送打字状态
    if (chatStore.currentSession) {
      await realtimeChatService.sendTypingIndicator(chatStore.currentSession.id, false)
    }
    
    const result = await chatStore.sendMessageStream(content.trim(), {
      onChunk: (chunk) => {
        console.log('ChatView收到流式内容:', chunk) // 添加调试日志
        // 确保UI实时更新流式内容
        // 内容已经通过store的streamingMessage更新
        nextTick(() => {
          scrollToBottom()
        })
      },
      onStatus: (status) => {
        console.log('ChatView收到状态更新:', status) // 添加调试日志
        // 更新AI调用状态
        aiCallStatus.value = {
          show: true,
          step: status.step,
          error: null,
          message: status.message
        }
      }
    })
    
    if (result.success) {
      // 完成后隐藏状态
      aiCallStatus.value.show = false
      
      // 滚动到底部
      await nextTick()
      scrollToBottom()
    } else {
      aiCallStatus.value.error = '发送失败: ' + (result.error || '未知错误')
      showNotification(result.error || '发送消息失败', 'error')
      
      // 3秒后隐藏错误状态
      setTimeout(() => {
        aiCallStatus.value.show = false
      }, 3000)
    }
    
    return result
  } catch (error) {
    console.error('发送消息失败:', error)
    aiCallStatus.value.error = '调用失败: ' + (error.message || '未知错误')
    showNotification('发送消息失败', 'error')
    
    // 3秒后隐藏错误状态
    setTimeout(() => {
      aiCallStatus.value.show = false
    }, 3000)
    
    return { success: false, error: error.message }
  }
}

const clearMessages = async () => {
  if (!confirm('确定要清空当前对话吗？此操作无法撤销。')) return
  
  try {
    const result = await chatStore.clearMessages()
    if (result.success) {
      showNotification('对话已清空', 'success')
    } else {
      showNotification(result.error || '清空对话失败', 'error')
    }
  } catch (error) {
    console.error('清空对话失败:', error)
    showNotification('清空对话失败', 'error')
  }
}

const exportChat = () => {
  try {
    const result = chatStore.exportChat()
    if (result.success) {
      showNotification('对话已导出', 'success')
    } else {
      showNotification(result.error || '导出失败', 'warning')
    }
  } catch (error) {
    console.error('导出对话失败:', error)
    showNotification('导出对话失败', 'error')
  }
}

const handleSuggestion = (suggestion) => {
  sendMessage(suggestion)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 实时消息处理
const handleRealtimeMessage = (message) => {
  // 如果消息属于当前会话，更新UI
  if (chatStore.currentSession && message.session_id === chatStore.currentSession.id) {
    // 检查消息是否已存在，避免重复
    const existingMessage = chatStore.messages.find(m => m.id === message.id)
    if (!existingMessage) {
      chatStore.messages.push(message)
      nextTick(() => scrollToBottom())
    }
  }
}

const handleMessageUpdate = (message) => {
  // 更新现有消息
  if (chatStore.currentSession && message.session_id === chatStore.currentSession.id) {
    const messageIndex = chatStore.messages.findIndex(m => m.id === message.id)
    if (messageIndex >= 0) {
      chatStore.messages[messageIndex] = message
    }
  }
}

const handleTypingUpdate = (data) => {
  console.log('打字状态更新:', data)
  // 可以在这里更新UI显示谁在打字
}

const handlePresenceUpdate = (data) => {
  console.log('用户状态更新:', data)
  // 可以在这里更新在线用户显示
}

const handleUserJoin = (data) => {
  console.log('用户加入:', data)
  // 可以显示用户加入提示
}

const handleUserLeave = (data) => {
  console.log('用户离开:', data)
  // 可以显示用户离开提示
}

// 消息操作处理
const copyMessage = (message) => {
  showNotification('消息已复制到剪贴板', 'success')
}

const retryMessage = async (message) => {
  try {
    await chatStore.retryMessage(message)
  } catch (error) {
    console.error('重试消息失败:', error)
    showNotification('重试消息失败', 'error')
  }
}

const rateMessage = async (data) => {
  try {
    const { message, rating } = data
    await chatStore.rateMessage(message, rating)
    showNotification(`已${rating === 'like' ? '点赞' : '点踩'}`, 'success')
  } catch (error) {
    console.error('评分消息失败:', error)
    showNotification('评分失败', 'error')
  }
}

const editMessage = (message) => {
  const newContent = prompt('编辑消息:', message.content)
  if (newContent && newContent !== message.content) {
    showNotification('消息编辑功能开发中', 'info')
  }
}

// 输入框事件处理
const handleInputFocus = () => {
  if (chatStore.currentSession) {
    realtimeChatService.sendTypingIndicator(chatStore.currentSession.id, true)
  }
}

const handleInputBlur = () => {
  if (chatStore.currentSession) {
    realtimeChatService.sendTypingIndicator(chatStore.currentSession.id, false)
  }
}

// 清理资源
const cleanup = async () => {
  await realtimeChatService.disconnectAll()
  chatStore.cleanup()
}

// 格式化日期
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
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 页面进入动画 */
.chat-container {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 会话列表动画 */
.session-item {
  transition: all 0.3s ease;
}

.session-item:hover {
  transform: translateX(2px);
}

.session-item.active {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 快速开始卡片动画 */
.quick-start-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.quick-start-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.quick-start-card:hover::before {
  left: 100%;
}

.quick-start-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 按钮动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 消息容器平滑滚动 */
.messages-container {
  scroll-behavior: smooth;
}

/* 加载状态动画 */
.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 空状态动画 */
.empty-state {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 工具提示动画 */
.tooltip {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.tooltip.show {
  opacity: 1;
  visibility: visible;
}

/* 侧边栏收缩动画 */
.sidebar {
  transition: width 0.3s ease, transform 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

/* 消息发送动画 */
.message-sending {
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 输入框聚焦动画 */
.input-focus {
  animation: inputGlow 0.3s ease;
}

@keyframes inputGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    z-index: 50;
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: #4b5563;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .session-item {
    border: 2px solid;
  }
  
  .btn-primary {
    border: 2px solid;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
