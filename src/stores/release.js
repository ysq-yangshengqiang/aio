import { defineStore } from 'pinia'

export const useReleaseStore = defineStore('release', {
  state: () => ({
    showPanel: false,
    activeTab: 'todos',
    versions: [
      {
        id: 'v0.1.0',
        title: 'v0.1.0 初始版本',
        date: '2025-01-15',
        updates: [
          '首页基础布局与动画',
          '登录/注册页面搭建',
          'Pinia 与路由初始化',
        ],
      },
    ],
    featureTodos: [
      { id: 'todo-okr', title: 'OKR管理基础视图', done: true },
      { id: 'todo-ai', title: 'AI学习助手入口', done: true },
      { id: 'todo-analytics', title: '学习数据分析卡片', done: true },
      { id: 'todo-auth', title: '认证流程打通', done: false },
    ],
  }),
  getters: {
    completedTodos(state) {
      return state.featureTodos.filter(t => t.done)
    },
    pendingTodos(state) {
      return state.featureTodos.filter(t => !t.done)
    },
  },
  actions: {
    togglePanel() {
      this.showPanel = !this.showPanel
    },
    switchTab(tab) {
      this.activeTab = tab
    },
    addVersionUpdate(versionId, update) {
      const v = this.versions.find(v => v.id === versionId)
      if (!v) return
      v.updates.push(update)
    },
    addNewVersion(payload) {
      this.versions.unshift({
        id: payload.id,
        title: payload.title || payload.id,
        date: payload.date || new Date().toISOString().slice(0, 10),
        updates: payload.updates || [],
      })
    },
    markTodo(id, done) {
      const t = this.featureTodos.find(t => t.id === id)
      if (t) t.done = done
    },
  },
}) 