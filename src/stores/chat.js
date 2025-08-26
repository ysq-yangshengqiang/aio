import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useKnowledgeStore } from './knowledge'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const sessionId = ref(null)
  const authStore = useAuthStore()

  // 计算属性
  const chatHistory = computed(() => messages.value)

  // 初始化聊天会话
  const initSession = () => {
    if (!sessionId.value) {
      sessionId.value = crypto.randomUUID()
    }
  }

  // 添加消息
  const addMessage = (role, content) => {
    const message = {
      id: Date.now(),
      role, // 'user' 或 'assistant'
      content,
      timestamp: new Date().toISOString()
    }
    
    messages.value.push(message)
    return message
  }

  // 发送消息到AI
  const sendMessage = async (content) => {
    try {
      loading.value = true
      error.value = null
      
      // 添加用户消息
      const userMessage = addMessage('user', content)
      
      // 保存到数据库
      await saveMessage(userMessage)
      
      // 调用AI API
      const aiResponse = await callAI(content)
      
      // 添加AI回复
      const assistantMessage = addMessage('assistant', aiResponse)
      
      // 保存AI回复
      await saveMessage(assistantMessage)
      
      return { success: true, response: aiResponse }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 保存消息到数据库
  const saveMessage = async (message) => {
    try {
      // 如果是模拟用户，不保存到数据库
      if (authStore.user.id === 'mock-user-id') {
        return
      }
      
      await supabase
        .from('chat_history')
        .insert({
          user_id: authStore.user.id,
          session_id: sessionId.value,
          message: {
            role: message.role,
            content: message.content
          }
        })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  // 调用AI API
  const callAI = async (content) => {
    try {
      // 获取用户的OKR信息
      const { useOKRStore } = await import('./okr')
      const okrStore = useOKRStore()
      const knowledgeStore = useKnowledgeStore()
      
      const userInput = content.toLowerCase()
      
      // 智能意图识别和响应
      
      // 1. 任务规划和每日建议
      if (userInput.includes('今天') && (userInput.includes('做什么') || userInput.includes('计划') || userInput.includes('任务'))) {
        return await generateDailyTasks(okrStore.currentOKR)
      }
      
      // 2. OKR进度查询
      if (userInput.includes('进度') || userInput.includes('完成') || userInput.includes('状态')) {
        return await generateProgressReport(okrStore.currentOKR)
      }
      
      // 3. 学习计划制定
      if (userInput.includes('学习计划') || userInput.includes('制定计划') || userInput.includes('规划')) {
        return await generateLearningPlan(okrStore.currentOKR)
      }
      
      // 4. 知识库搜索 - 扩大关键词范围
      const knowledgeKeywords = ['b+树', 'b树', '算法', '数据结构', 'vue', '前端', '后端', 'javascript', 'python', 'java', '排序', '查找', '数组', '链表', '栈', '队列', '树', '图', '哈希', '递归', '动态规划']
      const hasKnowledgeKeyword = knowledgeKeywords.some(keyword => userInput.includes(keyword))
      
      if (hasKnowledgeKeyword) {
        const searchResult = await knowledgeStore.searchKnowledge(content, 3)
        if (searchResult.success && searchResult.data.length > 0) {
          const bestMatch = searchResult.data[0]
          return `💡 **知识库检索结果**\n\n**主题：${bestMatch.title}**\n\n${bestMatch.content}\n\n📚 **学习建议：**\n${generateLearningTips(bestMatch.title)}\n\n有其他相关问题可以继续问我！`
        }
      }
      
      // 5. 学习困难和障碍诊断
      if (userInput.includes('不懂') || userInput.includes('困难') || userInput.includes('问题') || userInput.includes('卡住')) {
        return generateProblemSolution(content)
      }
      
      // 6. 学习方法建议
      if (userInput.includes('如何学') || userInput.includes('怎么学') || userInput.includes('方法')) {
        return generateLearningMethod(content)
      }
      
      // 7. 激励和鼓励
      if (userInput.includes('累') || userInput.includes('疲倦') || userInput.includes('放弃') || userInput.includes('坚持')) {
        return generateMotivationalResponse()
      }
      
      // 8. 资源推荐
      if (userInput.includes('资源') || userInput.includes('教程') || userInput.includes('视频') || userInput.includes('书籍')) {
        return generateResourceRecommendation(content)
      }
      
      // 9. 默认智能回复
      return generateSmartDefaultResponse(okrStore.currentOKR)
      
    } catch (error) {
      console.error('AI response error:', error)
      return '🤖 抱歉，我在处理您的问题时遇到了技术问题。请稍后再试，或者换个方式提问。我会持续改进为您提供更好的服务！'
    }
  }

  // 生成每日任务建议
  const generateDailyTasks = async (currentOKR) => {
    if (!currentOKR) {
      return '🎯 **今日学习建议**\n\n看起来您还没有设置OKR目标。建议您先在左侧创建一个学习目标，这样我就能为您制定更个性化的学习计划！\n\n📋 **通用每日任务：**\n1. 复习昨天学过的知识点（30分钟）\n2. 学习一个新概念或技能（60分钟）\n3. 完成相关练习或项目（90分钟）\n4. 总结今日所学，记录疑问\n\n创建OKR后，我可以根据您的具体目标提供更精准的指导！'
    }

    const tasks = []
    const keyResults = currentOKR.key_results || []
    
    keyResults.forEach((kr, index) => {
      const taskNumber = index + 1
      if (kr.text.includes('算法') || kr.text.includes('编程')) {
        tasks.push(`${taskNumber}. 💻 针对"${kr.text}"：完成2-3道相关算法题练习`)
      } else if (kr.text.includes('项目') || kr.text.includes('开发')) {
        tasks.push(`${taskNumber}. 🚀 针对"${kr.text}"：推进项目核心功能开发，预计2小时`)
      } else if (kr.text.includes('学习') || kr.text.includes('掌握')) {
        tasks.push(`${taskNumber}. 📚 针对"${kr.text}"：深入学习相关理论知识，做好笔记`)
      } else {
        tasks.push(`${taskNumber}. ✅ 针对"${kr.text}"：制定具体行动计划并开始执行`)
      }
    })

    return `🎯 **基于您的OKR目标的今日任务规划**\n\n**目标：** ${currentOKR.objective}\n\n📋 **今日重点任务：**\n${tasks.join('\n')}\n\n⏰ **时间分配建议：**\n• 上午：高强度学习任务（2小时）\n• 下午：实践和练习（2-3小时）\n• 晚上：复习总结（30分钟）\n\n💪 加油！每一步都让您更接近目标！有具体问题随时问我。`
  }

  // 生成进度报告
  const generateProgressReport = async (currentOKR) => {
    if (!currentOKR) {
      return '📊 **学习进度报告**\n\n您还没有设置OKR目标，因此无法生成进度报告。建议先创建学习目标，这样我就能帮您跟踪学习进度了！\n\n🎯 创建OKR的好处：\n• 明确学习方向\n• 量化学习成果\n• 持续动力激励\n• 科学进度管理'
    }

    const progressTips = [
      '定期回顾和调整目标',
      '记录学习过程中的收获',
      '寻找学习伙伴互相督促',
      '庆祝每个小的里程碑'
    ]

    return `📊 **您的OKR进度概览**\n\n**目标：** ${currentOKR.objective}\n\n📈 **关键结果进展：**\n${currentOKR.key_results?.map((kr, index) => `${index + 1}. ${kr.text} - 需要您自评进度`).join('\n') || '暂无关键结果'}\n\n💡 **进度提升建议：**\n• ${progressTips.join('\n• ')}\n\n想了解特定任务的详细进度吗？请告诉我您想重点关注哪个方面！`
  }

  // 生成学习计划
  const generateLearningPlan = async (currentOKR) => {
    const planTemplate = `📅 **个性化学习计划制定**\n\n`
    
    if (!currentOKR) {
      return planTemplate + `看起来您还没有明确的学习目标。让我帮您制定一个完整的学习计划：\n\n🎯 **第一步：目标设定**\n请先在左侧创建您的OKR，明确：\n• 想要达成的具体目标\n• 可衡量的关键结果\n• 预期完成时间\n\n📚 **通用学习框架：**\n• 周一三五：理论学习\n• 周二四：实践练习\n• 周末：项目实战和总结\n\n创建OKR后，我会为您制定更详细的个性化计划！`
    }

    return planTemplate + `基于您的目标"${currentOKR.objective}"，为您定制学习路径：\n\n📚 **学习阶段规划：**\n\n**第一阶段（基础建设）：**\n• 梳理相关基础知识\n• 建立知识体系框架\n• 完成基础练习\n\n**第二阶段（能力提升）：**\n• 深入学习核心概念\n• 完成中等难度项目\n• 解决实际问题\n\n**第三阶段（融会贯通）：**\n• 综合运用所学知识\n• 完成挑战性项目\n• 分享和教授他人\n\n🎯 **关键结果对应行动：**\n${currentOKR.key_results?.map((kr, index) => `${index + 1}. ${kr.text}\n   → 建议每周投入8-10小时`).join('\n') || ''}\n\n需要我为某个具体领域制定更详细的计划吗？`
  }

  // 生成学习小贴士
  const generateLearningTips = (topic) => {
    const tips = {
      'B+树': '建议先掌握二叉搜索树，再学习B树，最后理解B+树的优化',
      '算法': '多做题，多画图，理解算法思路比记忆代码更重要',
      'Vue': '从基础语法开始，多写小项目，理解响应式原理',
      '前端': '注重实践，多看优秀代码，关注用户体验'
    }
    
    return tips[topic] || '理论与实践相结合，多思考多总结'
  }

  // 生成问题解决方案
  const generateProblemSolution = (content) => {
    return `🤔 **学习困难诊断与解决**\n\n我理解您遇到了学习困难。让我来帮您分析解决：\n\n🔍 **问题分析：**\n• 是概念理解上的困难吗？\n• 还是实践操作中的问题？\n• 或是缺少相关的基础知识？\n\n💡 **解决策略：**\n1. **分解问题**：将复杂问题拆解成小块\n2. **寻找资源**：查阅资料、观看教程、请教他人\n3. **实践验证**：通过练习加深理解\n4. **举一反三**：找到类似问题，强化理解\n\n📚 **推荐资源：**\n• B站相关教学视频\n• 官方文档和教程\n• 技术博客和论坛\n• 同学和老师的帮助\n\n请详细描述您遇到的具体问题，我会提供更针对性的帮助！`
  }

  // 生成学习方法建议
  const generateLearningMethod = (content) => {
    return `📖 **高效学习方法指导**\n\n根据您的问题，我来分享一些有效的学习策略：\n\n🧠 **学习方法论：**\n1. **费曼学习法**：尝试向别人解释，检验理解深度\n2. **间隔重复**：定期复习，强化长期记忆\n3. **主动学习**：多提问题，多动手实践\n4. **思维导图**：整理知识结构，建立关联\n\n⚡ **具体技巧：**\n• 学习前明确目标和问题\n• 学习中做笔记和总结\n• 学习后实践和复习\n• 遇到困难时及时求助\n\n🎯 **针对性建议：**\n• 编程类：多写代码，多调试\n• 理论类：多思考，多讨论\n• 实践类：多动手，多尝试\n\n需要我针对特定学科给出更详细的学习方法吗？`
  }

  // 生成激励回复
  const generateMotivationalResponse = () => {
    const motivationalQuotes = [
      '每一次努力都不会白费，它们都在为未来的成功积累能量',
      '困难是成长的阶梯，坚持是成功的钥匙',
      '今天的努力是明天收获的种子',
      '相信自己，您比想象中更有潜力'
    ]
    
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    
    return `💪 **学习加油站**\n\n我理解学习过程中会有疲倦和困难，这很正常！每个优秀的人都经历过这样的时刻。\n\n🌟 **今日励志：**\n*"${randomQuote}"*\n\n🎯 **重新出发的建议：**\n• 休息一下，给大脑充电\n• 回顾已经取得的进步\n• 设定小目标，逐步推进\n• 找到学习的乐趣和意义\n\n💙 **记住：**\n我永远在这里支持您！有任何学习问题都可以来找我。您的坚持和努力，我都看在眼里。加油！`
  }

  // 生成资源推荐
  const generateResourceRecommendation = (content) => {
    return `📚 **优质学习资源推荐**\n\n根据您的需求，我为您精选了以下学习资源：\n\n🎥 **视频教程：**\n• B站：搜索相关关键词，有很多优质UP主\n• 慕课网：专业的编程学习平台\n• YouTube：国际优质教程\n\n📖 **文档和书籍：**\n• 官方文档：最权威的学习资料\n• GitHub：开源项目和代码示例\n• 技术博客：实战经验分享\n\n💻 **实践平台：**\n• LeetCode：算法练习\n• CodePen：前端实验场\n• GitHub：代码托管和协作\n\n🤝 **社区交流：**\n• Stack Overflow：技术问答\n• 掘金：中文技术社区\n• CSDN：综合性技术平台\n\n需要我针对特定技术栈推荐更具体的资源吗？`
  }

  // 生成智能默认回复
  const generateSmartDefaultResponse = (currentOKR) => {
    const hasOKR = currentOKR ? true : false
    
    return `🤖 **AI学习助手为您服务**\n\n${hasOKR ? `看到您的学习目标是"${currentOKR.objective}"，很棒的目标！` : '欢迎使用AI学习助手！'}\n\n🎯 **我可以帮您：**\n• 📅 制定学习计划和每日任务\n• 💡 解答学习问题和难点\n• 📊 跟踪学习进度\n• 🔍 搜索知识库资源\n• 💪 提供学习方法和激励\n\n✨ **快速开始：**\n• 问我"今天做什么？"获取任务建议\n• 问我具体问题获取知识解答\n• 说出您的困难获取解决方案\n\n${hasOKR ? '基于您的OKR，我已准备好为您提供个性化指导！' : '建议先创建您的OKR目标，这样我能提供更精准的帮助！'}\n\n请告诉我您需要什么帮助？ 😊`
  }

  // 获取聊天历史
  const fetchChatHistory = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 如果是模拟用户，返回空数组（新用户没有聊天历史）
      if (authStore.user.id === 'mock-user-id') {
        messages.value = []
        return { success: true, data: [] }
      }
      
      const { data, error: dbError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: true })
      
      if (dbError) throw dbError
      
              // 重构消息格式
        messages.value = data.map(record => ({
          id: record.id,
          role: record.message.role,
          content: record.message.content,
          timestamp: record.created_at
        }))
      
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 清空聊天记录
  const clearMessages = () => {
    messages.value = []
    sessionId.value = null
  }

  return {
    messages,
    loading,
    error,
    sessionId,
    chatHistory,
    initSession,
    addMessage,
    sendMessage,
    fetchChatHistory,
    clearMessages
  }
})
