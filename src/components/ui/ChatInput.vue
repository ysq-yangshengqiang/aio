<template>
  <div class="bg-white border-t border-gray-200 shadow-lg sticky bottom-0 z-10">
    <div class="px-6 py-4">
      <!-- 智能建议 -->
      <div v-if="suggestions.length > 0 && !inputValue.trim()" class="mb-4">
        <p class="text-xs text-gray-500 mb-2">💡 您可以试试：</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="suggestion in visibleSuggestions"
            :key="suggestion"
            @click="applySuggestion(suggestion)"
            class="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
          >
            {{ suggestion }}
          </button>
          <button
            v-if="suggestions.length > visibleSuggestions.length"
            @click="showAllSuggestions = !showAllSuggestions"
            class="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {{ showAllSuggestions ? '收起' : `+${suggestions.length - visibleSuggestions.length}更多` }}
          </button>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="flex items-end space-x-3">
        <!-- 附加功能按钮 -->
        <div class="flex items-center space-x-1 pb-2">
          <button
            @click="toggleAttachMenu"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="附件"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>

        <!-- 主输入框 -->
        <div class="flex-1 relative">
          <div class="relative">
            <textarea
              ref="textareaRef"
              v-model="inputValue"
              @keydown="handleKeyDown"
              @input="adjustHeight"
              @focus="handleFocus"
              @blur="handleBlur"
              placeholder="输入您的问题... (Shift+Enter 换行，Enter 发送)"
              rows="1"
              class="block w-full resize-none border-2 border-gray-200 rounded-xl px-4 py-4 pr-12 focus:ring-0 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white chat-input-enhanced"
              :disabled="isLoading"
              :style="{ minHeight: '60px', maxHeight: '160px', height: textareaHeight }"
            ></textarea>
            
            <!-- 输入框内的操作按钮 -->
            <div class="absolute right-2 bottom-2 flex items-center space-x-1">
              <!-- 清除按钮 -->
              <button
                v-if="inputValue && !isLoading"
                @click="clearInput"
                class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="清除"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <!-- 字数统计 -->
              <span v-if="inputValue.length > 50" class="text-xs text-gray-400 px-2">
                {{ inputValue.length }}/2000
              </span>
            </div>
          </div>
          
          <!-- 输入提示 -->
          <div class="flex items-center justify-between mt-2 px-1">
            <div class="text-xs text-gray-500">
              <span v-if="isFocused && !isLoading">
                <kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift</kbd> + 
                <kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> 换行
              </span>
              <span v-else-if="isLoading" class="text-blue-600">AI正在思考...</span>
            </div>
            
            <!-- 发送快捷键提示 -->
            <div v-if="canSend && isFocused" class="text-xs text-gray-500">
              <kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> 发送
            </div>
          </div>
        </div>
        
        <!-- 发送按钮 -->
        <div class="pb-2">
          <button
            @click="sendMessage"
            :disabled="!canSend"
            class="p-3 rounded-xl transition-all duration-200 relative overflow-hidden group"
            :class="{
              'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105': canSend,
              'bg-gray-200 text-gray-400 cursor-not-allowed': !canSend
            }"
            title="发送消息"
          >
            <!-- 发送图标 -->
            <svg 
              v-if="!isLoading" 
              class="w-5 h-5 transition-transform group-hover:translate-x-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            
            <!-- 加载图标 -->
            <svg 
              v-else 
              class="w-5 h-5 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            
            <!-- 发送按钮动画背景 -->
            <div v-if="canSend" class="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>
      
      <!-- 附件菜单 -->
      <div v-if="showAttachMenu" class="mt-3 p-3 bg-gray-50 rounded-lg border">
        <div class="grid grid-cols-3 gap-3">
          <button 
            @click="handleFileUpload('image')"
            class="flex flex-col items-center p-3 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200"
          >
            <svg class="w-6 h-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs text-gray-700">图片</span>
          </button>
          
          <button 
            @click="handleFileUpload('document')"
            class="flex flex-col items-center p-3 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200"
          >
            <svg class="w-6 h-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-xs text-gray-700">文档</span>
          </button>
          
          <button 
            @click="handleVoiceInput"
            class="flex flex-col items-center p-3 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200"
          >
            <svg class="w-6 h-6 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span class="text-xs text-gray-700">语音</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: Array,
    default: () => [
      '如何制定有效的学习目标？',
      '我的OKR进度如何？',
      '推荐一些前端学习资源',
      '分析我的学习习惯',
      '如何提高学习效率？',
      '制定本周的学习计划'
    ]
  }
})

