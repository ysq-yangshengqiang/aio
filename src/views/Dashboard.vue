<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <el-icon class="text-white">
                <Star />
              </el-icon>
            </div>
            <h1 class="text-xl font-semibold text-gray-900">启明星平台</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">{{ authStore.user?.email }}</span>
            <el-button @click="handleLogout" type="danger" size="small">
              退出登录
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：OKR区域 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">我的OKR</h2>
              <el-button 
                v-if="!okrStore.hasOKR" 
                type="primary" 
                size="small"
                @click="showCreateOKR = true"
              >
                创建OKR
              </el-button>
            </div>

            <!-- OKR内容 -->
            <div v-if="okrStore.hasOKR" class="space-y-4">
              <div class="bg-blue-50 rounded-lg p-4">
                <h3 class="font-medium text-blue-900 mb-2">目标 (Objective)</h3>
                <p class="text-blue-800">{{ okrStore.currentOKR.objective }}</p>
              </div>
              
              <div class="bg-green-50 rounded-lg p-4">
                <h3 class="font-medium text-green-900 mb-2">关键结果 (Key Results)</h3>
                <ul class="space-y-2">
                  <li 
                    v-for="(kr, index) in okrStore.currentOKR.key_results" 
                    :key="index"
                    class="flex items-start"
                  >
                    <span class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-0.5">
                      {{ index + 1 }}
                    </span>
                    <span class="text-green-800">{{ kr.text }}</span>
                  </li>
                </ul>
              </div>
            </div>

                         <!-- 无OKR提示 -->
             <div v-else class="text-center py-8">
               <el-icon class="text-gray-400 text-4xl mb-3">
                 <Aim />
               </el-icon>
               <p class="text-gray-500">还没有设置OKR</p>
               <p class="text-gray-400 text-sm mt-1">创建您的第一个学习目标</p>
             </div>
          </div>
        </div>

        <!-- 右侧：AI聊天区域 -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow h-[600px] flex flex-col">
            <!-- 聊天头部 -->
            <div class="border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">AI学习助手</h2>
              <p class="text-sm text-gray-500">基于您的OKR提供个性化指导</p>
            </div>

            <!-- 聊天消息区域 -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="chatContainer">
              <div 
                v-for="message in chatStore.messages" 
                :key="message.id"
                :class="[
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
              >
                <div 
                  :class="[
                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  <p class="whitespace-pre-wrap">{{ message.content }}</p>
                  <p class="text-xs mt-1 opacity-70">
                    {{ formatTime(message.timestamp) }}
                  </p>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="chatStore.loading" class="flex justify-start">
                <div class="bg-gray-100 px-4 py-2 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 聊天输入区域 -->
            <div class="border-t p-4">
              <div class="flex space-x-3">
                <el-input
                  v-model="messageInput"
                  placeholder="输入您的问题或指令..."
                  @keyup.enter="sendMessage"
                  :disabled="chatStore.loading"
                />
                <el-button 
                  type="primary" 
                  @click="sendMessage"
                  :loading="chatStore.loading"
                  :disabled="!messageInput.trim()"
                >
                  发送
                </el-button>
              </div>
              
              <!-- 快捷指令 -->
              <div class="mt-3 flex flex-wrap gap-2">
                <el-button 
                  v-for="suggestion in quickSuggestions" 
                  :key="suggestion"
                  size="small"
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
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="okrFormRef"
        :model="okrForm"
        :rules="okrRules"
        label-width="80px"
      >
        <el-form-item label="目标" prop="objective">
          <el-input
            v-model="okrForm.objective"
            type="textarea"
            :rows="3"
            placeholder="描述您的学习目标..."
          />
        </el-form-item>
        
        <el-form-item label="关键结果" prop="keyResults">
          <div class="space-y-2">
            <div 
              v-for="(kr, index) in okrForm.keyResults" 
              :key="index"
              class="flex items-center space-x-2"
            >
              <el-input
                v-model="kr.text"
                :placeholder="`关键结果 ${index + 1}`"
              />
              <el-button 
                v-if="okrForm.keyResults.length > 1"
                type="danger" 
                size="small"
                @click="removeKeyResult(index)"
              >
                删除
              </el-button>
            </div>
            <el-button 
              v-if="okrForm.keyResults.length < 5"
              type="primary" 
              size="small"
              @click="addKeyResult"
            >
              添加关键结果
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateOKR = false">取消</el-button>
          <el-button type="primary" @click="createOKR" :loading="okrStore.loading">
            创建
          </el-button>
        </span>
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
import { Star, Aim } from '@element-plus/icons-vue'
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
    { required: true, message: '请输入学习目标', trigger: 'blur' }
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
      // 使用Element Plus的消息提示
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
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
