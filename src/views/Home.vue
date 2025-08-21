<template>
  <div class="min-h-screen gradient-bg-light relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="relative z-10 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
            <el-icon class="text-white text-xl">
              <Star />
            </el-icon>
          </div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              启明星平台
            </h1>
            <p class="text-xs text-gray-500">AI学习成长管理系统</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <router-link
            to="/login"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            登录
          </router-link>
          <router-link
            to="/register"
            class="px-6 py-2 btn-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            注册
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="relative z-10 px-6 py-12">
      <div class="max-w-7xl mx-auto">
        <!-- 英雄区域 -->
        <div class="text-center mb-20">
          <div class="animate-fadeIn">
            <h1 class="text-5xl md:text-7xl font-bold mb-6">
              <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI驱动的
              </span>
              <br>
              <span class="text-gray-800">学习成长平台</span>
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              通过智能OKR管理、个性化AI助手和数据驱动的学习分析，
              <br>
              帮助学生制定目标、跟踪进度、实现学习成长的全面提升
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <router-link
                to="/register"
                class="px-8 py-4 btn-primary text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg font-semibold"
              >
                <el-icon class="mr-2">
                  <ArrowRight />
                </el-icon>
                开始学习之旅
              </router-link>
              <button class="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300 text-lg font-semibold">
                <el-icon class="mr-2">
                  <VideoCameraFilled />
                </el-icon>
                观看演示
              </button>
            </div>
          </div>

          <!-- 特色数据 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slideIn" style="animation-delay: 0.3s">
            <div class="text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                1000+
              </div>
              <p class="text-gray-600">活跃学生用户</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                95%
              </div>
              <p class="text-gray-600">目标完成率提升</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <p class="text-gray-600">AI助手在线服务</p>
            </div>
          </div>
        </div>

        <!-- 功能特色 -->
        <div class="mb-20">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">核心功能特色</h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              集成最新AI技术，为学生提供全方位的学习成长支持
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- 功能卡片1 -->
            <div class="glass-effect rounded-2xl p-8 border border-white/20 card-shadow hover:shadow-xl transition-all duration-300 animate-fadeIn" style="animation-delay: 0.1s">
              <div class="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <el-icon class="text-white text-2xl">
                  <Aim />
                </el-icon>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">智能OKR管理</h3>
              <p class="text-gray-600 leading-relaxed mb-6">
                基于AI算法的目标设定与跟踪系统，帮助学生制定可达成的学习目标，实时监控进度并提供优化建议。
              </p>
              <ul class="space-y-2 text-sm text-gray-500">
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  SMART目标制定
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  进度可视化跟踪
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  智能提醒与建议
                </li>
              </ul>
            </div>

            <!-- 功能卡片2 -->
            <div class="glass-effect rounded-2xl p-8 border border-white/20 card-shadow hover:shadow-xl transition-all duration-300 animate-fadeIn" style="animation-delay: 0.2s">
              <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <el-icon class="text-white text-2xl">
                  <ChatDotRound />
                </el-icon>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">AI学习助手</h3>
              <p class="text-gray-600 leading-relaxed mb-6">
                24/7在线的智能学习伙伴，提供个性化学习指导、答疑解惑和学习方法建议，让学习更高效。
              </p>
              <ul class="space-y-2 text-sm text-gray-500">
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  个性化学习建议
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  实时答疑解惑
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  学习方法优化
                </li>
              </ul>
            </div>

            <!-- 功能卡片3 -->
            <div class="glass-effect rounded-2xl p-8 border border-white/20 card-shadow hover:shadow-xl transition-all duration-300 animate-fadeIn" style="animation-delay: 0.3s">
              <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <el-icon class="text-white text-2xl">
                  <DataAnalysis />
                </el-icon>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">学习数据分析</h3>
              <p class="text-gray-600 leading-relaxed mb-6">
                深度分析学习行为和成果数据，生成个性化学习报告，帮助学生了解自己的学习模式和改进方向。
              </p>
              <ul class="space-y-2 text-sm text-gray-500">
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  学习行为分析
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  成果数据统计
                </li>
                <li class="flex items-center">
                  <el-icon class="text-green-500 mr-2"><Check /></el-icon>
                  个性化报告生成
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 用户评价 -->
        <div class="mb-20">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">用户评价</h2>
            <p class="text-xl text-gray-600">听听学生们怎么说</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="glass-effect rounded-2xl p-6 border border-white/20 card-shadow animate-fadeIn" style="animation-delay: 0.1s">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  张
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">张同学</h4>
                  <p class="text-sm text-gray-500">计算机科学专业</p>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "启明星平台帮助我建立了清晰的学习目标，AI助手的建议非常实用，我的学习效率提升了很多！"
              </p>
              <div class="flex items-center mt-4">
                <div class="flex text-yellow-400">
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                </div>
              </div>
            </div>

            <div class="glass-effect rounded-2xl p-6 border border-white/20 card-shadow animate-fadeIn" style="animation-delay: 0.2s">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  李
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">李同学</h4>
                  <p class="text-sm text-gray-500">数学专业</p>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "OKR管理功能让我的学习更有条理，数据分析报告帮我发现了学习中的薄弱环节。"
              </p>
              <div class="flex items-center mt-4">
                <div class="flex text-yellow-400">
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                </div>
              </div>
            </div>

            <div class="glass-effect rounded-2xl p-6 border border-white/20 card-shadow animate-fadeIn" style="animation-delay: 0.3s">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  王
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">王同学</h4>
                  <p class="text-sm text-gray-500">英语专业</p>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "AI助手就像我的私人导师，随时为我答疑解惑，学习变得更加轻松愉快。"
              </p>
              <div class="flex items-center mt-4">
                <div class="flex text-yellow-400">
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                  <el-icon><Star /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA区域 -->
        <div class="text-center">
          <div class="glass-effect rounded-3xl p-12 border border-white/20 card-shadow-heavy animate-fadeIn">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">
              准备开始您的学习成长之旅吗？
            </h2>
            <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              加入启明星平台，让AI助力您实现学习目标，开启高效学习的新篇章
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <router-link
                to="/register"
                class="px-10 py-4 btn-primary text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg font-semibold"
              >
                <el-icon class="mr-2">
                  <UserFilled />
                </el-icon>
                立即注册
              </router-link>
              <router-link
                to="/login"
                class="px-10 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300 text-lg font-semibold"
              >
                <el-icon class="mr-2">
                  <Right />
                </el-icon>
                已有账号？登录
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="relative z-10 mt-20 py-12 border-t border-gray-200/50">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                <el-icon class="text-white text-lg">
                  <Star />
                </el-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  启明星平台
                </h3>
              </div>
            </div>
            <p class="text-gray-600 mb-4 max-w-md">
              AI驱动的学生成长管理系统，致力于通过智能技术帮助每一位学生实现学习目标，开启成功之路。
            </p>
            <div class="flex space-x-4">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <el-icon class="text-gray-600"><Message /></el-icon>
              </div>
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <el-icon class="text-gray-600"><Phone /></el-icon>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-800 mb-4">产品功能</h4>
            <ul class="space-y-2 text-gray-600">
              <li><a href="#" class="hover:text-gray-800 transition-colors">OKR管理</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">AI助手</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">数据分析</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">学习报告</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold text-gray-800 mb-4">帮助支持</h4>
            <ul class="space-y-2 text-gray-600">
              <li><a href="#" class="hover:text-gray-800 transition-colors">使用指南</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">常见问题</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">联系我们</a></li>
              <li><a href="#" class="hover:text-gray-800 transition-colors">用户反馈</a></li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-gray-200/50 mt-12 pt-8 text-center">
          <p class="text-gray-500">
            © 2025 启明星平台. 保留所有权利. | 
            <a href="#" class="hover:text-gray-700 transition-colors">隐私政策</a> | 
            <a href="#" class="hover:text-gray-700 transition-colors">服务条款</a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { 
  Star, 
  ArrowRight, 
  VideoCameraFilled, 
  Aim, 
  ChatDotRound, 
  DataAnalysis, 
  Check, 
  UserFilled, 
  Right,
  Message,
  Phone
} from '@element-plus/icons-vue'
</script>

<style scoped>
/* 页面特定样式 */
.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .text-5xl {
    font-size: 2.5rem;
  }
  
  .text-7xl {
    font-size: 3.5rem;
  }
}
</style>