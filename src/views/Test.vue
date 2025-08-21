<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">启明星平台 - 测试页面</h1>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">认证状态测试</h2>
        <div class="space-y-2">
          <p><strong>认证状态:</strong> {{ authStore.isAuthenticated ? '已认证' : '未认证' }}</p>
          <p><strong>用户信息:</strong> {{ authStore.user ? authStore.user.email : '无' }}</p>
          <p><strong>用户档案:</strong> {{ authStore.userProfile ? authStore.userProfile.name : '无' }}</p>
        </div>
        
        <div class="mt-4 space-x-4">
          <el-button @click="testLogin" type="primary">测试登录</el-button>
          <el-button @click="testLogout" type="danger">测试登出</el-button>
          <el-button @click="goToDashboard" type="success">前往仪表板</el-button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">OKR测试</h2>
        <div class="space-y-2">
          <p><strong>OKR数量:</strong> {{ okrStore.okrs.length }}</p>
          <p><strong>是否有OKR:</strong> {{ okrStore.hasOKR ? '是' : '否' }}</p>
        </div>
        
        <div class="mt-4">
          <el-button @click="testCreateOKR" type="primary">测试创建OKR</el-button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">聊天测试</h2>
        <div class="space-y-2">
          <p><strong>消息数量:</strong> {{ chatStore.messages.length }}</p>
          <p><strong>会话ID:</strong> {{ chatStore.sessionId || '无' }}</p>
        </div>
        
        <div class="mt-4">
          <el-button @click="testSendMessage" type="primary">测试发送消息</el-button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">路由测试</h2>
        <div class="space-x-4">
          <el-button @click="$router.push('/login')" type="info">前往登录页</el-button>
          <el-button @click="$router.push('/register')" type="warning">前往注册页</el-button>
          <el-button @click="$router.push('/dashboard')" type="success">前往仪表板</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOKRStore } from '@/stores/okr'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const okrStore = useOKRStore()
const chatStore = useChatStore()

// 测试登录
const testLogin = async () => {
  try {
    const result = await authStore.login('test@example.com', 'password123')
    if (result.success) {
      ElMessage.success('测试登录成功！')
    } else {
      ElMessage.error('测试登录失败：' + result.error)
    }
  } catch (error) {
    ElMessage.error('测试登录出错：' + error.message)
  }
}

// 测试登出
const testLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('测试登出成功！')
  } catch (error) {
    ElMessage.error('测试登出出错：' + error.message)
  }
}

// 前往仪表板
const goToDashboard = () => {
  router.push('/dashboard')
}

// 测试创建OKR
const testCreateOKR = async () => {
  try {
    const result = await okrStore.createOKR(
      '测试学习目标',
      [{ text: '完成基础学习' }, { text: '进行实践练习' }]
    )
    if (result.success) {
      ElMessage.success('测试OKR创建成功！')
    } else {
      ElMessage.error('测试OKR创建失败：' + result.error)
    }
  } catch (error) {
    ElMessage.error('测试OKR创建出错：' + error.message)
  }
}

// 测试发送消息
const testSendMessage = async () => {
  try {
    const result = await chatStore.sendMessage('你好，这是一个测试消息')
    if (result.success) {
      ElMessage.success('测试消息发送成功！')
    } else {
      ElMessage.error('测试消息发送失败：' + result.error)
    }
  } catch (error) {
    ElMessage.error('测试消息发送出错：' + error.message)
  }
}

onMounted(async () => {
  // 初始化认证状态
  await authStore.init()
})
</script>
