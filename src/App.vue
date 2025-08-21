<template>
  <div id="app">
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>启明星平台启动中...</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const loading = ref(true)
const authStore = useAuthStore()

onMounted(async () => {
  try {
    // 初始化认证store
    await authStore.init()
  } catch (error) {
    console.error('App initialization error:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
#app {
  height: 100vh;
  width: 100vw;
}

.loading-screen {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
