import { BaseService } from './base.service.js'
import { supabase } from '../lib/supabase.js'
import { deepSeekService } from './deepseek.service.js'

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
   * 生成智能推荐（集成DeepSeek AI）
   */
  async generateSmartRecommendations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      // 获取用户个人资料
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

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
        .select('type, content, title')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      // 使用DeepSeek AI生成个性化推荐
      const aiResult = await deepSeekService.generateLearningRecommendations(
        {
          name: userProfile?.name,
          email: user.email,
          grade: userProfile?.grade,
          major: userProfile?.major,
          learningGoals: userProfile?.learning_goals || [],
          skills: userProfile?.skills || []
        },
        okrs || [],
        learningHistory || []
      )

      let recommendations = []

      if (aiResult.success && aiResult.data.recommendations) {
        // 处理AI生成的推荐
        recommendations = await this._processAIRecommendations(
          user,
          aiResult.data.recommendations,
          existingRecommendations || []
        )
      }

      // 如果AI推荐失败或数量不足，使用传统算法补充
      if (recommendations.length < 3) {
        const fallbackRecommendations = await this._generateFallbackRecommendations(
          user,
          okrs || [],
          learningHistory || [],
          existingRecommendations || []
        )
        recommendations = [...recommendations, ...fallbackRecommendations]
      }

      // 限制推荐数量
      recommendations = recommendations.slice(0, 5)

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
   * 处理AI生成的推荐
   * @private
   */
  async _processAIRecommendations(user, aiRecommendations, existingRecommendations) {
    const processedRecommendations = []
    const now = new Date()
    const existingTitles = existingRecommendations.map(r => r.title)

    for (const aiRec of aiRecommendations) {
      // 避免重复推荐
      if (existingTitles.includes(aiRec.title)) {
        continue
      }

      // 构建推荐对象
      const recommendation = {
        user_id: user.id,
        type: this._validateRecommendationType(aiRec.type),
        title: aiRec.title || '个性化学习建议',
        content: aiRec.content || '',
        priority: Math.min(Math.max(aiRec.priority || 2, 1), 3), // 确保优先级在1-3范围内
        status: 'pending',
        created_at: now.toISOString(),
        ai_generated: true, // 标记为AI生成
        metadata: {
          estimatedDuration: aiRec.estimatedDuration,
          tags: aiRec.tags || [],
          actionItems: aiRec.actionItems || [],
          aiModel: 'deepseek',
          generatedAt: now.toISOString()
        }
      }

      // 设置过期时间（根据优先级）
      const expireDays = aiRec.priority === 3 ? 3 : (aiRec.priority === 2 ? 7 : 14)
      recommendation.expires_at = new Date(now.getTime() + expireDays * 24 * 60 * 60 * 1000).toISOString()

      processedRecommendations.push(recommendation)
    }

    return processedRecommendations
  }

  /**
   * 验证推荐类型是否有效
   * @private
   */
  _validateRecommendationType(type) {
    const validTypes = [
      'study_plan', 'resource_recommendation', 'practice_exercise', 
      'progress_review', 'motivation', 'goal_setting', 'milestone_planning',
      'general_advice', 'final_push', 'progress_boost', 'diversify_learning',
      'increase_frequency', 'start_learning', 'skill_development', 'daily_reflection'
    ]
    return validTypes.includes(type) ? type : 'general_advice'
  }

  /**
   * 生成后备推荐（传统算法）
   * @private
   */
  async _generateFallbackRecommendations(user, okrs, learningHistory, existingRecommendations) {
    const recommendations = []
    const now = new Date()
    const existingContents = existingRecommendations.map(r => r.content)
    const existingTitles = existingRecommendations.map(r => r.title)

    // 基于OKR进度的推荐
    for (const okr of okrs.slice(0, 3)) { // 只处理前3个OKR
      const progress = okr.progress || 0
      
      if (progress < 0.3) {
        const recommendation = {
          user_id: user.id,
          type: 'study_plan',
          title: `加速完成"${okr.title}"`,
          content: `您的目标"${okr.title}"当前进度为${Math.round(progress * 100)}%，建议制定更详细的学习计划和时间安排来提升进度。可以考虑：1) 分解子任务 2) 设定每日目标 3) 寻找学习伙伴`,
          priority: 3,
          status: 'pending',
          ai_generated: false,
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingTitles.includes(recommendation.title) && 
            !existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      } else if (progress > 0.8) {
        const recommendation = {
          user_id: user.id,
          type: 'final_push',
          title: `冲刺完成"${okr.title}"`,
          content: `恭喜！您的目标"${okr.title}"已完成${Math.round(progress * 100)}%，距离成功只差临门一脚！建议集中精力完成剩余任务，可以：1) 列出剩余任务清单 2) 设定完成截止日期 3) 准备庆祝完成的方式`,
          priority: 2,
          status: 'pending',
          ai_generated: false,
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingTitles.includes(recommendation.title) && 
            !existingContents.includes(recommendation.content)) {
          recommendations.push(recommendation)
        }
      }
    }

    // 基于学习历史的推荐
    if (learningHistory.length > 0) {
      const learningFrequency = this._calculateLearningFrequency(learningHistory)
      
      if (learningFrequency < 0.3) {
        const recommendation = {
          user_id: user.id,
          type: 'increase_frequency',
          title: '提升学习习惯',
          content: '根据您的学习记录分析，建议增加学习频率以获得更好的效果。建议：1) 每天固定时间学习30分钟 2) 使用番茄工作法提高专注度 3) 记录学习成果增强成就感',
          priority: 2,
          status: 'pending',
          ai_generated: false,
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingTitles.includes(recommendation.title)) {
          recommendations.push(recommendation)
        }
      }

      // 学习内容多样化建议
      const subjects = [...new Set(learningHistory.slice(0, 10).map(r => r.subject).filter(Boolean))]
      if (subjects.length < 2) {
        const recommendation = {
          user_id: user.id,
          type: 'diversify_learning',
          title: '拓展学习领域',
          content: '建议尝试不同类型的学习内容，这样可以提高学习兴趣和综合能力。可以考虑：1) 跨学科学习 2) 理论与实践相结合 3) 加入讨论群体交流经验',
          priority: 1,
          status: 'pending',
          ai_generated: false,
          created_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        if (!existingTitles.includes(recommendation.title)) {
          recommendations.push(recommendation)
        }
      }
    } else {
      // 新用户推荐
      const recommendation = {
        user_id: user.id,
        type: 'start_learning',
        title: '开启学习之旅',
        content: '欢迎使用学习管理系统！建议从以下步骤开始：1) 设定第一个小目标（如每天学习15分钟）2) 选择感兴趣的学习内容 3) 记录学习过程和收获',
        priority: 3,
        status: 'pending',
        ai_generated: false,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      recommendations.push(recommendation)
    }

    // 目标设定推荐
    if (okrs.length === 0) {
      const recommendation = {
        user_id: user.id,
        type: 'goal_setting',
        title: '制定学习目标',
        content: '明确的学习目标是成功的关键！建议使用OKR方法制定学习目标：1) 设定明确的目标(Objective) 2) 制定可衡量的关键结果(Key Results) 3) 定期回顾和调整进度',
        priority: 3,
        status: 'pending',
        ai_generated: false,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      if (!existingTitles.includes(recommendation.title)) {
        recommendations.push(recommendation)
      }
    }

    // 每日反思推荐（每周推荐一次）
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const hasRecentReflection = existingRecommendations.some(
      r => r.type === 'daily_reflection' && new Date(r.created_at) > lastWeek
    )
    
    if (!hasRecentReflection) {
      const recommendation = {
        user_id: user.id,
        type: 'daily_reflection',
        title: '培养反思习惯',
        content: '每日反思是提高学习效率的重要方法。建议：1) 每天花5分钟回顾今日学习收获 2) 思考明天的学习计划 3) 记录遇到的困难和解决方法',
        priority: 1,
        status: 'pending',
        ai_generated: false,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      recommendations.push(recommendation)
    }

    return recommendations.slice(0, 3) // 限制后备推荐数量
  }
  /**
   * 生成个性化学习计划
   */
  async generateStudyPlan(goalId, preferences = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      // 获取目标信息
      const { data: goal, error: goalError } = await supabase
        .from('okrs')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single()

      if (goalError || !goal) {
        return this.error('目标不存在或无权访问')
      }

      // 使用DeepSeek AI生成学习计划
      const result = await deepSeekService.generateStudyPlan(goal, preferences)

      if (result.success) {
        // 保存学习计划到推荐表
        const recommendation = {
          user_id: user.id,
          type: 'study_plan',
          title: `学习计划：${goal.title}`,
          content: JSON.stringify(result.data),
          priority: 3,
          status: 'pending',
          ai_generated: true,
          metadata: {
            goalId: goalId,
            preferences: preferences,
            aiModel: 'deepseek',
            generatedAt: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        const { data: savedRec, error: saveError } = await supabase
          .from('recommendations')
          .insert(recommendation)
          .select()
          .single()

        if (saveError) {
          console.error('保存学习计划失败:', saveError)
        }

        return {
          success: true,
          data: {
            ...result.data,
            recommendationId: savedRec?.id
          }
        }
      }

      return result
    } catch (error) {
      console.error('生成学习计划异常:', error)
      return this.error('生成学习计划异常')
    }
  }

  /**
   * 分析用户进度并提供建议
   */
  async analyzeProgressAndSuggest(timeRange = 'month') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return this.error('用户未登录')
      }

      // 构建时间范围查询
      const now = new Date()
      let startDate
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // 获取用户OKR进度数据
      const { data: okrs } = await supabase
        .from('okrs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      // 获取学习记录
      const { data: learningRecords } = await supabase
        .from('learning_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // 获取推荐完成情况
      const { data: recommendations } = await supabase
        .from('recommendations')
        .select('status, type, created_at, completed_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      const progressData = {
        timeRange,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        okrs: okrs || [],
        learningRecords: learningRecords || [],
        recommendations: recommendations || [],
        stats: {
          totalOkrs: (okrs || []).length,
          completedOkrs: (okrs || []).filter(okr => okr.status === 'completed').length,
          totalLearningTime: (learningRecords || []).reduce((sum, record) => sum + (record.duration || 0), 0),
          learningSessionsCount: (learningRecords || []).length,
          recommendationsCompleted: (recommendations || []).filter(rec => rec.status === 'completed').length
        }
      }

      // 使用DeepSeek AI分析进度
      const result = await deepSeekService.analyzeProgressAndSuggest(progressData)

      return result
    } catch (error) {
      console.error('分析进度异常:', error)
      return this.error('分析进度异常')
    }
  }

  /**
   * 测试DeepSeek API连接
   */
  async testAIConnection() {
    try {
      const result = await deepSeekService.testConnection()
      return result
    } catch (error) {
      return {
        success: false,
        message: `API连接测试失败: ${error.message}`
      }
    }
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