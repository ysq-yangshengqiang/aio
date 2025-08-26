import BaseAPI from './base.api.js'
import NotificationService from '@/services/notification.service.js'
import AnalyticsService from '@/services/analytics.service.js'

/**
 * 通知API控制器
 */
class NotificationAPI extends BaseAPI {
  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options
      const paginationParams = this.formatPaginationParams(page, limit)
      
      let result
      if (unreadOnly) {
        result = await NotificationService.getUnreadNotifications(userId)
      } else {
        result = await NotificationService.getUserNotifications(userId, paginationParams)
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取未读通知
   */
  async getUnreadNotifications(userId) {
    try {
      const result = await NotificationService.getUnreadNotifications(userId)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId, userId) {
    try {
      const result = await NotificationService.markAsRead(notificationId, userId)
      
      if (result.success) {
        // 记录通知已读事件
        await AnalyticsService.trackEvent(userId, 'notification_read', {
          notification_id: notificationId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId) {
    try {
      const result = await NotificationService.markAllAsRead(userId)
      
      if (result.success) {
        // 记录批量已读事件
        await AnalyticsService.trackEvent(userId, 'notifications_mark_all_read', {
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await NotificationService.deleteNotification(notificationId, userId)
      
      if (result.success) {
        // 记录通知删除事件
        await AnalyticsService.trackEvent(userId, 'notification_deleted', {
          notification_id: notificationId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 清空所有通知
   */
  async clearAllNotifications(userId) {
    try {
      const result = await NotificationService.clearAllNotifications(userId)
      
      if (result.success) {
        // 记录清空通知事件
        await AnalyticsService.trackEvent(userId, 'notifications_cleared', {
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取通知统计
   */
  async getNotificationStats(userId) {
    try {
      const result = await NotificationService.getNotificationStats(userId)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 创建自定义通知
   */
  async createNotification(userId, notificationData) {
    try {
      this.validateRequired(notificationData, ['title', 'message'])
      
      const { title, message, type = 'info', data = {} } = notificationData
      
      const result = await NotificationService.createNotification(
        userId, 
        title, 
        message, 
        type, 
        data
      )
      
      if (result.success) {
        // 记录通知创建事件
        await AnalyticsService.trackEvent(userId, 'notification_created', {
          notification_id: result.data.id,
          type,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 发送学习提醒
   */
  async sendLearningReminder(userId, reminderType, data = {}) {
    try {
      this.validateRequired({ reminderType }, ['reminderType'])
      
      const result = await NotificationService.sendLearningReminder(userId, reminderType, data)
      
      if (result.success) {
        // 记录提醒发送事件
        await AnalyticsService.trackEvent(userId, 'learning_reminder_sent', {
          reminder_type: reminderType,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取通知偏好设置
   */
  async getNotificationPreferences(userId) {
    try {
      const result = await NotificationService.getNotificationPreferences(userId)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新通知偏好设置
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      const result = await NotificationService.setNotificationPreferences(userId, preferences)
      
      if (result.success) {
        // 记录偏好更新事件
        await AnalyticsService.trackEvent(userId, 'notification_preferences_updated', {
          updated_preferences: Object.keys(preferences),
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 发送模板通知
   */
  async sendTemplateNotification(userId, templateType, templateData = {}) {
    try {
      this.validateRequired({ templateType }, ['templateType'])
      
      const result = await NotificationService.sendTemplateNotification(
        userId, 
        templateType, 
        templateData
      )
      
      if (result.success) {
        // 记录模板通知发送事件
        await AnalyticsService.trackEvent(userId, 'template_notification_sent', {
          template_type: templateType,
          notification_id: result.data.id,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量发送通知
   */
  async sendBulkNotifications(userIds, notificationData) {
    try {
      this.validateRequired(notificationData, ['title', 'message'])
      this.validateRequired({ userIds }, ['userIds'])
      
      const { title, message, type = 'info', data = {} } = notificationData
      
      const result = await NotificationService.sendBulkNotifications(
        userIds, 
        title, 
        message, 
        type, 
        data
      )
      
      if (result.success) {
        // 记录批量通知发送事件
        await AnalyticsService.trackEvent(null, 'bulk_notifications_sent', {
          user_count: userIds.length,
          notification_type: type,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取通知模板列表
   */
  async getNotificationTemplates() {
    try {
      const templates = [
        {
          type: 'welcome',
          name: '欢迎通知',
          description: '新用户注册后的欢迎消息'
        },
        {
          type: 'first_okr',
          name: '首个OKR提醒',
          description: '引导用户创建第一个OKR'
        },
        {
          type: 'progress_milestone',
          name: '进度里程碑',
          description: '学习进度达到里程碑时的通知'
        },
        {
          type: 'weekly_summary',
          name: '周总结',
          description: '每周学习总结通知'
        }
      ]
      
      return this.handleResponse({
        success: true,
        data: templates
      })
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 测试通知发送
   */
  async testNotification(userId, testType = 'basic') {
    try {
      let result
      
      switch (testType) {
        case 'basic':
          result = await NotificationService.createNotification(
            userId,
            '🧪 测试通知',
            '这是一条测试通知，用于验证通知系统是否正常工作。',
            'info',
            { test: true }
          )
          break
        case 'okr':
          result = await NotificationService.sendOKRNotification(
            userId,
            'test-okr-id',
            'okr_created'
          )
          break
        case 'reminder':
          result = await NotificationService.sendLearningReminder(
            userId,
            'daily_checkin'
          )
          break
        default:
          throw new Error('Invalid test type')
      }
      
      if (result.success) {
        // 记录测试通知事件
        await AnalyticsService.trackEvent(userId, 'test_notification_sent', {
          test_type: testType,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default new NotificationAPI()