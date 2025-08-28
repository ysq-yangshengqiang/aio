import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/css/main.css'

// 导入服务
import { connectionService } from '@/services/connection.service.js'
import { useAuthStore } from '@/stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化应用
async function initializeApp() {
  try {
    console.log('初始化应用...')
    
    // 初始化认证状态
    const authStore = useAuthStore()
    await authStore.init()
    console.log('认证状态初始化完成')
    
    // 检查所有连接
    const connectionStatus = await connectionService.checkAllConnections()
    
    if (connectionStatus.overall === 'error') {
      console.error('应用连接检查失败，但继续启动应用')
    } else {
      console.log('应用连接检查完成:', connectionStatus.overall)
    }
    
  } catch (error) {
    console.error('应用初始化错误:', error)
    // 不阻止应用启动
  }
}

// 启动应用
app.mount('#app')

// 初始化应用（异步执行，不阻塞应用启动）
initializeApp()