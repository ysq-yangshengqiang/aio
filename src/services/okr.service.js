/**
 * OKR服务
 * 处理目标与关键结果的管理
 * 集成Supabase数据库操作
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class OKRService extends BaseService {
  constructor() {
    super('okrs')
  }

  /**
   * 创建新的OKR
   * @param {Object} okrData - OKR数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOKR(okrData) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 基础OKR数据，只包含核心字段
      const newOKR = {
        user_id: user.id,
        title: okrData.title,
        description: okrData.description || ''
      }

      // 安全地添加可选字段
      const optionalFields = ['category', 'priority', 'status', 'progress', 'start_date', 'target_date']
      
      optionalFields.forEach(field => {
        if (okrData[field] !== undefined && okrData[field] !== null) {
          newOKR[field] = okrData[field]
        }
      })

      // 设置默认值
      if (!newOKR.status) newOKR.status = 'active'
      if (!newOKR.progress) newOKR.progress = 0
      if (!newOKR.category) newOKR.category = 'learning'
      if (!newOKR.priority) newOKR.priority = 'medium'

      console.log('Creating OKR with data:', newOKR)

      const result = await this.create(newOKR)
      
      if (!result.success) {
        console.error('OKR creation failed:', result.error)
        
        // 如果是表结构问题，提供更友好的错误信息
        if (result.error.includes('could not find') || result.error.includes('schema cache')) {
          return {
            success: false,
            error: '数据库表结构不完整，请联系管理员执行数据库迁移'
          }
        }
        
        return result
      }
      
      if (result.success && okrData.keyResults && okrData.keyResults.length > 0) {
        // 创建关键结果
        const keyResultsResult = await this.createKeyResults(result.data.id, okrData.keyResults)
        if (keyResultsResult.success) {
          result.data.key_results = keyResultsResult.data
        } else {
          console.warn('Key results creation failed:', keyResultsResult.error)
          // 即使关键结果创建失败，OKR本身已经创建成功
        }
      }

      return result
    } catch (error) {
      console.error('OKR creation error:', error)
      return {
        success: false,
        error: `创建失败: ${error.message}`
      }
    }
  }

  /**
   * 获取用户的所有OKR
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getUserOKRs(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const {
        status = null,
        category = null,
        limit = null,
        offset = null,
        includeKeyResults = true
      } = options

      const where = { user_id: user.id }
      if (status) where.status = status
      if (category) where.category = category

      const relations = includeKeyResults ? ['key_results(*)'] : []

      return await this.findMany({
        where,
        relations,
        limit,
        offset,
        orderBy: [{ column: 'created_at', ascending: false }]
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取单个OKR详情
   * @param {string} okrId - OKR ID
   * @returns {Promise<Object>} 查询结果
   */
  async getOKRById(okrId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const result = await this.findById(okrId, {
        relations: ['key_results(*)']
      })

      if (result.success && result.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权访问此OKR'
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新OKR
   * @param {string} okrId - OKR ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateOKR(okrId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证权限
      const existingOKR = await this.findById(okrId)
      if (!existingOKR.success) {
        return existingOKR
      }

      if (existingOKR.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权修改此OKR'
        }
      }

      return await this.update(okrId, updates)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 删除OKR
   * @param {string} okrId - OKR ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteOKR(okrId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证权限
      const existingOKR = await this.findById(okrId)
      if (!existingOKR.success) {
        return existingOKR
      }

      if (existingOKR.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权删除此OKR'
        }
      }

      return await this.delete(okrId)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新OKR进度
   * @param {string} okrId - OKR ID
   * @param {number} progress - 进度百分比 (0-100)
   * @returns {Promise<Object>} 更新结果
   */
  async updateProgress(okrId, progress) {
    try {
      if (progress < 0 || progress > 100) {
        return {
          success: false,
          error: '进度值必须在0-100之间'
        }
      }

      const status = progress === 100 ? 'completed' : 'active'
      
      return await this.updateOKR(okrId, {
        progress,
        status,
        ...(progress === 100 && { completed_at: new Date().toISOString() })
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 创建关键结果
   * @param {string} okrId - OKR ID
   * @param {Array} keyResultsData - 关键结果数据数组
   * @returns {Promise<Object>} 创建结果
   */
  async createKeyResults(okrId, keyResultsData) {
    try {
      const keyResultsService = new BaseService('key_results')
      
      const keyResults = keyResultsData.map(kr => ({
        okr_id: okrId,
        title: kr.title,
        description: kr.description || '',
        target_value: kr.target_value || null,
        current_value: kr.current_value || 0,
        unit: kr.unit || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      return await keyResultsService.createMany(keyResults)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新关键结果
   * @param {string} keyResultId - 关键结果ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateKeyResult(keyResultId, updates) {
    try {
      const keyResultsService = new BaseService('key_results')
      
      // 如果更新了current_value，检查是否达到目标
      if (updates.current_value !== undefined) {
        const keyResult = await keyResultsService.findById(keyResultId)
        if (keyResult.success && keyResult.data.target_value) {
          const progress = (updates.current_value / keyResult.data.target_value) * 100
          if (progress >= 100) {
            updates.status = 'completed'
          }
        }
      }

      const result = await keyResultsService.update(keyResultId, updates)
      
      // 更新相关OKR的进度
      if (result.success) {
        await this.recalculateOKRProgress(result.data.okr_id)
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 重新计算OKR进度
   * @param {string} okrId - OKR ID
   * @returns {Promise<Object>} 计算结果
   */
  async recalculateOKRProgress(okrId) {
    try {
      const keyResultsService = new BaseService('key_results')
      
      // 获取所有关键结果
      const keyResultsResult = await keyResultsService.findMany({
        where: { okr_id: okrId }
      })

      if (!keyResultsResult.success || keyResultsResult.data.length === 0) {
        return { success: true, progress: 0 }
      }

      // 计算平均进度
      let totalProgress = 0
      keyResultsResult.data.forEach(kr => {
        if (kr.target_value && kr.target_value > 0) {
          const progress = Math.min((kr.current_value / kr.target_value) * 100, 100)
          totalProgress += progress
        }
      })

      const averageProgress = Math.round(totalProgress / keyResultsResult.data.length)
      
      // 更新OKR进度
      return await this.updateProgress(okrId, averageProgress)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取OKR统计数据
   * @returns {Promise<Object>} 统计结果
   */
  async getStats() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('okrs')
        .select('status, progress, category')
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      const stats = {
        total: data.length,
        active: data.filter(okr => okr.status === 'active').length,
        completed: data.filter(okr => okr.status === 'completed').length,
        paused: data.filter(okr => okr.status === 'paused').length,
        averageProgress: data.length > 0 
          ? Math.round(data.reduce((sum, okr) => sum + okr.progress, 0) / data.length)
          : 0,
        byCategory: {}
      }

      // 按类别统计
      data.forEach(okr => {
        if (!stats.byCategory[okr.category]) {
          stats.byCategory[okr.category] = 0
        }
        stats.byCategory[okr.category]++
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
   * 获取最近的OKR
   * @param {number} limit - 限制数量
   * @returns {Promise<Object>} 查询结果
   */
  async getRecentOkrs(limit = 5) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { data, error } = await supabase
        .from('okrs')
        .select(`
          *,
          key_results(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

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
   * 搜索OKR
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async searchOKRs(query, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { limit = 20 } = options

      const { data, error } = await supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

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
}

// 创建单例实例
export const okrService = new OKRService()