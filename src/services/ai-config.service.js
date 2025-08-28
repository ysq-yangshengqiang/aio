/**
 * AI配置服务
 * 处理用户的AI配置管理
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class AIConfigService extends BaseService {
  constructor() {
    super('ai_configurations')
  }

  /**
   * 获取用户的AI配置列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 配置列表
   */
  async getUserConfigurations(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { active_only = false } = options

      let query = supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (active_only) {
        query = query.eq('is_active', true)
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
   * 获取用户的默认AI配置
   * @returns {Promise<Object>} 默认配置
   */
  async getDefaultConfiguration() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('config_name', 'default')
        .limit(1)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      // 如果没有找到默认配置，创建一个
      if (!data || data.length === 0) {
        return await this.createDefaultConfiguration()
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
   * 创建默认AI配置
   * @returns {Promise<Object>} 创建结果
   */
  async createDefaultConfiguration() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const defaultConfig = {
        user_id: user.id,
        config_name: 'default',
        model_provider: 'n8n',
        model_name: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        system_prompt: '你是一个专业的AI学习助手，专门帮助学生制定学习计划、分析学习进度、提供个性化建议。请用简洁、友好的语言与用户交流。',
        configuration: {
          response_format: 'markdown',
          include_sources: true,
          max_history: 10
        },
        is_active: true
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .insert(config)
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data?.[0] || data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建新的AI配置
   * @param {Object} configData - 配置数据
   * @returns {Promise<Object>} 创建结果
   */
  async createConfiguration(configData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const config = {
        user_id: user.id,
        ...configData
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .insert(config)
        .select()
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
   * 更新AI配置
   * @param {string} configId - 配置ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateConfiguration(configId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .update(updates)
        .eq('id', configId)
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
        data: data?.[0] || data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 删除AI配置
   * @param {string} configId - 配置ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteConfiguration(configId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 检查是否为默认配置
      const { data: configData } = await supabase
        .from('ai_configurations')
        .select('config_name')
        .eq('id', configId)
        .eq('user_id', user.id)
        .limit(1)

      const config = configData?.[0]

      if (config && config.config_name === 'default') {
        return {
          success: false,
          error: '不能删除默认配置'
        }
      }

      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', configId)
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        message: '配置删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 激活指定配置
   * @param {string} configId - 配置ID
   * @returns {Promise<Object>} 激活结果
   */
  async activateConfiguration(configId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 先将所有配置设为非激活状态
      await supabase
        .from('ai_configurations')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // 激活指定配置
      const { data, error } = await supabase
        .from('ai_configurations')
        .update({ is_active: true })
        .eq('id', configId)
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
        data: data?.[0] || data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取配置的使用统计
   * @param {string} configId - 配置ID
   * @returns {Promise<Object>} 统计结果
   */
  async getConfigurationStats(configId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 这里可以扩展统计功能，比如统计使用次数、成功率等
      // 目前返回基本信息
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: '配置不存在'
        }
      }

      const config = data[0]
      const stats = {
        config: config,
        usage_count: 0, // 可以从其他表统计
        success_rate: 0, // 可以从聊天记录统计
        last_used: config.updated_at
      }

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
   * 复制配置
   * @param {string} configId - 源配置ID
   * @param {string} newName - 新配置名称
   * @returns {Promise<Object>} 复制结果
   */
  async duplicateConfiguration(configId, newName) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取源配置
      const { data: sourceConfigData, error: fetchError } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .limit(1)

      if (fetchError) {
        return {
          success: false,
          error: fetchError.message
        }
      }

      if (!sourceConfigData || sourceConfigData.length === 0) {
        return {
          success: false,
          error: '源配置不存在'
        }
      }

      const sourceConfig = sourceConfigData[0]

      // 创建新配置
      const newConfig = {
        ...sourceConfig,
        id: undefined, // 让数据库生成新ID
        config_name: newName,
        is_active: false,
        created_at: undefined,
        updated_at: undefined
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .insert(newConfig)
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data?.[0] || data
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
export const aiConfigService = new AIConfigService()