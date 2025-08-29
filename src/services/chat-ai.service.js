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
   * 生成AI回复 - 直接调用n8n webhook
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
      
      // 使用你提供的n8n webhook URL
      const webhookUrl = 'https://ysq123.app.n8n.cloud/webhook/66695751-ef1a-4f40-b901-b6fd7ca20842'
      
      const requestBody = {
        prompt: prompt,
        config: {
          model_provider: config.provider || this.defaultProvider,
          model_name: config.model_name || 'gpt-3.5-turbo',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          stream: false
        },
        context: context,
        user_id: config.user_id || user.id,
        session_id: config.session_id,
        timestamp: new Date().toISOString()
      }

      console.log('发送普通请求到n8n webhook:', { webhookUrl, requestBody })

      // 调用n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('n8n webhook响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('n8n webhook错误响应:', errorText)
        throw new Error(`n8n webhook调用失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('n8n webhook响应结果:', result)

      const responseTime = Date.now() - startTime
      
      // 提取响应内容
      const content = result.response || result.content || result.message || result.data?.content || '无响应内容'

      return {
        success: true,
        data: {
          content: content,
          response_time: responseTime,
          provider: 'n8n',
          metadata: result.metadata || result.data || {}
        }
      }
    } catch (error) {
      console.error('AI服务生成回复失败:', error)
      
      // 提供fallback响应
      return {
        success: true,
        data: {
          content: '抱歉，AI服务暂时不可用。请确保您的n8n工作流正常运行，或稍后重试。',
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
  }

  /**
   * 流式生成回复 - 直接调用n8n webhook
   */
  async generateStreamResponse(prompt, config = {}, context = {}, onChunk, onStatus) {
    try {
      console.log('开始调用n8n webhook进行流式响应')
      
      if (onStatus) onStatus({ step: 1, message: '准备AI配置...' })
      
      // 使用你提供的n8n webhook URL
      const webhookUrl = 'https://ysq123.app.n8n.cloud/webhook/66695751-ef1a-4f40-b901-b6fd7ca20842'
      
      const requestBody = {
        prompt: prompt,
        message: prompt, // 兼容不同的参数名
        config: {
          model_provider: config.provider || this.defaultProvider,
          model_name: config.model_name || 'gpt-3.5-turbo',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          stream: true
        },
        context: context,
        user_id: config.user_id || 'user-' + Date.now(),
        session_id: config.session_id || 'session-' + Date.now(),
        timestamp: new Date().toISOString()
      }

      console.log('发送请求到n8n webhook:', { webhookUrl, requestBody })

      if (onStatus) onStatus({ step: 2, message: '正在调用n8n Webhook...' })

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('n8n webhook响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('n8n webhook错误响应:', errorText)
        throw new Error(`n8n webhook调用失败: ${response.status} ${response.statusText}`)
      }

      if (onStatus) onStatus({ step: 3, message: '处理AI响应...' })

      // 检查响应类型
      const contentType = response.headers.get('content-type')
      console.log('响应Content-Type:', contentType)

      // 如果响应支持流式处理
      if (response.body) {
        console.log('开始处理流式响应...')
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) {
              console.log('流式读取完成')
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            
            console.log('收到数据块:', chunk)

            // 处理不同的响应格式
            if (contentType?.includes('application/json')) {
              // JSON流式响应
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const data = JSON.parse(line)
                    console.log('解析JSON数据:', data)
                    
                    if (data.content || data.response || data.message) {
                      const newContent = data.content || data.response || data.message
                      
                      // 检查是否是增量内容还是完整内容
                      if (newContent.length > fullContent.length && newContent.startsWith(fullContent)) {
                        // 这是增量更新（新内容包含旧内容）
                        fullContent = newContent
                        console.log('更新完整内容，总长度:', fullContent.length)
                      } else {
                        // 这是新的增量块，需要累加
                        fullContent += newContent
                        console.log('累加新内容，总长度:', fullContent.length)
                      }
                      
                      if (onChunk) onChunk(fullContent)
                    }
                  } catch (parseError) {
                    console.log('JSON解析失败，当作文本处理:', line)
                    fullContent += line + '\n'
                    if (onChunk) onChunk(fullContent)
                  }
                }
              }
            } else if (contentType?.includes('text/event-stream')) {
              // SSE格式
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                console.log('处理SSE行:', line)
                
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6)
                    if (jsonStr === '[DONE]') break
                    
                    const data = JSON.parse(jsonStr)
                    if (data.content || data.response) {
                      const newContent = data.content || data.response
                      
                      // 检查是否是增量内容还是完整内容
                      if (newContent.length > fullContent.length && newContent.startsWith(fullContent)) {
                        // 这是增量更新（新内容包含旧内容）
                        fullContent = newContent
                        console.log('SSE更新完整内容，总长度:', fullContent.length)
                      } else {
                        // 这是新的增量块，需要累加
                        fullContent += newContent
                        console.log('SSE累加新内容，总长度:', fullContent.length)
                      }
                      
                      if (onChunk) onChunk(fullContent)
                    }
                  } catch (e) {
                    // 纯文本数据
                    const textContent = line.slice(6)
                    fullContent += textContent
                    if (onChunk) onChunk(fullContent)
                  }
                }
              }
            } else {
              // 纯文本或其他格式，直接累加
              fullContent += chunk
              console.log('累加文本内容，当前长度:', fullContent.length)
              if (onChunk) onChunk(fullContent)
            }
          }
        } catch (readerError) {
          console.error('流式读取错误:', readerError)
          throw readerError
        }

        // 如果没有通过流式获取到内容，尝试解析完整响应
        if (!fullContent && buffer) {
          try {
            const finalData = JSON.parse(buffer)
            fullContent = finalData.content || finalData.response || finalData.message || buffer
          } catch (e) {
            fullContent = buffer
          }
          
          if (fullContent && onChunk) {
            console.log('使用缓冲区内容:', fullContent)
            onChunk(fullContent)
          }
        }

        return {
          success: true,
          data: {
            content: fullContent || '响应完成',
            provider: 'n8n',
            response_time: Date.now(),
            metadata: { stream: true }
          }
        }
      } else {
        // 没有响应体，尝试解析JSON
        const result = await response.json()
        console.log('JSON响应结果:', result)
        
        const content = result.response || result.content || result.message || '无响应内容'
        
        // 模拟流式输出
        if (onChunk) {
          console.log('模拟流式输出内容:', content)
          const chars = content.split('')
          let displayContent = ''
          
          for (let i = 0; i < chars.length; i++) {
            displayContent += chars[i]
            onChunk(displayContent)
            await new Promise(resolve => setTimeout(resolve, 30))
          }
        }

        return {
          success: true,
          data: {
            content: content,
            provider: 'n8n',
            response_time: Date.now(),
            metadata: result.metadata || {}
          }
        }
      }
      
    } catch (error) {
      console.error('AI流式生成失败:', error)
      
      // 如果是CORS错误，提供提示
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        return {
          success: true,
          data: {
            content: `⚠️ 检测到网络请求被阻止（CORS限制）。

解决方案：
1. 在n8n工作流中添加CORS头设置
2. 或者使用代理服务器转发请求
3. 或者在浏览器中禁用CORS检查（开发环境）

原始错误: ${error.message}`,
            provider: 'error',
            response_time: Date.now(),
            metadata: { error: true, cors: true }
          }
        }
      }
      
      return {
        success: false,
        error: error.message
      }
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