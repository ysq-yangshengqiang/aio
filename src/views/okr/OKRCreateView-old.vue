<template>
  <div class="space-y-6">
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {{ isEditing ? '编辑OKR' : '创建新的OKR' }}
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ isEditing ? '修改您的目标和关键结果' : '设定您的目标和关键结果' }}
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <router-link
          to="/okr"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          返回列表
        </router-link>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <form @submit.prevent="createOKR" class="space-y-6 p-6">
        <!-- 基本信息 -->
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">基本信息</h3>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="title" class="block text-sm font-medium text-gray-700">
                目标标题 <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                v-model="form.title"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="请输入清晰、可衡量的目标"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700">
                详细描述
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                v-model="form.description"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="详细描述此目标的背景、意义和预期成果"
              ></textarea>
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-gray-700">
                类别
              </label>
              <select
                id="category"
                name="category"
                v-model="form.category"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="learning">学习成长</option>
                <option value="career">职业发展</option>
                <option value="personal">个人发展</option>
                <option value="health">健康生活</option>
                <option value="project">项目管理</option>
              </select>
            </div>

            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700">
                优先级
              </label>
              <select
                id="priority"
                name="priority"
                v-model="form.priority"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>

            <div>
              <label for="start_date" class="block text-sm font-medium text-gray-700">
                开始日期
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                v-model="form.start_date"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="target_date" class="block text-sm font-medium text-gray-700">
                目标完成日期
              </label>
              <input
                type="date"
                id="target_date"
                name="target_date"
                v-model="form.target_date"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <!-- 关键结果 -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">关键结果</h3>
            <button
              type="button"
              @click="addKeyResult"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加关键结果
            </button>
          </div>

          <div v-if="form.keyResults.length === 0" class="text-center py-6 text-gray-500">
            暂无关键结果，请点击上方按钮添加
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(kr, index) in form.keyResults"
              :key="index"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex justify-between items-start mb-3">
                <h4 class="text-sm font-medium text-gray-900">关键结果 {{ index + 1 }}</h4>
                <button
                  type="button"
                  @click="removeKeyResult(index)"
                  class="text-red-400 hover:text-red-600"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label :for="`kr-title-${index}`" class="block text-sm font-medium text-gray-700">
                    结果描述 <span class="text-red-500">*</span>
                  </label>
                  <input
                    :id="`kr-title-${index}`"
                    type="text"
                    v-model="kr.title"
                    required
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="描述具体的、可量化的结果"
                  />
                </div>

                <div>
                  <label :for="`kr-target-${index}`" class="block text-sm font-medium text-gray-700">
                    目标值
                  </label>
                  <input
                    :id="`kr-target-${index}`"
                    type="number"
                    v-model="kr.target_value"
                    min="0"
                    step="0.01"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="目标数值"
                  />
                </div>

                <div>
                  <label :for="`kr-unit-${index}`" class="block text-sm font-medium text-gray-700">
                    单位
                  </label>
                  <input
                    :id="`kr-unit-${index}`"
                    type="text"
                    v-model="kr.unit"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="如：分、次、%、个等"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label :for="`kr-description-${index}`" class="block text-sm font-medium text-gray-700">
                    详细说明
                  </label>
                  <textarea
                    :id="`kr-description-${index}`"
                    v-model="kr.description"
                    rows="2"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="补充说明此关键结果的具体要求"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="pt-5">
          <div class="flex justify-end space-x-3">
            <router-link
              to="/okr"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? (isEditing ? '更新中...' : '创建中...') : (isEditing ? '更新OKR' : '创建OKR') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { okrService } from '@/services/okr.service.js'
import { useNotification } from '@/composables/useNotification.js'

const router = useRouter()
const route = useRoute()
const { showNotification } = useNotification()

const loading = ref(false)
const isEditing = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  description: '',
  category: 'learning',
  priority: 'medium',
  start_date: new Date().toISOString().split('T')[0],
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
  
  loading.value = true
  try {
    const result = await okrService.getOKRById(route.params.id)
    if (result.success) {
      const okr = result.data
      form.title = okr.title
      form.description = okr.description || ''
      form.category = okr.category
      form.priority = okr.priority
      form.start_date = okr.start_date ? okr.start_date.split('T')[0] : ''
      form.target_date = okr.target_date ? okr.target_date.split('T')[0] : ''
      
      // 加载关键结果
      form.keyResults = (okr.key_results || []).map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description || '',
        target_value: kr.target_value,
        current_value: kr.current_value,
        unit: kr.unit || ''
      }))
    } else {
      showNotification(result.error || 'OKR加载失败', 'error')
      router.push('/okr')
    }
  } catch (error) {
    console.error('加载OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
    router.push('/okr')
  } finally {
    loading.value = false
  }
}

const createOKR = async () => {
  if (!form.title.trim()) {
    showNotification('请输入目标标题', 'error')
    return
  }

  loading.value = true

  try {
    const okrData = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      keyResults: form.keyResults.filter(kr => kr.title.trim())
    }

    let result

    if (isEditing.value) {
      result = await okrService.updateOKR(route.params.id, {
        title: okrData.title,
        description: okrData.description,
        category: okrData.category,
        priority: okrData.priority,
        start_date: okrData.start_date,
        target_date: okrData.target_date
      })
      
      // TODO: 更新关键结果需要单独处理
      // 这里简化处理，实际应该比较新旧关键结果进行增删改
    } else {
      result = await okrService.createOKR(okrData)
    }

    if (result.success) {
      showNotification(isEditing.value ? 'OKR更新成功！' : 'OKR创建成功！', 'success')
      router.push('/okr')
    } else {
      showNotification(result.error || (isEditing.value ? 'OKR更新失败' : 'OKR创建失败'), 'error')
    }
  } catch (error) {
    console.error(isEditing.value ? '更新OKR失败:' : '创建OKR失败:', error)
    showNotification('系统错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadOKR()
  } else {
    // 初始化时添加一个关键结果
    addKeyResult()
  }
})
</script>