import BaseAPI from './base.api.js'
import OKRService from '@/services/okr.service.js'
import AnalyticsService from '@/services/analytics.service.js'
import NotificationService from '@/services/notification.service.js'

/**
 * OKR API控制器
 */
class OKRAPI extends BaseAPI {
  /**
   * 创建OKR
   */
  async createOKR(userId, okrData) {
    try {
      this.validateRequired(okrData, ['objective', 'keyResults'])
      
      const result = await OKRService.createOKR(
        userId, 
        okrData.objective, 
        okrData.keyResults
      )
      
      if (result.success) {
        // 记录OKR创建事件
        await AnalyticsService.trackEvent(userId, 'okr_created', {
          okr_id: result.data.id,
          objective: okrData.objective,
          key_results_count: okrData.keyResults.length,
          timestamp: new Date().toISOString()
        })
        
        // 发送OKR创建通知
        await NotificationService.sendOKRNotification(
          userId, 
          result.data.id, 
          'okr_created'
        )
        
        // 如果是第一个OKR，发送特殊通知
        const userOKRsResult = await OKRService.getUserOKRs(userId)
        if (userOKRsResult.success && userOKRsResult.data.length === 1) {
          await NotificationService.sendTemplateNotification(
            userId, 
            'first_okr'
          )
        }
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户OKR列表
   */
  async getUserOKRs(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status, sortBy = 'created_at', sortOrder = 'desc' } = options
      
      const paginationParams = this.formatPaginationParams(page, limit)
      const sortParams = this.formatSortParams(sortBy, sortOrder)
      
      const queryOptions = {
        ...paginationParams,
        orderBy: sortParams
      }
      
      // 添加状态筛选
      if (status) {
        queryOptions.status = status
      }
      
      const result = await OKRService.getUserOKRs(userId, queryOptions)
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取当前活跃的OKR
   */
  async getActiveOKRs(userId) {
    try {
      const result = await OKRService.getActiveOKRs(userId)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取OKR详情
   */
  async getOKRDetails(okrId, userId) {
    try {
      const result = await OKRService.getOKRDetails(okrId, userId)
      
      if (result.success) {
        // 记录OKR查看事件
        await AnalyticsService.trackEvent(userId, 'okr_viewed', {
          okr_id: okrId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新OKR进度
   */
  async updateOKRProgress(okrId, userId, progressData) {
    try {
      this.validateRequired(progressData, ['progress'])
      
      const result = await OKRService.updateOKRProgress(okrId, userId, progressData)
      
      if (result.success) {
        const progress = progressData.progress
        
        // 记录进度更新事件
        await AnalyticsService.trackEvent(userId, 'okr_progress_updated', {
          okr_id: okrId,
          progress: progress,
          previous_progress: result.data.previous_progress || 0,
          timestamp: new Date().toISOString()
        })
        
        // 发送进度更新通知
        await NotificationService.sendOKRNotification(
          userId, 
          okrId, 
          'okr_progress_updated',
          { progress }
        )
        
        // 检查是否完成目标
        if (progress >= 100) {
          await NotificationService.sendOKRNotification(
            userId, 
            okrId, 
            'okr_completed'
          )
          
          // 记录目标完成事件
          await AnalyticsService.trackEvent(userId, 'okr_completed', {
            okr_id: okrId,
            completion_date: new Date().toISOString()
          })
        }
        
        // 检查进度里程碑
        const milestones = [25, 50, 75]
        const previousProgress = result.data.previous_progress || 0
        
        milestones.forEach(async (milestone) => {
          if (previousProgress < milestone && progress >= milestone) {
            await NotificationService.sendTemplateNotification(
              userId,
              'progress_milestone',
              { progress: milestone, okr_id: okrId }
            )
          }
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(okrId, keyResultIndex, userId, progress) {
    try {
      this.validateRequired({ progress }, ['progress'])
      
      const result = await OKRService.updateKeyResultProgress(
        okrId, 
        keyResultIndex, 
        userId, 
        progress
      )
      
      if (result.success) {
        // 记录关键结果更新事件
        await AnalyticsService.trackEvent(userId, 'key_result_updated', {
          okr_id: okrId,
          key_result_index: keyResultIndex,
          progress: progress,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新OKR信息
   */
  async updateOKR(okrId, userId, updates) {
    try {
      const cleanedUpdates = this.cleanData(updates)
      const result = await OKRService.updateOKR(okrId, userId, cleanedUpdates)
      
      if (result.success) {
        // 记录OKR更新事件
        await AnalyticsService.trackEvent(userId, 'okr_updated', {
          okr_id: okrId,
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
   * 删除OKR
   */
  async deleteOKR(okrId, userId) {
    try {
      const result = await OKRService.deleteOKR(okrId, userId)
      
      if (result.success) {
        // 记录OKR删除事件
        await AnalyticsService.trackEvent(userId, 'okr_deleted', {
          okr_id: okrId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取OKR统计信息
   */
  async getOKRStats(userId, timeRange = '30d') {
    try {
      const result = await OKRService.getOKRStats(userId, timeRange)
      
      if (result.success) {
        // 记录统计查看事件
        await AnalyticsService.trackEvent(userId, 'okr_stats_viewed', {
          time_range: timeRange,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 搜索OKR
   */
  async searchOKRs(userId, query, options = {}) {
    try {
      this.validateRequired({ query }, ['query'])
      
      const { page = 1, limit = 10 } = options
      const paginationParams = this.formatPaginationParams(page, limit)
      
      const result = await OKRService.searchOKRs(userId, query, paginationParams)
      
      if (result.success) {
        // 记录搜索事件
        await AnalyticsService.trackEvent(userId, 'okr_search', {
          query,
          results_count: result.data.length,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 归档OKR
   */
  async archiveOKR(okrId, userId) {
    try {
      const result = await OKRService.updateOKR(okrId, userId, { 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      
      if (result.success) {
        // 记录归档事件
        await AnalyticsService.trackEvent(userId, 'okr_archived', {
          okr_id: okrId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 恢复归档的OKR
   */
  async unarchiveOKR(okrId, userId) {
    try {
      const result = await OKRService.updateOKR(okrId, userId, { 
        status: 'active',
        archived_at: null
      })
      
      if (result.success) {
        // 记录恢复事件
        await AnalyticsService.trackEvent(userId, 'okr_unarchived', {
          okr_id: okrId,
          timestamp: new Date().toISOString()
        })
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取OKR模板
   */
  async getOKRTemplates(category = null) {
    try {
      const result = await OKRService.getOKRTemplates(category)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 基于模板创建OKR
   */
  async createOKRFromTemplate(userId, templateId, customizations = {}) {
    try {
      const result = await OKRService.createOKRFromTemplate(userId, templateId, customizations)
      
      if (result.success) {
        // 记录模板使用事件
        await AnalyticsService.trackEvent(userId, 'okr_template_used', {
          template_id: templateId,
          okr_id: result.data.id,
          timestamp: new Date().toISOString()
        })
        
        // 发送创建通知
        await NotificationService.sendOKRNotification(
          userId, 
          result.data.id, 
          'okr_created'
        )
      }
      
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取OKR进度历史
   */
  async getOKRProgressHistory(okrId, userId) {
    try {
      const result = await OKRService.getOKRProgressHistory(okrId, userId)
      return this.handleResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量操作OKR
   */
  async batchUpdateOKRs(userId, okrIds, updates) {
    try {
      this.validateRequired({ okrIds }, ['okrIds'])
      
      const results = []
      const cleanedUpdates = this.cleanData(updates)
      
      for (const okrId of okrIds) {
        const result = await OKRService.updateOKR(okrId, userId, cleanedUpdates)
        results.push({ okr_id: okrId, ...result })
      }
      
      // 记录批量操作事件
      await AnalyticsService.trackEvent(userId, 'okr_batch_update', {
        okr_ids: okrIds,
        updated_fields: Object.keys(cleanedUpdates),
        success_count: results.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      })
      
      return this.handleResponse({
        success: true,
        data: results
      })
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default new OKRAPI()