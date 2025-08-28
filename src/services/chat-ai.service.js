/**
 * AI聊天服务管理器
 * 专门处理聊天相关的AI服务，现在通过Supabase Edge Functions处理
 */
import { BaseService } from './base.service.js'
import { supabase, getCurrentUser } from '../lib/supabase.js'

export class ChatAIService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL
    this.defaultProvider = 'n8n'
  }

  /**
   * 生成AI回复
   * @param {string} prompt - 用户输入
   * @param {Object} config - AI配置
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} AI回复结果
   */
  async generateResponse(prompt, config = {}, context = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const startTime = Date.now()
      
      // 调用Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-ai-handler', {
        body: {
          sessionId: config.session_id,
          message: prompt,
          userId: config.user_id || user.id,
          context,
          aiConfig: {
            model_provider: config.provider || this.defaultProvider,
            model_name: config.model_name || 'gpt-3.5-turbo',
            temperature: config.temperature || 0.7,
            max_tokens: config.max_tokens || 1000,
            ...config
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error(data.error || '生成回复失败')
      }

      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: {
          ...data.data,
          response_time: responseTime,
          provider: config.provider || this.defaultProvider
        }
      }
    } catch (error) {
      console.error('AI服务生成回复失败:', error)
      
      // 如果Edge Function不可用，提供fallback
      if (error.message.includes('n8n workflow') || error.message.includes('No active n8n workflow')) {
        return {
          success: true,
          data: {
            content: '抱歉，AI服务暂时不可用。请确保您已配置n8n工作流，或联系管理员获取帮助。',
            tokens_used: 0,
            provider: 'fallback',
            metadata: {
              fallback: true,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }
        }
      }
      
      return {
        success: false,
        error: error.message || '生成回复时发生错误'
      }
    }
  }

  /**
   * 流式生成回复
   * @param {string} prompt - 用户输入
   * @param {Object} config - AI配置
   * @param {Object} context - 上下文信息
   * @param {Function} onChunk - 数据块回调
   * @returns {Promise<Object>} 最终结果
   */
  async generateStreamResponse(prompt, config = {}, context = {}, onChunk) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const startTime = Date.now()
      
      // 构建请求URL
      const functionUrl = `${this.baseUrl}/functions/v1/chat-stream-handler`
      
      const requestBody = {
        sessionId: config.session_id,
        message: prompt,
        userId: config.user_id || user.id,
        context,
        aiConfig: {
          model_provider: config.provider || this.defaultProvider,
          model_name: config.model_name || 'gpt-3.5-turbo',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          stream: true,
          ...config
        }
      }

      // 获取auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('认证失败')
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // 处理流式响应
      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let finalResult = null

        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.type === 'content' && onChunk) {
                    onChunk(data.data)
                  } else if (data.type === 'done' || data.done) {
                    finalResult = data.data
                    break
                  } else if (data.type === 'error') {
                    throw new Error(data.error)
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError)
                }
              }
            }

            if (finalResult) break
          }
        } catch (readerError) {
          console.error('Streaming read error:', readerError)
          throw readerError
        }

        const responseTime = Date.now() - startTime

        return {
          success: true,
          data: {
            ...(finalResult || { content: '流式响应完成但未获取到最终结果' }),
            response_time: responseTime,
            provider: config.provider || this.defaultProvider
          }
        }
      } else {
        throw new Error('No response body for streaming')
      }

    } catch (error) {
      console.error('AI流式生成失败:', error)
      
      // 如果流式失败，回退到普通模式
      console.log('流式响应失败，回退到普通模式...')
      const result = await this.generateResponse(prompt, config, context)
      
      if (result.success && onChunk) {
        // 模拟流式输出
        const content = result.data.content
        const words = content.split('')
        
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20))
          onChunk(words.slice(0, i + 1).join(''))
        }
      }
      
      return result
    }
  }

  /**
   * 获取用户的AI配置
   * @param {string} userId - 用户ID
   * @param {string} configName - 配置名称
   * @returns {Promise<Object>} 配置信息
   */
  async getUserAIConfig(userId, configName = 'default') {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('config_name', configName)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // 如果没有找到配置，返回默认配置
      if (!data) {
        return this.getDefaultAIConfig()
      }

      return data
    } catch (error) {
      console.error('获取AI配置失败:', error)
      return this.getDefaultAIConfig()
    }
  }

  /**
   * 获取默认AI配置
   * @returns {Object} 默认配置
   */
  getDefaultAIConfig() {
    return {
      model_provider: 'n8n',
      model_name: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      system_prompt: `你是启明星AI学习助手，专门帮助用户制定和跟踪学习目标。你具有以下特点：
1. 友善、耐心、专业
2. 基于用户的OKR数据提供个性化建议
3. 能够分析学习进度并给出具体的改进建议
4. 擅长制定可执行的学习计划
5. 用简洁清晰的语言回答问题

请始终保持积极正面的态度，鼓励用户持续学习和进步。`
    }
  }

  /**
   * 保存AI配置
   * @param {string} userId - 用户ID
   * @param {Object} config - 配置信息
   * @returns {Promise<Object>} 保存结果
   */
  async saveUserAIConfig(userId, config) {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .upsert({
          user_id: userId,
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('保存AI配置失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 管理n8n工作流配置
   * @param {string} action - 操作类型 (get, create, update, delete)
   * @param {Object} config - 工作流配置
   * @returns {Promise<Object>} 操作结果
   */
  async manageN8NWorkflows(action, config = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const params = new URLSearchParams({
        user_id: user.id,
        ...(config.action && { action: config.action }),
        ...(config.workflow_id && { workflow_id: config.workflow_id })
      })

      let method = 'GET'
      let body = null

      switch (action) {
        case 'create':
          method = 'POST'
          body = JSON.stringify(config)
          break
        case 'update':
          method = 'PUT'
          body = JSON.stringify(config)
          break
        case 'delete':
          method = 'DELETE'
          break
        default:
          method = 'GET'
      }

      const { data, error } = await supabase.functions.invoke('n8n-workflow-manager', {
        method,
        body: body ? JSON.parse(body) : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('n8n工作流管理失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 测试n8n工作流连接
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} 测试结果
   */
  async testN8NWorkflow(webhookUrl) {
    try {
      const testPayload = {
        test: true,
        message: "Connection test from frontend",
        timestamp: new Date().toISOString()
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json().catch(() => ({}))

      return {
        success: true,
        status_code: response.status,
        response: result,
        message: 'Webhook连接测试成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Webhook连接测试失败'
      }
    }
  }
}

// 创建单例实例
export const chatAIService = new ChatAIService()