<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <!-- 左侧：版权信息 -->
        <div class="flex items-center space-x-4 text-sm text-gray-500">
          <span>&copy; {{ currentYear }} 启明星AI学习管理系统</span>
          <span class="hidden md:inline">|</span>
          <span class="hidden md:inline">让学习更智能</span>
        </div>

        <!-- 右侧：链接 -->
        <div class="flex items-center space-x-6 mt-2 md:mt-0">
          <a
            href="#"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            帮助中心
          </a>
          <a
            href="#"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            隐私政策
          </a>
          <a
            href="#"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            服务条款
          </a>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-400">版本</span>
            <span class="text-sm text-gray-600 font-medium">v1.0.0</span>
          </div>
        </div>
      </div>

      <!-- 移动端额外信息 -->
      <div class="mt-3 pt-3 border-t border-gray-100 md:hidden">
        <div class="flex justify-center items-center space-x-4 text-xs text-gray-400">
          <span>技术支持</span>
          <span>•</span>
          <span>在线客服</span>
          <span>•</span>
          <span>意见反馈</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>