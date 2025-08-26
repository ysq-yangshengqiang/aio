/**
 * 应用配置文件
 */
export const APP_CONFIG = {
  // 应用基本信息
  name: '启明星AI学习管理系统',
  version: '1.0.0',
  description: 'AI驱动的个人学习目标管理平台',
  
  // API配置
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // Supabase配置
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  },
  
  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    pageSizeOptions: [10, 20, 50, 100]
  },
  
  // OKR配置
  okr: {
    maxKeyResults: 5,
    minKeyResults: 1,
    progressUpdateInterval: 24 * 60 * 60 * 1000, // 24小时
    reminderInterval: 7 * 24 * 60 * 60 * 1000, // 7天
    defaultDuration: 90, // 90天
    categories: [
      { id: 'learning', name: '学习成长', icon: '📚' },
      { id: 'skill', name: '技能提升', icon: '🛠️' },
      { id: 'career', name: '职业发展', icon: '💼' },
      { id: 'personal', name: '个人发展', icon: '🌟' },
      { id: 'health', name: '健康生活', icon: '💪' },
      { id: 'hobby', name: '兴趣爱好', icon: '🎨' }
    ]
  },
  
  // 通知配置
  notification: {
    maxNotifications: 1000,
    cleanupInterval: 30, // 30天后清理
    defaultPreferences: {
      okr_updates: true,
      learning_reminders: true,
      achievement_notifications: true,
      system_notifications: true,
      email_notifications: false,
      push_notifications: true
    },
    types: {
      info: { color: '#3b82f6', icon: 'ℹ️' },
      success: { color: '#10b981', icon: '✅' },
      warning: { color: '#f59e0b', icon: '⚠️' },
      error: { color: '#ef4444', icon: '❌' }
    }
  },
  
  // 聊天配置
  chat: {
    maxMessageLength: 2000,
    maxHistoryLength: 100,
    aiResponseTimeout: 30000,
    supportedLanguages: ['zh-CN', 'en-US'],
    defaultContext: {
      role: 'learning_assistant',
      personality: 'helpful_and_encouraging'
    }
  },
  
  // 分析配置
  analytics: {
    trackingEnabled: true,
    batchSize: 50,
    flushInterval: 5000, // 5秒
    retentionDays: 365,
    events: {
      user_login: { category: 'auth', importance: 'high' },
      user_register: { category: 'auth', importance: 'high' },
      okr_created: { category: 'okr', importance: 'high' },
      okr_progress_updated: { category: 'okr', importance: 'medium' },
      okr_completed: { category: 'okr', importance: 'high' },
      chat_message_sent: { category: 'chat', importance: 'low' },
      notification_read: { category: 'notification', importance: 'low' }
    }
  },
  
  // UI配置
  ui: {
    theme: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    animations: {
      duration: 300,
      easing: 'ease-in-out'
    },
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    }
  },
  
  // 存储配置
  storage: {
    prefix: 'aio_',
    keys: {
      user: 'user',
      preferences: 'preferences',
      theme: 'theme',
      language: 'language',
      cache: 'cache'
    },
    expiration: {
      cache: 24 * 60 * 60 * 1000, // 24小时
      session: 7 * 24 * 60 * 60 * 1000 // 7天
    }
  },
  
  // 功能开关
  features: {
    chat: true,
    notifications: true,
    analytics: true,
    darkMode: true,
    multiLanguage: false,
    offlineMode: false,
    exportData: true,
    socialSharing: false
  },
  
  // 错误处理配置
  errorHandling: {
    showErrorDetails: import.meta.env.DEV,
    logErrors: true,
    reportErrors: !import.meta.env.DEV,
    maxErrorLogs: 100
  },
  
  // 性能配置
  performance: {
    enableLazyLoading: true,
    enableVirtualScrolling: true,
    debounceDelay: 300,
    throttleDelay: 100,
    cacheSize: 50
  },
  
  // 安全配置
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    passwordMinLength: 8,
    requireStrongPassword: true
  }
}

// 环境特定配置
export const ENV_CONFIG = {
  development: {
    debug: true,
    mockData: false,
    showDevTools: true
  },
  production: {
    debug: false,
    mockData: false,
    showDevTools: false
  },
  test: {
    debug: true,
    mockData: true,
    showDevTools: false
  }
}

// 获取当前环境配置
export const getCurrentEnvConfig = () => {
  const env = import.meta.env.MODE || 'development'
  return ENV_CONFIG[env] || ENV_CONFIG.development
}

// 合并配置
export const getAppConfig = () => {
  const envConfig = getCurrentEnvConfig()
  return {
    ...APP_CONFIG,
    ...envConfig
  }
}

export default APP_CONFIG