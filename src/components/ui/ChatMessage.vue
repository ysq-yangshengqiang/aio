<template>
  <div class="flex group" :class="{ 'justify-end': isUser, 'justify-start': !isUser }">
    <!-- AI头像 -->
    <div v-if="!isUser" class="flex-shrink-0 mr-3">
      <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="flex flex-col" :class="{ 'items-end': isUser, 'items-start': !isUser }">
      <div
        class="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 relative group/message"
        :class="messageClasses"
      >
        <!-- 用户消息 -->
        <div v-if="isUser" class="text-white">
          <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ message.content }}</p>
        </div>

        <!-- AI消息 -->
        <div v-else class="text-gray-800">
          <!-- 流式输入效果 -->
          <div v-if="isStreaming || isStreamingMessage" class="relative">
            <div 
              class="whitespace-pre-wrap"
            >{{ renderedContent }}</div>
            <span class="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse cursor-blink"></span>
            
            <!-- 流式状态指示器 -->
            <div v-if="isStreamingMessage" class="mt-2 flex items-center text-xs text-blue-600">
              <svg class="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>AI正在生成回复...</span>
            </div>
          </div>
          
          <!-- 完整消息 -->
          <div v-else>
            <div class="whitespace-pre-wrap">{{ renderedContent }}</div>
          </div>
        </div>

        <!-- 消息状态指示器 -->
        <div v-if="isUser && message.status" class="absolute -right-1 -bottom-1">
          <div 
            class="w-3 h-3 rounded-full flex items-center justify-center"
            :class="{
              'bg-gray-400': message.status === 'sending',
              'bg-green-500': message.status === 'sent',
              'bg-red-500': message.status === 'failed'
            }"
          >
            <svg v-if="message.status === 'sent'" class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="message.status === 'failed'" class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 消息元信息和操作 -->
      <div class="flex items-center mt-2 space-x-3" :class="{ 'flex-row-reverse space-x-reverse': isUser }">
        <!-- 时间戳 -->
        <span class="text-xs text-gray-500">
          {{ formatTime(message.created_at) }}
        </span>

        <!-- AI消息的元数据 -->
        <div v-if="!isUser && message.metadata" class="flex items-center space-x-2">
          <span v-if="message.metadata.model" class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {{ message.metadata.model }}
          </span>
          <span v-if="message.metadata.tokens_used" class="text-xs text-gray-400">
            {{ message.metadata.tokens_used }} tokens
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- 复制按钮 -->
          <button
            @click="copyMessage"
            class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="复制消息"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <!-- AI消息特有操作 -->
          <template v-if="!isUser">
            <!-- 重新生成 -->
            <button
              @click="retryMessage"
              class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="重新生成"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <!-- 点赞/点踩 -->
            <div class="flex items-center space-x-1">
              <button
                @click="rateMessage('like')"
                class="p-1 text-gray-400 rounded transition-colors"
                :class="{ 'text-green-600': message.rating === 'like', 'hover:text-green-600': message.rating !== 'like' }"
                title="点赞"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              
              <button
                @click="rateMessage('dislike')"
                class="p-1 text-gray-400 rounded transition-colors"
                :class="{ 'text-red-600': message.rating === 'dislike', 'hover:text-red-600': message.rating !== 'dislike' }"
                title="点踩"
              >
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
            </div>
          </template>

          <!-- 用户消息特有操作 -->
          <template v-if="isUser">
            <!-- 编辑消息 -->
            <button
              @click="editMessage"
              class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="编辑消息"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <!-- 重试发送 -->
            <button
              v-if="message.status === 'failed'"
              @click="retryMessage"
              class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="重试发送"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 用户头像 -->
    <div v-if="isUser" class="flex-shrink-0 ml-3">
      <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['copy', 'retry', 'rate', 'edit'])

// 计算属性
const isUser = computed(() => props.message.role === 'user')

// 检查是否为流式消息 - 简化版
const isStreamingMessage = computed(() => {
  const result = props.isStreaming || 
         (props.message.metadata?.streaming === true) ||
         (props.message.id && props.message.id.startsWith('temp_'))
         
  console.log('ChatMessage流式检查:', {
    messageId: props.message.id,
    content: props.message.content?.substring(0, 50) + '...',
    contentLength: props.message.content?.length,
    isStreaming: result
  })
  
  return result
})

const messageClasses = computed(() => {
  if (isUser.value) {
    return {
      'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg': true,
      'rounded-bl-2xl rounded-tl-2xl rounded-tr-sm': true
    }
  } else {
    return {
      'bg-white border border-gray-200 text-gray-800 shadow-sm': true,
      'rounded-br-2xl rounded-tr-2xl rounded-tl-sm': true
    }
  }
})

const renderedContent = computed(() => {
  if (isUser.value) {
    return props.message.content
  } else {
    // 简化AI消息渲染，直接返回内容
    const content = props.message.content || ''
    console.log('ChatMessage渲染内容:', content.length, '字符')
    return content
  }
})

// 方法
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    emit('copy', props.message)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const retryMessage = () => {
  emit('retry', props.message)
}

const rateMessage = (rating) => {
  emit('rate', { message: props.message, rating })
}

const editMessage = () => {
  emit('edit', props.message)
}
</script>

<style scoped>
/* Markdown 样式优化 */
:deep(.prose) {
  color: inherit;
  max-width: none;
}

:deep(.prose p) {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

:deep(.prose p:last-child) {
  margin-bottom: 0;
}

:deep(.prose ul, .prose ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.25rem;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

:deep(.prose pre) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

:deep(.prose code) {
  font-size: 0.875rem;
  font-weight: 600;
}

:deep(.prose blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  font-style: italic;
  margin: 0.5rem 0;
}

/* 消息动画 */
.group\/message {
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 悬停效果 */
.group:hover .group\/message {
  transform: translateY(-1px);
  transition: transform 0.2s ease-in-out;
}

/* 流式输入光标动画 */
.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 流式内容动画 */
.streaming-content {
  animation: fadeInText 0.3s ease-in;
}

@keyframes fadeInText {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 流式内容平滑更新 */
.streaming-content :deep(p:last-child) {
  position: relative;
}

/* 流式文字出现效果 */
.streaming-content :deep(*) {
  animation: textReveal 0.1s ease-out;
}

@keyframes textReveal {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>