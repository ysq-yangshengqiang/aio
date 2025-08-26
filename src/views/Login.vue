<template>
  <div class="min-h-screen gradient-bg-light flex items-center justify-center p-4 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-md w-full glass-effect rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeIn relative z-10">
      <!-- Logo和标题 -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-custom">
          <el-icon class="text-white text-3xl">
            <Star />
          </el-icon>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          启明星平台
        </h1>
        <p class="text-gray-600">AI驱动的学生成长管理系统</p>
        <div class="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
      </div>

      <!-- 登录表单 -->
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="space-y-6">
        <div class="animate-slideIn" style="animation-delay: 0.1s">
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              type="email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              class="input-enhanced"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
        </div>

        <div class="animate-slideIn" style="animation-delay: 0.2s">
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="input-enhanced"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
        </div>

        <div class="animate-slideIn" style="animation-delay: 0.3s">
          <el-button
            type="primary"
            size="large"
            class="w-full btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
            @click="handleLogin"
            :loading="authStore.loading"
          >
            <el-icon class="mr-2" v-if="!authStore.loading">
              <Right />
            </el-icon>
            {{ authStore.loading ? '登录中...' : '立即登录' }}
          </el-button>
        </div>
        
        <!-- 快速体验按钮 -->
        <div class="animate-slideIn" style="animation-delay: 0.35s">
          <el-button
            type="info"
            size="large"
            class="w-full shadow-md hover:shadow-lg transition-all duration-300"
            @click="quickLogin"
            :disabled="authStore.loading"
            plain
          >
            <el-icon class="mr-2">
              <Star />
            </el-icon>
            快速体验（无需注册）
          </el-button>
        </div>
      </el-form>

      <!-- 错误提示区域暂时隐藏 -->

      <!-- 分割线 -->
      <div class="flex items-center my-8">
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <span class="px-4 text-sm text-gray-500 bg-white">或</span>
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      <!-- 注册链接 -->
      <div class="text-center animate-slideIn" style="animation-delay: 0.4s">
        <p class="text-gray-600 mb-4">
          还没有账号？
        </p>
        <router-link
          to="/register"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
        >
          <el-icon class="mr-2">
            <UserFilled />
          </el-icon>
          立即注册
        </router-link>
      </div>

      <!-- 底部装饰 -->
      <div class="mt-8 text-center">
        <div class="flex justify-center space-x-2 mb-4">
          <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
        <p class="text-xs text-gray-400">
          © 2025 启明星平台 · 让AI助力您的学习成长
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Message, Lock, Star, Right, Warning, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loginFormRef = ref()

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    const result = await authStore.login(loginForm.email, loginForm.password)
    
    if (result.success) {
      ElMessage.success('登录成功！欢迎回来～')
      const redirect = route.query.redirect || '/dashboard'
      router.push(String(redirect))
    } else {
      ElMessage.error('登录失败：' + result.error)
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录出错，请稍后重试')
  }
}

// 快速体验功能（模拟登录）
const quickLogin = async () => {
  try {
    // 设置模拟用户
    authStore.user = {
      id: 'mock-user-id',
      email: 'demo@qimingxing.com',
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    await authStore.fetchUserProfile()
    
    ElMessage.success('欢迎体验启明星平台！')
    router.push('/dashboard')
  } catch (error) {
    console.error('Quick login error:', error)
    ElMessage.error('快速体验失败，请稍后重试')
  }
}
</script>

<style scoped>
.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}
</style>
