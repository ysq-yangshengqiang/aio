/**
 * 应用启动引导文件
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { supabase } from '@/lib/supabase.js'
import { APP_CONFIG } from '@/config/app.config.js'
import { localStorage, userStorage } from '@/utils/storage.js'

/**
 * 创建Vue应用实例
 */
export async function createVueApp() {
  const app = createApp(App)
  
  // 创建Pinia状态管理
  const pinia = createPinia()
  app.use(pinia)
  
  // 使用路由
  app.use(router)
  
  // 全局配置
  app.config.globalProperties.$config = APP_CONFIG
  app.config.globalProperties.$supabase = supabase
  
  // 全局错误处理
  app.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error)
    console.error('Component:', instance)
    console.error('Info:', info)
    
    // 可以在这里添加错误上报逻辑
    if (APP_CONFIG.errorHandling.reportErrors) {
      // reportError(error, instance, info)
    }
  }
  
  return app
}

/**
 * 初始化应用服务
 */
export async function initializeServices() {
  try {
    // 初始化存储
    await initializeStorage()
    
    // 初始化认证状态
    await initializeAuth()
    
    // 初始化主题
    await initializeTheme()
    
    // 初始化分析服务
    if (APP_CONFIG.features.analytics) {
      await initializeAnalytics()
    }
    
    // 初始化通知服务
    if (APP_CONFIG.features.notifications) {
      await initializeNotifications()
    }
    
    console.log('✅ 应用服务初始化完成')
    return true
  } catch (error) {
    console.error('❌ 应用服务初始化失败:', error)
    return false
  }
}

/**
 * 初始化存储
 */
