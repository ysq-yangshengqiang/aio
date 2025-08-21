import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

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
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) throw authError
      
      user.value = data.user
      
      // 获取用户档案
      await fetchUserProfile()
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (email, password, userData = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (authError) throw authError
      
      user.value = data.user
      
      // 创建用户档案
      await createUserProfile(userData)
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      user.value = null
      error.value = null
    } catch (err) {
      error.value = err.message
    }
  }

  // 检查当前会话
  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
      } else {
        // 如果没有会话，设置为null
        user.value = null
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      user.value = null
    }
  }

  // 获取用户档案
  const fetchUserProfile = async () => {
    try {
      if (!user.value) return
      
      // 如果是模拟用户，创建模拟档案
      if (user.value.id === 'mock-user-id') {
        userProfile.value = {
          id: 'mock-profile-id',
          user_id: user.value.id,
          name: '测试用户',
          student_id: '2024001',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return
      }
      
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.value.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Fetch profile error:', profileError)
        return
      }
      
      userProfile.value = data
    } catch (err) {
      console.error('Fetch profile error:', err)
    }
  }

  // 创建用户档案
  const createUserProfile = async (userData) => {
    try {
      if (!user.value) return
      
      // 如果是模拟用户，创建模拟档案
      if (user.value.id === 'mock-user-id') {
        userProfile.value = {
          id: 'mock-profile-id',
          user_id: user.value.id,
          name: userData.name || '测试用户',
          student_id: userData.student_id || '2024001',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return
      }
      
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.value.id,
          name: userData.name,
          student_id: userData.student_id,
          role: 'student'
        })
        .select()
        .single()
      
      if (profileError) {
        console.error('Create profile error:', profileError)
        return
      }
      
      userProfile.value = data
    } catch (err) {
      console.error('Create profile error:', err)
    }
  }

  // 更新用户档案
  const updateUserProfile = async (updates) => {
    try {
      if (!user.value || !userProfile.value) return
      
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.value.id)
        .select()
        .single()
      
      if (profileError) {
        console.error('Update profile error:', profileError)
        return
      }
      
      userProfile.value = data
      return { success: true, data }
    } catch (err) {
      console.error('Update profile error:', err)
      return { success: false, error: err.message }
    }
  }

  // 初始化
  const init = async () => {
    try {
      await checkAuth()
      
      if (user.value) {
        await fetchUserProfile()
      }
      
      // 监听认证状态变化
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
          user.value = session?.user || null
          if (user.value) {
            await fetchUserProfile()
          }
        } else if (event === 'SIGNED_OUT') {
          user.value = null
          userProfile.value = null
        }
      })
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
    createUserProfile,
    updateUserProfile,
    init
  }
})
