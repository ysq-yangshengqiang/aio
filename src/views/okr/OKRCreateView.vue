<template>
  <div class="space-y-6">
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          创建新的OKR
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          设定您的目标和关键结果
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

    <div class="bg-white shadow rounded-lg p-6">
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">OKR创建功能开发中</h3>
        <p class="mt-1 text-sm text-gray-500">此功能正在开发中，敬请期待</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// OKR创建页面逻辑将在后续开发
</script>