<template>
  <!-- 弹窗遮罩 -->
  <div 
    v-if="isVisible" 
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-20"
    @click="closeModal"
  >
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- 弹窗内容 -->
      <div 
        class="bg-white rounded-lg shadow max-w-2xl w-full p-6"
        @click.stop
      >
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? '编辑OKR' : '创建新OKR' }}
          </h3>
          <button
            type="button"
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 表单内容 -->
        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- 基本信息 -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
              OKR标题 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              v-model="form.title"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="例如：提升前端开发技能"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              详细描述
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="详细描述您的目标..."
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                类别
              </label>
              <select
                id="category"
                v-model="form.category"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="learning">学习成长</option>
                <option value="career">职业发展</option>
                <option value="personal">个人发展</option>
                <option value="health">健康生活</option>
                <option value="project">项目管理</option>
              </select>
            </div>

            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                id="priority"
                v-model="form.priority"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          <!-- 关键结果区域 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-900">关键结果</h4>
              <button
                type="button"
                @click="addKeyResult"
                class="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + 添加关键结果
              </button>
            </div>

            <div class="space-y-3" v-if="form.keyResults.length > 0">
              <div
                v-for="(kr, index) in form.keyResults"
                :key="index"
                class="border border-gray-200 rounded-md p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="text-sm font-medium text-gray-900">关键结果 {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="removeKeyResult(index)"
                    class="text-red-400 hover:text-red-600"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  v-model="kr.title"
                  placeholder="关键结果标题"
                  class="block w-full px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div v-else class="text-center py-4 text-gray-500 text-sm">
              暂无关键结果，点击"添加关键结果"来设定可衡量的目标
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ submitting ? '保存中...' : (isEditing ? '更新OKR' : '创建OKR') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { okrService } from '@/services/okr.service.js'
import { useNotification } from '@/composables/useNotification.js'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  editOkrId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const { showNotification } = useNotification()

const submitting = ref(false)
const isEditing = computed(() => !!props.editOkrId)

const form = reactive({
  title: '',
  description: '',
  category: 'learning',
  priority: 'medium',
  keyResults: []
})

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.category = 'learning'
  form.priority = 'medium'
  form.keyResults = []
}

const closeModal = () => {
  emit('close')
  resetForm()
}

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

const submitForm = async () => {
  if (!form.title.trim()) {
    showNotification('请输入OKR标题', 'warning')
    return
  }

  submitting.value = true
  try {
    let result
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      keyResults: form.keyResults.filter(kr => kr.title.trim())
    }

    if (isEditing.value) {
      result = await okrService.updateOKR(props.editOkrId, payload)
    } else {
      result = await okrService.createOKR(payload)
    }

    if (result.success) {
      showNotification(
        isEditing.value ? 'OKR更新成功！' : 'OKR创建成功！',
        'success'
      )
      if (isEditing.value) {
        emit('updated', result.data)
      } else {
        emit('created', result.data)
      }
      closeModal()
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

// 监听弹窗显示状态
watch(() => props.isVisible, async (visible) => {
  if (visible) {
    resetForm()
    console.log('Modal opened, isEditing:', isEditing.value) // 调试日志
  }
})
</script>