<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex min-h-screen">
      <!-- 左侧品牌区 -->
      <div class="hidden lg:flex lg:w-2/5 gradient-bg relative overflow-hidden">
        <div
          class="absolute inset-0"
          style="background-image: url('https://readdy.ai/api/search-image?query=Modern%20abstract%20geometric%20patterns%20with%20soft%20gradients%2C%20minimalist%20design%20elements%2C%20flowing%20curves%20and%20subtle%20light%20effects%2C%20professional%20tech%20company%20branding%20background%2C%20clean%20and%20sophisticated%20visual%20style%2C%20contemporary%20digital%20art%20with%20blue%20and%20purple%20tones&width=800&height=1200&seq=register-bg-001&orientation=portrait'); background-size: cover; background-position: center; opacity: 0.1;"
        ></div>

        <div
          class="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white slide-in-left"
        >
          <div class="text-center">
            <h1 class="text-5xl font-['Pacifico'] mb-6">AIO</h1>
            <p class="text-xl mb-8 opacity-90">开启智能学习新篇章</p>
            <p class="text-base opacity-75 leading-relaxed max-w-md">
              加入我们，体验AI驱动的个性化学习体验。让技术成为你学习路上的得力助手，实现更高效的成长。
            </p>
          </div>

          <div class="mt-16">
            <img
              src="https://readdy.ai/api/search-image?query=Students%20learning%20with%20AI%20technology%2C%20modern%20classroom%20setting%2C%20digital%20education%20illustration%2C%20friendly%20and%20welcoming%20atmosphere%2C%20contemporary%20flat%20design%20style%20with%20blue%20and%20green%20color%20scheme&width=400&height=300&seq=register-illustration-001&orientation=landscape"
              alt="学习插画"
              class="w-80 h-60 object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      <!-- 右侧注册区 -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div class="w-full max-w-md fade-in">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">创建新账户</h2>
            <p class="text-gray-600">填写信息，开启学习之旅</p>
          </div>

          <form class="space-y-6" @submit.prevent="handleRegister">
            <!-- 姓名输入框 -->
            <div>
              <label
                for="fullName"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                姓名
              </label>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <div class="w-5 h-5 flex items-center justify-center">
                    <i class="ri-user-line text-gray-400"></i>
                  </div>
                </div>
                <input
                  type="text"
                  id="fullName"
                  v-model="form.fullName"
                  required
                  class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  placeholder="请输入您的姓名"
                />
              </div>
            </div>

            <!-- 邮箱输入框 -->
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                邮箱地址
              </label>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <div class="w-5 h-5 flex items-center justify-center">
                    <i class="ri-mail-line text-gray-400"></i>
                  </div>
                </div>
                <input
                  type="email"
                  id="email"
                  v-model="form.email"
                  required
                  class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>

            <!-- 密码输入框 -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                密码
              </label>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <div class="w-5 h-5 flex items-center justify-center">
                    <i class="ri-lock-line text-gray-400"></i>
                  </div>
                </div>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="form.password"
                  required
                  class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  placeholder="请设置密码（至少6位）"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div
                    class="w-5 h-5 flex items-center justify-center password-toggle cursor-pointer"
                    @click="togglePassword"
                  >
                    <i :class="showPassword ? 'ri-eye-line' : 'ri-eye-off-line'" class="text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- 确认密码输入框 -->
            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                确认密码
              </label>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <div class="w-5 h-5 flex items-center justify-center">
                    <i class="ri-lock-line text-gray-400"></i>
                  </div>
                </div>
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  required
                  class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  placeholder="请再次输入密码"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div
                    class="w-5 h-5 flex items-center justify-center password-toggle cursor-pointer"
                    @click="toggleConfirmPassword"
                  >
                    <i :class="showConfirmPassword ? 'ri-eye-line' : 'ri-eye-off-line'" class="text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- 服务条款 -->
            <div class="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agreeTerms"
                v-model="form.agreeTerms"
                required
                class="checkbox-custom mt-1"
              />
              <label
                for="agreeTerms"
                class="text-sm text-gray-600 cursor-pointer leading-relaxed"
              >
                我已阅读并同意
                <router-link
                  to="/terms"
                  class="text-primary hover:text-blue-700 transition-colors duration-200"
                >
                  服务条款
                </router-link>
                和
                <router-link
                  to="/privacy"
                  class="text-primary hover:text-blue-700 transition-colors duration-200"
                >
                  隐私政策
                </router-link>
              </label>
            </div>

            <!-- 注册按钮 -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary text-white py-3 px-4 rounded-button font-medium text-sm btn-hover loading-btn transition-all duration-200 whitespace-nowrap"
              :class="{ 'loading': loading }"
            >
              {{ loading ? '' : '创建账户' }}
            </button>
          </form>

          <!-- 错误提示 -->
          <div v-if="error" class="mt-6 rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <div class="w-5 h-5 flex items-center justify-center">
                  <i class="ri-error-warning-line text-red-400"></i>
                </div>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  注册失败
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="mt-8 mb-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-gray-500"
                  >或使用以下方式注册</span
                >
              </div>
            </div>
          </div>

          <!-- 第三方注册 -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyRegister('wechat')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-wechat-fill text-green-500 text-lg"></i>
              </div>
            </button>
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyRegister('alipay')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-alipay-fill text-blue-500 text-lg"></i>
              </div>
            </button>
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyRegister('qq')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-qq-fill text-blue-600 text-lg"></i>
              </div>
            </button>
          </div>

          <!-- 登录链接 -->
          <div class="text-center">
            <span class="text-sm text-gray-600">已有账号？</span>
            <router-link
              to="/login"
              class="text-sm text-primary hover:text-blue-700 font-medium transition-colors duration-200 ml-1"
            >
              立即登录
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth.service.js'
import { useNotification } from '@/composables/useNotification.js'

