<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div class="max-w-6xl mx-auto p-6">
      <!-- 美化的页面标题 -->
      <div class="bg-white rounded-xl shadow p-8 mb-8 border border-gray-100">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5-6l-7 7-7-7" />
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">数据库状态检查</h1>
            <p class="mt-2 text-lg text-gray-600">
              🔧 诊断和修复OKR数据库结构问题
            </p>
          </div>
        </div>
      </div>
    
    <div class="space-y-8">
      <!-- 连接测试 -->
      <div class="bg-white shadow rounded-lg p-8 border border-gray-100">
        <h2 class="text-xl font-semibold mb-6 flex items-center">
          <div class="p-2 bg-green-500 rounded-lg mr-3">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          🔌 数据库连接测试
        </h2>
        <button 
          @click="testConnection" 
          :disabled="loading.connection"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading.connection ? '测试中...' : '测试连接' }}
        </button>
        <div v-if="results.connection" class="mt-4">
          <div :class="results.connection.connected ? 'text-green-600' : 'text-red-600'">
            {{ results.connection.connected ? '✅ 连接成功' : '❌ 连接失败' }}
          </div>
          <div v-if="results.connection.error" class="text-red-600 text-sm mt-1">
            {{ results.connection.error }}
          </div>
        </div>
      </div>

      <!-- OKR表检查 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">OKR表结构检查</h2>
        <button 
          @click="checkOKRTable" 
          :disabled="loading.okr"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading.okr ? '检查中...' : '检查OKR表' }}
        </button>
        <div v-if="results.okr" class="mt-4">
          <!-- 基本状态 -->
          <div :class="results.okr.exists ? 'text-green-600' : 'text-red-600'">
            {{ results.okr.exists ? '✅ 表存在' : '❌ 表不存在' }}
          </div>
          
          <!-- 访问权限 -->
          <div v-if="results.okr.accessible === false" class="text-yellow-600 text-sm mt-1">
            ⚠️ 表存在但无法访问，可能是RLS权限问题
          </div>
          
          <!-- 字段检查结果 -->
          <div v-if="results.okr.hasRequiredFields === false" class="text-red-600 text-sm mt-1">
            ❌ 缺少核心字段（title, user_id, status, progress）
          </div>
          <div v-else-if="results.okr.hasRequiredFields === true && results.okr.hasAllFields === false" class="text-orange-600 text-sm mt-1">
            ⚠️ 核心字段存在，但缺少可选字段（category, priority等）
          </div>
          <div v-else-if="results.okr.hasAllFields === true" class="text-green-600 text-sm mt-1">
            ✅ 所有字段完整
          </div>
          
          <!-- 错误信息 -->
          <div v-if="results.okr.error" class="text-red-600 text-sm mt-1 font-medium">
            {{ results.okr.error }}
          </div>
          
          <!-- 详细错误 -->
          <div v-if="results.okr.structureError" class="text-orange-600 text-xs mt-1 bg-orange-50 p-2 rounded">
            <strong>详细错误:</strong> {{ results.okr.structureError }}
          </div>
          
          <!-- 错误代码 -->
          <div v-if="results.okr.code" class="text-gray-500 text-xs mt-1">
            错误代码: {{ results.okr.code }}
          </div>
          
          <!-- 修复建议 -->
          <div v-if="!results.okr.exists || results.okr.hasRequiredFields === false" class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
            <h4 class="text-sm font-medium text-blue-800">🔧 修复建议:</h4>
            <p class="text-sm text-blue-700 mt-1">
              请在Supabase SQL Editor中执行完整的表创建脚本。
            </p>
          </div>
          
          <div v-else-if="results.okr.partialStructure" class="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <h4 class="text-sm font-medium text-yellow-800">🔧 修复建议:</h4>
            <p class="text-sm text-yellow-700 mt-1">
              表结构部分完整，建议执行字段补充脚本添加缺失字段。
            </p>
          </div>
          
          <!-- 示例记录 -->
          <div v-if="results.okr.sampleRecord" class="mt-4">
            <h3 class="font-semibold mb-2">示例记录结构：</h3>
            <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">{{ JSON.stringify(results.okr.sampleRecord, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Key Results表检查 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Key Results表结构检查</h2>
        <button 
          @click="checkKeyResultsTable" 
          :disabled="loading.keyResults"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading.keyResults ? '检查中...' : '检查Key Results表' }}
        </button>
        <div v-if="results.keyResults" class="mt-4">
          <div :class="results.keyResults.exists ? 'text-green-600' : 'text-red-600'">
            {{ results.keyResults.exists ? '✅ 表存在' : '❌ 表不存在' }}
          </div>
          <div v-if="results.keyResults.accessible === false" class="text-yellow-600 text-sm mt-1">
            ⚠️ 表存在但无法访问，可能是权限问题
          </div>
          <div v-if="results.keyResults.hasRequiredFields === false" class="text-orange-600 text-sm mt-1">
            ⚠️ 表结构可能不完整
          </div>
          <div v-if="results.keyResults.hasRequiredFields === true" class="text-green-600 text-sm mt-1">
            ✅ 表结构完整
          </div>
          <div v-if="results.keyResults.error" class="text-red-600 text-sm mt-1">
            {{ results.keyResults.error }}
          </div>
          <div v-if="results.keyResults.structureError" class="text-orange-600 text-sm mt-1">
            结构错误: {{ results.keyResults.structureError }}
          </div>
        </div>
      </div>

      <!-- OKR创建测试 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">OKR创建测试</h2>
        <form @submit.prevent="testCreateOKR" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">测试标题</label>
            <input 
              v-model="testOKR.title" 
              type="text" 
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="测试OKR标题"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">测试描述</label>
            <textarea 
              v-model="testOKR.description"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows="3"
              placeholder="测试OKR描述"
            ></textarea>
          </div>
          <button 
            type="submit" 
            :disabled="loading.create || !testOKR.title"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {{ loading.create ? '创建中...' : '测试创建OKR' }}
          </button>
        </form>
        <div v-if="results.create" class="mt-4">
          <div :class="results.create.success ? 'text-green-600' : 'text-red-600'">
            {{ results.create.success ? '✅ 创建成功' : '❌ 创建失败' }}
          </div>
          <div v-if="results.create.error" class="text-red-600 text-sm mt-1">
            {{ results.create.error }}
          </div>
          <div v-if="results.create.data" class="text-sm mt-1 bg-gray-100 p-2 rounded">
            <pre>{{ JSON.stringify(results.create.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- SQL执行区域 -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">紧急修复SQL</h2>
        <p class="text-sm text-gray-600 mb-4">
          如果表不存在或结构有问题，请在Supabase Dashboard的SQL Editor中执行以下SQL：
        </p>
        <textarea 
          readonly
          class="w-full h-64 font-mono text-sm border border-gray-300 rounded p-2 bg-gray-50"
          :value="fixSQL"
        ></textarea>
        <button 
          @click="copySQL" 
          class="mt-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          复制SQL
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import DatabaseChecker from '@/utils/database-checker.js'
import { okrService } from '@/services/okr.service.js'

const loading = reactive({
  connection: false,
  okr: false,
  keyResults: false,
  create: false
})

const results = reactive({
  connection: null,
  okr: null,
  keyResults: null,
  create: null
})

const testOKR = reactive({
  title: '测试OKR - ' + new Date().toLocaleDateString(),
  description: '这是一个数据库测试用的OKR'
})

const fixSQL = `-- 立即修复：OKR表结构问题
-- 在Supabase SQL Editor中复制并执行以下SQL

-- 1. 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 完全删除现有表（如果存在问题）
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.okrs CASCADE;

-- 3. 创建完整的OKR表
CREATE TABLE public.okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'learning',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建关键结果表
CREATE TABLE public.key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    okr_id UUID REFERENCES public.okrs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建索引
CREATE INDEX idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX idx_okrs_status ON public.okrs(status);
CREATE INDEX idx_key_results_okr_id ON public.key_results(okr_id);

-- 6. 启用RLS
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- 7. 创建RLS策略
CREATE POLICY "users_manage_own_okrs" ON public.okrs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_manage_own_key_results" ON public.key_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.okrs 
            WHERE okrs.id = key_results.okr_id 
            AND okrs.user_id = auth.uid()
        )
    );

-- 8. 验证创建结果
SELECT 'Tables created successfully!' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('okrs', 'key_results')
ORDER BY table_name, ordinal_position;`

const testConnection = async () => {
  loading.connection = true
  try {
    results.connection = await DatabaseChecker.testConnection()
  } finally {
    loading.connection = false
  }
}

const checkOKRTable = async () => {
  loading.okr = true
  try {
    results.okr = await DatabaseChecker.checkOKRTable()
  } finally {
    loading.okr = false
  }
}

const checkKeyResultsTable = async () => {
  loading.keyResults = true
  try {
    results.keyResults = await DatabaseChecker.checkKeyResultsTable()
  } finally {
    loading.keyResults = false
  }
}

const testCreateOKR = async () => {
  loading.create = true
  try {
    results.create = await okrService.createOKR({
      title: testOKR.title,
      description: testOKR.description,
      category: 'learning',
      priority: 'medium'
    })
  } catch (error) {
    results.create = {
      success: false,
      error: error.message
    }
  } finally {
    loading.create = false
  }
}

const copySQL = () => {
  navigator.clipboard.writeText(fixSQL)
  alert('SQL已复制到剪贴板')
}
</script>