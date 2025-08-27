/**
 * AI服务
 * 处理AI推荐和智能分析
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class AIService extends BaseService {
  constructor() {
    super('ai_recommendations')
  }

  /**
   * 获取用户的AI推荐
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 推荐结果
   */
  async getRecommendations(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const {
        type = null,
        status = 'pending',
        limit = 10
      } = options

      let query = supabase
        .from('ai_recommendations')
        .select(`
          *,
          okrs(title, category)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (limit) {
        query = query.limit(limit)
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
   * 生成个性化推荐
   * @returns {Promise<Object>} 生成结果
   */
  async generatePersonalizedRecommendations() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取用户数据
      const [okrsResult, activitiesResult, profileResult] = await Promise.all([
        supabase.from('okrs').select('*').eq('user_id', user.id),
        supabase.from('learning_activities').select('*').eq('user_id', user.id).limit(20),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      ])

      if (okrsResult.error || activitiesResult.error) {
        return {
          success: false,
          error: '获取用户数据失败'
        }
      }

      const okrs = okrsResult.data || []
      const activities = activitiesResult.data || []
      const profile = profileResult.data

      // 生成推荐
      const recommendations = []

      // 1. 基于OKR进度的推荐
      okrs.forEach(okr => {
        if (okr.status === 'active' && okr.progress < 30) {
          recommendations.push({
            user_id: user.id,
            okr_id: okr.id,
            type: 'okr_acceleration',
            title: `加速推进目标：${okr.title}`,
            content: `您的目标"${okr.title}"进度较慢，建议：\n1. 分解为更小的子任务\n2. 设定每日学习计划\n3. 寻找相关学习资源`,
            priority: okr.priority === 'high' ? 3 : 2,
            status: 'pending',
            metadata: {
              okr_progress: okr.progress,
              okr_category: okr.category
            }
          })
        }
      })

      // 2. 基于学习活动模式的推荐
      const activityTypes = activities.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
        return acc
      }, {})

      const mostCommonType = Object.keys(activityTypes).reduce((a, b) => 
        activityTypes[a] > activityTypes[b] ? a : b, null)

      if (mostCommonType && activityTypes[mostCommonType] > 5) {
        recommendations.push({
          user_id: user.id,
          type: 'learning_diversity',
          title: '丰富学习方式',
          content: `您最近主要进行${mostCommonType}类型的学习，建议尝试其他学习方式：\n1. 实践项目\n2. 同伴讨论\n3. 在线课程\n4. 阅读相关书籍`,
          priority: 1,
          status: 'pending',
          metadata: {
            dominant_activity: mostCommonType,
            activity_count: activityTypes[mostCommonType]
          }
        })
      }

      // 3. 基于时间管理的推荐
      const recentActivities = activities.filter(activity => {
        const activityDate = new Date(activity.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return activityDate > weekAgo
      })

      if (recentActivities.length < 3) {
        recommendations.push({
          user_id: user.id,
          type: 'consistency',
          title: '保持学习连续性',
          content: '最近一周的学习活动较少，建议：\n1. 制定每日学习计划\n2. 设置学习提醒\n3. 从小目标开始\n4. 记录学习成果',
          priority: 2,
          status: 'pending',
          metadata: {
            recent_activity_count: recentActivities.length
          }
        })
      }

      // 4. 基于专业发展的推荐
      if (profile && profile.major) {
        recommendations.push({
          user_id: user.id,
          type: 'career_development',
          title: `${profile.major}专业技能提升`,
          content: `基于您的专业背景，推荐以下学习方向：\n1. 行业前沿技术\n2. 实际项目经验\n3. 专业认证考试\n4. 行业交流活动`,
          priority: 2,
          status: 'pending',
          metadata: {
            major: profile.major,
            grade: profile.grade
          }
        })
      }

      // 保存推荐到数据库
      if (recommendations.length > 0) {
        // 先清除旧的推荐
        await supabase
          .from('ai_recommendations')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'pending')

        // 插入新推荐
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .insert(recommendations)

        if (insertError) {
          return {
            success: false,
            error: insertError.message
          }
        }
      }

      return {
        success: true,
        data: recommendations
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 标记推荐为已读
   * @param {string} recommendationId - 推荐ID
   * @returns {Promise<Object>} 更新结果
   */
  async markAsRead(recommendationId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('ai_recommendations')
        .update({ status: 'read' })
        .eq('id', recommendationId)
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
   * 获取学习路径推荐
   * @param {string} category - 学习类别
   * @returns {Promise<Object>} 路径推荐
   */
  async getLearningPath(category) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 基于类别生成学习路径
      const learningPaths = {
        'programming': {
          title: '编程技能提升路径',
          steps: [
            { title: '基础语法掌握', duration: '2-4周', description: '掌握编程语言基础语法和概念' },
            { title: '数据结构与算法', duration: '4-6周', description: '学习常用数据结构和算法' },
            { title: '项目实践', duration: '6-8周', description: '完成实际项目，应用所学知识' },
            { title: '代码优化', duration: '2-3周', description: '学习代码重构和性能优化' }
          ]
        },
        'design': {
          title: '设计技能提升路径',
          steps: [
            { title: '设计基础理论', duration: '2-3周', description: '学习色彩、构图、字体等基础理论' },
            { title: '工具熟练使用', duration: '3-4周', description: '掌握设计软件的使用' },
            { title: '作品集建设', duration: '4-6周', description: '创建个人作品集' },
            { title: '用户体验设计', duration: '3-4周', description: '学习UX/UI设计原则' }
          ]
        },
        'business': {
          title: '商业技能提升路径',
          steps: [
            { title: '商业基础知识', duration: '2-3周', description: '学习市场营销、财务等基础知识' },
            { title: '数据分析能力', duration: '3-4周', description: '掌握数据分析工具和方法' },
            { title: '项目管理', duration: '4-5周', description: '学习项目管理方法论' },
            { title: '领导力发展', duration: '持续进行', description: '培养团队协作和领导能力' }
          ]
        }
      }

      const path = learningPaths[category] || {
        title: '通用学习路径',
        steps: [
          { title: '目标设定', duration: '1周', description: '明确学习目标和期望成果' },
          { title: '基础学习', duration: '4-6周', description: '系统学习基础知识' },
          { title: '实践应用', duration: '4-8周', description: '通过项目实践巩固知识' },
          { title: '持续改进', duration: '持续进行', description: '不断反思和优化学习方法' }
        ]
      }

      return {
        success: true,
        data: path
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成学习报告
   * @param {Object} options - 报告选项
   * @returns {Promise<Object>} 报告结果
   */
  async generateLearningReport(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { period = 'month' } = options

      // 计算时间范围
      const now = new Date()
      let startDate
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      // 获取数据
      const [okrsResult, activitiesResult] = await Promise.all([
        supabase
          .from('okrs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('learning_activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
      ])

      if (okrsResult.error || activitiesResult.error) {
        return {
          success: false,
          error: '获取数据失败'
        }
      }

      const okrs = okrsResult.data || []
      const activities = activitiesResult.data || []

      // 生成报告
      const report = {
        period: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        summary: {
          totalOkrs: okrs.length,
          completedOkrs: okrs.filter(okr => okr.status === 'completed').length,
          totalActivities: activities.length,
          totalLearningTime: activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0)
        },
        achievements: [],
        insights: [],
        recommendations: []
      }

      // 生成成就
      if (report.summary.completedOkrs > 0) {
        report.achievements.push(`完成了 ${report.summary.completedOkrs} 个目标`)
      }
      
      if (report.summary.totalLearningTime > 0) {
        const hours = Math.round(report.summary.totalLearningTime / 60)
        report.achievements.push(`累计学习 ${hours} 小时`)
      }

      // 生成洞察
      const avgProgress = okrs.length > 0 
        ? okrs.reduce((sum, okr) => sum + okr.progress, 0) / okrs.length 
        : 0

      if (avgProgress > 70) {
        report.insights.push('您的目标执行力很强，大部分目标都有良好进展')
      } else if (avgProgress < 30) {
        report.insights.push('建议重新评估目标的可行性，或调整执行策略')
      }

      // 生成建议
      if (activities.length < 10) {
        report.recommendations.push('增加学习活动的频率，保持持续学习的习惯')
      }

      const activityTypes = [...new Set(activities.map(a => a.activity_type))]
      if (activityTypes.length < 3) {
        report.recommendations.push('尝试多样化的学习方式，提高学习效果')
      }

      return {
        success: true,
        data: report
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
export const aiService = new AIService()
