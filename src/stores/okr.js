import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useOKRStore = defineStore('okr', () => {
  const okrs = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  // 计算属性
  const currentOKR = computed(() => okrs.value[0] || null)
  const hasOKR = computed(() => okrs.value.length > 0)

  // 创建OKR
  const createOKR = async (objective, keyResults) => {
    try {
      loading.value = true
      error.value = null
      
      // 如果是模拟用户，创建模拟OKR
      if (authStore.user.id === 'mock-user-id') {
        const mockOKR = {
          id: 'mock-okr-id',
          user_id: authStore.user.id,
          objective,
          key_results: keyResults,
          status: 'active',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        okrs.value.unshift(mockOKR)
        return { success: true, data: mockOKR }
      }
      
      const { data, error: dbError } = await supabase
        .from('okrs')
        .insert({
          user_id: authStore.user.id,
          objective,
          key_results: keyResults
        })
        .select()
        .single()
      
      if (dbError) throw dbError
      
      okrs.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取用户OKR
  const fetchOKRs = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 如果是模拟用户，返回空数组（新用户没有OKR）
      if (authStore.user.id === 'mock-user-id') {
        okrs.value = []
        return { success: true, data: [] }
      }
      
      const { data, error: dbError } = await supabase
        .from('okrs')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      
      if (dbError) throw dbError
      
      okrs.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 更新OKR
  const updateOKR = async (id, updates) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: dbError } = await supabase
        .from('okrs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single()
      
      if (dbError) throw dbError
      
      const index = okrs.value.findIndex(okr => okr.id === id)
      if (index !== -1) {
        okrs.value[index] = data
      }
      
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 删除OKR
  const deleteOKR = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: dbError } = await supabase
        .from('okrs')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)
      
      if (dbError) throw dbError
      
      okrs.value = okrs.value.filter(okr => okr.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  return {
    okrs,
    loading,
    error,
    currentOKR,
    hasOKR,
    createOKR,
    fetchOKRs,
    updateOKR,
    deleteOKR
  }
})
