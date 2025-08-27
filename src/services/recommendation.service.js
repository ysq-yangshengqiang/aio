import { BaseService } from './base.service.js'
import { supabase } from '../lib/supabase.js'

class RecommendationService extends BaseService {
  constructor() {
    super('recommendations')
  }

  /**
   * 获取用户推荐列表
   */
  async getUserRecommendations(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      let query = supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // 应用过滤器
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('获取推荐失败:', error)
        return this.error('获取推荐失败')
      }

      return this.success(data)
    } catch (error) {
      console.error('获取推荐异常:', error)
      return this.error('获取推荐异常')
    }
  }

  /**
   * 获取推荐统计数据
   */
  async getRecommendationStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      // 获取各状态的推荐数量
      const { data: allRecommendations, error } = await supabase
        .from('recommendations')
        .select('status')
        .eq('user_id', user.id)

      if (error) {
        console.error('获取统计数据失败:', error)
        return this.error('获取统计数据失败')
      }

      const stats = {
        total: allRecommendations.length,
        pending: allRecommendations.filter(r => r.status === 'pending').length,
        completed: allRecommendations.filter(r => r.status === 'completed').length,
        dismissed: allRecommendations.filter(r => r.status === 'dismissed').length
      }

      return this.success(stats)
    } catch (error) {
      console.error('获取统计数据异常:', error)
      return this.error('获取统计数据异常')
    }
  }

  /**
   * 生成智能推荐
   */
  async generateSmartRecommendations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      // 获取用户的OKR数据
      const { data: okrs } = await supabase
        .from('okrs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      // 获取用户的学习历史
      const { data: learningHistory } = await supabase
        .from('learning_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // 获取现有推荐，避免重复
      const { data: existingRecommendations } = await supabase
        .from('recommendations')
        .select('type, content')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      // 生成推荐
      const recommendations = await this._generateRecommendations(
        user,
        okrs || [],
        learningHistory || [],
        existingRecommendations || []
      )

      // 批量插入推荐
      if (recommendations.length > 0) {
        const { data, error } = await supabase
          .from('recommendations')
          .insert(recommendations)
          .select()

        if (error) {
          console.error('插入推荐失败:', error)
          return this.error('生成推荐失败')
        }

        return this.success(data)
      }

      return this.success([])
    } catch (error) {
      console.error('生成推荐异常:', error)
      return this.error('生成推荐异常')
    }
  }

  /**
   * 标记推荐为已完成
   */
  async markAsCompleted(recommendationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      const { data, error } = await supabase
        .from('recommendations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', recommendationId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('更新推荐状态失败:', error)
        return this.error('操作失败')
      }

      return this.success(data[0])
    } catch (error) {
      console.error('更新推荐状态异常:', error)
      return this.error('操作异常')
    }
  }

  /**
   * 忽略推荐
   */
  async dismissRecommendation(recommendationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      const { data, error } = await supabase
        .from('recommendations')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString()
        })
        .eq('id', recommendationId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('忽略推荐失败:', error)
        return this.error('操作失败')
      }

      return this.success(data[0])
    } catch (error) {
      console.error('忽略推荐异常:', error)
      return this.error('操作异常')
    }
  }

  /**
   * 生成推荐算法核心逻辑
   */
  async _generateRecommendations(user, okrs, learningHistory, existingRecommendations) {
    const recommendations = []
    const now = new Date()
    const existingContents = existingRecommendations.map(r => r.content)

    // 1. 基于OKR进度的推荐
    for (const okr of okrs) {
      const progress = okr.progress || 0
      
      if (progress < 0.3) {
        // 进度较低，推荐制定详细计划
        const recommendation = {
          user_id: user.id,
          type: 'study_plan',
          title: `为"${okr.title}"制定详细学习计划`,
          content: `您的目标"${okr.title}"当前进度为${Math.round(progress * 100)}%，建议制定更详细的学习计划来提升进度。`,
          priority: 3,
          status: 'pending',
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
        }
        
        if (!existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      } else if (progress > 0.8) {
        // 进度较高，推荐冲刺完成
        const recommendation = {
          user_id: user.id,
          type: 'final_push',
          title: `冲刺完成"${okr.title}"`,
          content: `您的目标"${okr.title}"已完成${Math.round(progress * 100)}%，距离完成只差一步！建议集中精力完成剩余任务。`,
          priority: 2,
          status: 'pending',
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3天后过期
        }
        
        if (!existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      }
    }

    // 2. 基于学习历史的推荐
    if (learningHistory.length > 0) {
      const recentLearning = learningHistory.slice(0, 10)
      const learningFrequency = this._calculateLearningFrequency(learningHistory)
      
      if (learningFrequency < 0.3) {
        // 学习频率较低
        const recommendation = {
          user_id: user.id,
          type: 'increase_frequency',
          title: '增加学习频率',
          content: '根据您的学习记录，建议增加学习频率。每天坚持学习30分钟，会有显著的进步。',
          priority: 2,
          status: 'pending',
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      }

      // 推荐多样化学习
      const subjects = [...new Set(recentLearning.map(r => r.subject).filter(Boolean))]
      if (subjects.length < 2) {
        const recommendation = {
          user_id: user.id,
          type: 'diversify_learning',
          title: '多样化学习内容',
          content: '建议尝试不同类型的学习内容，这样可以提高学习效果和保持学习兴趣。',
          priority: 1,
          status: 'pending',
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      }
    } else {
      // 没有学习历史，推荐开始学习
      const recommendation = {
        user_id: user.id,
        type: 'start_learning',
        title: '开始您的学习之旅',
        content: '欢迎使用学习管理系统！建议从设定一个小目标开始，比如每天学习15分钟。',
        priority: 3,
        status: 'pending',
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      recommendations.push(recommendation)
    }

    // 3. 通用推荐
    if (okrs.length === 0) {
      const recommendation = {
        user_id: user.id,
        type: 'goal_setting',
        title: '设定学习目标',
        content: '建议设定明确的学习目标（OKR），这将帮助您更好地规划和跟踪学习进度。',
        priority: 3,
        status: 'pending',
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      if (!existingContents.includes(recommendation.content)) {
        recommendations.push(recommendation)
      }
    }

    // 4. 每日反思推荐（每周推荐一次）
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const hasRecentReflection = existingRecommendations.some(
      r => r.type === 'daily_reflection' && new Date(r.created_at) > lastWeek
    )
    
    if (!hasRecentReflection) {
      const recommendation = {
        user_id: user.id,
        type: 'daily_reflection',
        title: '每日学习反思',
        content: '建议每天花5分钟时间反思今天的学习收获和明天的学习计划，这有助于提高学习效率。',
        priority: 1,
        status: 'pending',
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      recommendations.push(recommendation)
    }

    return recommendations.slice(0, 5) // 限制每次最多生成5个推荐
  }

  /**
   * 计算学习频率
   */
  _calculateLearningFrequency(learningHistory) {
    if (learningHistory.length === 0) return 0

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const recentLearning = learningHistory.filter(
      record => new Date(record.created_at) > thirtyDaysAgo
    )
    
    // 计算过去30天的学习天数
    const learningDays = new Set(
      recentLearning.map(record => 
        new Date(record.created_at).toDateString()
      )
    ).size
    
    return learningDays / 30 // 返回学习频率（0-1之间）
  }
}

export const recommendationService = new RecommendationService()