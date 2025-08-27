import { ref } from 'vue'

// 全局通知状态
const notifications = ref([])
let notificationId = 0

export function useNotification() {
  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = ++notificationId
    const notification = {
      id,
      message,
      type,
      visible: true
    }
    
    notifications.value.push(notification)
    
    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAllNotifications = () => {
    notifications.value = []
  }
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  }
}