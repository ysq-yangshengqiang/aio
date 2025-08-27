/**
 * 用户档案服务
 * 处理用户个人信息和成长画像
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class ProfileService extends BaseService {
  constructor() {
    super('user_profiles')
  }

  /**
   * 获取用户档案
   * @returns {Promise<Object>} 用户档案
   */
  async getUserProfile() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

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
   * 更新用户档案
   * @param {Object} profileData - 档案数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(profileData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const updates = {
        ...profileData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
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
   * 获取成长画像
   * @returns {Promise<Object>} 成长画像
   */
  async getGrowthProfile() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('growth_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

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
   * 更新成长画像
   * @param {Object} growthData - 成长数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateGrowthProfile(growthData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const updates = {
        ...growthData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('growth_profiles')
        .update(updates)
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
   * 分析用户技能标签
   * @returns {Promise<Object>} 技能分析结果
   */
  async analyzeSkills() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取用户的OKR和学习活动
      const [okrsResult, activitiesResult] = await Promise.all([
        supabase.from('okrs').select('category, status, progress').eq('user_id', user.id),
        supabase.from('learning_activities').select('activity_type, metadata').eq('user_id', user.id)
      ])

      if (okrsResult.error || activitiesResult.error) {
        return {
          success: false,
          error: '获取数据失败'
        }
      }

      const okrs = okrsResult.data || []
      const activities = activitiesResult.data || []

      // 分析技能标签
      const skillTags = new Map()

      // 基于OKR类别分析
      okrs.forEach(okr => {
        const category = okr.category
        if (!skillTags.has(category)) {
          skillTags.set(category, { count: 0, progress: 0 })
        }
        const skill = skillTags.get(category)
        skill.count++
        skill.progress += okr.progress
      })

      // 基于学习活动分析
      activities.forEach(activity => {
        const type = activity.activity_type
        if (!skillTags.has(type)) {
          skillTags.set(type, { count: 0, progress: 0 })
        }
        skillTags.get(type).count++
      })

      // 转换为数组并计算平均进度
      const skills = Array.from(skillTags.entries()).map(([tag, data]) => ({
        tag,
        count: data.count,
        averageProgress: data.count > 0 ? Math.round(data.progress / data.count) : 0,
        level: this.calculateSkillLevel(data.count, data.progress / data.count)
      }))

      return {
        success: true,
        data: skills.sort((a, b) => b.count - a.count)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 计算技能等级
   * @param {number} count - 活动数量
   * @param {number} avgProgress - 平均进度
   * @returns {string} 技能等级
   */
  calculateSkillLevel(count, avgProgress) {
    if (count >= 10 && avgProgress >= 80) return 'expert'
    if (count >= 5 && avgProgress >= 60) return 'advanced'
    if (count >= 3 && avgProgress >= 40) return 'intermediate'
    return 'beginner'
  }

  /**
   * 生成学习建议
   * @returns {Promise<Object>} 建议结果
   */
  async generateLearningAdvice() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取技能分析结果
      const skillsResult = await this.analyzeSkills()
      if (!skillsResult.success) {
        return skillsResult
      }

      const skills = skillsResult.data
      const advice = []

      // 基于技能水平生成建议
      const beginnerSkills = skills.filter(s => s.level === 'beginner')
      const expertSkills = skills.filter(s => s.level === 'expert')

      if (beginnerSkills.length > 0) {
        advice.push({
          type: 'skill_development',
          title: '技能提升建议',
          content: `建议重点提升以下技能：${beginnerSkills.slice(0, 3).map(s => s.tag).join('、')}`,
          priority: 'high'
        })
      }

      if (expertSkills.length > 0) {
        advice.push({
          type: 'knowledge_sharing',
          title: '知识分享建议',
          content: `您在${expertSkills[0].tag}方面表现优秀，可以考虑分享经验帮助他人`,
          priority: 'medium'
        })
      }

      // 基于学习频率生成建议
      const recentActivities = await supabase
        .from('learning_activities')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (recentActivities.data && recentActivities.data.length < 3) {
        advice.push({
          type: 'consistency',
          title: '学习频率建议',
          content: '建议保持更规律的学习节奏，每周至少进行3次学习活动',
          priority: 'medium'
        })
      }

      return {
        success: true,
        data: advice
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 上传头像
   * @param {File} file - 头像文件
   * @returns {Promise<Object>} 上传结果
   */
  async uploadAvatar(file) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 生成文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 更新用户档案
      const updateResult = await this.updateProfile({
        avatar_url: urlData.publicUrl
      })

      if (!updateResult.success) {
        return updateResult
      }

      return {
        success: true,
        data: {
          avatar_url: urlData.publicUrl
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
export const profileService = new ProfileService()