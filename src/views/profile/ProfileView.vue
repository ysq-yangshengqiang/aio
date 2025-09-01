<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          个人资料
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          管理您的个人信息、技能标签和学习偏好
        </p>
      </div>
    </div>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" />

    <!-- 主要内容 -->
    <div v-else class="space-y-6">
      <!-- 基本信息卡片 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">基本信息</h3>
        </div>
        <div class="p-6">
          <div class="flex items-start space-x-6">
            <!-- 头像区域 -->
            <div class="flex-shrink-0">
              <div class="relative">
                <img
                  v-if="profile.avatar_url"
                  :src="profile.avatar_url"
                  :alt="profile.full_name || profile.name"
                  class="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                />
                <div
                  v-else
                  class="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200"
                >
                  <svg class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button
                  @click="triggerFileUpload"
                  class="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
                  title="更换头像"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarUpload"
                />
              </div>
            </div>

            <!-- 基本信息表单 -->
            <div class="flex-1 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">姓名</label>
                  <input
                    v-model="profile.name"
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">全名</label>
                  <input
                    v-model="profile.full_name"
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入全名"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">学号</label>
                  <input
                    v-model="profile.student_id"
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入学号"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">角色</label>
                  <select
                    v-model="profile.role"
                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">学生</option>
                    <option value="teacher">教师</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  @click="saveBasicInfo"
                  :disabled="saving"
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span v-if="saving">保存中...</span>
                  <span v-else>保存基本信息</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能标签卡片 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">技能标签</h3>
          <p class="mt-1 text-sm text-gray-500">基于您的学习活动自动生成的技能标签</p>
        </div>
        <div class="p-6">
          <div v-if="skills.length > 0" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="skill in skills"
                :key="skill.tag"
                class="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ skill.tag }}</span>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': skill.level === 'expert',
                      'bg-blue-100 text-blue-800': skill.level === 'advanced',
                      'bg-yellow-100 text-yellow-800': skill.level === 'intermediate',
                      'bg-gray-100 text-gray-800': skill.level === 'beginner'
                    }"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getSkillLevelText(skill.level) }}
                  </span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>活动数量: {{ skill.count }}</span>
                    <span>平均进度: {{ skill.averageProgress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: skill.averageProgress + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">暂无技能数据</h3>
            <p class="mt-1 text-sm text-gray-500">开始创建OKR和学习活动来生成技能标签</p>
          </div>
        </div>
      </div>

      <!-- 成长统计卡片 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">成长统计</h3>
          <p class="mt-1 text-sm text-gray-500">您的学习进度和成就统计</p>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">{{ stats.totalOkrs }}</div>
              <div class="text-sm text-gray-500">总OKR数量</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">{{ stats.completedOkrs }}</div>
              <div class="text-sm text-gray-500">已完成OKR</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600">{{ stats.totalActivities }}</div>
              <div class="text-sm text-gray-500">学习活动</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-600">{{ stats.avgProgress }}%</div>
              <div class="text-sm text-gray-500">平均进度</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习建议卡片 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">学习建议</h3>
          <p class="mt-1 text-sm text-gray-500">基于您的学习情况生成的个性化建议</p>
        </div>
        <div class="p-6">
          <div v-if="advice.length > 0" class="space-y-4">
            <div
              v-for="item in advice"
              :key="item.type"
              class="flex items-start space-x-3 p-4 rounded-lg border"
              :class="{
                'border-blue-200 bg-blue-50': item.priority === 'high',
                'border-yellow-200 bg-yellow-50': item.priority === 'medium',
                'border-gray-200 bg-gray-50': item.priority === 'low'
              }"
            >
              <div class="flex-shrink-0">
                <svg
                  v-if="item.priority === 'high'"
                  class="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <svg
                  v-else-if="item.priority === 'medium'"
                  class="h-5 w-5 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900">{{ item.title }}</h4>
                <p class="mt-1 text-sm text-gray-600">{{ item.content }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">暂无学习建议</h3>
            <p class="mt-1 text-sm text-gray-500">继续学习以获取个性化建议</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { profileService } from '@/services/profile.service.js'
import { useNotification } from '@/composables/useNotification.js'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const { showNotification } = useNotification()

// 响应式数据
const loading = ref(true)
const saving = ref(false)
const fileInput = ref(null)

const profile = reactive({
  name: '',
  full_name: '',
  student_id: '',
  role: 'student',
  avatar_url: ''
})

const skills = ref([])
const advice = ref([])
const stats = reactive({
  totalOkrs: 0,
  completedOkrs: 0,
  totalActivities: 0,
  avgProgress: 0
})

// 生命周期
onMounted(async () => {
  await loadProfileData()
})

// 方法
const loadProfileData = async () => {
  try {
    loading.value = true
    
    // 并行加载所有数据
    const [profileResult, skillsResult, adviceResult, statsResult] = await Promise.all([
      profileService.getUserProfile(),
      profileService.analyzeSkills(),
      profileService.generateLearningAdvice(),
      loadStatistics()
    ])

    // 处理个人资料数据
    if (profileResult.success && profileResult.data) {
      Object.assign(profile, profileResult.data)
    }

    // 处理技能数据
    if (skillsResult.success) {
      skills.value = skillsResult.data || []
    }

    // 处理建议数据
    if (adviceResult.success) {
      advice.value = adviceResult.data || []
    }

    // 处理统计数据
    if (statsResult.success) {
      Object.assign(stats, statsResult.data)
    }

  } catch (error) {
    console.error('加载个人资料数据失败:', error)
    showNotification('加载数据失败，请刷新页面重试', 'error')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const { supabase } = await import('@/lib/supabase.js')
    const { getCurrentUser } = await import('@/lib/supabase.js')
    
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    // 获取OKR统计
    const { data: okrs, error: okrsError } = await supabase
      .from('okrs')
      .select('status, progress')
      .eq('user_id', user.id)

    if (okrsError) throw okrsError

    // 获取学习活动统计
    const { data: activities, error: activitiesError } = await supabase
      .from('learning_activities')
      .select('id')
      .eq('user_id', user.id)

    if (activitiesError) throw activitiesError

    const totalOkrs = okrs?.length || 0
    const completedOkrs = okrs?.filter(okr => okr.status === 'completed').length || 0
    const totalActivities = activities?.length || 0
    const avgProgress = totalOkrs > 0 
      ? Math.round(okrs.reduce((sum, okr) => sum + (okr.progress || 0), 0) / totalOkrs)
      : 0

    return {
      success: true,
      data: {
        totalOkrs,
        completedOkrs,
        totalActivities,
        avgProgress
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const saveBasicInfo = async () => {
  try {
    saving.value = true
    
    const result = await profileService.updateProfile({
      name: profile.name,
      full_name: profile.full_name,
      student_id: profile.student_id,
      role: profile.role
    })

    if (result.success) {
      showNotification('基本信息保存成功', 'success')
    } else {
      showNotification(result.error || '保存失败', 'error')
    }
  } catch (error) {
    console.error('保存基本信息失败:', error)
    showNotification('保存失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await profileService.uploadAvatar(file)
    
    if (result.success) {
      profile.avatar_url = result.data.avatar_url
      showNotification('头像上传成功', 'success')
    } else {
      showNotification(result.error || '头像上传失败', 'error')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    showNotification('头像上传失败，请重试', 'error')
  }

  // 清空文件输入
  event.target.value = ''
}

const getSkillLevelText = (level) => {
  const levelMap = {
    'expert': '专家',
    'advanced': '高级',
    'intermediate': '中级',
    'beginner': '初级'
  }
  return levelMap[level] || level
}
</script>