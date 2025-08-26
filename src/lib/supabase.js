/**
 * Supabase客户端配置
 * 使用单例模式确保客户端实例唯一
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量。请检查.env文件中的VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY')
}

// 创建Supabase客户端实例（单例模式）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 导出默认客户端
export default supabase

// 辅助函数：检查Supabase连接状态
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('_health_check').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is expected
      throw error
    }
    return { connected: true, error: null }
  } catch (error) {
    console.warn('Supabase连接检查失败:', error.message)
    return { connected: false, error: error.message }
  }
}

// 辅助函数：获取当前用户
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('获取当前用户失败:', error.message)
    return null
  }
}

// 辅助函数：监听认证状态变化
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// 辅助函数：登出
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // 清理本地存储
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      Object.entries(storage).forEach(([key]) => {
        if (key.startsWith('supabase.') || key.startsWith('sb-')) {
          storage.removeItem(key)
        }
      })
    })
    
    return { success: true }
  } catch (error) {
    console.error('登出失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 辅助函数：用邮箱和密码登录
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('邮箱登录失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 辅助函数：用邮箱和密码注册
export async function signUpWithEmail(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      // 处理特定的错误情况
      if (error.message.includes('Anonymous sign-ins are disabled')) {
        throw new Error('邮箱注册功能未启用，请联系管理员启用邮箱认证提供商')
      } else if (error.message.includes('User already registered')) {
        throw new Error('该邮箱已被注册，请直接登录或使用其他邮箱')
      } else if (error.message.includes('Invalid email')) {
        throw new Error('邮箱格式不正确，请检查后重试')
      } else if (error.message.includes('Password should be at least')) {
        throw new Error('密码长度至少需要6位字符')
      }
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('邮箱注册失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 辅助函数：重置密码
export async function resetPassword(email, redirectTo = null) {
  try {
    const options = redirectTo ? { redirectTo } : {}
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('重置密码失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 辅助函数：更新用户信息
export async function updateUser(updates) {
  try {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('更新用户信息失败:', error.message)
    return { success: false, error: error.message }
  }
}