/**
 * 连接管理服务
 * 负责管理应用与各种服务的连接状态和健康检查
 */
import { supabase, checkSupabaseConnection } from '@/lib/supabase.js'

export class ConnectionService {
  constructor() {
    this.connectionStates = {
      supabase: 'unknown',
      database: 'unknown',
      auth: 'unknown'
    }
    
    this.healthCheckInterval = null
    this.listeners = new Set()
  }

  /**
   * 添加连接状态监听器
   * @param {Function} callback - 状态变化回调函数
   */
  addListener(callback) {
    this.listeners.add(callback)
  }

  /**
   * 移除连接状态监听器
   * @param {Function} callback - 状态变化回调函数
   */
  removeListener(callback) {
    this.listeners.delete(callback)
  }

  /**
   * 通知所有监听器状态变化
   * @param {Object} states - 连接状态
   */
  notifyListeners(states) {
    this.listeners.forEach(callback => {
      try {
        callback(states)
      } catch (error) {
        console.error('Connection state listener error:', error)
      }
    })
  }

  /**
   * 检查Supabase连接状态
   * @returns {Promise<Object>} 连接状态结果
   */
  async checkSupabaseConnection() {
    try {
      const result = await checkSupabaseConnection()
      
      this.connectionStates.supabase = result.connected ? 'connected' : 'disconnected'
      
      return {
        service: 'supabase',
        connected: result.connected,
        error: result.error,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.connectionStates.supabase = 'error'
      return {
        service: 'supabase',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 检查认证服务连接状态
   * @returns {Promise<Object>} 认证状态结果
   */
  async checkAuthConnection() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      const isAuthenticated = !!session?.user
      
      this.connectionStates.auth = isAuthenticated ? 'authenticated' : 'unauthenticated'
      
      return {
        service: 'auth',
        connected: true,
        authenticated: isAuthenticated,
        user: session?.user || null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.connectionStates.auth = 'error'
      return {
        service: 'auth',
        connected: false,
        authenticated: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 检查数据库连接状态
   * @returns {Promise<Object>} 数据库状态结果
   */
  async checkDatabaseConnection() {
    try {
      // 尝试查询一个简单的表或系统视图
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      this.connectionStates.database = 'connected'
      
      return {
        service: 'database',
        connected: true,
        tablesAccessible: !error,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.connectionStates.database = 'error'
      return {
        service: 'database',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 执行全面的连接检查
   * @returns {Promise<Object>} 所有服务的连接状态
   */
  async checkAllConnections() {
    console.log('开始检查所有连接状态...')
    
    try {
      const [supabaseResult, authResult, databaseResult] = await Promise.allSettled([
        this.checkSupabaseConnection(),
        this.checkAuthConnection(),
        this.checkDatabaseConnection()
      ])

      const results = {
        overall: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { 
            service: 'supabase', 
            connected: false, 
            error: supabaseResult.reason?.message 
          },
          auth: authResult.status === 'fulfilled' ? authResult.value : { 
            service: 'auth', 
            connected: false, 
            error: authResult.reason?.message 
          },
          database: databaseResult.status === 'fulfilled' ? databaseResult.value : { 
            service: 'database', 
            connected: false, 
            error: databaseResult.reason?.message 
          }
        }
      }

      // 判断总体健康状态
      const hasErrors = Object.values(results.services).some(service => !service.connected)
      if (hasErrors) {
        results.overall = 'degraded'
      }

      // 通知监听器
      this.notifyListeners(results)

      console.log('连接检查完成:', results)
      return results

    } catch (error) {
      const errorResult = {
        overall: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {}
      }

      this.notifyListeners(errorResult)
      return errorResult
    }
  }

  /**
   * 开始定期健康检查
   * @param {number} interval - 检查间隔（毫秒）
   */
  startHealthCheck(interval = 30000) { // 默认30秒
    if (this.healthCheckInterval) {
      this.stopHealthCheck()
    }

    console.log('开启定期健康检查，间隔:', interval, 'ms')

    // 立即执行一次检查
    this.checkAllConnections()

    // 设置定期检查
    this.healthCheckInterval = setInterval(() => {
      this.checkAllConnections()
    }, interval)
  }

  /**
   * 停止定期健康检查
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      console.log('停止定期健康检查')
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * 获取当前连接状态
   * @returns {Object} 连接状态摘要
   */
  getConnectionStates() {
    return { ...this.connectionStates }
  }

  /**
   * 尝试重新连接所有服务
   * @returns {Promise<Object>} 重连结果
   */
  async reconnectAll() {
    console.log('尝试重新连接所有服务...')
    
    try {
      // 重置连接状态
      this.connectionStates = {
        supabase: 'reconnecting',
        database: 'reconnecting',
        auth: 'reconnecting'
      }

      // 通知监听器开始重连
      this.notifyListeners({ status: 'reconnecting', ...this.connectionStates })

      // 重新检查所有连接
      const result = await this.checkAllConnections()

      console.log('重连完成:', result)
      return result

    } catch (error) {
      console.error('重连失败:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stopHealthCheck()
    this.listeners.clear()
    console.log('连接管理服务已销毁')
  }
}

// 创建单例实例
export const connectionService = new ConnectionService()

// 自动开始健康检查（仅在浏览器环境中）
if (typeof window !== 'undefined') {
  // 延迟启动，确保应用初始化完成
  setTimeout(() => {
    connectionService.startHealthCheck(60000) // 1分钟检查一次
  }, 2000)
}