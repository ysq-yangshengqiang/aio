/**
 * 基础API类，提供通用的API响应处理
 */
export default class BaseAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || ''
  }

  /**
   * 处理API响应
   */
  handleResponse(result) {
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message || 'Operation successful'
      }
    } else {
      return {
        success: false,
        error: result.error || 'Operation failed',
        code: result.code || 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * 处理API错误
   */
  handleError(error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    }
  }

  /**
   * 验证必需参数
   */
  validateRequired(data, requiredFields) {
    const missing = []
    
    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field)
      }
    })

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }

  /**
   * 清理数据对象
   */
  cleanData(data) {
    const cleaned = {}
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        cleaned[key] = data[key]
      }
    })

    return cleaned
  }

  /**
   * 格式化分页参数
   */
  formatPaginationParams(page = 1, limit = 10) {
    const offset = (page - 1) * limit
    return {
      limit: Math.min(limit, 100), // 限制最大每页数量
      offset: Math.max(offset, 0)
    }
  }

  /**
   * 格式化排序参数
   */
  formatSortParams(sortBy, sortOrder = 'desc') {
    if (!sortBy) return null
    
    return {
      column: sortBy,
      ascending: sortOrder.toLowerCase() === 'asc'
    }
  }
}