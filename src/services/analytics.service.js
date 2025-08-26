/**
 * 分析服务
 * 处理数据分析和统计相关的业务逻辑
 * 集成Supabase数据库操作
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class AnalyticsService extends BaseService {
  constructor() {
    super('analytics')
  }

  /**
   * 获取用户学习概览
   * @returns {Promise<Object>} 学习概览数据
   */
  async getLearningOverview() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取OKR数据
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          status,
          progress,
          start_date,
          end_date,
          key_results (
            id,
            title,
            progress,
            status
          )
        `)
        .eq('user_id', user.id)

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      // 获取聊天会话数据
      const { data: chatData, error: chatError } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (chatError) {
        return {
          success: false,
          error: chatError.message
        }
      }

      // 计算统计数据
      const totalOKRs = okrData?.length || 0
      const completedOKRs = okrData?.filter(okr => okr.status === 'completed').length || 0
      const inProgressOKRs = okrData?.filter(okr => okr.status === 'in_progress').length || 0
      const totalKeyResults = okrData?.reduce((sum, okr) => sum + (okr.key_results?.length || 0), 0) || 0
      const completedKeyResults = okrData?.reduce((sum, okr) => 
        sum + (okr.key_results?.filter(kr => kr.status === 'completed').length || 0), 0) || 0

      const overview = {
        okrs: {
          total: totalOKRs,
          completed: completedOKRs,
          inProgress: inProgressOKRs,
          completionRate: totalOKRs > 0 ? Math.round((completedOKRs / totalOKRs) * 100) : 0
        },
        keyResults: {
          total: totalKeyResults,
          completed: completedKeyResults,
          completionRate: totalKeyResults > 0 ? Math.round((completedKeyResults / totalKeyResults) * 100) : 0
        },
        chats: {
          total: chatData?.length || 0,
          recent: chatData || []
        },
        lastUpdated: new Date().toISOString()
      }

      return {
        success: true,
        data: overview
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取OKR进度趋势
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 进度趋势数据
   */
  async getOKRProgressTrend(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { days = 30 } = options
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 获取指定时间范围内的OKR数据
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select('id, title, progress, status, updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', startDate.toISOString())
        .order('updated_at', { ascending: true })

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      // 按日期分组统计进度
      const progressByDate = {}
      const dateRange = []
      
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        const dateStr = date.toISOString().split('T')[0]
        dateRange.push(dateStr)
        progressByDate[dateStr] = {
          date: dateStr,
          totalProgress: 0,
          okrCount: 0,
          averageProgress: 0
        }
      }

      // 计算每日平均进度
      okrData?.forEach(okr => {
        const dateStr = okr.updated_at.split('T')[0]
        if (progressByDate[dateStr]) {
          progressByDate[dateStr].totalProgress += okr.progress || 0
          progressByDate[dateStr].okrCount += 1
        }
      })

      // 计算平均值
      Object.values(progressByDate).forEach(dayData => {
        if (dayData.okrCount > 0) {
          dayData.averageProgress = Math.round(dayData.totalProgress / dayData.okrCount)
        }
      })

      const trendData = dateRange.map(date => progressByDate[date])

      return {
        success: true,
        data: {
          trend: trendData,
          summary: {
            totalDays: days,
            dataPoints: trendData.filter(d => d.okrCount > 0).length,
            averageProgress: Math.round(
              trendData.reduce((sum, d) => sum + d.averageProgress, 0) / trendData.length
            )
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
   * 获取学习活动统计
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 活动统计数据
   */
  async getActivityStats(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { period = 'week' } = options
      let startDate = new Date()
      
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // 获取OKR活动
      const { data: okrActivity, error: okrError } = await supabase
        .from('okrs')
        .select('created_at, updated_at, status')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      // 获取聊天活动
      const { data: chatActivity, error: chatError } = await supabase
        .from('chat_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (chatError) {
        return {
          success: false,
          error: chatError.message
        }
      }

      // 获取通知活动
      const { data: notificationActivity, error: notificationError } = await supabase
        .from('notifications')
        .select('created_at, type')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (notificationError) {
        return {
          success: false,
          error: notificationError.message
        }
      }

      const stats = {
        period: period,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        okrs: {
          created: okrActivity?.length || 0,
          completed: okrActivity?.filter(o => o.status === 'completed').length || 0
        },
        chats: {
          sessions: chatActivity?.length || 0
        },
        notifications: {
          total: notificationActivity?.length || 0,
          byType: {}
        }
      }

      // 按通知类型统计
      notificationActivity?.forEach(notification => {
        const type = notification.type
        if (!stats.notifications.byType[type]) {
          stats.notifications.byType[type] = 0
        }
        stats.notifications.byType[type]++
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
   * 获取目标完成率分析
   * @returns {Promise<Object>} 完成率分析数据
   */
  async getCompletionAnalysis() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取所有OKR数据
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          status,
          progress,
          start_date,
          end_date,
          created_at,
          key_results (
            id,
            title,
            progress,
            status
          )
        `)
        .eq('user_id', user.id)

      if (okrError) {
        return {
          success: false,
          error: okrError.message
        }
      }

      const now = new Date()
      const analysis = {
        overall: {
          total: okrData?.length || 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0
        },
        byMonth: {},
        keyResults: {
          total: 0,
          completed: 0,
          averageProgress: 0
        },
        trends: {
          completionRate: 0,
          averageTimeToComplete: 0
        }
      }

      let totalKeyResults = 0
      let completedKeyResults = 0
      let totalKeyResultProgress = 0
      let completedOKRs = []

      okrData?.forEach(okr => {
        // 整体统计
        switch (okr.status) {
          case 'completed':
            analysis.overall.completed++
            completedOKRs.push(okr)
            break
          case 'in_progress':
            analysis.overall.inProgress++
            break
          case 'not_started':
            analysis.overall.notStarted++
            break
        }

        // 检查是否过期
        if (okr.end_date && new Date(okr.end_date) < now && okr.status !== 'completed') {
          analysis.overall.overdue++
        }

        // 按月统计
        const month = okr.created_at.substring(0, 7) // YYYY-MM
        if (!analysis.byMonth[month]) {
          analysis.byMonth[month] = {
            total: 0,
            completed: 0,
            completionRate: 0
          }
        }
        analysis.byMonth[month].total++
        if (okr.status === 'completed') {
          analysis.byMonth[month].completed++
        }

        // 关键结果统计
        if (okr.key_results) {
          totalKeyResults += okr.key_results.length
          okr.key_results.forEach(kr => {
            totalKeyResultProgress += kr.progress || 0
            if (kr.status === 'completed') {
              completedKeyResults++
            }
          })
        }
      })

      // 计算完成率
      Object.values(analysis.byMonth).forEach(monthData => {
        monthData.completionRate = monthData.total > 0 
          ? Math.round((monthData.completed / monthData.total) * 100) 
          : 0
      })

      // 关键结果分析
      analysis.keyResults.total = totalKeyResults
      analysis.keyResults.completed = completedKeyResults
      analysis.keyResults.averageProgress = totalKeyResults > 0 
        ? Math.round(totalKeyResultProgress / totalKeyResults) 
        : 0

      // 趋势分析
      analysis.trends.completionRate = analysis.overall.total > 0 
        ? Math.round((analysis.overall.completed / analysis.overall.total) * 100) 
        : 0

      // 计算平均完成时间
      if (completedOKRs.length > 0) {
        const totalDays = completedOKRs.reduce((sum, okr) => {
          const startDate = new Date(okr.start_date || okr.created_at)
          const endDate = new Date(okr.end_date || okr.updated_at)
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0)
        analysis.trends.averageTimeToComplete = Math.round(totalDays / completedOKRs.length)
      }

      return {
        success: true,
        data: analysis
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取学习热力图数据
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 热力图数据
   */
  async getHeatmapData(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { year = new Date().getFullYear() } = options
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)

      // 获取活动数据
      const { data: activities, error } = await supabase
        .from('okrs')
        .select('created_at, updated_at, status')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // 生成日期范围
      const heatmapData = {}
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        heatmapData[dateStr] = {
          date: dateStr,
          count: 0,
          level: 0
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // 统计每日活动
      activities?.forEach(activity => {
        const dateStr = activity.created_at.split('T')[0]
        if (heatmapData[dateStr]) {
          heatmapData[dateStr].count++
        }
        
        // 如果有更新，也计入活动
        if (activity.updated_at !== activity.created_at) {
          const updateDateStr = activity.updated_at.split('T')[0]
          if (heatmapData[updateDateStr]) {
            heatmapData[updateDateStr].count++
          }
        }
      })

      // 计算活动等级（0-4）
      const maxCount = Math.max(...Object.values(heatmapData).map(d => d.count))
      Object.values(heatmapData).forEach(dayData => {
        if (maxCount > 0) {
          dayData.level = Math.min(4, Math.ceil((dayData.count / maxCount) * 4))
        }
      })

      return {
        success: true,
        data: {
          year: year,
          heatmap: Object.values(heatmapData),
          summary: {
            totalDays: Object.keys(heatmapData).length,
            activeDays: Object.values(heatmapData).filter(d => d.count > 0).length,
            totalActivities: Object.values(heatmapData).reduce((sum, d) => sum + d.count, 0),
            maxDailyActivities: maxCount
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
   * 导出分析报告
   * @param {Object} options - 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportAnalyticsReport(options = {}) {
    try {
      const { format = 'json', period = 'month' } = options

      // 获取各种分析数据
      const [overview, progressTrend, activityStats, completionAnalysis] = await Promise.all([
        this.getLearningOverview(),
        this.getOKRProgressTrend({ days: 30 }),
        this.getActivityStats({ period }),
        this.getCompletionAnalysis()
      ])

      const report = {
        generatedAt: new Date().toISOString(),
        period: period,
        overview: overview.success ? overview.data : null,
        progressTrend: progressTrend.success ? progressTrend.data : null,
        activityStats: activityStats.success ? activityStats.data : null,
        completionAnalysis: completionAnalysis.success ? completionAnalysis.data : null
      }

      return {
        success: true,
        data: {
          format: format,
          report: report,
          downloadUrl: null // 实际应用中可以生成下载链接
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
export const analyticsService = new AnalyticsService()