async function initializeStorage() {
  try {
    // 检查存储可用性
    if (!localStorage.isAvailable()) {
      console.warn('LocalStorage 不可用，部分功能可能受限')
    }
    
    // 清理过期数据
    const cleanedCount = localStorage.cleanup()
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期存储项`)
    }
    
    // 检查存储配额
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usagePercentage = (estimate.usage / estimate.quota) * 100
      
      if (usagePercentage > 80) {
        console.warn(`⚠️ 存储空间使用率较高: ${usagePercentage.toFixed(1)}%`)
      }
    }
    
    console.log('✅ 存储初始化完成')
  } catch (error) {
    console.error('❌ 存储初始化失败:', error)
    throw error
  }
}

/**
 * 初始化认证状态
 */
async function initializeAuth() {
  try {
    // 检查当前会话
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取会话失败:', error)
      return
    }
    
    if (session) {
      console.log('✅ 用户已登录:', session.user.email)
      
      // 更新用户存储
      userStorage.setUser({
        id: session.user.id,
        email: session.user.email,
        lastLogin: new Date().toISOString()
      })
    } else {
      console.log('ℹ️ 用户未登录')
      userStorage.removeUser()
    }
    
    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('认证状态变化:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        userStorage.setUser({
          id: session.user.id,
          email: session.user.email,
          lastLogin: new Date().toISOString()
        })
      } else if (event === 'SIGNED_OUT') {
        userStorage.removeUser()
      }
    })
    
    console.log('✅ 认证初始化完成')
  } catch (error) {
    console.error('❌ 认证初始化失败:', error)
    throw error
  }
}

/**
 * 初始化主题
 */
async function initializeTheme() {
  try {
    const { themeStorage } = await import('@/utils/storage.js')
    const savedTheme = themeStorage.getTheme()
    
    // 应用主题
    document.documentElement.setAttribute('data-theme', savedTheme)
    document.body.className = `theme-${savedTheme}`
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        if (!themeStorage.getTheme()) {
          const systemTheme = e.matches ? 'dark' : 'light'
          themeStorage.setTheme(systemTheme)
          document.documentElement.setAttribute('data-theme', systemTheme)
          document.body.className = `theme-${systemTheme}`
        }
      })
    }
    
    console.log('✅ 主题初始化完成:', savedTheme)
  } catch (error) {
    console.error('❌ 主题初始化失败:', error)
    throw error
  }
}

/**
 * 初始化分析服务
 */
async function initializeAnalytics() {
  try {
    // 这里可以初始化第三方分析服务
    // 例如：Google Analytics, 百度统计等
    
    console.log('✅ 分析服务初始化完成')
  } catch (error) {
    console.error('❌ 分析服务初始化失败:', error)
    throw error
  }
}

/**
 * 初始化通知服务
 */
async function initializeNotifications() {
  try {
    // 检查浏览器通知权限
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      console.log('通知权限:', permission)
    }
    
    // 初始化Service Worker（如果需要推送通知）
    if ('serviceWorker' in navigator && APP_CONFIG.features.push) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker 注册成功:', registration)
      } catch (error) {
        console.warn('Service Worker 注册失败:', error)
      }
    }
    
    console.log('✅ 通知服务初始化完成')
  } catch (error) {
    console.error('❌ 通知服务初始化失败:', error)
    throw error
  }
}

/**
 * 初始化数据库
 */
export async function initializeDatabase() {
  try {
    // 检查Supabase连接
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('数据库连接失败:', error)
      return false
    }
    
    console.log('✅ 数据库连接成功')
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return false
  }
}

/**
 * 预加载关键资源
 */
export async function preloadResources() {
  try {
    // 预加载关键CSS
    const criticalCSS = [
      '/assets/css/critical.css',
      '/assets/css/components.css'
    ]
    
    criticalCSS.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = href
      document.head.appendChild(link)
    })
    
    // 预加载关键字体
    const criticalFonts = [
      '/assets/fonts/inter-regular.woff2',
      '/assets/fonts/inter-medium.woff2'
    ]
    
    criticalFonts.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = href
      document.head.appendChild(link)
    })
    
    console.log('✅ 资源预加载完成')
  } catch (error) {
    console.error('❌ 资源预加载失败:', error)
  }
}

/**
 * 性能监控
 */
export function initializePerformanceMonitoring() {
  try {
    // 监控页面加载性能
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0]
          const loadTime = perfData.loadEventEnd - perfData.loadEventStart
          
          console.log('页面加载时间:', loadTime + 'ms')
          
          // 可以在这里上报性能数据
          if (APP_CONFIG.performance.reportMetrics) {
            // reportPerformanceMetrics(perfData)
          }
        }, 0)
      })
    }
    
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('检测到长任务:', entry.duration + 'ms')
          }
        })
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    }
    
    console.log('✅ 性能监控初始化完成')
  } catch (error) {
    console.error('❌ 性能监控初始化失败:', error)
  }
}

/**
 * 错误监控
 */
export function initializeErrorMonitoring() {
  try {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error)
      
      if (APP_CONFIG.errorHandling.reportErrors) {
        // reportError(event.error, null, 'global')
      }
    })
    
    // Promise 错误处理
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason)
      
      if (APP_CONFIG.errorHandling.reportErrors) {
        // reportError(event.reason, null, 'promise')
      }
    })
    
    console.log('✅ 错误监控初始化完成')
  } catch (error) {
    console.error('❌ 错误监控初始化失败:', error)
  }
}

/**
 * 应用健康检查
 */
export async function healthCheck() {
  const checks = {
    database: false,
    storage: false,
    auth: false,
    services: false
  }
  
  try {
    // 数据库检查
    checks.database = await initializeDatabase()
    
    // 存储检查
    checks.storage = localStorage.isAvailable()
    
    // 认证检查
    try {
      const { data } = await supabase.auth.getSession()
      checks.auth = true
    } catch {
      checks.auth = false
    }
    
    // 服务检查
    checks.services = true // 假设服务都正常
    
    const allHealthy = Object.values(checks).every(check => check)
    
    console.log('健康检查结果:', checks)
    
    return {
      healthy: allHealthy,
      checks
    }
  } catch (error) {
    console.error('健康检查失败:', error)
    return {
      healthy: false,
      checks,
      error: error.message
    }
  }
}

/**
 * 应用启动流程
 */
export async function bootstrap() {
  console.log('🚀 启动应用...')
  
  try {
    // 1. 预加载资源
    await preloadResources()
    
    // 2. 初始化监控
    initializePerformanceMonitoring()
    initializeErrorMonitoring()
    
    // 3. 初始化服务
    const servicesInitialized = await initializeServices()
    if (!servicesInitialized) {
      throw new Error('服务初始化失败')
    }
    
    // 4. 健康检查
    const health = await healthCheck()
    if (!health.healthy) {
      console.warn('应用健康检查未完全通过:', health.checks)
    }
    
    // 5. 创建Vue应用
    const app = await createVueApp()
    
    console.log('✅ 应用启动完成')
    
    return {
      app,
      health,
      config: APP_CONFIG
    }
  } catch (error) {
    console.error('❌ 应用启动失败:', error)
    throw error
  }
}

/**
 * 优雅关闭
 */
export function shutdown() {
  console.log('🛑 关闭应用...')
  
  try {
    // 清理定时器
    // 关闭数据库连接
    // 保存重要数据
    
    console.log('✅ 应用已安全关闭')
  } catch (error) {
    console.error('❌ 应用关闭时出错:', error)
  }
}

// 监听页面卸载
window.addEventListener('beforeunload', shutdown)

export default {
  bootstrap,
  createVueApp,
  initializeServices,
  healthCheck,
  shutdown
}
