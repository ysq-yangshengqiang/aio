import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const hasProfile = computed(() => !!userProfile.value)

  // 登录
  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await authService.login(email, password)
      
      if (result.success) {
        user.value = result.data.user
        // 获取用户档案
        await fetchUserProfile()
        return { success: true, data: result.data.user }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Store login error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await authService.register(userData)
      
      if (result.success) {
        user.value = result.data?.user || null
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Store register error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      loading.value = true
      const result = await authService.logout()
      
      if (result.success) {
        user.value = null
        userProfile.value = null
        error.value = null
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Store logout error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 检查当前会话
  const checkAuth = async () => {
    try {
      const result = await authService.getCurrentUser()
      if (result.success) {
        user.value = result.data
        userProfile.value = result.data.profile
      } else {
        user.value = null
        userProfile.value = null
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      user.value = null
      userProfile.value = null
    }
  }

  // 获取用户档案
  const fetchUserProfile = async () => {
    try {
      if (!user.value) return
      
      // 这里可以实现获取用户档案的逻辑
      // 暂时使用基本信息
      userProfile.value = {
        id: user.value.id,
        email: user.value.email,
        name: user.value.user_metadata?.name || user.value.email.split('@')[0],
        role: user.value.user_metadata?.role || 'student',
        created_at: user.value.created_at,
        updated_at: user.value.updated_at
      }
    } catch (err) {
      console.error('Fetch profile error:', err)
    }
  }

  // 更新用户档案
  const updateUserProfile = async (updates) => {
    try {
      loading.value = true
      const result = await authService.updateProfile(updates)
      
      if (result.success) {
        userProfile.value = { ...userProfile.value, ...updates }
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Update profile error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 初始化
  const init = async () => {
    try {
      await checkAuth()
    } catch (error) {
      console.error('Auth init error:', error)
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    hasProfile,
    login,
    register,
    logout,
    checkAuth,
    fetchUserProfile,
    updateUserProfile,
    init
  }
})
