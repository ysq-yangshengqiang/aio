<template>
  <div class="min-h-screen gradient-bg-light">
    <!-- 顶部导航栏 -->
    <header class="glass-effect border-b border-white/20 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center animate-slideIn">
            <div class="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <el-icon class="text-white text-lg">
                <Star />
              </el-icon>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                启明星平台
              </h1>
              <p class="text-xs text-gray-500">AI驱动的学习成长助手</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2 bg-white/50 rounded-full px-3 py-1">
              <div class="status-online"></div>
              <span class="text-sm text-gray-700 font-medium">{{ authStore.user?.email }}</span>
            </div>
            <el-button 
              @click="handleLogout" 
              type="danger" 
              size="small"
              class="shadow-md hover:shadow-lg transition-all duration-300"
            >
              退出登录
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 欢迎横幅 -->
      <div class="mb-8 animate-fadeIn">
        <div class="glass-effect rounded-2xl p-6 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">
                欢迎回来！👋
              </h2>
              <p class="text-gray-600">
                让AI助手帮助您实现学习目标，开启高效学习之旅
              </p>
            </div>
            <div class="hidden md:block">
              <div class="w-20 h-20 gradient-bg rounded-full flex items-center justify-center animate-pulse-custom">
                <el-icon class="text-white text-3xl">
                  <Star />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：OKR区域 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- OKR卡片 -->
          <div class="glass-effect rounded-2xl p-6 border border-white/20 card-shadow animate-slideIn">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <el-icon class="text-white text-sm">
                    <Aim />
                  </el-icon>
                </div>
                <h2 class="text-lg font-bold text-gray-800">我的OKR</h2>
              </div>
              <el-button 
                v-if="!okrStore.hasOKR" 
                type="primary" 
                size="small"
                class="btn-primary shadow-md"
                @click="showCreateOKR = true"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                创建OKR
              </el-button>
            </div>

            <!-- OKR内容 -->
            <div v-if="okrStore.hasOKR" class="space-y-4 animate-fadeIn">
              <!-- 目标卡片 -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div class="flex items-center mb-3">
                  <div class="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                    <el-icon class="text-white text-xs">
                      <Flag />
                    </el-icon>
                  </div>
                  <h3 class="font-semibold text-blue-900">目标 (Objective)</h3>
                </div>
                <p class="text-blue-800 leading-relaxed">{{ okrStore.currentOKR.objective }}</p>
              </div>
              
              <!-- 关键结果卡片 -->
              <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                <div class="flex items-center mb-3">
                  <div class="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
                    <el-icon class="text-white text-xs">
                      <Trophy />
                    </el-icon>
                  </div>
                  <h3 class="font-semibold text-emerald-900">关键结果 (Key Results)</h3>
                </div>
                <ul class="space-y-3">
                  <li 
                    v-for="(kr, index) in okrStore.currentOKR.key_results" 
                    :key="index"
                    class="flex items-start group"
                  >
                    <div class="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3 mt-0.5 shadow-sm group-hover:shadow-md transition-shadow">
                      {{ index + 1 }}
                    </div>
                    <span class="text-emerald-800 leading-relaxed flex-1">{{ kr.text }}</span>
                  </li>
                </ul>
              </div>

              <!-- OKR操作按钮 -->
              <div class="flex space-x-2 pt-2">
                <el-button size="small" class="flex-1" @click="editOKR">
                  <el-icon class="mr-1"><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="success" class="flex-1">
                  <el-icon class="mr-1"><Check /></el-icon>
                  进度
                </el-button>
              </div>
            </div>

            <!-- 无OKR提示 -->
            <div v-else class="text-center py-12 animate-fadeIn">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-custom">
                <el-icon class="text-gray-400 text-2xl">
                  <Aim />
                </el-icon>
              </div>
              <h3 class="text-lg font-medium text-gray-700 mb-2">还没有设置OKR</h3>
              <p class="text-gray-500 text-sm mb-4">创建您的第一个学习目标，开始AI辅助学习之旅</p>
              <el-button 
                type="primary" 
                class="btn-primary"
                @click="showCreateOKR = true"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                立即创建
              </el-button>
            </div>
          </div>

          <!-- 学习统计卡片 -->
          <div class="glass-effect rounded-2xl p-6 border border-white/20 card-shadow animate-slideIn" style="animation-delay: 0.1s">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <el-icon class="text-white text-sm">
                  <DataAnalysis />
                </el-icon>
              </div>
              <h3 class="text-lg font-bold text-gray-800">学习统计</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div class="text-2xl font-bold text-blue-600">{{ chatStore.messages.length }}</div>
                <div class="text-xs text-blue-500 mt-1">对话次数</div>
              </div>
              <div class="text-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                <div class="text-2xl font-bold text-emerald-600">7</div>
                <div class="text-xs text-emerald-500 mt-1">学习天数</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：AI聊天区域 -->
        <div class="lg:col-span-2">
          <div class="glass-effect rounded-2xl border border-white/20 h-[700px] flex flex-col card-shadow animate-slideIn" style="animation-delay: 0.2s">
            <!-- 聊天头部 -->
            <div class="border-b border-white/20 px-6 py-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <el-icon class="text-white text-lg">
                      <ChatDotRound />
                    </el-icon>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-800">AI学习助手</h2>
                    <div class="flex items-center space-x-2">
                      <div class="status-online"></div>
                      <p class="text-sm text-gray-500">基于您的OKR提供个性化指导</p>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <el-button size="small" circle @click="clearChat">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                  <el-button size="small" circle>
                    <el-icon><Setting /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 聊天消息区域 -->
            <div class="flex-1 overflow-y-auto p-6" ref="chatContainer">
              <!-- 欢迎消息 -->
              <div v-if="chatStore.messages.length === 0" class="text-center py-12 animate-fadeIn">
                <div class="w-20 h-20 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <el-icon class="text-violet-500 text-3xl">
                    <ChatDotRound />
                  </el-icon>
                </div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">👋 您好！我是您的AI学习助手</h3>
                <p class="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  我可以帮助您制定学习计划、回答学习问题、跟踪学习进度。让我们开始对话吧！
                </p>
                <div class="flex flex-wrap justify-center gap-2">
                  <el-button 
                    v-for="suggestion in quickSuggestions" 
                    :key="suggestion"
                    size="small"
                    class="tag-primary"
                    @click="messageInput = suggestion"
                  >
                    {{ suggestion }}
                  </el-button>
                </div>
              </div>

              <!-- 聊天消息列表 -->
              <div v-else class="space-y-6">
                <div 
                  v-for="(message, index) in chatStore.messages" 
                  :key="message.id"
                  :class="[
                    'flex animate-fadeIn',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  ]"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <!-- AI助手消息 -->
                  <div v-if="message.role === 'assistant'" class="flex items-start space-x-3 max-w-4xl">
                    <div class="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <el-icon class="text-white text-sm">
                        <Avatar />
                      </el-icon>
                    </div>
                    <div class="chat-bubble-assistant px-4 py-3 shadow-sm">
                      <div class="prose prose-sm max-w-none">
                        <p class="whitespace-pre-wrap leading-relaxed mb-0">{{ message.content }}</p>
                      </div>
                      <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <p class="text-xs text-gray-400">{{ formatTime(message.timestamp) }}</p>
                        <div class="flex items-center space-x-1">
                          <el-button size="small" text @click="copyMessage(message.content)">
                            <el-icon class="text-xs"><CopyDocument /></el-icon>
                          </el-button>
                          <el-button size="small" text>
                            <el-icon class="text-xs"><CircleCheck /></el-icon>
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 用户消息 -->
                  <div v-else class="flex items-start space-x-3 max-w-md">
                    <div class="chat-bubble-user px-4 py-3 shadow-md">
                      <p class="whitespace-pre-wrap leading-relaxed mb-0">{{ message.content }}</p>
                      <p class="text-xs mt-2 opacity-80">{{ formatTime(message.timestamp) }}</p>
                    </div>
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <el-icon class="text-white text-sm">
                        <User />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="chatStore.loading" class="flex justify-start animate-fadeIn">
                <div class="flex items-start space-x-3">
                  <div class="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <el-icon class="text-white text-sm">
                      <Avatar />
                    </el-icon>
                  </div>
                  <div class="chat-bubble-assistant px-4 py-3 shadow-sm">
                    <div class="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">AI正在思考中...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 聊天输入区域 -->
            <div class="border-t border-white/20 p-6 bg-white/30">
              <div class="flex space-x-3 mb-4">
                <el-input
                  v-model="messageInput"
                  placeholder="输入您的问题或指令..."
                  @keyup.enter="sendMessage"
                  :disabled="chatStore.loading"
                  class="input-enhanced"
                  size="large"
                />
                <el-button 
                  type="primary" 
                  @click="sendMessage"
                  :loading="chatStore.loading"
                  :disabled="!messageInput.trim()"
                  class="btn-primary px-6"
                  size="large"
                >
                  <el-icon class="mr-1"><Promotion /></el-icon>
                  发送
                </el-button>
              </div>
              
              <!-- 快捷指令 -->
              <div class="flex flex-wrap gap-2">
                <el-button 
                  v-for="suggestion in quickSuggestions" 
                  :key="suggestion"
                  size="small"
                  class="tag-primary hover:shadow-md transition-all duration-200"
                  @click="messageInput = suggestion"
                >
                  {{ suggestion }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 创建OKR对话框 -->
    <el-dialog
      v-model="showCreateOKR"
      title="创建新的OKR"
      width="600px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="p-2">
        <el-form
          ref="okrFormRef"
          :model="okrForm"
          :rules="okrRules"
          label-width="100px"
          class="space-y-6"
        >
          <el-form-item label="学习目标" prop="objective">
            <el-input
              v-model="okrForm.objective"
              type="textarea"
              :rows="4"
              placeholder="描述您的学习目标，例如：掌握数据结构与算法基础知识..."
              class="input-enhanced"
            />
            <div class="text-xs text-gray-500 mt-1">
              💡 建议：设定一个具体、可衡量、有时限的学习目标
            </div>
          </el-form-item>
          
          <el-form-item label="关键结果" prop="keyResults">
            <div class="space-y-3">
              <div 
                v-for="(kr, index) in okrForm.keyResults" 
                :key="index"
                class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {{ index + 1 }}
                </div>
                <el-input
                  v-model="kr.text"
                  :placeholder="`关键结果 ${index + 1}，例如：完成10道算法题目...`"
                  class="flex-1 input-enhanced"
                />
                <el-button 
                  v-if="okrForm.keyResults.length > 1"
                  type="danger" 
                  size="small"
                  circle
                  @click="removeKeyResult(index)"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
              </div>
              
              <el-button 
                v-if="okrForm.keyResults.length < 5"
                type="primary" 
                size="small"
                class="w-full btn-primary"
                @click="addKeyResult"
              >
                <el-icon class="mr-1"><Plus /></el-icon>
                添加关键结果 ({{ okrForm.keyResults.length }}/5)
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end space-x-3">
          <el-button @click="showCreateOKR = false" size="large">
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="createOKR" 
            :loading="okrStore.loading"
            class="btn-primary px-8"
            size="large"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            创建OKR
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOKRStore } from '@/stores/okr'
import { useChatStore } from '@/stores/chat'
import { 
  Star, 
  Aim, 
  ChatDotRound, 
  Delete, 
  Setting, 
  Avatar, 
  User,
  Promotion, 
  Plus, 
  Minus, 
  Edit, 
  Check, 
  Flag, 
  Trophy, 
  DataAnalysis,
  CopyDocument,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const okrStore = useOKRStore()
const chatStore = useChatStore()

// 响应式数据
const showCreateOKR = ref(false)
const messageInput = ref('')
const chatContainer = ref(null)
const okrFormRef = ref()

// OKR表单
const okrForm = reactive({
  objective: '',
  keyResults: [{ text: '' }]
})

const okrRules = {
  objective: [
    { required: true, message: '请输入学习目标', trigger: 'blur' },
    { min: 10, message: '目标描述至少10个字符', trigger: 'blur' }
  ],
  keyResults: [
    { 
      type: 'array', 
      required: true, 
      message: '请至少添加一个关键结果', 
      trigger: 'change' 
    }
  ]
}

// 快捷指令
const quickSuggestions = [
  '今天该做什么？',
  '解释一下B+树',
  '帮我制定学习计划',
  '我的进度如何？'
]

// 方法
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const sendMessage = async () => {
  if (!messageInput.value.trim()) return
  
  const message = messageInput.value
  messageInput.value = ''
  
  await chatStore.sendMessage(message)
  
  // 滚动到底部
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const clearChat = () => {
  chatStore.clearMessages()
}

const copyMessage = (content) => {
  navigator.clipboard.writeText(content)
  ElMessage.success('已复制到剪贴板')
}

const editOKR = () => {
  // 编辑OKR逻辑
  showCreateOKR.value = true
  okrForm.objective = okrStore.currentOKR.objective
  okrForm.keyResults = [...okrStore.currentOKR.key_results]
}

const addKeyResult = () => {
  if (okrForm.keyResults.length < 5) {
    okrForm.keyResults.push({ text: '' })
  }
}

const removeKeyResult = (index) => {
  if (okrForm.keyResults.length > 1) {
    okrForm.keyResults.splice(index, 1)
  }
}

const createOKR = async () => {
  try {
    if (!okrFormRef.value) return
    
    const valid = await okrFormRef.value.validate()
    if (!valid) return

    const keyResults = okrForm.keyResults
      .filter(kr => kr.text.trim())
      .map(kr => ({ text: kr.text.trim() }))

    if (keyResults.length === 0) {
      ElMessage.error('请至少添加一个关键结果')
      return
    }

    const result = await okrStore.createOKR(okrForm.objective, keyResults)
    if (result.success) {
      showCreateOKR.value = false
      // 重置表单
      okrForm.objective = ''
      okrForm.keyResults = [{ text: '' }]
      ElMessage.success('OKR创建成功！')
    }
  } catch (error) {
    console.error('Create OKR error:', error)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听聊天消息变化，自动滚动
watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
})

// 生命周期
onMounted(async () => {
  try {
    // 等待认证状态初始化
    await authStore.init()
    
    // 检查认证状态
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }
    
    // 初始化聊天会话
    chatStore.initSession()
    
    // 获取用户OKR
    await okrStore.fetchOKRs()
    
    // 获取聊天历史
    await chatStore.fetchChatHistory()
  } catch (error) {
    console.error('Dashboard initialization error:', error)
  }
})
</script>

<style scoped>
/* 自定义对话框样式 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

/* 输入框样式增强 */
:deep(.el-input__wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 按钮样式增强 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}
</style>