const { showNotification } = useNotification()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = async () => {
  if (loading.value) return
  
  // 清除之前的错误
  error.value = ''
  
  // 基本验证
  if (!form.fullName.trim()) {
    error.value = '请输入姓名'
    return
  }
  
  if (!form.email.trim()) {
    error.value = '请输入邮箱地址'
    return
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    error.value = '请输入有效的邮箱地址'
    return
  }
  
  if (!form.password.trim()) {
    error.value = '请输入密码'
    return
  }
  
  if (form.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }
  
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (!form.agreeTerms) {
    error.value = '请同意服务条款和隐私政策'
    return
  }
  
  loading.value = true
  
  try {
    // 使用认证服务注册
    const result = await authService.register({
      email: form.email,
      password: form.password,
      name: form.fullName
    })
    
    if (result.success) {
      // 注册成功，显示成功消息
      showNotification('注册成功！请查收邮箱验证邮件', 'success')
      
      // 如果用户立即可用（邮箱验证可能自动完成），则同步状态
      if (result.data?.user) {
        await authStore.init()
        // 重定向到仪表板
        router.push('/dashboard')
      } else {
        // 等待邮箱验证，重定向到登录页
        showNotification('请先验证邮箱再登录', 'info')
        router.push('/login')
      }
    } else {
      // 注册失败，显示错误信息
      error.value = result.error || '注册失败，请检查信息后重试'
      showNotification(error.value, 'error')
    }
  } catch (err) {
    console.error('Register error:', err)
    error.value = '注册过程中发生错误，请稍后重试'
    showNotification(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const handleThirdPartyRegister = (provider) => {
  console.log(`使用 ${provider} 注册`)
  showNotification(`${provider} 注册功能开发中...`, 'info')
}

// 组件挂载时检查认证状态
onMounted(async () => {
  try {
    await authStore.init()
    // 如果用户已经登录，直接跳转到仪表板
    if (authStore.isAuthenticated) {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('初始化认证状态失败:', error)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.input-focus:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.checkbox-custom {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.checkbox-custom:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-custom:checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.password-toggle {
  cursor: pointer;
  user-select: none;
}

.loading-btn {
  position: relative;
}

.loading-btn.loading {
  color: transparent;
}

.loading-btn.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-left {
  animation: slideInLeft 0.8s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rounded-button {
  border-radius: 8px;
}

.primary {
  color: #3b82f6;
}

.bg-primary {
  background-color: #3b82f6;
}

.text-primary {
  color: #3b82f6;
}
</style>