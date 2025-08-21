<template>
  <div class="min-h-screen gradient-bg-light flex items-center justify-center p-4 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-md w-full glass-effect rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeIn relative z-10">
      <!-- Logo和标题 -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-custom">
          <el-icon class="text-white text-3xl">
            <Star />
          </el-icon>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          加入启明星
        </h1>
        <p class="text-gray-600">开启您的AI学习成长之旅</p>
        <div class="w-16 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mt-4"></div>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        @submit.prevent="handleRegister"
        class="space-y-5"
      >
        <el-form-item prop="name" class="animate-slideIn" style="animation-delay: 0.1s">
          <div class="relative">
            <el-input
              v-model="registerForm.name"
              placeholder="请输入您的姓名"
              size="large"
              :prefix-icon="User"
              class="input-enhanced"
            />
          </div>
        </el-form-item>

        <el-form-item prop="email" class="animate-slideIn" style="animation-delay: 0.2s">
          <div class="relative">
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              class="input-enhanced"
            />
          </div>
        </el-form-item>

        <el-form-item prop="password" class="animate-slideIn" style="animation-delay: 0.3s">
          <div class="relative">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请设置密码（至少6位）"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="input-enhanced"
            />
          </div>
        </el-form-item>

        <el-form-item prop="confirmPassword" class="animate-slideIn" style="animation-delay: 0.4s">
          <div class="relative">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="input-enhanced"
            />
          </div>
        </el-form-item>

        <el-form-item prop="studentId" class="animate-slideIn" style="animation-delay: 0.5s">
          <div class="relative">
            <el-input
              v-model="registerForm.studentId"
              placeholder="学号（可选，8-12位数字）"
              size="large"
              :prefix-icon="Document"
              class="input-enhanced"
            />
          </div>
        </el-form-item>

        <!-- 密码强度指示器 -->
        <div v-if="registerForm.password" class="animate-fadeIn">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-sm text-gray-600">密码强度:</span>
            <div class="flex space-x-1">
              <div :class="['w-6 h-1 rounded-full transition-colors', passwordStrength >= 1 ? 'bg-red-400' : 'bg-gray-200']"></div>
              <div :class="['w-6 h-1 rounded-full transition-colors', passwordStrength >= 2 ? 'bg-yellow-400' : 'bg-gray-200']"></div>
              <div :class="['w-6 h-1 rounded-full transition-colors', passwordStrength >= 3 ? 'bg-green-400' : 'bg-gray-200']"></div>
            </div>
            <span :class="['text-xs font-medium', getPasswordStrengthColor()]">
              {{ getPasswordStrengthText() }}
            </span>
          </div>
        </div>

        <el-form-item class="animate-slideIn" style="animation-delay: 0.6s">
          <el-button
            type="primary"
            size="large"
            class="w-full btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
            :loading="authStore.loading"
            @click="handleRegister"
          >
            <el-icon class="mr-2" v-if="!authStore.loading">
              <UserFilled />
            </el-icon>
            {{ authStore.loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 错误提示 -->
      <div v-if="authStore.error" class="mt-6 animate-fadeIn">
        <div class="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
          <div class="flex items-center">
            <el-icon class="text-red-500 mr-2">
              <Warning />
            </el-icon>
            <p class="text-red-600 text-sm font-medium">{{ authStore.error }}</p>
          </div>
        </div>
      </div>

      <!-- 用户协议 -->
      <div class="mt-6 animate-slideIn" style="animation-delay: 0.7s">
        <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div class="flex items-start space-x-3">
            <el-icon class="text-blue-500 mt-0.5">
              <InfoFilled />
            </el-icon>
            <div class="text-sm text-gray-600 leading-relaxed">
              <p class="mb-2">注册即表示您同意我们的</p>
              <div class="flex flex-wrap gap-2">
                <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">用户协议</a>
                <span>和</span>
                <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">隐私政策</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="flex items-center my-8">
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <span class="px-4 text-sm text-gray-500 bg-white">或</span>
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      <!-- 登录链接 -->
      <div class="text-center animate-slideIn" style="animation-delay: 0.8s">
        <p class="text-gray-600 mb-4">
          已有账号？
        </p>
        <router-link
          to="/login"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
        >
          <el-icon class="mr-2">
            <Right />
          </el-icon>
          立即登录
        </router-link>
      </div>

      <!-- 底部装饰 -->
      <div class="mt-8 text-center">
        <div class="flex justify-center space-x-2 mb-4">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
        <p class="text-xs text-gray-400">
          © 2025 启明星平台 · 让AI助力您的学习成长
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Message, Lock, Document, Star, UserFilled, Warning, InfoFilled, Right } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const registerFormRef = ref()

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  studentId: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  studentId: [
    { pattern: /^\d{8,12}$/, message: '学号格式不正确', trigger: 'blur' }
  ]
}

// 密码强度计算
const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 6) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  return strength
})

const getPasswordStrengthText = () => {
  switch (passwordStrength.value) {
    case 0: return '太弱'
    case 1: return '较弱'
    case 2: return '中等'
    case 3: return '强'
    default: return '太弱'
  }
}

const getPasswordStrengthColor = () => {
  switch (passwordStrength.value) {
    case 0: return 'text-red-500'
    case 1: return 'text-red-500'
    case 2: return 'text-yellow-500'
    case 3: return 'text-green-500'
    default: return 'text-red-500'
  }
}

const handleRegister = async () => {
  try {
    const valid = await registerFormRef.value.validate()
    if (!valid) return

    const userData = {
      name: registerForm.name,
      student_id: registerForm.studentId || null
    }

    const result = await authStore.register(registerForm.email, registerForm.password, userData)
    if (result.success) {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Register error:', error)
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
