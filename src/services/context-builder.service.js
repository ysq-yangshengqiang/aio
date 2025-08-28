/**
 * 上下文构建服务
 * 负责为AI聊天收集和构建智能上下文信息
 */
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class ContextBuilderService {
  constructor() {
    this.contextCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 构建完整的AI上下文
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   * @param {string} query - 用户查询内容
   * @returns {Promise<Object>} 构建的上下文信息
   */
  async buildContext(userId, sessionId, query) {
    try {
      const cacheKey = `${userId}_${sessionId}_${Date.now()}`
      
      // 并行收集各种上下文信息
      const [
        userProfile,
        activeOKRs,
        conversationHistory,
        relatedActivities,
        learningProgress
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getActiveOKRs(userId),
        this.getConversationHistory(sessionId),
        this.getRelatedActivities(userId, query),
        this.getLearningProgress(userId)
      ])

      const context = {
        user_profile: userProfile,
        active_okrs: activeOKRs,
        conversation_history: conversationHistory,
        related_activities: relatedActivities,
        learning_progress: learningProgress,
        query_analysis: this.analyzeQuery(query),
        timestamp: new Date().toISOString()
      }

      // 缓存上下文
      this.contextCache.set(cacheKey, {
        data: context,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: context
      }
    } catch (error) {
      console.error('构建上下文失败:', error)
      return {
        success: false,
        error: error.message,
        data: this.getMinimalContext()
      }
    }
  }

  /**
   * 获取用户资料信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户资料
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          username,
          major,
          grade,
          bio,
          learning_goals,
          skills,
          preferences,
          created_at
        `)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data ? {
        username: data.username || '同学',
        major: data.major,
        grade: data.grade,
        learning_goals: data.learning_goals || [],
        skills: data.skills || [],
        preferences: data.preferences || {},
        experience_level: this.calculateExperienceLevel(data.created_at)
      } : null
    } catch (error) {
      console.error('获取用户资料失败:', error)
      return null
    }
  }

  /**
   * 获取活跃的OKR数据
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} OKR列表
   */
  async getActiveOKRs(userId) {
    try {
      const { data, error } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          description,
          category,
          priority,
          status,
          progress,
          target_date,
          key_results (
            id,
            title,
            status,
            progress,
            target_value,
            current_value,
            unit
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'in_progress'])
        .order('priority', { ascending: false })
        .limit(5)

      if (error) throw error

      return (data || []).map(okr => ({
        id: okr.id,
        title: okr.title,
        category: okr.category,
        progress: okr.progress,
        status: okr.status,
        priority: okr.priority,
        target_date: okr.target_date,
        key_results_count: okr.key_results?.length || 0,
        key_results_progress: this.calculateKeyResultsProgress(okr.key_results),
        urgency: this.calculateUrgency(okr.target_date, okr.progress)
      }))
    } catch (error) {
      console.error('获取OKR数据失败:', error)
      return []
    }
  }

  /**
   * 获取对话历史
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Array>} 对话历史
   */
  async getConversationHistory(sessionId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at, tokens_used')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return (data || [])
        .reverse() // 按时间正序
        .slice(-6) // 只取最近6条消息
        .map(msg => ({
          role: msg.role,
          content: this.truncateContent(msg.content, 200),
          timestamp: msg.created_at
        }))
    } catch (error) {
      console.error('获取对话历史失败:', error)
      return []
    }
  }

  /**
   * 获取相关学习活动
   * @param {string} userId - 用户ID
   * @param {string} query - 查询内容
   * @returns {Promise<Array>} 相关活动
   */
  async getRelatedActivities(userId, query) {
    try {
      const keywords = this.extractKeywords(query)
      if (keywords.length === 0) return []

      // 构建搜索条件
      const searchConditions = keywords.map(keyword => 
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,tags.cs.{${keyword}}`
      ).join(',')

      const { data, error } = await supabase
        .from('learning_activities')
        .select(`
          id,
          title,
          activity_type,
          status,
          tags,
          progress,
          created_at
        `)
        .eq('user_id', userId)
        .or(searchConditions)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      return (data || []).map(activity => ({
        title: activity.title,
        type: activity.activity_type,
        status: activity.status,
        progress: activity.progress,
        tags: activity.tags || [],
        relevance: this.calculateRelevance(activity, keywords)
      }))
    } catch (error) {
      console.error('获取相关活动失败:', error)
      return []
    }
  }

  /**
   * 获取学习进度统计
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 学习进度
   */
  async getLearningProgress(userId) {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .select('status, activity_type, progress, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      const activities = data || []
      
      return {
        total_activities: activities.length,
        completed_activities: activities.filter(a => a.status === 'completed').length,
        in_progress_activities: activities.filter(a => a.status === 'in_progress').length,
        average_progress: this.calculateAverageProgress(activities),
        activity_types: this.groupByActivityType(activities),
        recent_trend: this.calculateRecentTrend(activities)
      }
    } catch (error) {
      console.error('获取学习进度失败:', error)
      return {
        total_activities: 0,
        completed_activities: 0,
        in_progress_activities: 0,
        average_progress: 0,
        activity_types: {},
        recent_trend: 'stable'
      }
    }
  }

  /**
   * 分析用户查询内容
   * @param {string} query - 查询内容
   * @returns {Object} 查询分析结果
   */
  analyzeQuery(query) {
    const intent = this.detectIntent(query)
    const keywords = this.extractKeywords(query)
    const sentiment = this.analyzeSentiment(query)
    const complexity = this.assessComplexity(query)

    return {
      intent,
      keywords,
      sentiment,
      complexity,
      length: query.length,
      has_question: query.includes('?') || query.includes('？'),
      language: this.detectLanguage(query)
    }
  }

  /**
   * 格式化上下文供AI使用
   * @param {Object} context - 原始上下文
   * @returns {string} 格式化的上下文字符串
   */
  formatContextForAI(context) {
    if (!context || typeof context !== 'object') {
      return '当前没有可用的上下文信息。'
    }

    let formatted = []

    // 用户信息
    if (context.user_profile) {
      const profile = context.user_profile
      formatted.push(`用户信息：${profile.username}，${profile.major || ''}${profile.grade || ''}`)
      
      if (profile.learning_goals && profile.learning_goals.length > 0) {
        formatted.push(`学习目标：${profile.learning_goals.join('、')}`)
      }
    }

    // OKR信息
    if (context.active_okrs && context.active_okrs.length > 0) {
      const okrSummary = context.active_okrs.map(okr => 
        `${okr.title}(${okr.progress}%)`
      ).join('、')
      formatted.push(`当前OKR：${okrSummary}`)
    }

    // 学习进度
    if (context.learning_progress) {
      const progress = context.learning_progress
      formatted.push(`学习统计：完成${progress.completed_activities}项，进行中${progress.in_progress_activities}项`)
    }

    // 对话历史
    if (context.conversation_history && context.conversation_history.length > 0) {
      formatted.push('最近对话：')
      context.conversation_history.slice(-3).forEach(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI'
        formatted.push(`${role}：${msg.content}`)
      })
    }

    return formatted.join('\n')
  }

  // 辅助方法
  calculateExperienceLevel(createdAt) {
    if (!createdAt) return 'new'
    
    const daysSinceJoin = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceJoin < 7) return 'new'
    if (daysSinceJoin < 30) return 'beginner'
    if (daysSinceJoin < 90) return 'intermediate'
    return 'experienced'
  }

  calculateKeyResultsProgress(keyResults) {
    if (!keyResults || keyResults.length === 0) return 0
    
    const totalProgress = keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0)
    return Math.round(totalProgress / keyResults.length)
  }

  calculateUrgency(targetDate, progress) {
    if (!targetDate) return 'low'
    
    const daysLeft = (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    const progressRatio = progress / 100
    
    if (daysLeft < 7 && progressRatio < 0.8) return 'high'
    if (daysLeft < 14 && progressRatio < 0.6) return 'medium'
    return 'low'
  }

  extractKeywords(text) {
    const stopWords = ['的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '个', '有', '和', '与', '或', '但', '如果', '因为', '所以', '可以', '应该', '需要', '想要', '怎么', '什么', '哪里', '为什么', '如何', '请', '帮', '助']
    
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 8)
  }

  detectIntent(query) {
    const intents = {
      question: ['什么', '怎么', '如何', '为什么', '哪里', '?', '？'],
      help: ['帮助', '帮忙', '协助', '指导', '教'],
      planning: ['计划', '安排', '规划', '目标', '制定'],
      progress: ['进度', '完成', '状态', '情况', '怎么样'],
      learning: ['学习', '学', '掌握', '理解', '练习']
    }

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return intent
      }
    }

    return 'general'
  }

  analyzeSentiment(query) {
    const positiveWords = ['好', '棒', '优秀', '成功', '完成', '满意', '开心', '高兴']
    const negativeWords = ['难', '困难', '问题', '失败', '错误', '不会', '不懂', '担心']

    const positiveCount = positiveWords.filter(word => query.includes(word)).length
    const negativeCount = negativeWords.filter(word => query.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  assessComplexity(query) {
    if (query.length < 10) return 'simple'
    if (query.length < 50) return 'medium'
    return 'complex'
  }

  detectLanguage(query) {
    const chineseChars = (query.match(/[\u4e00-\u9fff]/g) || []).length
    const totalChars = query.length
    
    return chineseChars / totalChars > 0.5 ? 'zh' : 'en'
  }

  truncateContent(content, maxLength) {
    if (!content || content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  calculateRelevance(activity, keywords) {
    let score = 0
    const text = `${activity.title} ${activity.description || ''} ${(activity.tags || []).join(' ')}`.toLowerCase()
    
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 1
      }
    })
    
    return Math.min(score / keywords.length, 1)
  }

  calculateAverageProgress(activities) {
    if (activities.length === 0) return 0
    
    const totalProgress = activities.reduce((sum, activity) => sum + (activity.progress || 0), 0)
    return Math.round(totalProgress / activities.length)
  }

  groupByActivityType(activities) {
    return activities.reduce((groups, activity) => {
      const type = activity.activity_type || 'other'
      groups[type] = (groups[type] || 0) + 1
      return groups
    }, {})
  }

  calculateRecentTrend(activities) {
    if (activities.length < 2) return 'stable'
    
    const now = Date.now()
    const recentActivities = activities.filter(a => 
      (now - new Date(a.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    )
    
    if (recentActivities.length > activities.length * 0.5) return 'increasing'
    if (recentActivities.length < activities.length * 0.2) return 'decreasing'
    return 'stable'
  }

  getMinimalContext() {
    return {
      user_profile: { username: '同学' },
      active_okrs: [],
      conversation_history: [],
      related_activities: [],
      learning_progress: {
        total_activities: 0,
        completed_activities: 0,
        in_progress_activities: 0,
        average_progress: 0
      },
      query_analysis: {
        intent: 'general',
        keywords: [],
        sentiment: 'neutral',
        complexity: 'simple'
      }
    }
  }

  // 清理过期缓存
  cleanupCache() {
    const now = Date.now()
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.contextCache.delete(key)
      }
    }
  }
}

// 创建单例实例
export const contextBuilder = new ContextBuilderService()

// 定期清理缓存
setInterval(() => {
  contextBuilder.cleanupCache()
}, 5 * 60 * 1000) // 每5分钟清理一次