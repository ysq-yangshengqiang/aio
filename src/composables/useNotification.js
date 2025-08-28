import { ref, reactive } from 'vue'

// 全局通知状态
const notifications = ref([])
let notificationId = 0

// 通知类型配置
const notificationConfig = {
  success: {
    icon: '✓',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-400',
    duration: 4000
  },
  error: {
    icon: '✕',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-400',
    duration: 6000
  },
  warning: {
    icon: '⚠',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-400',
    duration: 5000
  },
  info: {
    icon: 'ℹ',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-400',
    duration: 4000
  }
}

export function useNotification() {
  // 显示通知
  const showNotification = (message, type = 'info', options = {}) => {
    const id = ++notificationId
    const config = notificationConfig[type] || notificationConfig.info
    
    const notification = {
      id,
      message,
      type,
      ...config,
      ...options,
      timestamp: Date.now(),
      visible: true
    }
    
    notifications.value.push(notification)
    
    // 自动移除通知
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
    
    return id
  }
  
  // 移除通知
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value[index].visible = false
      // 延迟移除以支持退出动画
      setTimeout(() => {
        const currentIndex = notifications.value.findIndex(n => n.id === id)
        if (currentIndex > -1) {
          notifications.value.splice(currentIndex, 1)
        }
      }, 300)
    }
  }
  
  // 清空所有通知
  const clearNotifications = () => {
    notifications.value.forEach(n => n.visible = false)
    setTimeout(() => {
      notifications.value.splice(0)
    }, 300)
  }
  
  // 快捷方法
  const showSuccess = (message, options) => showNotification(message, 'success', options)
  const showError = (message, options) => showNotification(message, 'error', options)
  const showWarning = (message, options) => showNotification(message, 'warning', options)
  const showInfo = (message, options) => showNotification(message, 'info', options)
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

// 全局通知实例
export const globalNotification = useNotification()