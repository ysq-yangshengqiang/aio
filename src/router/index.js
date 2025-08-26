import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase.js'

// 路由组件
const LoginView = () => import('../views/auth/LoginView.vue')
const RegisterView = () => import('../views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('../views/auth/ForgotPasswordView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const OKRView = () => import('../views/okr/OKRView.vue')
const OKRCreateView = () => import('../views/okr/OKRCreateView.vue')
const OKRDetailView = () => import('../views/okr/OKRDetailView.vue')
const ChatView = () => import('../views/chat/ChatView.vue')
const AnalyticsView = () => import('../views/analytics/AnalyticsView.vue')
const NotificationsView = () => import('../views/notifications/NotificationsView.vue')
const ProfileView = () => import('../views/profile/ProfileView.vue')
const SettingsView = () => import('../views/settings/SettingsView.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/okr',
    name: 'okr',
    component: OKRView,
    meta: { requiresAuth: true }
  },
  {
    path: '/okr/create',
    name: 'okr-create',
    component: OKRCreateView,
    meta: { requiresAuth: true }
  },
  {
    path: '/okr/:id',
    name: 'okr-detail',
    component: OKRDetailView,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatView,
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    // 检查认证状态
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session?.user

    // 需要认证的路由
    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/login')
      return
    }

    // 需要游客状态的路由（登录、注册等）
    if (to.meta.requiresGuest && isAuthenticated) {
      next('/dashboard')
      return
    }

    next()
  } catch (error) {
    console.error('Router guard error:', error)
    next('/login')
  }
})

export default router