<template>
  <div class="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50" v-if="showDebug">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-900">流式调试信息</h3>
      <button @click="showDebug = false" class="text-gray-400 hover:text-gray-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="space-y-2 text-xs">
      <div>
        <span class="font-medium">消息总数:</span>
        <span class="ml-1">{{ chatStore.messages.length }}</span>
      </div>
      
      <div>
        <span class="font-medium">流式状态:</span>
        <span class="ml-1" :class="{
          'text-green-600': chatStore.isStreaming,
          'text-gray-600': !chatStore.isStreaming
        }">
          {{ chatStore.isStreaming ? '进行中' : '未激活' }}
        </span>
      </div>
      
      <div v-if="chatStore.streamingMessage">
        <span class="font-medium">流式消息ID:</span>
        <span class="ml-1 font-mono">{{ chatStore.streamingMessage.id }}</span>
      </div>
      
      <div v-if="chatStore.streamingMessage">
        <span class="font-medium">内容长度:</span>
        <span class="ml-1">{{ chatStore.streamingMessage.content?.length || 0 }}</span>
      </div>
      
      <div class="pt-2 border-t border-gray-200">
        <span class="font-medium">最新消息:</span>
        <div v-if="latestMessage" class="mt-1 text-xs bg-gray-100 p-2 rounded">
          <div><strong>ID:</strong> {{ latestMessage.id }}</div>
          <div><strong>角色:</strong> {{ latestMessage.role }}</div>
          <div><strong>流式:</strong> {{ latestMessage.metadata?.streaming ? '是' : '否' }}</div>
          <div><strong>内容:</strong> {{ latestMessage.content?.substring(0, 50) }}...</div>
        </div>
      </div>
    </div>
    
    <div class="mt-3 pt-3 border-t border-gray-200">
      <button 
        @click="testMessage" 
        class="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        :disabled="testing"
      >
        {{ testing ? '测试中...' : '发送测试消息' }}
      </button>
    </div>
  </div>
  
  <!-- 调试触发按钮 -->
  <button 
    v-if="!showDebug"
    @click="showDebug = true"
    class="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-40"
    title="显示调试信息"
  >
    <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  </button>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat.js'

const chatStore = useChatStore()
const showDebug = ref(false)
const testing = ref(false)

const latestMessage = computed(() => {
  return chatStore.messages.length > 0 
    ? chatStore.messages[chatStore.messages.length - 1] 
    : null
})

const testMessage = async () => {
  testing.value = true
  try {
    console.log('开始测试流式消息...')
    
    if (!chatStore.currentSession) {
      await chatStore.createSession()
    }
    
    const testContent = `测试流式输出 - ${new Date().toLocaleTimeString()}`
    console.log('发送测试消息:', testContent)
    
    const result = await chatStore.sendMessageStream(testContent, {
      onChunk: (chunk) => {
        console.log('调试组件收到流式内容:', chunk)
      },
      onStatus: (status) => {
        console.log('调试组件收到状态更新:', status)
      }
    })
    
    console.log('测试结果:', result)
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    testing.value = false
  }
}

// 监听聊天store的变化
const stopWatching = chatStore.$subscribe((mutation, state) => {
  console.log('Chat store 状态变化:', {
    type: mutation.type,
    payload: mutation.payload,
    isStreaming: state.isStreaming,
    streamingMessageId: state.streamingMessage?.id,
    messagesCount: state.messages.length
  })
})

onMounted(() => {
  console.log('流式调试组件已加载')
})
</script>

<style scoped>
/* 确保调试面板在最上层 */
.z-50 {
  z-index: 50;
}

.z-40 {
  z-index: 40;
}
</style>