const emit = defineEmits(['update:modelValue', 'send', 'suggestion'])

// 响应式数据
const textareaRef = ref(null)
const inputValue = ref(props.modelValue || '')
const textareaHeight = ref('48px')
const isFocused = ref(false)
const showAttachMenu = ref(false)
const showAllSuggestions = ref(false)

// 计算属性
const canSend = computed(() => {
  return inputValue.value.trim() && !props.isLoading
})

const visibleSuggestions = computed(() => {
  return showAllSuggestions.value ? props.suggestions : props.suggestions.slice(0, 3)
})

// 监听
watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal || ''
})

watch(inputValue, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  
  // 自动调整高度
  nextTick(() => {
    adjustHeight()
  })
}

const adjustHeight = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 160)
    textareaHeight.value = `${newHeight}px`
    textarea.style.height = `${newHeight}px`
  }
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
  // 延迟关闭附件菜单，给用户点击的时间
  setTimeout(() => {
    showAttachMenu.value = false
  }, 150)
}

const sendMessage = () => {
  if (canSend.value) {
    const message = inputValue.value.trim()
    inputValue.value = ''
    textareaHeight.value = '48px'
    emit('send', message)
    
    // 重新聚焦到输入框
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
      }
    })
  }
}

const clearInput = () => {
  inputValue.value = ''
  textareaHeight.value = '60px'
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

const applySuggestion = (suggestion) => {
  inputValue.value = suggestion
  emit('suggestion', suggestion)
  adjustHeight()
  
  // 聚焦到输入框末尾
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(suggestion.length, suggestion.length)
    }
  })
}

const toggleAttachMenu = () => {
  showAttachMenu.value = !showAttachMenu.value
}

const handleFileUpload = (type) => {
  console.log(`上传${type}类型文件`)
  showAttachMenu.value = false
  // TODO: 实现文件上传功能
}

const handleVoiceInput = () => {
  console.log('语音输入')
  showAttachMenu.value = false
  // TODO: 实现语音输入功能
}

// 生命周期
onMounted(() => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
})
</script>

<style scoped>
/* 聊天输入框容器美化 */
.sticky {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

/* 增强的聊天输入框样式 */
.chat-input-enhanced {
  font-size: 16px;
  line-height: 1.5;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-input-enhanced:focus {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 0 transparent, 0 4px 16px rgba(96, 165, 250, 0.15) !important;
  transform: translateY(-1px);
}

.chat-input-enhanced:hover:not(:focus) {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条 */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 输入框动画 */
textarea {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 发送按钮增强 */
.p-3.rounded-xl {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.p-3.rounded-xl:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

/* 建议按钮美化 */
.px-3.py-1\.5.text-sm.bg-blue-50 {
  border-radius: 20px;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.px-3.py-1\.5.text-sm.bg-blue-50:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* 附件按钮美化 */
.p-2.text-gray-400 {
  border-radius: 10px;
  transition: all 0.2s ease;
}

.p-2.text-gray-400:hover {
  transform: scale(1.1);
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/* 键盘快捷键样式 */
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  color: #374151;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
}

/* 附件菜单美化 */
.mt-3.p-3.bg-gray-50 {
  border-radius: 16px;
  backdrop-filter: blur(8px);
  background: rgba(249, 250, 251, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 附件菜单按钮 */
.flex.flex-col.items-center.p-3.rounded-lg {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.flex.flex-col.items-center.p-3.rounded-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .chat-input-enhanced {
    font-size: 16px; /* 防止iOS缩放 */
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .sticky {
    background: rgba(17, 24, 39, 0.95);
    border-color: #374151;
  }
  
  .chat-input-enhanced {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .chat-input-enhanced:focus {
    background-color: #111827;
    border-color: #60a5fa;
  }
  
  kbd {
    background-color: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .chat-input-enhanced {
    border-width: 3px;
  }
  
  .chat-input-enhanced:focus {
    border-width: 3px;
    border-color: #1d4ed8;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
