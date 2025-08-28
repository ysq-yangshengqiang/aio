// 服务层统一导出
export { BaseService } from './base.service.js'
export { authService } from './auth.service.js'
export { okrService } from './okr.service.js'
export { userService } from './user.service.js'
export { chatService } from './chat.service.js'
export { aiService } from './ai.service.js'
export { aiConfigService } from './ai-config.service.js'
export { notificationService } from './notification.service.js'
export { analyticsService } from './analytics.service.js'

// 默认导出所有服务
export default {
  BaseService,
  authService,
  okrService,
  userService,
  chatService,
  aiService,
  aiConfigService,
  notificationService,
  analyticsService
}
