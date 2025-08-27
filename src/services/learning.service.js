/**
 * 学习活动服务
 * 处理学习记录和活动管理
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class LearningService extends BaseService {
  constructor() {
    super('learning_activities')
  }

  /**
   * 记录学习活动
   * @param {Object} activityData - 活动数据
   * @returns {Promise<Object>} 创建结果
   */
  async recordActivity(activityData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const newActivity = {
        user_id: user.id,
        okr_id: activityData.okr_id || null,
        activity_type: activityData.activity_type,
        title: activityData.title,
        description: activityData.description || '',
        duration_minutes: activityData.duration_minutes || 0,
        status: 'completed',
        metadata: activityData.metadata || {},
        created_at: new Date().toISOString()
      }

      return await this.create(newActivity)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取用户学习活动
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getUserActivities(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const {
        activity_type = null,
        okr_id = null,
        limit = 20,
        offset = 0,
        date_from = null,
        date_to = null
      } = options

      let query = supabase
        .from('learning_activities')
        .select(`
          *,
          okrs(title, category)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activity_type) {
        query = query.eq('activity_type', activity_type)
      }

      if (okr_id) {
        query = query.eq('okr_id', okr_id)
      }

      if (date_from) {
        query = query.gte('created_at', date_from)
      }

      if (date_to) {
        query = query.lte('created_at', date_to)
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
   * 获取学习统计数据
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 统计结果
   */
  async getLearningStats(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { period = 'week' } = options
      
      // 计算时间范围
      const now = new Date()
      let startDate
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          const dayOfWeek = now.getDay()
          startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }

      const { data, error } = await supabase
        .from('learning_activities')
        .select('activity_type, duration_minutes, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // 计算统计数据
      const stats = {
        totalActivities: data.length,
        totalDuration: data.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0),
        byType: {},
        dailyStats: {}
      }

      // 按类型统计
      data.forEach(activity => {
        if (!stats.byType[activity.activity_type]) {
          stats.byType[activity.activity_type] = {
            count: 0,
            duration: 0
          }
        }
        stats.byType[activity.activity_type].count++
        stats.byType[activity.activity_type].duration += activity.duration_minutes || 0
      })

      // 按日期统计
      data.forEach(activity => {
        const date = new Date(activity.created_at).toDateString()
        if (!stats.dailyStats[date]) {
          stats.dailyStats[date] = {
            count: 0,
            duration: 0
          }
        }
        stats.dailyStats[date].count++
        stats.dailyStats[date].duration += activity.duration_minutes || 0
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
   * 获取学习建议
   * @returns {Promise<Object>} 建议结果
   */
  async getLearningRecommendations() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取用户的活跃OKR
      const { data: activeOkrs, error: okrError } = await supabase
        .from('okrs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      // 获取最近的学习活动
      const recentActivities = await this.getUserActivities({ limit: 10 })
      
      if (!recentActivities.success) {
        return recentActivities
      }

      // 生成建议
      const recommendations = []

      // 基于OKR进度的建议
      activeOkrs.forEach(okr => {
        if (okr.progress < 50) {
          recommendations.push({
            type: 'okr_progress',
            title: `加速推进：${okr.title}`,
            description: `您的目标"${okr.title}"进度为${okr.progress}%，建议增加相关学习活动`,
            priority: okr.priority === 'high' ? 3 : 2,
            okr_id: okr.id
          })
        }
      })

      // 基于学习频率的建议
      const recentActivityCount = recentActivities.data.length
      if (recentActivityCount < 3) {
        recommendations.push({
          type: 'frequency',
          title: '保持学习节奏',
          description: '最近的学习活动较少，建议制定规律的学习计划',
          priority: 2
        })
      }

      // 基于学习类型多样性的建议
      const activityTypes = new Set(recentActivities.data.map(a => a.activity_type))
      if (activityTypes.size < 3) {
        recommendations.push({
          type: 'diversity',
          title: '丰富学习方式',
          description: '尝试不同类型的学习活动，如阅读、实践、讨论等',
          priority: 1
        })
      }

      return {
        success: true,
        data: recommendations.sort((a, b) => b.priority - a.priority)
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
export const learningService = new LearningService()