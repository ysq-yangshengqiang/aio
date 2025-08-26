/**
 * 存储工具函数
 */
import { APP_CONFIG } from '@/config/app.config.js'

const { prefix, keys, expiration } = APP_CONFIG.storage

/**
 * 本地存储管理器
 */
class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage
    this.prefix = prefix
  }

  /**
   * 生成带前缀的键名
   */
  getKey(key) {
    return `${this.prefix}${key}`
  }

  /**
   * 设置存储项
   */
  setItem(key, value, expires = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expires: expires ? Date.now() + expires : null
      }
      
      this.storage.setItem(this.getKey(key), JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Storage setItem error:', error)
      return false
    }
  }

  /**
   * 获取存储项
   */
  getItem(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.getKey(key))
      if (!item) return defaultValue

      const data = JSON.parse(item)
      
      // 检查是否过期
      if (data.expires && Date.now() > data.expires) {
        this.removeItem(key)
        return defaultValue
      }

      return data.value
    } catch (error) {
      console.error('Storage getItem error:', error)
      return defaultValue
    }
  }

  /**
   * 移除存储项
   */
  removeItem(key) {
    try {
      this.storage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.error('Storage removeItem error:', error)
      return false
    }
  }

  /**
   * 清空所有存储项
   */
  clear() {
    try {
      const keysToRemove = []
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        this.storage.removeItem(key)
      })
      
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }

  /**
   * 获取所有键名
   */
  getAllKeys() {
    const keys = []
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''))
        }
      }
    } catch (error) {
      console.error('Storage getAllKeys error:', error)
    }
    
    return keys
  }

  /**
   * 获取存储大小
   */
  getSize() {
    let size = 0
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const value = this.storage.getItem(key)
          size += key.length + (value ? value.length : 0)
        }
      }
    } catch (error) {
      console.error('Storage getSize error:', error)
    }
    
    return size
  }

  /**
   * 检查存储是否可用
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__'
      this.storage.setItem(testKey, 'test')
      this.storage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * 清理过期项
   */
  cleanup() {
    const keys = this.getAllKeys()
    let cleanedCount = 0
    
    keys.forEach(key => {
      const item = this.getItem(key)
      if (item === null) {
        cleanedCount++
      }
    })
    
    return cleanedCount
  }
}

// 创建存储实例
export const localStorage = new StorageManager(window.localStorage)
export const sessionStorage = new StorageManager(window.sessionStorage)

/**
 * 用户数据存储
 */
export const userStorage = {
  setUser(user) {
    return localStorage.setItem(keys.user, user, expiration.session)
  },

  getUser() {
    return localStorage.getItem(keys.user)
  },

  removeUser() {
    return localStorage.removeItem(keys.user)
  },

  setPreferences(preferences) {
    return localStorage.setItem(keys.preferences, preferences)
  },

  getPreferences() {
    return localStorage.getItem(keys.preferences, {})
  },

  updatePreferences(updates) {
    const current = this.getPreferences()
    const updated = { ...current, ...updates }
    return this.setPreferences(updated)
  }
}

/**
 * 主题存储
 */
export const themeStorage = {
  setTheme(theme) {
    return localStorage.setItem(keys.theme, theme)
  },

  getTheme() {
    return localStorage.getItem(keys.theme, 'light')
  },

  toggleTheme() {
    const current = this.getTheme()
    const newTheme = current === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
    return newTheme
  }
}

/**
 * 语言存储
 */
export const languageStorage = {
  setLanguage(language) {
    return localStorage.setItem(keys.language, language)
  },

  getLanguage() {
    return localStorage.getItem(keys.language, 'zh-CN')
  }
}

/**
 * 缓存存储
 */
export const cacheStorage = {
  setCache(key, data, expires = expiration.cache) {
    const cacheKey = `${keys.cache}_${key}`
    return localStorage.setItem(cacheKey, data, expires)
  },

  getCache(key) {
    const cacheKey = `${keys.cache}_${key}`
    return localStorage.getItem(cacheKey)
  },

  removeCache(key) {
    const cacheKey = `${keys.cache}_${key}`
    return localStorage.removeItem(cacheKey)
  },

  clearCache() {
    const keys = localStorage.getAllKeys()
    const cacheKeys = keys.filter(key => key.startsWith(keys.cache))
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    return cacheKeys.length
  }
}

/**
 * Cookie 工具函数
 */
export const cookieUtils = {
  /**
   * 设置 Cookie
   */
  setCookie(name, value, days = 7, path = '/') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path}`
  },

  /**
   * 获取 Cookie
   */
  getCookie(name) {
    const nameEQ = name + '='
    const cookies = document.cookie.split(';')
    
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }
    
    return null
  },

  /**
   * 删除 Cookie
   */
  removeCookie(name, path = '/') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`
  },

  /**
   * 获取所有 Cookie
   */
  getAllCookies() {
    const cookies = {}
    
    if (document.cookie) {
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookies[name] = decodeURIComponent(value)
        }
      })
    }
    
    return cookies
  }
}

/**
 * IndexedDB 工具类
 */
export class IndexedDBManager {
  constructor(dbName, version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  /**
   * 打开数据库
   */
  async open(stores = []) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, store.options || { keyPath: 'id' })
            
            if (store.indexes) {
              store.indexes.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, index.options || {})
              })
            }
          }
        })
      }
    })
  }

  /**
   * 添加数据
   */
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取数据
   */
  async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新数据
   */
  async put(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除数据
   */
  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取所有数据
   */
  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清空存储
   */
  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

/**
 * 存储配额检查
 */
export const storageQuota = {
  /**
   * 检查存储配额
   */
  async checkQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          usagePercentage: (estimate.usage / estimate.quota) * 100
        }
      } catch (error) {
        console.error('Check storage quota error:', error)
        return null
      }
    }
    return null
  },

  /**
   * 请求持久化存储
   */
  async requestPersistent() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        return await navigator.storage.persist()
      } catch (error) {
        console.error('Request persistent storage error:', error)
        return false
      }
    }
    return false
  }
}