import { ref, computed } from 'vue'
import { AuthAPI, OKRAPI, ChatAPI, UserAPI, AnalyticsAPI, NotificationAPI } from '@/api'

/**
 * API组合式函数，提供统一的API调用接口
 */
export function useAPI() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  /**
   * 执行API调用的通用方法
   */
  const execute = async (apiCall, ...args) => {
    loading.value = true
    error.value = null
    data.value = null

    try {
      const result = await apiCall(...args)
      
      if (result.success) {
        data.value = result.data
        return result
      } else {
        error.value = result.error || 'API调用失败'
        return result
      }
    } catch (err) {
      error.value = err.message || '网络错误'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 认证相关API
   */
  const auth = {
    login: (credentials) => execute(AuthAPI.login, credentials),
    register: (userData) => execute(AuthAPI.register, userData),
    logout: (userId) => execute(AuthAPI.logout, userId),
    getCurrentUser: () => execute(AuthAPI.getCurrentUser),
    updateProfile: (userId, updates) => execute(AuthAPI.updateProfile, userId, updates),
    resetPassword: (email) => execute(AuthAPI.resetPassword, email),
    updatePassword: (userId, newPassword) => execute(AuthAPI.updatePassword, userId, newPassword),
    validateSession: () => execute(AuthAPI.validateSession),
    refreshProfile: (userId) => execute(AuthAPI.refreshProfile, userId)
  }

  /**
   * OKR相关API
   */
  const okr = {
    create: (userId, okrData) => execute(OKRAPI.createOKR, userId, okrData),
    getUserOKRs: (userId, options) => execute(OKRAPI.getUserOKRs, userId, options),
    getActiveOKRs: (userId) => execute(OKRAPI.getActiveOKRs, userId),
    getDetails: (okrId, userId) => execute(OKRAPI.getOKRDetails, okrId, userId),
    updateProgress: (okrId, userId, progressData) => execute(OKRAPI.updateOKRProgress, okrId, userId, progressData),
    updateKeyResult: (okrId, keyResultIndex, userId, progress) => execute(OKRAPI.updateKeyResultProgress, okrId, keyResultIndex, userId, progress),
    update: (okrId, userId, updates) => execute(OKRAPI.updateOKR, okrId, userId, updates),
    delete: (okrId, userId) => execute(OKRAPI.deleteOKR, okrId, userId),
    getStats: (userId, timeRange) => execute(OKRAPI.getOKRStats, userId, timeRange),
    search: (userId, query, options) => execute(OKRAPI.searchOKRs, userId, query, options),
    archive: (okrId, userId) => execute(OKRAPI.archiveOKR, okrId, userId),
    unarchive: (okrId, userId) => execute(OKRAPI.unarchiveOKR, okrId, userId),
    getTemplates: (category) => execute(OKRAPI.getOKRTemplates, category),
    createFromTemplate: (userId, templateId, customizations) => execute(OKRAPI.createOKRFromTemplate, userId, templateId, customizations),
    getProgressHistory: (okrId, userId) => execute(OKRAPI.getOKRProgressHistory, okrId, userId),
    batchUpdate: (userId, okrIds, updates) => execute(OKRAPI.batchUpdateOKRs, userId, okrIds, updates)
  }

  /**
   * 通知相关API
   */
  const notification = {
    getList: (userId, options) => execute(NotificationAPI.getUserNotifications, userId, options),
    getUnread: (userId) => execute(NotificationAPI.getUnreadNotifications, userId),
    markAsRead: (notificationId, userId) => execute(NotificationAPI.markAsRead, notificationId, userId),
    markAllAsRead: (userId) => execute(NotificationAPI.markAllAsRead, userId),
    delete: (notificationId, userId) => execute(NotificationAPI.deleteNotification, notificationId, userId),
    clearAll: (userId) => execute(NotificationAPI.clearAllNotifications, userId),
    getStats: (userId) => execute(NotificationAPI.getNotificationStats, userId),
    create: (userId, notificationData) => execute(NotificationAPI.createNotification, userId, notificationData),
    sendReminder: (userId, reminderType, data) => execute(NotificationAPI.sendLearningReminder, userId, reminderType, data),
    getPreferences: (userId) => execute(NotificationAPI.getNotificationPreferences, userId),
    updatePreferences: (userId, preferences) => execute(NotificationAPI.updateNotificationPreferences, userId, preferences),
    sendTemplate: (userId, templateType, templateData) => execute(NotificationAPI.sendTemplateNotification, userId, templateType, templateData),
    sendBulk: (userIds, notificationData) => execute(NotificationAPI.sendBulkNotifications, userIds, notificationData),
    getTemplates: () => execute(NotificationAPI.getNotificationTemplates),
    test: (userId, testType) => execute(NotificationAPI.testNotification, userId, testType)
  }

  /**
   * 用户相关API
   */
  const user = {
    getProfile: (userId) => execute(UserAPI.getUserProfile, userId),
    updateProfile: (userId, updates) => execute(UserAPI.updateUserProfile, userId, updates),
    getStats: (userId) => execute(UserAPI.getUserStats, userId),
    getActivity: (userId, options) => execute(UserAPI.getUserActivity, userId, options),
    updatePreferences: (userId, preferences) => execute(UserAPI.updateUserPreferences, userId, preferences),
    getPreferences: (userId) => execute(UserAPI.getUserPreferences, userId),
    search: (query, options) => execute(UserAPI.searchUsers, query, options),
    getAchievements: (userId) => execute(UserAPI.getUserAchievements, userId),
    updateSettings: (userId, settings) => execute(UserAPI.updateUserSettings, userId, settings)
  }

  /**
   * 分析相关API
   */
  const analytics = {
    trackEvent: (userId, eventName, eventData) => execute(AnalyticsAPI.trackEvent, userId, eventName, eventData),
    getUserAnalytics: (userId, options) => execute(AnalyticsAPI.getUserAnalytics, userId, options),
    getSystemAnalytics: (options) => execute(AnalyticsAPI.getSystemAnalytics, options),
    getLearningInsights: (userId, timeRange) => execute(AnalyticsAPI.getLearningInsights, userId, timeRange),
    getProgressReport: (userId, timeRange) => execute(AnalyticsAPI.getProgressReport, userId, timeRange)
  }

  /**
   * 聊天相关API
   */
  const chat = {
    sendMessage: (userId, message, context) => execute(ChatAPI.sendMessage, userId, message, context),
    getChatHistory: (userId, options) => execute(ChatAPI.getChatHistory, userId, options),
    clearHistory: (userId) => execute(ChatAPI.clearChatHistory, userId),
    getAIResponse: (userId, message, context) => execute(ChatAPI.getAIResponse, userId, message, context),
    saveChatSession: (userId, sessionData) => execute(ChatAPI.saveChatSession, userId, sessionData),
    getChatSessions: (userId, options) => execute(ChatAPI.getChatSessions, userId, options)
  }

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasData = computed(() => !!data.value)

  // 清除状态的方法
  const clearError = () => {
    error.value = null
  }

  const clearData = () => {
    data.value = null
  }

  const reset = () => {
    loading.value = false
    error.value = null
    data.value = null
  }

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    
    // 计算属性
    isLoading,
    hasError,
    hasData,
    
    // 方法
    execute,
    clearError,
    clearData,
    reset,
    
    // API分组
    auth,
    okr,
    notification,
    user,
    analytics,
    chat
  }
}

/**
 * 专门用于认证的API组合式函数
 */
export function useAuthAPI() {
  const { auth, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...auth,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}

/**
 * 专门用于OKR的API组合式函数
 */
export function useOKRAPI() {
  const { okr, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...okr,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}

/**
 * 专门用于通知的API组合式函数
 */
export function useNotificationAPI() {
  const { notification, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...notification,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}

/**
 * 专门用于用户的API组合式函数
 */
export function useUserAPI() {
  const { user, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...user,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}

/**
 * 专门用于分析的API组合式函数
 */
export function useAnalyticsAPI() {
  const { analytics, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...analytics,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}

/**
 * 专门用于聊天的API组合式函数
 */
export function useChatAPI() {
  const { chat, loading, error, data, isLoading, hasError, clearError, reset } = useAPI()
  
  return {
    ...chat,
    loading,
    error,
    data,
    isLoading,
    hasError,
    clearError,
    reset
  }
}
