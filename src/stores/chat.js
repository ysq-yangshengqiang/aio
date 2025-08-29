import { defineStore } from 'pinia'
import { ref, computed, nextTick, triggerRef } from 'vue'
import { supabase, getCurrentUser } from '../lib/supabase.js'
import { useAuthStore } from './auth.js'
import { chatService } from '../services/chat.service.js'
import { aiService } from '../services/ai.service.js'
import { aiConfigService } from '../services/ai-config.service.js'
import { contextBuilder } from '../services/context-builder.service.js'

export const useChatStore = defineStore('chat', () => {
  // 基本状态
  const sessions = ref([])
  const currentSession = ref(null)
  const messages = ref([])
  const loading = ref(false)
  const isTyping = ref(false)
  const error = ref(null)
  
  // AI配置状态
  const aiConfig = ref({})
  const availableProviders = ref(['n8n', 'openai', 'mock'])
  
  // 流式响应状态
  const streamingMessage = ref(null)
  const isStreaming = ref(false)
  
  // 上下文状态
  const contextCache = ref({})
  const contextLoading = ref(false)
  
  const authStore = useAuthStore()

  // 计算属性
  const chatHistory = computed(() => messages.value)
  
  const activeSessions = computed(() => 
    sessions.value.filter(session => session.status === 'active')
  )
  
  const currentMessages = computed(() => {
    if (!currentSession.value) return []
    return messages.value.filter(msg => msg.session_id === currentSession.value.id)
  })
  
  const hasActiveSession = computed(() => !!currentSession.value)
  
  const canSendMessage = computed(() => 
    hasActiveSession.value && !isTyping.value && !loading.value
  )
  
  const currentAIProvider = computed(() => 
    aiConfig.value.model_provider || 'mock'
  )

  // 会话管理方法
  const loadSessions = async () => {
    try {
      loading.value = true
      error.value = null
      
      const result = await chatService.getUserSessions({ 
        limit: 50, 
        includeMessages: false 
      })
      
      if (result.success) {
        sessions.value = result.data || []
        // 如果没有当前会话且有会话列表，选择第一个
        if (!currentSession.value && sessions.value.length > 0) {
          await selectSession(sessions.value[0])
        }
      } else {
        throw new Error(result.error)
      }
      
      return result
    } catch (err) {
      error.value = err.message
      console.error('加载会话列表失败:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createSession = async (title = null, promptMessage = null) => {
    try {
      loading.value = true
      error.value = null
      
      const sessionTitle = title || `对话 ${new Date().toLocaleString()}`
      
      console.log('Creating new chat session:', sessionTitle)
      
      const result = await chatService.createSession({
        title: sessionTitle
      })
      
      if (result.success) {
        const newSession = result.data
        sessions.value.unshift(newSession)
        await selectSession(newSession)
        
        // 如果有预设消息，自动发送
        if (promptMessage) {
          await sendMessage(promptMessage)
        }
        
        return { success: true, data: newSession }
      } else {
        console.error('Failed to create session:', result)
        throw new Error(result.error || '创建会话失败')
      }
    } catch (err) {
      error.value = err.message
      console.error('创建会话失败:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const selectSession = async (session) => {
    try {
      if (currentSession.value?.id === session.id) return
      
      currentSession.value = session
      messages.value = []
      
      // 加载会话消息
      await loadMessages(session.id)
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('选择会话失败:', err)
      return { success: false, error: err.message }
    }
  }

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const result = await chatService.updateSession(sessionId, { 
        title: newTitle 
      })
      
      if (result.success) {
        const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
        if (sessionIndex >= 0) {
          sessions.value[sessionIndex].title = newTitle
        }
        
        if (currentSession.value?.id === sessionId) {
          currentSession.value.title = newTitle
        }
      }
      
      return result
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  const deleteSession = async (sessionId) => {
    try {
      const result = await chatService.deleteSession(sessionId)
      
      if (result.success) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
        
        // 如果删除的是当前会话，切换到其他会话
        if (currentSession.value?.id === sessionId) {
          if (sessions.value.length > 0) {
            await selectSession(sessions.value[0])
          } else {
            currentSession.value = null
            messages.value = []
          }
        }
      }
      
      return result
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // 消息管理方法
  const loadMessages = async (sessionId) => {
    try {
      const result = await chatService.getSessionMessages(sessionId, {
        limit: 100,
        offset: 0
      })
      
      if (result.success) {
        messages.value = result.data || []
      } else {
        throw new Error(result.error)
      }
      
      return result
    } catch (err) {
      error.value = err.message
      console.error('加载消息失败:', err)
      return { success: false, error: err.message }
    }
  }

  const sendMessageStream = async (content, callbacks = {}) => {
    console.log('=== 开始sendMessageStream ===') // 调试日志
    console.log('content:', content) // 调试日志
    console.log('currentSession:', currentSession.value) // 调试日志
    
    if (!currentSession.value || !content?.trim()) {
      console.log('无效的会话或消息内容') // 调试日志
      return { success: false, error: '无效的会话或消息内容' }
    }
    
    const { onChunk, onStatus } = callbacks
    console.log('callbacks:', { onChunk: !!onChunk, onStatus: !!onStatus }) // 调试日志
    
    try {
      isTyping.value = true
      error.value = null
      
      const messageContent = content.trim()
      
      // 1. 创建并保存用户消息
      if (onStatus) onStatus({ step: 1, message: '准备AI配置...' })
      
      const userMessageResult = await chatService.sendMessage(
        currentSession.value.id,
        messageContent,
        'user'
      )
      
      if (!userMessageResult.success) {
        throw new Error(userMessageResult.error)
      }
      
      const userMessage = userMessageResult.data
      messages.value.push(userMessage)
      
      await nextTick()
      
      // 2. 构建上下文（简化版）
      const context = {}
      
      // 3. 创建流式AI消息占位符
      console.log('创建流式AI消息占位符') // 调试日志
      isStreaming.value = true
      streamingMessage.value = {
        id: `temp_${Date.now()}`,
        role: 'assistant',
        content: '',
        session_id: currentSession.value.id,
        created_at: new Date().toISOString(),
        metadata: { streaming: true }
      }
      messages.value.push(streamingMessage.value)
      console.log('流式消息已添加到messages:', streamingMessage.value) // 调试日志
      console.log('当前messages数量:', messages.value.length) // 调试日志
      
      // 4. 使用chatAIService进行流式调用
      const { chatAIService } = await import('../services/chat-ai.service.js')
      
      const aiResponse = await chatAIService.generateStreamResponse(
        messageContent,
        {
          session_id: currentSession.value.id,
          provider: aiConfig.value.model_provider || 'n8n',
          model_name: aiConfig.value.model_name,
          temperature: aiConfig.value.temperature,
          max_tokens: aiConfig.value.max_tokens
        },
        context,
        (chunk) => {
          console.log('=== 收到流式chunk ===', chunk)
          if (streamingMessage.value) {
            console.log('直接更新streamingMessage内容')
            
            // 最简单的更新方式
            streamingMessage.value.content = chunk
            
            // 立即更新messages数组中对应的消息
            const messageIndex = messages.value.findIndex(m => m.id === streamingMessage.value.id)
            if (messageIndex >= 0) {
              console.log('更新messages数组索引:', messageIndex)
              messages.value[messageIndex].content = chunk
              console.log('更新后内容长度:', messages.value[messageIndex].content.length)
            }
            
            if (onChunk) onChunk(chunk)
          }
        },
        onStatus
      )
      
      if (aiResponse.success) {
        // 5. 保存AI回复消息到数据库
        const assistantMessageResult = await chatService.sendMessage(
          currentSession.value.id,
          aiResponse.data.content,
          'assistant',
          aiResponse.data.metadata
        )
        
        if (assistantMessageResult.success) {
          const assistantMessage = assistantMessageResult.data
          
          // 更新流式消息为实际消息
          if (streamingMessage.value) {
            const messageIndex = messages.value.findIndex(m => m.id === streamingMessage.value.id)
            if (messageIndex >= 0) {
              // 创建新的消息对象，移除流式标识
              const finalMessage = {
                ...assistantMessage,
                metadata: {
                  ...assistantMessage.metadata,
                  streaming: false // 明确标记为非流式
                }
              }
              messages.value[messageIndex] = finalMessage
            }
            streamingMessage.value = null
          }
          
          isStreaming.value = false
          
          // 更新会话活动时间
          updateSessionLastActivity()
          
          return { success: true, data: assistantMessage }
        } else {
          throw new Error('保存AI回复失败')
        }
      } else {
        throw new Error(aiResponse.error || 'AI生成回复失败')
      }
      
    } catch (err) {
      error.value = err.message
      console.error('流式发送消息失败:', err)
      
      // 清理流式消息
      if (streamingMessage.value) {
        const messageIndex = messages.value.findIndex(m => m.id === streamingMessage.value.id)
        if (messageIndex >= 0) {
          messages.value.splice(messageIndex, 1)
        }
      }
      
      return { success: false, error: err.message }
    } finally {
      streamingMessage.value = null
      isStreaming.value = false
      isTyping.value = false
    }
  }

  const sendMessage = async (content, useStream = true) => {
    if (!currentSession.value || !content?.trim()) {
      return { success: false, error: '无效的会话或消息内容' }
    }
    
    try {
      isTyping.value = true
      error.value = null
      
      const messageContent = content.trim()
      
      // 1. 创建并保存用户消息
      const userMessageResult = await chatService.sendMessage(
        currentSession.value.id,
        messageContent,
        'user'
      )
      
      if (!userMessageResult.success) {
        throw new Error(userMessageResult.error)
      }
      
      const userMessage = userMessageResult.data
      messages.value.push(userMessage)
      
      await nextTick()
      
      // 2. 暂时跳过上下文构建以避免数据库错误
      // contextLoading.value = true
      // const contextResult = await contextBuilder.buildContext(
      //   authStore.user.id,
      //   currentSession.value.id,
      //   messageContent
      // )
      // contextLoading.value = false
      
      const context = {} // 使用空上下文
      
      // 3. 生成AI回复 - 使用aiService直接调用n8n webhook
      let aiResponse
      if (useStream) {
        // 流式响应
        isStreaming.value = true
        streamingMessage.value = {
          id: `temp_${Date.now()}`,
          role: 'assistant',
          content: '',
          session_id: currentSession.value.id,
          created_at: new Date().toISOString()
        }
        messages.value.push(streamingMessage.value)
        
        aiResponse = await aiService.chatStream(
          messageContent,
          (chunk) => {
            if (streamingMessage.value) {
              streamingMessage.value.content = chunk
            }
          },
          {
            sessionId: currentSession.value.id,
            context: context
          }
        )
        
        isStreaming.value = false
      } else {
        // 普通响应
        aiResponse = await aiService.chat(messageContent, {
          sessionId: currentSession.value.id,
          context: context
        })
      }
      
      if (aiResponse.success) {
        // 5. 保存AI回复消息
        const assistantMessageResult = await chatService.sendMessage(
          currentSession.value.id,
          aiResponse.data.content,
          'assistant',
          aiResponse.data.metadata
        )
        
        if (assistantMessageResult.success) {
          const assistantMessage = assistantMessageResult.data
          
          if (isStreaming.value && streamingMessage.value) {
            // 更新流式消息
            const messageIndex = messages.value.findIndex(m => m.id === streamingMessage.value.id)
            if (messageIndex >= 0) {
              messages.value[messageIndex] = assistantMessage
            }
            streamingMessage.value = null
          } else {
            // 添加新消息
            messages.value.push(assistantMessage)
          }
          
          // 更新会话活动时间
          updateSessionLastActivity()
          
          return { success: true, data: assistantMessage }
        } else {
          throw new Error('保存AI回复失败')
        }
      } else {
        throw new Error(aiResponse.error || 'AI生成回复失败')
      }
      
    } catch (err) {
      error.value = err.message
      console.error('发送消息失败:', err)
      
      // 清理流式消息
      if (streamingMessage.value) {
        const messageIndex = messages.value.findIndex(m => m.id === streamingMessage.value.id)
        if (messageIndex >= 0) {
          messages.value.splice(messageIndex, 1)
        }
        streamingMessage.value = null
        isStreaming.value = false
      }
      
      return { success: false, error: err.message }
    } finally {
      isTyping.value = false
    }
  }

  // AI配置管理
  const loadAIConfig = async () => {
    try {
      // 使用aiConfigService获取配置
      const result = await aiConfigService.getDefaultConfiguration()
      if (result.success) {
        aiConfig.value = result.data
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('加载AI配置失败:', err)
      // 使用默认配置
      aiConfig.value = {
        model_provider: 'n8n',
        model_name: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        system_prompt: '你是启明星AI学习助手，专门帮助用户制定和跟踪学习目标。'
      }
      return { success: false, error: err.message }
    }
  }

  const updateAIConfig = async (newConfig) => {
    try {
      const result = await aiConfigService.updateConfiguration({
        ...aiConfig.value,
        ...newConfig
      })
      
      if (result.success) {
        aiConfig.value = result.data
      }
      
      return result
    } catch (err) {
      console.error('更新AI配置失败:', err)
      return { success: false, error: err.message }
    }
  }

  // 辅助方法
  const updateSessionLastActivity = () => {
    if (currentSession.value) {
      currentSession.value.updated_at = new Date().toISOString()
      
      // 将当前会话移到列表顶部
      const sessionIndex = sessions.value.findIndex(s => s.id === currentSession.value.id)
      if (sessionIndex > 0) {
        const [session] = sessions.value.splice(sessionIndex, 1)
        sessions.value.unshift(session)
      }
    }
  }

  const retryMessage = async (message) => {
    try {
      if (message.role === 'user') {
        // 重新发送用户消息
        await sendMessage(message.content)
      } else {
        // 重新生成AI回复
        const messageIndex = messages.value.indexOf(message)
        const userMessage = messages.value[messageIndex - 1]
        
        if (userMessage && userMessage.role === 'user') {
          // 移除当前AI消息
          messages.value.splice(messageIndex, 1)
          // 重新发送
          await sendMessage(userMessage.content)
        }
      }
    } catch (err) {
      console.error('重试消息失败:', err)
      return { success: false, error: err.message }
    }
  }

  const rateMessage = async (message, rating) => {
    try {
      message.rating = message.rating === rating ? null : rating
      // TODO: 将评分发送到服务器
      return { success: true }
    } catch (err) {
      console.error('评分消息失败:', err)
      return { success: false, error: err.message }
    }
  }

  const clearMessages = async () => {
    if (!currentSession.value) return
    
    try {
      messages.value = []
      return { success: true }
    } catch (err) {
      console.error('清空消息失败:', err)
      return { success: false, error: err.message }
    }
  }

  const exportChat = () => {
    if (!currentSession.value || messages.value.length === 0) {
      return { success: false, error: '没有可导出的对话内容' }
    }
    
    try {
      const chatContent = messages.value.map(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI助手'
        const time = new Date(msg.created_at).toLocaleString()
        return `[${time}] ${role}: ${msg.content}`
      }).join('\n\n')
      
      const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentSession.value.title}_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (err) {
      console.error('导出对话失败:', err)
      return { success: false, error: err.message }
    }
  }

  // 初始化方法
  const initialize = async () => {
    try {
      loading.value = true
      
      // 并行加载基础数据
      const [sessionsResult, configResult] = await Promise.all([
        loadSessions(),
        loadAIConfig()
      ])
      
      return {
        success: true,
        data: {
          sessions: sessionsResult,
          config: configResult
        }
      }
    } catch (err) {
      console.error('初始化聊天系统失败:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 清理方法
  const cleanup = () => {
    sessions.value = []
    currentSession.value = null
    messages.value = []
    streamingMessage.value = null
    contextCache.value = {}
    isTyping.value = false
    isStreaming.value = false
    loading.value = false
    contextLoading.value = false
    error.value = null
  }

  // 返回所有状态和方法
  return {
    // 状态
    sessions,
    currentSession,
    messages,
    loading,
    isTyping,
    error,
    aiConfig,
    availableProviders,
    streamingMessage,
    isStreaming,
    contextCache,
    contextLoading,
    
    // 计算属性
    chatHistory,
    activeSessions,
    currentMessages,
    hasActiveSession,
    canSendMessage,
    currentAIProvider,
    
    // 会话管理方法
    loadSessions,
    createSession,
    selectSession,
    updateSessionTitle,
    deleteSession,
    
    // 消息管理方法
    loadMessages,
    sendMessage,
    sendMessageStream,
    retryMessage,
    rateMessage,
    clearMessages,
    exportChat,
    
    // AI配置方法
    loadAIConfig,
    updateAIConfig,
    
    // 初始化和清理
    initialize,
    cleanup
  }
})
