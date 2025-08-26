/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关操作
 * 集成Supabase认证系统
 */
import { BaseService } from './base.service.js'
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser, 
  resetPassword, 
  updateUser,
  onAuthStateChange 
} from '../lib/supabase.js'

export class AuthService extends BaseService {
  constructor() {
    super('auth')
    this.currentUser = null
    this.authStateSubscription = null
    this.initAuthListener()
  }

  /**
   * 初始化认证状态监听器
   */
  initAuthListener() {
    this.authStateSubscription = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = session.user
        this.syncUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null
        this.clearLocalData()
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        this.currentUser = session.user
      }
    })
  }

  /**
   * 同步用户资料到数据库
   * @param {Object} user - Supabase用户对象
   */
  async syncUserProfile(user) {
    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // 创建新用户资料
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            avatar: user.user_metadata?.avatar_url || null,
            role: 'student',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('创建用户资料失败:', error)
        }
      }
    } catch (error) {
      console.error('同步用户资料失败:', error)
    }
  }

  /**
   * 清除本地数据
   */
  clearLocalData() {
    // 清除可能的本地缓存数据
    ['user_preferences', 'okr_cache', 'chat_history'].forEach(key => {
      localStorage.removeItem(key)
    })
  }

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(email, password) {
    try {
      const result = await signInWithEmail(email, password)
      
      if (result.success) {
        return {
          success: true,
          data: {
            user: result.data.user,
            session: result.data.session
          }
        }
      } else {
        return {
          success: false,
          error: result.error || '登录失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      const { email, password, name } = userData

      const result = await signUpWithEmail(email, password, {
        name: name
      })

      if (result.success) {
        return {
          success: true,
          data: {
            user: result.data.user,
            message: '注册成功，请查收邮箱验证邮件'
          }
        }
      } else {
        return {
          success: false,
          error: result.error || '注册失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 用户注册 (别名方法)
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 注册结果
   */
  async signUp(userData) {
    return this.register(userData)
  }

  /**
   * 用户登出
   * @returns {Promise<Object>} 登出结果
   */
  async logout() {
    try {
      const result = await signOut()
      
      if (result.success) {
        return {
          success: true,
          message: '登出成功'
        }
      } else {
        return {
          success: false,
          error: result.error || '登出失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser() {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 获取完整的用户资料
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('获取用户资料失败:', error)
        }

        return {
          success: true,
          data: {
            ...user,
            profile: profile || null
          }
        }
      } else {
        return {
          success: false,
          error: '用户未登录'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新用户资料
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(updates) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 更新Supabase用户元数据
      if (updates.name || updates.avatar) {
        const metadataUpdates = {}
        if (updates.name) metadataUpdates.name = updates.name
        if (updates.avatar) metadataUpdates.avatar_url = updates.avatar

        const authResult = await updateUser({
          data: metadataUpdates
        })

        if (!authResult.success) {
          return {
            success: false,
            error: authResult.error
          }
        }
      }

      // 更新用户资料表
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 重置密码
   * @param {string} email - 邮箱
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(email) {
    try {
      const result = await resetPassword(email, `${window.location.origin}/reset-password`)
      
      if (result.success) {
        return {
          success: true,
          message: '重置密码邮件已发送，请查收邮箱'
        }
      } else {
        return {
          success: false,
          error: result.error || '发送重置邮件失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 更新结果
   */
  async updatePassword(newPassword) {
    try {
      const result = await updateUser({
        password: newPassword
      })

      if (result.success) {
        return {
          success: true,
          message: '密码更新成功'
        }
      } else {
        return {
          success: false,
          error: result.error || '密码更新失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 检查认证状态
   * @returns {boolean} 是否已认证
   */
  isAuthenticated() {
    return !!this.currentUser
  }

  /**
   * 获取认证令牌
   * @returns {Promise<string|null>} 认证令牌
   */
  async getToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('获取令牌失败:', error)
      return null
    }
  }

  /**
   * 获取用户会话
   * @returns {Promise<Object|null>} 用户会话
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('获取会话失败:', error)
      return null
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    if (this.authStateSubscription) {
      this.authStateSubscription.subscription.unsubscribe()
    }
  }
}

// 创建单例实例
export const authService = new AuthService()