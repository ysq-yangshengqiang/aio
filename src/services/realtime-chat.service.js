/**
 * 实时通信服务
 * 使用Supabase Realtime处理聊天消息的实时同步
 * 支持多设备消息同步、状态指示等功能
 */
import { supabase, getCurrentUser } from '../lib/supabase.js'
import { ref, reactive } from 'vue'

export class RealtimeChatService {
  constructor() {
    this.channels = new Map()
    this.subscriptions = new Map()
    this.connectionState = ref('disconnected') // disconnected, connecting, connected
    this.typingUsers = reactive(new Map()) // sessionId -> Set of typing users
    this.presenceState = reactive(new Map()) // sessionId -> Set of online users
    this.messageQueue = [] // 离线消息队列
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  /**
   * 连接到指定会话的实时通道
   * @param {string} sessionId - 会话ID
   * @param {Object} callbacks - 回调函数
   */
  async connectToSession(sessionId, callbacks = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      // 如果已经连接到此会话，先断开
      if (this.channels.has(sessionId)) {
        await this.disconnectFromSession(sessionId)
      }

      console.log(`连接到会话 ${sessionId} 的实时通道...`)
      this.connectionState.value = 'connecting'

      // 创建Realtime通道
      const channel = supabase
        .channel(`chat_session_${sessionId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        }, (payload) => {
          this.handleNewMessage(payload.new, callbacks.onNewMessage)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        }, (payload) => {
          this.handleMessageUpdate(payload.new, callbacks.onMessageUpdate)
        })
        .on('broadcast', {
          event: 'typing'
        }, (payload) => {
          this.handleTypingIndicator(sessionId, payload, callbacks.onTypingUpdate)
        })
        .on('presence', {
          event: 'sync'
        }, () => {
          this.handlePresenceSync(sessionId, channel, callbacks.onPresenceUpdate)
        })
        .on('presence', {
          event: 'join'
        }, ({ newPresences }) => {
          this.handlePresenceJoin(sessionId, newPresences, callbacks.onUserJoin)
        })
        .on('presence', {
          event: 'leave'
        }, ({ leftPresences }) => {
          this.handlePresenceLeave(sessionId, leftPresences, callbacks.onUserLeave)
        })

      // 订阅通道
      const subscription = await channel.subscribe(async (status) => {
        console.log(`会话 ${sessionId} 的实时连接状态:`, status)
        
        if (status === 'SUBSCRIBED') {
          this.connectionState.value = 'connected'
          this.reconnectAttempts = 0

          // 加入presence，表示用户在线
          await this.updatePresence(channel, {
            user_id: user.id,
            username: user.email || `用户${user.id.slice(0, 8)}`,
            joined_at: new Date().toISOString()
          })

          // 处理离线消息队列
          await this.processOfflineMessages()

          if (callbacks.onConnected) {
            callbacks.onConnected(sessionId)
          }
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionState.value = 'disconnected'
          this.handleConnectionError(sessionId, callbacks)
        } else if (status === 'TIMED_OUT') {
          this.connectionState.value = 'disconnected'
          this.handleConnectionTimeout(sessionId, callbacks)
        }
      })

      // 存储通道和订阅信息
      this.channels.set(sessionId, channel)
      this.subscriptions.set(sessionId, subscription)

      return {
        success: true,
        channel,
        subscription
      }
    } catch (error) {
      console.error('连接实时通道失败:', error)
      this.connectionState.value = 'disconnected'
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 断开会话连接
   * @param {string} sessionId - 会话ID
   */
  async disconnectFromSession(sessionId) {
    try {
      const channel = this.channels.get(sessionId)
      if (channel) {
        await supabase.removeChannel(channel)
        this.channels.delete(sessionId)
        this.subscriptions.delete(sessionId)
        this.typingUsers.delete(sessionId)
        this.presenceState.delete(sessionId)
        console.log(`已断开会话 ${sessionId} 的连接`)
      }
      
      return { success: true }
    } catch (error) {
      console.error('断开连接失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 发送打字状态指示
   * @param {string} sessionId - 会话ID
   * @param {boolean} isTyping - 是否正在输入
   */
  async sendTypingIndicator(sessionId, isTyping) {
    try {
      const channel = this.channels.get(sessionId)
      const user = await getCurrentUser()
      
      if (channel && user) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            username: user.email || `用户${user.id.slice(0, 8)}`,
            is_typing: isTyping,
            timestamp: new Date().toISOString()
          }
        })
      }
      
      return { success: true }
    } catch (error) {
      console.error('发送打字指示失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 处理新消息
   * @param {Object} message - 消息数据
   * @param {Function} callback - 回调函数
   */
  handleNewMessage(message, callback) {
    try {
      console.log('收到新消息:', message)
      if (callback) {
        callback(message)
      }
    } catch (error) {
      console.error('处理新消息失败:', error)
    }
  }

  /**
   * 处理消息更新
   * @param {Object} message - 更新的消息数据
   * @param {Function} callback - 回调函数
   */
  handleMessageUpdate(message, callback) {
    try {
      console.log('消息已更新:', message)
      if (callback) {
        callback(message)
      }
    } catch (error) {
      console.error('处理消息更新失败:', error)
    }
  }

  /**
   * 处理打字指示器
   * @param {string} sessionId - 会话ID
   * @param {Object} payload - 载荷数据
   * @param {Function} callback - 回调函数
   */
  handleTypingIndicator(sessionId, payload, callback) {
    try {
      const { user_id, username, is_typing } = payload
      
      if (!this.typingUsers.has(sessionId)) {
        this.typingUsers.set(sessionId, new Set())
      }
      
      const typingSet = this.typingUsers.get(sessionId)
      
      if (is_typing) {
        typingSet.add({ user_id, username })
      } else {
        // 移除用户
        for (const user of typingSet) {
          if (user.user_id === user_id) {
            typingSet.delete(user)
            break
          }
        }
      }
      
      if (callback) {
        callback({
          sessionId,
          typingUsers: Array.from(typingSet),
          isTyping: typingSet.size > 0
        })
      }
    } catch (error) {
      console.error('处理打字指示失败:', error)
    }
  }

  /**
   * 处理用户状态同步
   * @param {string} sessionId - 会话ID
   * @param {Object} channel - 通道对象
   * @param {Function} callback - 回调函数
   */
  handlePresenceSync(sessionId, channel, callback) {
    try {
      const presences = channel.presenceState()
      const onlineUsers = new Set()
      
      Object.keys(presences).forEach(userId => {
        const presence = presences[userId][0]
        if (presence) {
          onlineUsers.add({
            user_id: userId,
            username: presence.username,
            joined_at: presence.joined_at
          })
        }
      })
      
      this.presenceState.set(sessionId, onlineUsers)
      
      if (callback) {
        callback({
          sessionId,
          onlineUsers: Array.from(onlineUsers),
          count: onlineUsers.size
        })
      }
    } catch (error) {
      console.error('处理状态同步失败:', error)
    }
  }

  /**
   * 处理用户加入
   * @param {string} sessionId - 会话ID
   * @param {Array} newPresences - 新加入的用户
   * @param {Function} callback - 回调函数
   */
  handlePresenceJoin(sessionId, newPresences, callback) {
    try {
      newPresences.forEach(presence => {
        console.log(`用户 ${presence.username} 加入了会话 ${sessionId}`)
      })
      
      if (callback) {
        callback({
          sessionId,
          joinedUsers: newPresences
        })
      }
    } catch (error) {
      console.error('处理用户加入失败:', error)
    }
  }

  /**
   * 处理用户离开
   * @param {string} sessionId - 会话ID
   * @param {Array} leftPresences - 离开的用户
   * @param {Function} callback - 回调函数
   */
  handlePresenceLeave(sessionId, leftPresences, callback) {
    try {
      leftPresences.forEach(presence => {
        console.log(`用户 ${presence.username} 离开了会话 ${sessionId}`)
      })
      
      if (callback) {
        callback({
          sessionId,
          leftUsers: leftPresences
        })
      }
    } catch (error) {
      console.error('处理用户离开失败:', error)
    }
  }

  /**
   * 更新用户在线状态
   * @param {Object} channel - 通道对象
   * @param {Object} presence - 状态信息
   */
  async updatePresence(channel, presence) {
    try {
      await channel.track(presence)
      return { success: true }
    } catch (error) {
      console.error('更新在线状态失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 处理连接错误
   * @param {string} sessionId - 会话ID
   * @param {Object} callbacks - 回调函数
   */
  async handleConnectionError(sessionId, callbacks) {
    console.error(`会话 ${sessionId} 连接错误`)
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`${delay}ms 后重新连接... (第 ${this.reconnectAttempts} 次尝试)`)
      
      setTimeout(() => {
        this.connectToSession(sessionId, callbacks)
      }, delay)
    } else {
      console.error('达到最大重连次数，停止重连')
      if (callbacks.onError) {
        callbacks.onError('连接失败，请检查网络连接')
      }
    }
  }

  /**
   * 处理连接超时
   * @param {string} sessionId - 会话ID
   * @param {Object} callbacks - 回调函数
   */
  async handleConnectionTimeout(sessionId, callbacks) {
    console.warn(`会话 ${sessionId} 连接超时`)
    
    // 尝试重新连接
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      await this.handleConnectionError(sessionId, callbacks)
    }
  }

  /**
   * 处理离线消息队列
   */
  async processOfflineMessages() {
    if (this.messageQueue.length > 0) {
      console.log(`处理 ${this.messageQueue.length} 条离线消息`)
      
      for (const message of this.messageQueue) {
        try {
          // 重新发送消息或执行相应操作
          await this.sendOfflineMessage(message)
        } catch (error) {
          console.error('处理离线消息失败:', error)
        }
      }
      
      this.messageQueue = []
    }
  }

  /**
   * 发送离线消息
   * @param {Object} message - 消息对象
   */
  async sendOfflineMessage(message) {
    // 实现离线消息发送逻辑
    console.log('发送离线消息:', message)
  }

  /**
   * 添加消息到离线队列
   * @param {Object} message - 消息对象
   */
  addToOfflineQueue(message) {
    this.messageQueue.push({
      ...message,
      queued_at: new Date().toISOString()
    })
  }

  /**
   * 获取连接状态
   * @returns {string} 连接状态
   */
  getConnectionState() {
    return this.connectionState.value
  }

  /**
   * 获取会话的在线用户
   * @param {string} sessionId - 会话ID
   * @returns {Array} 在线用户列表
   */
  getOnlineUsers(sessionId) {
    const users = this.presenceState.get(sessionId)
    return users ? Array.from(users) : []
  }

  /**
   * 获取会话的打字用户
   * @param {string} sessionId - 会话ID
   * @returns {Array} 正在打字的用户列表
   */
  getTypingUsers(sessionId) {
    const users = this.typingUsers.get(sessionId)
    return users ? Array.from(users) : []
  }

  /**
   * 断开所有连接
   */
  async disconnectAll() {
    try {
      const sessionIds = Array.from(this.channels.keys())
      await Promise.all(
        sessionIds.map(sessionId => this.disconnectFromSession(sessionId))
      )
      
      this.connectionState.value = 'disconnected'
      console.log('已断开所有实时连接')
      
      return { success: true }
    } catch (error) {
      console.error('断开所有连接失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.disconnectAll()
    this.channels.clear()
    this.subscriptions.clear()
    this.typingUsers.clear()
    this.presenceState.clear()
    this.messageQueue = []
    this.reconnectAttempts = 0
  }
}

// 创建单例实例
export const realtimeChatService = new RealtimeChatService()