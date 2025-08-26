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

  // 更新关键结果进度
  const updateKeyResultProgress = async (okrId, keyResultIndex, progress) => {
    try {
      loading.value = true
      error.value = null
      
      const okr = okrs.value.find(o => o.id === okrId)
      if (!okr) throw new Error('OKR not found')
      
      // 更新关键结果的进度
      const updatedKeyResults = [...okr.key_results]
      if (updatedKeyResults[keyResultIndex]) {
        updatedKeyResults[keyResultIndex] = {
          ...updatedKeyResults[keyResultIndex],
          progress: Math.max(0, Math.min(100, progress)), // 确保进度在0-100之间
          updated_at: new Date().toISOString()
        }
        
        // 计算整体OKR进度（所有关键结果的平均进度）
        const totalProgress = updatedKeyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0)
        const overallProgress = Math.round(totalProgress / updatedKeyResults.length)
        
        const updates = {
          key_results: updatedKeyResults,
          progress: overallProgress,
          updated_at: new Date().toISOString()
        }
        
        // 如果是模拟用户，直接更新本地数据
        if (authStore.user.id === 'mock-user-id') {
          const index = okrs.value.findIndex(o => o.id === okrId)
          if (index !== -1) {
            okrs.value[index] = { ...okr, ...updates }
          }
          return { success: true, data: okrs.value[index] }
        }
        
        // 更新数据库
        const result = await updateOKR(okrId, updates)
        return result
      }
      
      throw new Error('Key result not found')
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取OKR进度统计
  const getOKRStats = computed(() => {
    if (okrs.value.length === 0) return null
    
    const currentOkr = okrs.value[0]
    const keyResults = currentOkr.key_results || []
    
    const completedKRs = keyResults.filter(kr => (kr.progress || 0) >= 100).length
    const inProgressKRs = keyResults.filter(kr => {
      const progress = kr.progress || 0
      return progress > 0 && progress < 100
    }).length
    const notStartedKRs = keyResults.filter(kr => (kr.progress || 0) === 0).length
    
    return {
      totalKRs: keyResults.length,
      completedKRs,
      inProgressKRs,
      notStartedKRs,
      overallProgress: currentOkr.progress || 0,
      completionRate: keyResults.length > 0 ? Math.round((completedKRs / keyResults.length) * 100) : 0
    }
  })

  // 生成进度报告
  const generateProgressReport = () => {
    const stats = getOKRStats.value
    if (!stats) return null
    
    const currentOkr = okrs.value[0]
    
    return {
      objective: currentOkr.objective,
      overallProgress: stats.overallProgress,
      completionRate: stats.completionRate,
      keyResults: currentOkr.key_results.map((kr, index) => ({
        index,
        text: kr.text,
        progress: kr.progress || 0,
        status: (kr.progress || 0) >= 100 ? 'completed' : 
               (kr.progress || 0) > 0 ? 'in_progress' : 'not_started'
      })),
      recommendations: generateProgressRecommendations(stats),
      lastUpdated: currentOkr.updated_at
    }
  }

  // 生成进度建议
  const generateProgressRecommendations = (stats) => {
    const recommendations = []
    
    if (stats.notStartedKRs > 0) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        message: `您有${stats.notStartedKRs}个关键结果尚未开始，建议制定具体的行动计划`
      })
    }
    
    if (stats.inProgressKRs > 0) {
      recommendations.push({
        type: 'progress',
        priority: 'medium',
        message: `有${stats.inProgressKRs}个关键结果正在进行中，保持当前节奏继续推进`
      })
    }
    
    if (stats.completedKRs > 0) {
      recommendations.push({
        type: 'celebration',
        priority: 'low',
        message: `恭喜！您已完成${stats.completedKRs}个关键结果，值得庆祝！`
      })
    }
    
    if (stats.overallProgress < 30) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        message: '进度相对较慢，建议重新评估时间安排和优先级，寻求必要的帮助'
      })
    } else if (stats.overallProgress > 80) {
      recommendations.push({
        type: 'achievement',
        priority: 'low',
        message: '进度很好！您正在朝着目标快速前进，继续保持'
      })
    }
    
    return recommendations
  }

  // 删除OKR
  const deleteOKR = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      // 如果是模拟用户，直接删除本地数据
      if (authStore.user.id === 'mock-user-id') {
        okrs.value = okrs.value.filter(okr => okr.id !== id)
        return { success: true }
      }
      
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
    getOKRStats,
    createOKR,
    fetchOKRs,
    updateOKR,
    updateKeyResultProgress,
    generateProgressReport,
    deleteOKR
  }
})
