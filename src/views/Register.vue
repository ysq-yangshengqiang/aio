<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
      <!-- Logo和标题 -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <el-icon class="text-white text-2xl">
            <Star />
          </el-icon>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">启明星平台</h1>
        <p class="text-gray-600 mt-2">AI驱动的学生成长管理系统</p>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        @submit.prevent="handleRegister"
        class="space-y-6"
      >
        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="姓名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="studentId">
          <el-input
            v-model="registerForm.studentId"
            placeholder="学号（可选）"
            size="large"
            :prefix-icon="Document"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="authStore.loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 错误提示 -->
      <div v-if="authStore.error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-600 text-sm">{{ authStore.error }}</p>
      </div>

      <!-- 登录链接 -->
      <div class="text-center mt-6">
        <p class="text-gray-600">
          已有账号？
          <router-link
            to="/login"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            立即登录
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Message, Lock, Document, Star } from '@element-plus/icons-vue'

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
