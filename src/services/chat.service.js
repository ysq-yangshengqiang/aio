/**
 * 聊天服务
 * 处理AI聊天助手功能
 * 集成Supabase数据库操作
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'
import { aiConfigService } from './ai-config.service.js'
import { aiService } from './ai.service.js'

export class ChatService extends BaseService {
  constructor() {
    super('chat_sessions')
  }

  /**
   * 创建新的聊天会话
   * @param {Object} sessionData - 会话数据
   * @returns {Promise<Object>} 创建结果
   */
  async createSession(sessionData = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const newSession = {
        user_id: user.id,
        title: sessionData.title || '新对话',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return await this.create(newSession)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取用户的所有聊天会话
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getUserSessions(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { limit = 50, includeMessages = false } = options

      const relations = includeMessages ? ['chat_messages(*)'] : []

      return await this.findMany({
        where: { user_id: user.id },
        relations,
        limit,
        orderBy: [{ column: 'updated_at', ascending: false }]
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取单个会话详情
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>} 查询结果
   */
  async getSessionById(sessionId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const result = await this.findById(sessionId, {
        relations: ['chat_messages(*)']
      })

      if (result.success && result.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权访问此会话'
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
   * 更新会话
   * @param {string} sessionId - 会话ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateSession(sessionId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证权限
      const existingSession = await this.findById(sessionId)
      if (!existingSession.success) {
        return existingSession
      }

      if (existingSession.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权修改此会话'
        }
      }

      return await this.update(sessionId, updates)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteSession(sessionId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证权限
      const existingSession = await this.findById(sessionId)
      if (!existingSession.success) {
        return existingSession
      }

      if (existingSession.data.user_id !== user.id) {
        return {
          success: false,
          error: '无权删除此会话'
        }
      }

      return await this.delete(sessionId)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 发送消息
   * @param {string} sessionId - 会话ID
   * @param {string} content - 消息内容
   * @param {string} role - 消息角色 ('user' | 'assistant' | 'system')
   * @param {Object} metadata - 消息元数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendMessage(sessionId, content, role = 'user', metadata = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证会话权限
      const session = await this.getSessionById(sessionId)
      if (!session.success) {
        return session
      }

      const messagesService = new BaseService('chat_messages')
      
      const newMessage = {
        session_id: sessionId,
        role,
        content,
        created_at: new Date().toISOString()
      }

      const result = await messagesService.create(newMessage)

      if (result.success) {
        // 更新会话的最后活动时间
        await this.updateSession(sessionId, {
          updated_at: new Date().toISOString()
        })

        // 如果是用户消息，自动生成AI回复
        if (role === 'user') {
          const aiResponse = await this.generateAIResponse(sessionId, content)
          if (aiResponse.success) {
            await this.sendMessage(sessionId, aiResponse.data.content, 'assistant', aiResponse.data.metadata)
          }
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
   * 获取会话消息
   * @param {string} sessionId - 会话ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getSessionMessages(sessionId, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 验证会话权限
      const session = await this.getSessionById(sessionId)
      if (!session.success) {
        return session
      }

      const { limit = 100, offset = 0 } = options
      const messagesService = new BaseService('chat_messages')

      return await messagesService.findMany({
        where: { session_id: sessionId },
        limit,
        offset,
        orderBy: [{ column: 'created_at', ascending: true }]
      })
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 删除消息
   * @param {string} messageId - 消息ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMessage(messageId) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const messagesService = new BaseService('chat_messages')
      
      // 获取消息信息
      const message = await messagesService.findById(messageId)
      if (!message.success) {
        return message
      }

      // 验证会话权限
      const session = await this.getSessionById(message.data.session_id)
      if (!session.success) {
        return session
      }

      return await messagesService.delete(messageId)
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 搜索消息
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async searchMessages(query, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const { limit = 50, sessionId = null } = options

      let queryBuilder = supabase
        .from('chat_messages')
        .select(`
          *,
          chat_sessions!inner(user_id, title)
        `)
        .eq('chat_sessions.user_id', user.id)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (sessionId) {
        queryBuilder = queryBuilder.eq('session_id', sessionId)
      }

      const { data, error } = await queryBuilder

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
   * 获取聊天统计数据
   * @returns {Promise<Object>} 统计结果
   */
  async getChatStats() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 获取会话统计
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .eq('user_id', user.id)

      if (sessionsError) {
        return {
          success: false,
          error: sessionsError.message
        }
      }

      // 获取消息统计
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role, created_at, chat_sessions!inner(user_id)')
        .eq('chat_sessions.user_id', user.id)

      if (messagesError) {
        return {
          success: false,
          error: messagesError.message
        }
      }

      const stats = {
        totalSessions: sessions.length,
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
        averageMessagesPerSession: sessions.length > 0 
          ? Math.round(messages.length / sessions.length)
          : 0
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
   * 生成AI回复
   * @param {string} sessionId - 会话ID
   * @param {string} userMessage - 用户消息
   * @returns {Promise<Object>} AI回复结果
   */
  async generateAIResponse(sessionId, userMessage) {
    try {
      // 获取会话历史消息作为上下文
      const messagesResult = await this.getSessionMessages(sessionId, { limit: 10 })
      const context = messagesResult.success ? messagesResult.data : []

      // 使用 AI 服务生成回复
      const response = await aiService.chat(userMessage, sessionId, context)

      if (response.success) {
        return {
          success: true,
          data: {
            content: response.data.content,
            metadata: {
              timestamp: new Date().toISOString(),
              session_id: sessionId,
              ...response.data.metadata
            }
          }
        }
      }

      return response
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }


  /**
   * 清理旧会话
   * @param {number} daysOld - 清理多少天前的会话
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupOldSessions(daysOld = 30) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data, error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString())
        .select()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: {
          deletedCount: data?.length || 0,
          message: `已清理 ${data?.length || 0} 个旧会话`
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
export const chatService = new ChatService()
