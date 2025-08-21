import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 开发环境下的环境变量检查
if (import.meta.env.DEV) {
  console.log('🔧 环境变量检查:')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置')
}

let supabase

// 如果没有设置环境变量，使用模拟客户端
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase环境变量未设置，使用模拟客户端')
  
  // 创建模拟的supabase客户端
  supabase = {
    auth: {
      signInWithPassword: async (credentials) => {
        // 模拟登录成功
        if (credentials.email && credentials.password) {
          const mockUser = {
            id: 'mock-user-id',
            email: credentials.email,
            created_at: new Date().toISOString()
          }
          
          // 存储模拟会话到localStorage
          const mockSession = {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
          
          // 保存到localStorage以便getSession能获取到
          if (typeof window !== 'undefined') {
            localStorage.setItem('mock-session', JSON.stringify(mockSession))
          }
          
          return {
            data: {
              user: mockUser,
              session: mockSession
            },
            error: null
          }
        } else {
          return {
            data: null,
            error: { message: '邮箱和密码不能为空' }
          }
        }
      },
      signUp: async (credentials) => {
        // 模拟注册成功
        if (credentials.email && credentials.password) {
          return {
            data: {
              user: {
                id: 'mock-user-id',
                email: credentials.email,
                created_at: new Date().toISOString()
              },
              session: {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token'
              }
            },
            error: null
          }
        } else {
          return {
            data: null,
            error: { message: '注册信息不完整' }
          }
        }
      },
      signOut: async () => {
        // 清除localStorage中的模拟会话
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mock-session')
        }
        return { error: null }
      },
      getSession: async () => {
        // 从localStorage获取模拟会话
        if (typeof window !== 'undefined') {
          const storedSession = localStorage.getItem('mock-session')
          if (storedSession) {
            try {
              const session = JSON.parse(storedSession)
              return { data: { session } }
            } catch (e) {
              console.error('Failed to parse mock session:', e)
            }
          }
        }
        
        // 如果没有存储的会话，返回null
        return { data: { session: null } }
      },
      onAuthStateChange: (callback) => {
        // 模拟认证状态变化监听
        // 模拟一个简单的订阅对象
        const subscription = {
          unsubscribe: () => {}
        }
        return { data: { subscription } }
      }
    },
    from: (table) => ({
      insert: async (data) => {
        // 模拟插入数据
        if (table === 'user_profiles') {
          return { data: { id: 'mock-profile-id', ...data }, error: null }
        }
        if (table === 'okrs') {
          return { data: { id: 'mock-okr-id', ...data }, error: null }
        }
        if (table === 'chat_history') {
          return { data: { id: 'mock-chat-id', ...data }, error: null }
        }
        return { data: null, error: null }
      },
      select: () => ({
        eq: (field, value) => ({
          order: (field, options) => ({ data: [], error: null }),
          single: () => ({ data: null, error: null })
        }),
        order: (field, options) => ({ data: [], error: null })
      }),
      update: () => ({
        eq: (field, value) => ({
          select: () => ({ data: null, error: null })
        })
      }),
      delete: () => ({
        eq: (field, value) => ({ error: null })
      })
    }),
    rpc: (functionName, params) => {
      // 模拟RPC调用
      if (functionName === 'search_knowledge') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'B+树基础概念',
              content: 'B+树是一种多路平衡查找树，常用于数据库和文件系统。它的特点是：1. 所有叶子节点都在同一层 2. 叶子节点包含所有关键字 3. 非叶子节点只存储索引信息 4. 支持范围查询和顺序访问',
              similarity: 0.1
            }
          ],
          error: null
        })
      }
      return Promise.resolve({ data: null, error: null })
    }
  }
} else {
  // 创建真实的supabase客户端
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  })
}

export { supabase }
