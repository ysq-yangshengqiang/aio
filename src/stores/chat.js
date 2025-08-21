import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useKnowledgeStore } from './knowledge'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const sessionId = ref(null)
  const authStore = useAuthStore()

  // 计算属性
  const chatHistory = computed(() => messages.value)

  // 初始化聊天会话
  const initSession = () => {
    if (!sessionId.value) {
      sessionId.value = crypto.randomUUID()
    }
  }

  // 添加消息
  const addMessage = (role, content) => {
    const message = {
      id: Date.now(),
      role, // 'user' 或 'assistant'
      content,
      timestamp: new Date().toISOString()
    }
    
    messages.value.push(message)
    return message
  }

  // 发送消息到AI
  const sendMessage = async (content) => {
    try {
      loading.value = true
      error.value = null
      
      // 添加用户消息
      const userMessage = addMessage('user', content)
      
      // 保存到数据库
      await saveMessage(userMessage)
      
      // 调用AI API
      const aiResponse = await callAI(content)
      
      // 添加AI回复
      const assistantMessage = addMessage('assistant', aiResponse)
      
      // 保存AI回复
      await saveMessage(assistantMessage)
      
      return { success: true, response: aiResponse }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 保存消息到数据库
  const saveMessage = async (message) => {
    try {
      // 如果是模拟用户，不保存到数据库
      if (authStore.user.id === 'mock-user-id') {
        return
      }
      
      await supabase
        .from('chat_history')
        .insert({
          user_id: authStore.user.id,
          session_id: sessionId.value,
          message: {
            role: message.role,
            content: message.content
          }
        })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  // 调用AI API
  const callAI = async (content) => {
    try {
      // 首先尝试从知识库搜索相关答案
      const knowledgeStore = useKnowledgeStore()
      
      // 如果是特定问题，尝试知识库搜索
      if (content.includes('B+树') || content.includes('b+树') || 
          content.includes('算法') || content.includes('数据结构') ||
          content.includes('Vue') || content.includes('前端')) {
        
        const searchResult = await knowledgeStore.searchKnowledge(content, 3)
        if (searchResult.success && searchResult.data.length > 0) {
          const bestMatch = searchResult.data[0]
          return `根据知识库，我找到了相关信息：\n\n**${bestMatch.title}**\n\n${bestMatch.content}\n\n如果您需要更详细的解释或有其他问题，请告诉我！`
        }
      }
      
      // 如果是任务相关的问题
      if (content.includes('今天做什么') || content.includes('今天该做什么')) {
        return '基于您的OKR，今天建议完成以下任务：\n1. 复习数据结构B+树概念\n2. 完成算法练习题3道\n3. 准备明天的项目答辩\n\n您可以在左侧查看您的OKR目标，我可以根据具体目标为您制定更详细的计划。'
      }
      
      // 如果是学习计划相关
      if (content.includes('学习计划') || content.includes('制定计划')) {
        return '我来帮您制定学习计划！请告诉我：\n1. 您想学习什么技能？\n2. 您有多少时间？\n3. 您的学习目标是什么？\n\n我可以根据您的OKR和知识库为您推荐合适的学习路径。'
      }
      
      // 默认回复
      return '我是您的AI学习助手，可以帮您：\n1. 解答学习问题（如B+树、算法等）\n2. 制定学习计划\n3. 基于OKR推荐每日任务\n4. 搜索知识库资源\n\n请告诉我您需要什么帮助？'
    } catch (error) {
      console.error('AI response error:', error)
      return '抱歉，我在处理您的问题时遇到了错误。请稍后再试或换个方式提问。'
    }
  }

  // 获取聊天历史
  const fetchChatHistory = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 如果是模拟用户，返回空数组（新用户没有聊天历史）
      if (authStore.user.id === 'mock-user-id') {
        messages.value = []
        return { success: true, data: [] }
      }
      
      const { data, error: dbError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: true })
      
      if (dbError) throw dbError
      
              // 重构消息格式
        messages.value = data.map(record => ({
          id: record.id,
          role: record.message.role,
          content: record.message.content,
          timestamp: record.created_at
        }))
      
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 清空聊天记录
  const clearChat = () => {
    messages.value = []
    sessionId.value = null
  }

  return {
    messages,
    loading,
    error,
    sessionId,
    chatHistory,
    initSession,
    addMessage,
    sendMessage,
    fetchChatHistory,
    clearChat
  }
})
