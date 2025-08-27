/**
 * 通知服务
 * 处理系统通知和消息推送
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class NotificationService extends BaseService {
  constructor() {
    super('notifications')
  }

  /**
   * 获取用户通知
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 通知列表
   */
  async getUserNotifications(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const {
        is_read = null,
        type = null,
        limit = 20,
        offset = 0
      } = options

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (is_read !== null) {
        query = query.eq('is_read', is_read)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (limit) {
        query = query.limit(limit)
      }

      if (offset) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Object>} 创建结果
   */
  async createNotification(notificationData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const newNotification = {
        user_id: user.id,
        title: notificationData.title,
        content: notificationData.content || '',
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'normal',
        is_read: false,
        action_url: notificationData.action_url || null,
        metadata: notificationData.metadata || {},
        created_at: new Date().toISOString()
      }

      return await this.create(newNotification)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   * @returns {Promise<Object>} 更新结果
   */
  async markAsRead(notificationId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data[0]
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 标记所有通知为已读
   * @returns {Promise<Object>} 更新结果
   */
  async markAllAsRead() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select()

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
   * 删除通知
   * @param {string} notificationId - 通知ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteNotification(notificationId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取未读通知数量
   * @returns {Promise<Object>} 数量结果
   */
  async getUnreadCount() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: count || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建系统通知
   * @param {string} userId - 用户ID
   * @param {string} type - 通知类型
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {Object} options - 其他选项
   * @returns {Promise<Object>} 创建结果
   */
  async createSystemNotification(userId, type, title, content, options = {}) {
    try {
      const notification = {
        user_id: userId,
        title,
        content,
        type,
        priority: options.priority || 'normal',
        is_read: false,
        action_url: options.action_url || null,
        metadata: options.metadata || {},
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data[0]
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建OKR相关通知
   * @param {string} userId - 用户ID
   * @param {string} okrId - OKR ID
   * @param {string} action - 动作类型
   * @param {Object} okrData - OKR数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOKRNotification(userId, okrId, action, okrData) {
    try {
      let title, content, type = 'okr'

      switch (action) {
        case 'created':
          title = '新目标已创建'
          content = `您创建了新目标："${okrData.title}"`
          break
        case 'completed':
          title = '目标已完成'
          content = `恭喜！您完成了目标："${okrData.title}"`
          type = 'success'
          break
        case 'deadline_approaching':
          title = '目标截止日期临近'
          content = `目标"${okrData.title}"即将到期，请及时完成`
          type = 'warning'
          break
        case 'progress_updated':
          title = '目标进度更新'
          content = `目标"${okrData.title}"进度已更新至${okrData.progress}%`
          break
        default:
          title = 'OKR更新'
          content = `目标"${okrData.title}"有新的更新`
      }

      return await this.createSystemNotification(userId, type, title, content, {
        action_url: `/okr/${okrId}`,
        metadata: {
          okr_id: okrId,
          action: action,
          progress: okrData.progress
        }
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建学习活动通知
   * @param {string} userId - 用户ID
   * @param {string} activityType - 活动类型
   * @param {Object} activityData - 活动数据
   * @returns {Promise<Object>} 创建结果
   */
  async createLearningNotification(userId, activityType, activityData) {
    try {
      let title, content

      switch (activityType) {
        case 'milestone_reached':
          title = '学习里程碑达成'
          content = `恭喜！您已完成${activityData.count}个学习活动`
          break
        case 'streak_achieved':
          title = '连续学习记录'
          content = `太棒了！您已连续学习${activityData.days}天`
          break
        case 'recommendation_available':
          title = '新的学习建议'
          content = '系统为您生成了个性化学习建议，快来查看吧！'
          break
        default:
          title = '学习提醒'
          content = '记得保持学习习惯哦！'
      }

      return await this.createSystemNotification(userId, 'learning', title, content, {
        action_url: '/dashboard',
        metadata: activityData
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 创建单例实例
export const notificationService = new NotificationService()