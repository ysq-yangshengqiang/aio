/**
 * 基础服务类
 * 提供通用的数据访问和操作方法
 * 集成Supabase数据库操作
 */
import { supabase } from '../lib/supabase.js'

export class BaseService {
  constructor(tableName) {
    this.tableName = tableName
    this.supabase = supabase
  }

  /**
   * 创建记录
   * @param {Object} data - 要创建的数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 创建结果
   */
  async create(data, options = {}) {
    try {
      const { select = '*', upsert = false } = options
      
      let query = this.supabase
        .from(this.tableName)
        
      if (upsert) {
        query = query.upsert(data)
      } else {
        query = query.insert(data)
      }
      
      const { data: result, error } = await query
        .select(select)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批量创建记录
   * @param {Array} dataArray - 要创建的数据数组
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 创建结果
   */
  async createMany(dataArray, options = {}) {
    try {
      const { select = '*', upsert = false } = options
      
      let query = this.supabase
        .from(this.tableName)
        
      if (upsert) {
        query = query.upsert(dataArray)
      } else {
        query = query.insert(dataArray)
      }
      
      const { data: result, error } = await query.select(select)

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 根据ID获取单条记录
   * @param {string|number} id - 记录ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findById(id, options = {}) {
    try {
      const { select = '*', relations = [] } = options
      
      let selectClause = select
      if (relations.length > 0) {
        selectClause = `${select}, ${relations.join(', ')}`
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(selectClause)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: '记录不存在',
            code: 'NOT_FOUND'
          }
        }
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 查询多条记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findMany(options = {}) {
    try {
      const {
        select = '*',
        where = {},
        orderBy = [],
        limit = null,
        offset = null,
        relations = [],
        count = false
      } = options

      let selectClause = select
      if (relations.length > 0) {
        selectClause = `${select}, ${relations.join(', ')}`
      }

      let query = this.supabase
        .from(this.tableName)
        .select(selectClause, { count: count ? 'exact' : undefined })

      // 应用where条件
      Object.entries(where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'object' && value !== null) {
          // 支持操作符 {gt: 10}, {gte: 10}, {lt: 10}, {lte: 10}, {like: '%text%'}
          Object.entries(value).forEach(([operator, operatorValue]) => {
            switch (operator) {
              case 'gt':
                query = query.gt(key, operatorValue)
                break
              case 'gte':
                query = query.gte(key, operatorValue)
                break
              case 'lt':
                query = query.lt(key, operatorValue)
                break
              case 'lte':
                query = query.lte(key, operatorValue)
                break
              case 'like':
                query = query.like(key, operatorValue)
                break
              case 'ilike':
                query = query.ilike(key, operatorValue)
                break
              case 'neq':
                query = query.neq(key, operatorValue)
                break
              default:
                query = query.eq(key, operatorValue)
            }
          })
        } else {
          query = query.eq(key, value)
        }
      })

      // 应用排序
      orderBy.forEach(({ column, ascending = true }) => {
        query = query.order(column, { ascending })
      })

      // 应用分页
      if (limit) {
        query = query.limit(limit)
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 1000) - 1)
      }

      const { data, error, count: totalCount } = await query

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        }
      }

      const result = {
        success: true,
        data: data || []
      }

      if (count) {
        result.count = totalCount
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
   * 根据条件查询单条记录
   * @param {Object} where - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findOne(where = {}, options = {}) {
    try {
      const { select = '*', relations = [] } = options
      
      let selectClause = select
      if (relations.length > 0) {
        selectClause = `${select}, ${relations.join(', ')}`
      }

      let query = this.supabase
        .from(this.tableName)
        .select(selectClause)

      // 应用where条件
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: '记录不存在',
            code: 'NOT_FOUND'
          }
        }
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 更新记录
   * @param {string|number} id - 记录ID
   * @param {Object} updates - 更新数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 更新结果
   */
  async update(id, updates, options = {}) {
    try {
      const { select = '*' } = options

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(select)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 根据条件更新记录
   * @param {Object} where - 更新条件
   * @param {Object} updates - 更新数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 更新结果
   */
  async updateMany(where, updates, options = {}) {
    try {
      const { select = '*' } = options

      let query = this.supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })

      // 应用where条件
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.select(select)

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 删除记录
   * @param {string|number} id - 记录ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 删除结果
   */
  async delete(id, options = {}) {
    try {
      const { select = '*' } = options

      const { data, error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select(select)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 根据条件删除记录
   * @param {Object} where - 删除条件
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMany(where, options = {}) {
    try {
      const { select = '*' } = options

      let query = this.supabase
        .from(this.tableName)
        .delete()

      // 应用where条件
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.select(select)

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 统计记录数量
   * @param {Object} where - 统计条件
   * @returns {Promise<Object>} 统计结果
   */
  async count(where = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      // 应用where条件
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { count, error } = await query

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        }
      }

      return {
        success: true,
        data: count
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 执行原始SQL查询
   * @param {string} query - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async rawQuery(query, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query,
        params: params
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
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
   * 订阅实时数据变化
   * @param {Function} callback - 回调函数
   * @param {Object} options - 订阅选项
   * @returns {Object} 订阅对象
   */
  subscribe(callback, options = {}) {
    const { event = '*', filter = null } = options

    let subscription = this.supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', {
        event: event,
        schema: 'public',
        table: this.tableName,
        filter: filter
      }, callback)
      .subscribe()

    return {
      unsubscribe: () => {
        subscription.unsubscribe()
      }
    }
  }

  /**
   * 检查表是否存在
   * @returns {Promise<boolean>} 表是否存在
   */
  async tableExists() {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .limit(1)

      return !error || error.code !== 'PGRST106'
    } catch (error) {
      return false
    }
  }

  /**
   * 获取表结构信息
   * @returns {Promise<Object>} 表结构信息
   */
  async getTableInfo() {
    try {
      const { data, error } = await this.supabase.rpc('get_table_info', {
        table_name: this.tableName
      })

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
}