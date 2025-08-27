<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex min-h-screen">
      <!-- 左侧品牌区 -->
      <div class="hidden lg:flex lg:w-2/5 gradient-bg relative overflow-hidden">
        <div
          class="absolute inset-0"
          style="background-image: url('https://readdy.ai/api/search-image?query=Modern%20abstract%20geometric%20patterns%20with%20soft%20gradients%2C%20minimalist%20design%20elements%2C%20flowing%20curves%20and%20subtle%20light%20effects%2C%20professional%20tech%20company%20branding%20background%2C%20clean%20and%20sophisticated%20visual%20style%2C%20contemporary%20digital%20art%20with%20blue%20and%20purple%20tones&width=800&height=1200&seq=login-bg-001&orientation=portrait'); background-size: cover; background-position: center; opacity: 0.1;"
        ></div>

        <div
          class="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white slide-in-left"
        >
          <div class="text-center">
            <h1 class="text-5xl font-['Pacifico'] mb-6">AIO</h1>
            <p class="text-xl mb-8 opacity-90">连接未来，创造无限可能</p>
            <p class="text-base opacity-75 leading-relaxed max-w-md">
              我们致力于为用户提供最优质的服务体验，让科技改变生活，让创新引领未来。
            </p>
          </div>

          <div class="mt-16">
            <img
              src="https://readdy.ai/api/search-image?query=Modern%20technology%20illustration%20with%20floating%20geometric%20elements%2C%20clean%20minimalist%20design%2C%20professional%20business%20graphics%2C%20abstract%20digital%20connectivity%20symbols%2C%20contemporary%20flat%20design%20style%20with%20subtle%20shadows%20and%20gradients%2C%20blue%20and%20white%20color%20scheme&width=400&height=300&seq=login-illustration-001&orientation=landscape"
              alt="品牌插画"
              class="w-80 h-60 object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      <!-- 右侧登录区 -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div class="w-full max-w-md fade-in">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">欢迎登录</h2>
            <p class="text-gray-600">请输入您的账号信息</p>
          </div>

          <form class="space-y-6" @submit.prevent="handleLogin">
            <!-- 用户名输入框 -->
            <div>
              <label
                for="username"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                用户名
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
                  id="username"
                  v-model="loginForm.email"
                  required
                  class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  :class="{ 'border-red-500 shadow-red-100': errors.username }"
                  placeholder="请输入用户名"
                />
              </div>
              <div v-if="errors.username" class="error-message text-red-500 text-sm mt-1">
                {{ errors.username }}
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
                  v-model="loginForm.password"
                  required
                  class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 input-focus transition-all duration-200"
                  :class="{ 'border-red-500 shadow-red-100': errors.password }"
                  placeholder="请输入密码"
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
              <div v-if="errors.password" class="error-message text-red-500 text-sm mt-1">
                {{ errors.password }}
              </div>
            </div>

            <!-- 记住密码和忘记密码 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  v-model="loginForm.remember"
                  class="checkbox-custom"
                />
                <label
                  for="remember"
                  class="ml-2 text-sm text-gray-600 cursor-pointer"
                >
                  记住密码
                </label>
              </div>
              <router-link
                to="/auth/forgot-password"
                class="text-sm text-primary hover:text-blue-700 transition-colors duration-200"
              >
                忘记密码？
              </router-link>
            </div>

            <!-- 登录按钮 -->
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full bg-primary text-white py-3 px-4 rounded-button font-medium text-sm btn-hover loading-btn transition-all duration-200 whitespace-nowrap"
              :class="{ 'loading': authStore.loading }"
            >
              {{ authStore.loading ? '' : '登录' }}
            </button>
          </form>

          <!-- 分割线 -->
          <div class="mt-8 mb-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-gray-500"
                  >或使用以下方式登录</span
                >
              </div>
            </div>
          </div>

          <!-- 第三方登录 -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyLogin('wechat')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-wechat-fill text-green-500 text-lg"></i>
              </div>
            </button>
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyLogin('alipay')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-alipay-fill text-blue-500 text-lg"></i>
              </div>
            </button>
            <button
              class="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="handleThirdPartyLogin('qq')"
            >
              <div class="w-5 h-5 flex items-center justify-center">
                <i class="ri-qq-fill text-blue-600 text-lg"></i>
              </div>
            </button>
          </div>

          <!-- 注册链接 -->
          <div class="text-center">
            <span class="text-sm text-gray-600">还没有账号？</span>
            <router-link
              to="/register"
              class="text-sm text-primary hover:text-blue-700 font-medium transition-colors duration-200 ml-1"
            >
              立即注册
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showPassword = ref(false)

const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  username: '',
  password: ''
})

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const validateForm = () => {
  errors.username = ''
  errors.password = ''

  if (!loginForm.email.trim()) {
    errors.username = '请输入用户名'
    return false
  }

  if (!loginForm.password.trim()) {
    errors.password = '请输入密码'
    return false
  }

  if (loginForm.password.length < 6) {
    errors.password = '密码长度至少为 6 位'
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  try {
    const result = await authStore.login(loginForm.email, loginForm.password)
    
    if (result.success) {
      ElMessage.success('登录成功！欢迎回来～')
      const redirect = route.query.redirect || '/dashboard'
      router.push(String(redirect))
    } else {
      ElMessage.error('登录失败：' + result.error)
      if (result.error.includes('用户名') || result.error.includes('邮箱')) {
        errors.username = '用户名不存在'
      } else if (result.error.includes('密码')) {
        errors.password = '密码错误'
      } else {
        errors.password = '登录失败，请重试'
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录出错，请稍后重试')
    errors.password = '登录出错，请稍后重试'
  }
}

const handleThirdPartyLogin = (provider) => {
  console.log(`使用 ${provider} 登录`)
  ElMessage.info(`${provider} 登录功能开发中...`)
}
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