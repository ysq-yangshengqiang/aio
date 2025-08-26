import BaseAPI from './base.api.js'
import AuthService from '@/services/auth.service.js'
import AnalyticsService from '@/services/analytics.service.js'
import NotificationService from '@/services/notification.service.js'

/**
 * 认证API控制器
 */
class AuthAPI extends BaseAPI {
  /**
   * 用户登录
   */
  async login(credentials) {
    try {
      this.validateRequired(credentials, ['email', 'password'])
      
      const result = await AuthService.login(credentials.email, credentials.password)
      
      if (result.success) {
        // 记录登录事件
        await AnalyticsService.trackEvent(result.data.user.id, 'user_login', {
          login_method: 'email',
          timestamp: new Date().toISOString()
        })
        
        // 更新最后活跃时间
        if (result.data.profile) {
          await AuthService.updateUserProfile(result.data.user.id, {
            last_active_at: new Date().toISOString()
          })
        }
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 用户注册
   */
  async register(userData) {
    try {
      this.validateRequired(userData, ['email', 'password', 'name'])
      
      const result = await AuthService.register(
        userData.email, 
        userData.password, 
        this.cleanData(userData)
      )
      
      if (result.success) {
        // 记录注册事件
        await AnalyticsService.trackEvent(result.data.user.id, 'user_register', {
          registration_method: 'email',
          timestamp: new Date().toISOString()
        })
        
        // 发送欢迎通知
        await NotificationService.sendTemplateNotification(
          result.data.user.id, 
          'welcome'
        )
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 用户登出
   */
  async logout(userId) {
    try {
      const result = await AuthService.logout()
      
      if (result.success && userId) {
        // 记录登出事件
        await AnalyticsService.trackEvent(userId, 'user_logout', {
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      const sessionResult = await AuthService.getCurrentSession()
      if (!sessionResult.success || !sessionResult.data) {
        return { success: false, error: 'No active session' }
      }

      const user = sessionResult.data.user
      const profileResult = await AuthService.getUserProfile(user.id)
      
      return this.handleResponse({
        success: true,
        data: {
          user,
          profile: profileResult.success ? profileResult.data : null,
          session: sessionResult.data
        }
      })
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新用户档案
   */
  async updateProfile(userId, updates) {
    try {
      const cleanedUpdates = this.cleanData(updates)
      const result = await AuthService.updateUserProfile(userId, cleanedUpdates)
      
      if (result.success) {
        // 记录档案更新事件
        await AnalyticsService.trackEvent(userId, 'profile_updated', {
          updated_fields: Object.keys(cleanedUpdates),
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(email) {
    try {
      this.validateRequired({ email }, ['email'])
      
      const result = await AuthService.resetPassword(email)
      
      if (result.success) {
        // 记录密码重置请求事件
        await AnalyticsService.trackEvent(null, 'password_reset_requested', {
          email,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新密码
   */
  async updatePassword(userId, newPassword) {
    try {
      this.validateRequired({ newPassword }, ['newPassword'])
      
      const result = await AuthService.updatePassword(newPassword)
      
      if (result.success) {
        // 记录密码更新事件
        await AnalyticsService.trackEvent(userId, 'password_updated', {
          timestamp: new Date().toISOString()
        })
        
        // 发送密码更新通知
        await NotificationService.sendSystemNotification(
          userId,
          '🔒 密码已更新',
          '您的账户密码已成功更新，如非本人操作请及时联系客服。',
          'warning'
        )
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 验证会话
   */
  async validateSession() {
    try {
      const result = await AuthService.getCurrentSession()
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 刷新用户档案
   */
  async refreshProfile(userId) {
    try {
      const result = await AuthService.getUserProfile(userId)
      
      if (result.success) {
        // 更新最后活跃时间
        await AuthService.updateUserProfile(userId, {
          last_active_at: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default new AuthAPI()