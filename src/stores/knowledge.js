import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const knowledgeChunks = ref([])
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const hasKnowledge = computed(() => knowledgeChunks.value.length > 0)
  const searchResultCount = computed(() => searchResults.value.length)

  // 搜索知识库
  const searchKnowledge = async (query, limit = 5) => {
    try {
      loading.value = true
      error.value = null
      
      // 使用向量搜索函数
      const { data, error: searchError } = await supabase
        .rpc('search_knowledge', {
          query_text: query,
          limit_count: limit
        })
      
      if (searchError) throw searchError
      
      searchResults.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取所有知识库内容
  const fetchKnowledgeChunks = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 返回模拟知识库数据
      const mockData = [
        {
          id: 1,
          title: 'B+树基础概念',
          content: 'B+树是一种多路平衡查找树，常用于数据库和文件系统。它的特点是：1. 所有叶子节点都在同一层 2. 叶子节点包含所有关键字 3. 非叶子节点只存储索引信息 4. 支持范围查询和顺序访问',
          content_type: 'text',
          source: '数据结构教材',
          tags: ['数据结构', 'B+树', '数据库'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          title: '快速排序算法',
          content: '快速排序是一种高效的排序算法，平均时间复杂度为O(nlogn)。它使用分治策略，选择一个基准元素，将数组分为两部分，递归地对子数组进行排序。',
          content_type: 'text',
          source: '算法导论',
          tags: ['算法', '排序', '分治'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Vue.js组件通信',
          content: 'Vue.js中组件间通信有多种方式：1. Props向下传递 2. Emit向上传递 3. Provide/Inject跨层级传递 4. Vuex状态管理 5. 事件总线',
          content_type: 'text',
          source: 'Vue.js官方文档',
          tags: ['Vue.js', '前端开发', '组件通信'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      knowledgeChunks.value = mockData
      return { success: true, data: mockData }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 根据标签搜索知识库
  const searchByTags = async (tags) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: searchError } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .contains('tags', tags)
        .order('created_at', { ascending: false })
      
      if (searchError) throw searchError
      
      searchResults.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取技能标签
  const fetchSkillTags = async () => {
    try {
      // 返回模拟技能标签数据
      const mockData = [
        {
          id: 'skill-1',
          name: '数据结构',
          category: '计算机科学',
          description: '包括数组、链表、栈、队列、树、图等数据结构',
          created_at: new Date().toISOString()
        },
        {
          id: 'skill-2',
          name: '算法设计',
          category: '计算机科学',
          description: '包括排序、搜索、动态规划、贪心算法等',
          created_at: new Date().toISOString()
        },
        {
          id: 'skill-3',
          name: 'Web开发',
          category: '软件开发',
          description: '包括HTML、CSS、JavaScript、前端框架等',
          created_at: new Date().toISOString()
        },
        {
          id: 'skill-4',
          name: '数据库设计',
          category: '软件开发',
          description: '包括关系型数据库、SQL、数据库优化等',
          created_at: new Date().toISOString()
        },
        {
          id: 'skill-5',
          name: '机器学习',
          category: '人工智能',
          description: '包括监督学习、无监督学习、深度学习等',
          created_at: new Date().toISOString()
        },
        {
          id: 'skill-6',
          name: '项目管理',
          category: '软技能',
          description: '包括敏捷开发、Scrum、项目规划等',
          created_at: new Date().toISOString()
        }
      ]
      
      return { success: true, data: mockData }
    } catch (err) {
      console.error('Fetch skill tags error:', err)
      return { success: false, error: err.message }
    }
  }

  // 清空搜索结果
  const clearSearchResults = () => {
    searchResults.value = []
  }

  return {
    knowledgeChunks,
    searchResults,
    loading,
    error,
    hasKnowledge,
    searchResultCount,
    searchKnowledge,
    fetchKnowledgeChunks,
    searchByTags,
    fetchSkillTags,
    clearSearchResults
  }
})
