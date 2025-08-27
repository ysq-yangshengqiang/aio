import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/css/main.css'

// 导入连接服务
import { connectionService } from '@/services/connection.service.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化应用连接检查
async function initializeApp() {
  try {
    console.log('初始化应用连接状态...')
    
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

// 初始化连接检查（异步执行，不阻塞应用启动）
initializeApp()