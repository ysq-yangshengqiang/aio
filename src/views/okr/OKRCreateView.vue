<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div class="max-w-4xl mx-auto p-6">
      <!-- 美化的表单 -->
      <div class="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <form @submit.prevent="submitForm" class="space-y-8">
          <!-- 基本信息区域 -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div class="p-2 bg-blue-500 rounded-lg mr-3">
                <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              基本信息
            </h2>
            
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                  🎯 OKR标题 <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  v-model="form.title"
                  required
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                  placeholder="例如：提升前端开发技能"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  📝 详细描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  v-model="form.description"
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                  placeholder="详细描述您的目标..."
                ></textarea>
              </div>

              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  📂 类别
                </label>
                <select
                  id="category"
                  name="category"
                  v-model="form.category"
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                >
                  <option value="learning">🎓 学习成长</option>
                  <option value="career">💼 职业发展</option>
                  <option value="personal">🌟 个人发展</option>
                  <option value="health">💪 健康生活</option>
                  <option value="project">📋 项目管理</option>
                </select>
              </div>

              <div>
                <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
                  ⚡ 优先级
                </label>
                <select
                  id="priority"
                  name="priority"
                  v-model="form.priority"
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                >
                  <option value="low">🔵 低</option>
                  <option value="medium">🟡 中</option>
                  <option value="high">🟠 高</option>
                  <option value="urgent">🔴 紧急</option>
                </select>
              </div>

              <div>
                <label for="start_date" class="block text-sm font-medium text-gray-700 mb-2">
                  📅 开始日期
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  v-model="form.start_date"
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div>
                <label for="target_date" class="block text-sm font-medium text-gray-700 mb-2">
                  🎯 目标日期
                </label>
                <input
                  type="date"
                  id="target_date"
                  name="target_date"
                  v-model="form.target_date"
                  class="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:shadow-md"
                />
              </div>
            </div>
          </div>

          <!-- 关键结果区域 -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                <div class="p-2 bg-purple-500 rounded-lg mr-3">
                  <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                关键结果 (KRs)
              </h2>
              <button
                type="button"
                @click="addKeyResult"
                class="group inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                添加关键结果
              </button>
            </div>

            <div class="space-y-6" v-if="form.keyResults.length > 0">
              <div
                v-for="(kr, index) in form.keyResults"
                :key="index"
                class="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div class="flex items-start justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-900">关键结果 {{ index + 1 }}</h3>
                  <button
                    type="button"
                    @click="removeKeyResult(index)"
                    class="text-red-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      🎯 关键结果标题 <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      v-model="kr.title"
                      required
                      class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                      placeholder="例如：完成10个项目"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      📝 描述
                    </label>
                    <textarea
                      v-model="kr.description"
                      rows="2"
                      class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                      placeholder="详细描述这个关键结果..."
                    ></textarea>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        📊 目标值
                      </label>
                      <input
                        type="number"
                        v-model="kr.target_value"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        📏 单位
                      </label>
                      <input
                        type="text"
                        v-model="kr.unit"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                        placeholder="个/分/天"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-gray-500 text-lg mb-4">暂无关键结果</p>
              <p class="text-sm text-gray-400">点击"添加关键结果"来设定可衡量的目标</p>
            </div>
          </div>

          <!-- 美化的提交按钮 -->
          <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$router.go(-1)"
              class="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="group relative inline-flex items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? '保存中...' : (isEditing ? '更新OKR' : '创建OKR') }}
              <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-200"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { okrService } from '@/services/okr.service.js'
import { useNotification } from '@/composables/useNotification.js'

const { showNotification } = useNotification()
const router = useRouter()
const route = useRoute()

const submitting = ref(false)
const isEditing = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  description: '',
  category: 'learning',
  priority: 'medium',
  start_date: '',
  target_date: '',
  keyResults: []
})

const addKeyResult = () => {
  form.keyResults.push({
    title: '',
    description: '',
    target_value: null,
    unit: ''
  })
}

const removeKeyResult = (index) => {
  form.keyResults.splice(index, 1)
}

const loadOKR = async () => {
  if (!isEditing.value) return
  
  try {
    const result = await okrService.getOKRById(route.params.id)
    if (result.success) {
      const okr = result.data
      Object.keys(form).forEach(key => {
        if (key === 'keyResults') {
          form[key] = okr.key_results || []
        } else if (okr[key] !== undefined) {
          form[key] = okr[key]
        }
      })
    } else {
      showNotification('加载OKR失败', 'error')
      router.push('/okr')
    }
  } catch (error) {
    console.error('加载OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
    router.push('/okr')
  }
}

const submitForm = async () => {
  if (!form.title.trim()) {
    showNotification('请输入OKR标题', 'warning')
    return
  }

  submitting.value = true
  try {
    let result
    if (isEditing.value) {
      result = await okrService.updateOKR(route.params.id, {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        keyResults: form.keyResults.filter(kr => kr.title.trim())
      })
    } else {
      result = await okrService.createOKR({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        keyResults: form.keyResults.filter(kr => kr.title.trim())
      })
    }

    if (result.success) {
      showNotification(
        isEditing.value ? 'OKR更新成功！' : 'OKR创建成功！',
        'success'
      )
      router.push('/okr')
    } else {
      showNotification(result.error || '操作失败', 'error')
    }
  } catch (error) {
    console.error('提交OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOKR()
})
</script>

<style scoped>
.animate__delay-1s {
  animation-delay: 1s;
}
</style>