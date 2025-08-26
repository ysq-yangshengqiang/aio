/**
 * 用户服务
 * 处理用户相关的业务逻辑
 * 集成Supabase数据库操作
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class UserService extends BaseService {
  constructor() {
    super('users')
  }

  /**
   * 获取用户资料
   * @param {string} userId - 用户ID，可选，默认获取当前用户
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile(userId = null) {
    try {
      let targetUserId = userId
      
      if (!targetUserId) {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          return {
            success: false,
            error: '用户未登录'
          }
        }
        targetUserId = currentUser.id
      }

      const result = await this.findById(targetUserId)
      if (!result.success) {
        return result
      }

      // 如果数据库中没有用户记录，创建一个基础记录
      if (!result.data) {
        const authUser = await getCurrentUser()
        if (authUser && authUser.id === targetUserId) {
          const newUserData = {
            id: authUser.id,
            email: authUser.email,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
            full_name: authUser.user_metadata?.full_name || '',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: '',
            preferences: {
              theme: 'light',
              language: 'zh-CN',
              notifications: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const createResult = await this.create(newUserData)
          return createResult
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新用户资料
   * @param {Object} profileData - 更新的资料数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserProfile(profileData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
      }

      // 移除不允许更新的字段
      delete updateData.id
      delete updateData.email
      delete updateData.created_at

      return await this.update(user.id, updateData)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 上传用户头像
   * @param {File} avatarFile - 头像文件
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAvatar(avatarFile) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 生成文件名
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // 上传到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        return {
          success: false,
          error: uploadError.message
        }
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = urlData.publicUrl

      // 更新用户资料中的头像URL
      const updateResult = await this.updateUserProfile({
        avatar_url: avatarUrl
      })

      if (!updateResult.success) {
        return updateResult
      }

      return {
        success: true,
        data: {
          avatarUrl: avatarUrl,
          uploadedAt: new Date().toISOString()
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
   * 获取用户设置
   * @returns {Promise<Object>} 用户设置
   */
  async getUserSettings() {
    try {
      const profile = await this.getUserProfile()
      if (!profile.success) {
        return profile
      }

      return {
        success: true,
        data: profile.data.preferences || {
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisible: true,
            showEmail: false,
            showPhone: false
          }
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
   * 更新用户设置
   * @param {Object} settings - 设置数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserSettings(settings) {
    try {
      const profile = await this.getUserProfile()
      if (!profile.success) {
        return profile
      }

      const updatedPreferences = {
        ...profile.data.preferences,
        ...settings
      }

      return await this.updateUserProfile({
        preferences: updatedPreferences
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 搜索用户
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async searchUsers(query, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options

      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .range(offset, offset + limit - 1)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // 获取总数
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)

      if (countError) {
        return {
          success: false,
          error: countError.message
        }
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          limit: limit,
          hasMore: (offset + limit) < (count || 0)
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
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getUserStats() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取OKR统计
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select('status')
        .eq('user_id', user.id)

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      // 获取聊天会话统计
      const { data: chatData, error: chatError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)

      if (chatError) {
        return {
          success: false,
          error: chatError.message
        }
      }

      // 获取通知统计
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('is_read')
        .eq('user_id', user.id)

      if (notificationError) {
        return {
          success: false,
          error: notificationError.message
        }
      }

      const stats = {
        okrs: {
          total: okrData?.length || 0,
          completed: okrData?.filter(o => o.status === 'completed').length || 0,
          inProgress: okrData?.filter(o => o.status === 'in_progress').length || 0,
          notStarted: okrData?.filter(o => o.status === 'not_started').length || 0
        },
        chats: {
          total: chatData?.length || 0
        },
        notifications: {
          total: notificationData?.length || 0,
          unread: notificationData?.filter(n => !n.is_read).length || 0
        }
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 删除用户账户
   * @returns {Promise<Object>} 删除结果
   */
  async deleteAccount() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 删除用户相关数据（级联删除由数据库处理）
      const deleteResult = await this.delete(user.id)
      if (!deleteResult.success) {
        return deleteResult
      }

      // 删除认证用户
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) {
        return {
          success: false,
          error: authError.message
        }
      }

      return {
        success: true,
        data: {
          message: '账户已成功删除'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 创建单例实例
export const userService = new UserService()