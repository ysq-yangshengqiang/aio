import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const knowledgeChunks = ref([])
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)
  const spaces = ref([])
  const docs = ref([])

  // 计算属性
  const hasKnowledge = computed(() => knowledgeChunks.value.length > 0)
  const searchResultCount = computed(() => searchResults.value.length)

  // 搜索知识库
  const searchKnowledge = async (query, limit = 5) => {
    try {
      loading.value = true
      error.value = null
      
      // 模拟向量搜索，实际应用中会调用真实的RAG系统
      const allData = await fetchKnowledgeChunks()
      if (!allData.success) return { success: false, error: 'Failed to fetch knowledge' }
      
      const queryLower = query.toLowerCase()
      const searchResults = []
      
      // 对每个知识条目进行相关性评分
      knowledgeChunks.value.forEach(chunk => {
        let score = 0
        const titleLower = chunk.title.toLowerCase()
        const contentLower = chunk.content.toLowerCase()
        const tagsLower = chunk.tags.map(tag => tag.toLowerCase())
        
        // 标题匹配得分最高
        if (titleLower.includes(queryLower)) {
          score += 10
        }
        
        // 标签匹配得分较高
        tagsLower.forEach(tag => {
          if (queryLower.includes(tag) || tag.includes(queryLower)) {
            score += 8
          }
        })
        
        // 内容匹配基础得分
        if (contentLower.includes(queryLower)) {
          score += 5
        }
        
        // 关键词匹配
        const keywords = queryLower.split(/\s+/)
        keywords.forEach(keyword => {
          if (keyword.length > 2) { // 忽略过短的词
            if (titleLower.includes(keyword)) score += 3
            if (contentLower.includes(keyword)) score += 1
            tagsLower.forEach(tag => {
              if (tag.includes(keyword)) score += 2
            })
          }
        })
        
        if (score > 0) {
          searchResults.push({
            ...chunk,
            relevanceScore: score
          })
        }
      })
      
      // 按相关性得分排序并限制结果数量
      const sortedResults = searchResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
      
      searchResults.value = sortedResults
      return { success: true, data: sortedResults }
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
          content: 'B+树是一种多路平衡查找树，常用于数据库和文件系统。它的特点是：\n\n1. **结构特点：**\n   • 所有叶子节点都在同一层\n   • 叶子节点包含所有关键字\n   • 非叶子节点只存储索引信息\n   • 支持范围查询和顺序访问\n\n2. **优势：**\n   • 查询效率稳定（O(log n)）\n   • 支持范围查询\n   • 磁盘IO次数少\n   • 适合大量数据存储',
          content_type: 'text',
          source: '数据结构教材',
          tags: ['数据结构', 'B+树', '数据库'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          title: '快速排序算法',
          content: '快速排序是一种高效的排序算法，基于分治思想。\n\n**算法步骤：**\n1. 选择一个基准元素（pivot）\n2. 分区操作：将小于基准的放左边，大于的放右边\n3. 递归地对左右子数组进行快速排序\n\n**复杂度分析：**\n• 平均时间复杂度：O(n log n)\n• 最坏时间复杂度：O(n²)\n• 空间复杂度：O(log n)\n\n**优化技巧：**\n• 三数取中选择基准\n• 小数组使用插入排序\n• 尾递归优化',
          content_type: 'text',
          source: '算法导论',
          tags: ['算法', '排序', '分治'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Vue.js组件通信',
          content: 'Vue.js中组件间通信的多种方式：\n\n**1. Props（父 → 子）**\n```javascript\n// 父组件\n<ChildComponent :data="parentData" />\n\n// 子组件\nprops: ["data"]\n```\n\n**2. Emit（子 → 父）**\n```javascript\n// 子组件\nthis.$emit("update", value)\n\n// 父组件\n<ChildComponent @update="handleUpdate" />\n```\n\n**3. Provide/Inject（跨层级）**\n```javascript\n// 祖先组件\nprovide() { return { theme: "dark" } }\n\n// 后代组件\ninject: ["theme"]\n```\n\n**4. Vuex/Pinia（全局状态）**\n适合大型应用的状态管理',
          content_type: 'text',
          source: 'Vue.js官方文档',
          tags: ['Vue.js', '前端开发', '组件通信'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          title: 'JavaScript异步编程',
          content: 'JavaScript异步编程的发展历程和最佳实践：\n\n**1. 回调函数（Callback）**\n```javascript\nfs.readFile("file.txt", (err, data) => {\n  if (err) throw err;\n  console.log(data);\n});\n```\n\n**2. Promise**\n```javascript\nfetch("/api/data")\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n```\n\n**3. Async/Await**\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch("/api/data");\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error(error);\n  }\n}\n```\n\n**优势：**\n• 避免回调地狱\n• 代码更清晰易读\n• 错误处理更优雅',
          content_type: 'text',
          source: 'MDN文档',
          tags: ['JavaScript', '异步编程', 'Promise'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 5,
          title: 'HTTP协议基础',
          content: 'HTTP（超文本传输协议）是Web通信的基础。\n\n**常用HTTP方法：**\n• GET：获取资源\n• POST：创建资源\n• PUT：更新资源\n• DELETE：删除资源\n• PATCH：部分更新资源\n\n**HTTP状态码：**\n• 2xx：成功（200 OK, 201 Created）\n• 3xx：重定向（301 Moved, 304 Not Modified）\n• 4xx：客户端错误（400 Bad Request, 404 Not Found）\n• 5xx：服务器错误（500 Internal Error, 503 Service Unavailable）\n\n**HTTP头部：**\n• Content-Type：内容类型\n• Authorization：身份验证\n• Cache-Control：缓存控制\n• User-Agent：客户端信息',
          content_type: 'text',
          source: 'RFC文档',
          tags: ['HTTP', '网络协议', 'Web开发'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 6,
          title: 'MySQL数据库优化',
          content: 'MySQL数据库性能优化的关键策略：\n\n**1. 索引优化**\n• 为查询字段创建合适的索引\n• 避免过多索引影响写入性能\n• 使用复合索引优化多字段查询\n\n**2. 查询优化**\n• 避免SELECT *，只查询需要的字段\n• 使用LIMIT限制结果集大小\n• 避免在WHERE子句中使用函数\n• 合理使用JOIN，避免笛卡尔积\n\n**3. 表结构优化**\n• 选择合适的数据类型\n• 规范化vs反规范化权衡\n• 表分区和分表策略\n\n**4. 配置优化**\n• 调整缓冲池大小（innodb_buffer_pool_size）\n• 优化查询缓存\n• 调整连接数和超时时间',
          content_type: 'text',
          source: 'MySQL官方文档',
          tags: ['MySQL', '数据库', '性能优化'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 7,
          title: 'Git版本控制基础',
          content: 'Git是分布式版本控制系统的标准。\n\n**基本命令：**\n```bash\n# 初始化仓库\ngit init\n\n# 添加文件到暂存区\ngit add <file>\ngit add .\n\n# 提交更改\ngit commit -m "提交信息"\n\n# 查看状态\ngit status\n\n# 查看历史\ngit log --oneline\n```\n\n**分支操作：**\n```bash\n# 创建并切换分支\ngit checkout -b feature-branch\n\n# 合并分支\ngit merge feature-branch\n\n# 删除分支\ngit branch -d feature-branch\n```\n\n**远程操作：**\n```bash\n# 添加远程仓库\ngit remote add origin <url>\n\n# 推送代码\ngit push origin main\n\n# 拉取代码\ngit pull origin main\n```',
          content_type: 'text',
          source: 'Git官方文档',
          tags: ['Git', '版本控制', '开发工具'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 8,
          title: 'Python数据结构与算法',
          content: 'Python中常用数据结构和算法实现：\n\n**列表（List）操作：**\n```python\n# 创建和操作\nmy_list = [1, 2, 3]\nmy_list.append(4)  # 添加元素\nmy_list.insert(0, 0)  # 插入元素\nmy_list.remove(2)  # 删除元素\n```\n\n**字典（Dict）操作：**\n```python\n# 创建和操作\nmy_dict = {"key1": "value1"}\nmy_dict["key2"] = "value2"\nmy_dict.get("key1", "default")\n```\n\n**集合（Set）操作：**\n```python\n# 去重和集合运算\nmy_set = {1, 2, 3}\nmy_set.add(4)\nunion_set = set1 | set2  # 并集\nintersect_set = set1 & set2  # 交集\n```\n\n**算法示例 - 二分查找：**\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```',
          content_type: 'text',
          source: 'Python官方文档',
          tags: ['Python', '数据结构', '算法实现'],
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

  // === Supabase 后端：知识空间 CRUD ===
  const fetchSpaces = async () => {
    try {
      loading.value = true
      error.value = null
      const { data, error: dbError } = await supabase
        .from('knowledge_spaces')
        .select('*')
        .order('created_at', { ascending: false })
      if (dbError) throw dbError
      spaces.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createSpace = async ({ name, description }) => {
    try {
      loading.value = true
      error.value = null
      const { data, error: dbError } = await supabase
        .from('knowledge_spaces')
        .insert({ name, description })
        .select()
        .single()
      if (dbError) throw dbError
      spaces.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // === Supabase 后端：文档 CRUD ===
  const fetchDocs = async (spaceId) => {
    try {
      loading.value = true
      error.value = null
      const query = supabase
        .from('knowledge_docs')
        .select('*')
        .order('created_at', { ascending: false })
      const { data, error: dbError } = spaceId
        ? await query.eq('space_id', spaceId)
        : await query
      if (dbError) throw dbError
      docs.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createDoc = async ({ space_id, title, source_url, mime_type, size_bytes }) => {
    try {
      loading.value = true
      error.value = null
      const { data, error: dbError } = await supabase
        .from('knowledge_docs')
        .insert({ space_id, title, source_url, mime_type, size_bytes })
        .select()
        .single()
      if (dbError) throw dbError
      docs.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // === Supabase 后端：Chunk CRUD ===
  const fetchChunksFromDB = async (docId) => {
    try {
      loading.value = true
      error.value = null
      const { data, error: dbError } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('doc_id', docId)
        .order('seq', { ascending: true })
      if (dbError) throw dbError
      knowledgeChunks.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const insertChunk = async ({ doc_id, content, tags = [], seq = 0, token_count = null }) => {
    try {
      loading.value = true
      error.value = null
      const { data, error: dbError } = await supabase
        .from('knowledge_chunks')
        .insert({ doc_id, content, tags, seq, token_count })
        .select()
        .single()
      if (dbError) throw dbError
      knowledgeChunks.value.push(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // === 语义/相似度搜索：优先 RPC，失败回退本地评分 ===
  const semanticSearch = async (q, limit = 5) => {
    try {
      loading.value = true
      error.value = null
      const { data, error: rpcError } = await supabase
        .rpc('search_knowledge_trgm', { q, limit_rows: limit })
      if (rpcError) throw rpcError
      searchResults.value = data || []
      return { success: true, data }
    } catch (err) {
      // 回退到现有本地打分搜索
      const fallback = await searchKnowledge(q, limit)
      return fallback
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
    spaces,
    docs,
    hasKnowledge,
    searchResultCount,
    searchKnowledge,
    fetchKnowledgeChunks,
    fetchSpaces,
    createSpace,
    fetchDocs,
    createDoc,
    fetchChunksFromDB,
    insertChunk,
    searchByTags,
    semanticSearch,
    fetchSkillTags,
    clearSearchResults
  }
})
