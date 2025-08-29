/**
 * DeepSeek API 服务
 * 提供与DeepSeek AI模型的集成接口
 */

class DeepSeekService {
  constructor() {
    this.apiKey = 'sk-aec6dfb959df46f6ac3573b0f8967023'
    this.baseURL = 'https://api.deepseek.com/v1'
    this.maxRetries = 3
    this.timeout = 30000 // 30秒超时
  }

  /**
   * 调用DeepSeek Chat Completion API
   * @param {string} prompt - 用户提示
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} API响应结果
   */
  async chatCompletion(prompt, options = {}) {
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2048,
      systemPrompt = null,
      conversationHistory = []
    } = options

    try {
      const messages = []
      
      // 添加系统提示
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }

      // 添加对话历史
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })))
      }

      // 添加当前用户提示
      messages.push({
        role: 'user',
        content: prompt
      })

      const requestBody = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      }

      const response = await this._makeRequest('/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.choices && response.choices.length > 0) {
        return {
          success: true,
          data: {
            content: response.choices[0].message.content,
            usage: response.usage,
            model: response.model,
            finishReason: response.choices[0].finish_reason
          }
        }
      }

      return {
        success: false,
        error: 'No response choices available'
      }
    } catch (error) {
      console.error('DeepSeek API Error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成个性化学习推荐
   * @param {Object} userData - 用户数据
   * @param {Array} okrs - 用户的OKR数据
   * @param {Array} learningHistory - 学习历史记录
   * @returns {Promise<Object>} 推荐结果
   */
  async generateLearningRecommendations(userData, okrs = [], learningHistory = []) {
    try {
      const systemPrompt = `你是一个专业的AI学习顾问，专门为学生提供个性化的学习建议和推荐。你的任务是：

1. 分析用户的学习目标（OKR）和学习历史
2. 提供具体、可操作的学习推荐
3. 推荐应该包括：学习计划、资源推荐、练习建议、进度回顾建议等
4. 每个推荐都要有明确的优先级（1-3，3为最高）
5. 推荐要个性化，基于用户的实际情况

请以JSON格式返回推荐结果，格式如下：
{
  "recommendations": [
    {
      "type": "study_plan|resource_recommendation|practice_exercise|progress_review|motivation|goal_setting",
      "title": "推荐标题",
      "content": "详细的推荐内容和建议",
      "priority": 1-3,
      "estimatedDuration": "预计完成时间",
      "tags": ["相关标签"],
      "actionItems": ["具体的行动项目"]
    }
  ],
  "summary": "整体分析和建议总结"
}`

      // 构建用户上下文信息
      const userContext = this._buildUserContext(userData, okrs, learningHistory)
      
      const prompt = `请为以下用户生成个性化的学习推荐：

**用户信息：**
${userContext}

请生成3-5个高质量的个性化学习推荐，确保推荐具有针对性和可操作性。`

      const result = await this.chatCompletion(prompt, {
        systemPrompt,
        temperature: 0.8,
        maxTokens: 3000
      })

      if (result.success) {
        try {
          const recommendations = JSON.parse(result.data.content)
          return {
            success: true,
            data: recommendations
          }
        } catch (parseError) {
          // 如果JSON解析失败，尝试提取文本内容
          return {
            success: true,
            data: {
              recommendations: [{
                type: 'general_advice',
                title: 'AI学习建议',
                content: result.data.content,
                priority: 2,
                estimatedDuration: '根据建议内容而定',
                tags: ['AI建议'],
                actionItems: ['根据AI建议采取行动']
              }],
              summary: '基于AI分析的个性化学习建议'
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('Generate recommendations error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成学习计划
   * @param {Object} goal - 学习目标
   * @param {Object} preferences - 用户偏好设置
   * @returns {Promise<Object>} 学习计划
   */
  async generateStudyPlan(goal, preferences = {}) {
    try {
      const systemPrompt = `你是一个专业的学习计划制定专家。请根据用户的学习目标和偏好，制定一个详细的学习计划。

学习计划应该包括：
1. 阶段性目标分解
2. 每日/每周学习安排
3. 学习资源推荐
4. 进度检查点
5. 评估方式

请以JSON格式返回：
{
  "title": "学习计划标题",
  "duration": "计划总时长",
  "phases": [
    {
      "phase": "阶段名称",
      "duration": "阶段时长",
      "objectives": ["目标1", "目标2"],
      "activities": ["活动1", "活动2"],
      "resources": ["资源1", "资源2"],
      "milestones": ["里程碑1", "里程碑2"]
    }
  ],
  "dailySchedule": {
    "recommendedStudyTime": "建议每日学习时间",
    "timeSlots": ["时间段建议"]
  },
  "evaluationCriteria": ["评估标准"],
  "tips": ["学习建议和技巧"]
}`

      const prompt = `请为以下学习目标制定详细的学习计划：

**学习目标：**
- 标题：${goal.title || '未指定'}
- 描述：${goal.description || '未提供详细描述'}
- 截止时间：${goal.deadline || '未设定'}
- 当前进度：${goal.progress ? Math.round(goal.progress * 100) + '%' : '0%'}

**用户偏好：**
- 学习方式：${preferences.learningStyle || '未指定'}
- 每日可用时间：${preferences.dailyTimeAvailable || '未指定'}
- 学习难度偏好：${preferences.difficultyPreference || '中等'}
- 特殊要求：${preferences.specialRequirements || '无'}

请制定一个实用、可行的学习计划。`

      const result = await this.chatCompletion(prompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4000
      })

      if (result.success) {
        try {
          const studyPlan = JSON.parse(result.data.content)
          return {
            success: true,
            data: studyPlan
          }
        } catch (parseError) {
          return {
            success: true,
            data: {
              title: `${goal.title}学习计划`,
              content: result.data.content,
              rawResponse: true
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('Generate study plan error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 分析学习进度并提供建议
   * @param {Object} progressData - 进度数据
   * @returns {Promise<Object>} 分析结果和建议
   */
  async analyzeProgressAndSuggest(progressData) {
    try {
      const systemPrompt = `你是一个专业的学习进度分析师。请分析用户的学习进度，识别问题，并提供改进建议。

分析要点：
1. 进度完成情况
2. 学习效率分析
3. 潜在问题识别
4. 改进建议
5. 激励措施

请以JSON格式返回：
{
  "analysis": {
    "overallProgress": "整体进度评估",
    "strengths": ["优势点"],
    "weaknesses": ["需要改进的地方"],
    "efficiency": "学习效率评分（1-10）"
  },
  "suggestions": [
    {
      "category": "建议类别",
      "title": "建议标题",
      "content": "具体建议内容",
      "priority": "优先级（high/medium/low）"
    }
  ],
  "motivation": "激励话语",
  "nextSteps": ["下一步行动建议"]
}`

      const prompt = `请分析以下学习进度数据并提供改进建议：

**进度数据：**
${JSON.stringify(progressData, null, 2)}

请提供专业的分析和实用的改进建议。`

      const result = await this.chatCompletion(prompt, {
        systemPrompt,
        temperature: 0.6,
        maxTokens: 2500
      })

      if (result.success) {
        try {
          const analysis = JSON.parse(result.data.content)
          return {
            success: true,
            data: analysis
          }
        } catch (parseError) {
          return {
            success: true,
            data: {
              analysis: {
                overallProgress: '需要进一步分析',
                rawContent: result.data.content
              }
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('Analyze progress error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 构建用户上下文信息
   * @private
   */
  _buildUserContext(userData, okrs, learningHistory) {
    let context = []

    // 用户基本信息
    if (userData) {
      context.push(`用户基本信息：`)
      if (userData.name) context.push(`- 姓名：${userData.name}`)
      if (userData.grade) context.push(`- 年级：${userData.grade}`)
      if (userData.major) context.push(`- 专业：${userData.major}`)
      if (userData.learningGoals) context.push(`- 学习目标：${userData.learningGoals.join(', ')}`)
      if (userData.skills) context.push(`- 技能标签：${userData.skills.join(', ')}`)
    }

    // OKR信息
    if (okrs && okrs.length > 0) {
      context.push(`\n当前学习目标（OKR）：`)
      okrs.forEach((okr, index) => {
        context.push(`${index + 1}. ${okr.title}`)
        if (okr.description) context.push(`   描述：${okr.description}`)
        if (typeof okr.progress === 'number') {
          context.push(`   进度：${Math.round(okr.progress * 100)}%`)
        }
        if (okr.status) context.push(`   状态：${okr.status}`)
        if (okr.deadline) context.push(`   截止时间：${okr.deadline}`)
      })
    }

    // 学习历史
    if (learningHistory && learningHistory.length > 0) {
      context.push(`\n最近学习记录：`)
      learningHistory.slice(0, 10).forEach((record, index) => {
        context.push(`${index + 1}. ${record.activity || record.title || '学习活动'}`)
        if (record.duration) context.push(`   时长：${record.duration}分钟`)
        if (record.score) context.push(`   成绩：${record.score}`)
        if (record.subject) context.push(`   科目：${record.subject}`)
        if (record.created_at) {
          context.push(`   日期：${new Date(record.created_at).toLocaleDateString('zh-CN')}`)
        }
      })

      // 学习统计
      const totalSessions = learningHistory.length
      const totalDuration = learningHistory.reduce((sum, record) => {
        return sum + (record.duration || 0)
      }, 0)
      const avgScore = learningHistory
        .filter(record => record.score)
        .reduce((sum, record, _, arr) => sum + record.score / arr.length, 0)

      context.push(`\n学习统计：`)
      context.push(`- 总学习次数：${totalSessions}`)
      context.push(`- 总学习时长：${Math.round(totalDuration / 60)}小时`)
      if (avgScore > 0) context.push(`- 平均成绩：${avgScore.toFixed(1)}`)
    }

    return context.join('\n')
  }

  /**
   * 发送HTTP请求的通用方法
   * @private
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  /**
   * 测试API连接
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection() {
    try {
      const result = await this.chatCompletion('Hello, please respond with "Connection successful"', {
        maxTokens: 50,
        temperature: 0
      })

      return {
        success: result.success,
        message: result.success ? 'API连接正常' : `连接失败: ${result.error}`,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        message: `连接测试失败: ${error.message}`
      }
    }
  }
}

// 创建单例实例
export const deepSeekService = new DeepSeekService()
export default deepSeekService