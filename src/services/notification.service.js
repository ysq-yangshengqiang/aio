/**
 * 通知服务
 * 处理系统通知的创建、发送和管理
 * 集成Supabase数据库操作
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class NotificationService extends BaseService {
  constructor() {
    super('notifications')
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
        message: notificationData.message,
        type: notificationData.type || 'info',
        category: notificationData.category || 'general',
        is_read: false,
        data: notificationData.data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
   * 获取用户通知
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
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
        isRead = null,
        type = null,
        category = null,
        limit = 50,
        offset = 0
      } = options

      const where = { user_id: user.id }
      if (isRead !== null) where.is_read = isRead
      if (type) where.type = type
      if (category) where.category = category

      return await this.findMany({
        where,
        limit,
        offset,
        orderBy: [{ column: 'created_at', ascending: false }]
      })
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

      // 验证权限
      const notification = await this.findById(notificationId)
      if (!notification.success) {
        return notification
      }

      if (notification.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权操作此通知'
        }
      }

      return await this.update(notificationId, {
        is_read: true,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批量标记通知为已读
   * @param {Array} notificationIds - 通知ID数组
   * @returns {Promise<Object>} 更新结果
   */
  async markMultipleAsRead(notificationIds) {
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
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', notificationIds)
        .select()

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
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
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
        data: {
          updatedCount: data?.length || 0,
          message: `已标记 ${data?.length || 0} 条通知为已读`
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

      // 验证权限
      const notification = await this.findById(notificationId)
      if (!notification.success) {
        return notification
      }

      if (notification.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权删除此通知'
        }
      }

      return await this.delete(notificationId)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批量删除通知
   * @param {Array} notificationIds - 通知ID数组
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMultiple(notificationIds) {
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
        .delete()
        .eq('user_id', user.id)
        .in('id', notificationIds)
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: {
          deletedCount: data?.length || 0,
          message: `已删除 ${data?.length || 0} 条通知`
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
   * 获取未读通知数量
   * @returns {Promise<Object>} 统计结果
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

      return await this.count({
        user_id: user.id,
        is_read: false
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取通知统计数据
   * @returns {Promise<Object>} 统计结果
   */
  async getNotificationStats() {
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
        .select('type, category, is_read')
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      const stats = {
        total: data.length,
        unread: data.filter(n => !n.is_read).length,
        read: data.filter(n => n.is_read).length,
        byType: {},
        byCategory: {}
      }

      // 按类型统计
      data.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 }
        }
        stats.byType[notification.type].total++
        if (!notification.is_read) {
          stats.byType[notification.type].unread++
        }
      })

      // 按分类统计
      data.forEach(notification => {
        if (!stats.byCategory[notification.category]) {
          stats.byCategory[notification.category] = { total: 0, unread: 0 }
        }
        stats.byCategory[notification.category].total++
        if (!notification.is_read) {
          stats.byCategory[notification.category].unread++
        }
      })

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
   * 创建系统通知模板
   * @param {string} template - 模板类型
   * @param {Object} data - 模板数据
   * @returns {Object} 通知数据
   */
  createNotificationFromTemplate(template, data = {}) {
    const templates = {
      okr_created: {
        title: '新目标已创建',
        message: `您的目标"${data.title}"已成功创建`,
        type: 'success',
        category: 'okr'
      },
      okr_completed: {
        title: '目标已完成',
        message: `恭喜！您已完成目标"${data.title}"`,
        type: 'success',
        category: 'okr'
      },
      okr_deadline_approaching: {
        title: '目标截止日期临近',
        message: `您的目标"${data.title}"将在${data.daysLeft}天后到期`,
        type: 'warning',
        category: 'okr'
      },
      milestone_completed: {
        title: '里程碑已完成',
        message: `您已完成里程碑"${data.title}"`,
        type: 'success',
        category: 'milestone'
      },
      chat_session_created: {
        title: '新对话已开始',
        message: '您开始了一个新的AI对话会话',
        type: 'info',
        category: 'chat'
      },
      system_maintenance: {
        title: '系统维护通知',
        message: data.message || '系统将进行维护，请注意保存您的工作',
        type: 'warning',
        category: 'system'
      }
    }

    const templateData = templates[template]
    if (!templateData) {
      throw new Error(`未知的通知模板: ${template}`)
    }

    return {
      ...templateData,
      data: data
    }
  }

  /**
   * 发送模板通知
   * @param {string} template - 模板类型
   * @param {Object} data - 模板数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendTemplateNotification(template, data = {}) {
    try {
      const notificationData = this.createNotificationFromTemplate(template, data)
      return await this.createNotification(notificationData)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 清理旧通知
   * @param {number} daysOld - 清理多少天前的通知
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString())
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: {
          deletedCount: data?.length || 0,
          message: `已清理 ${data?.length || 0} 条旧通知`
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
   * 订阅实时通知
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToNotifications(callback) {
    const user = getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    return this.subscribe(callback, {
      event: 'INSERT',
      filter: `user_id=eq.${user.id}`
    })
  }
}

// 创建单例实例
export const notificationService = new NotificationService()