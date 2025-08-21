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
      <div class="space-y-6">
        <div class="animate-slideIn" style="animation-delay: 0.1s">
          <div class="relative w-full mb-6">
            <el-input
              v-model="loginForm.email"
              type="email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              class="input-enhanced w-full"
              style="width: 100%;"
            />
          </div>
        </div>

        <div class="animate-slideIn" style="animation-delay: 0.2s">
          <div class="relative w-full mb-6">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="input-enhanced w-full"
              style="width: 100%;"
            />
          </div>
        </div>

        <div class="animate-slideIn" style="animation-delay: 0.3s">
          <el-button
            type="primary"
            size="large"
            class="w-full btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
            @click="handleLogin"
          >
            <el-icon class="mr-2">
              <Right />
            </el-icon>
            立即登录
          </el-button>
        </div>
      </div>

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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Message, Lock, Star, Right, Warning, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  try {
    // 使用模拟登录
    const result = await authStore.login(loginForm.email || 'test@example.com', loginForm.password || 'password123')
    
    if (result.success) {
      ElMessage.success('登录成功！')
      router.push('/dashboard')
    } else {
      ElMessage.error('登录失败：' + result.error)
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录出错：' + error.message)
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
