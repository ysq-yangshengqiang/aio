# 🌟 启明星平台 - AI驱动的学生成长管理系统

## 📋 项目概述

启明星平台是一个基于Vue 3 + Element Plus的现代化Web应用，旨在通过AI技术帮助学生制定和执行个人发展计划（OKR），提供个性化的学习指导和资源推荐。

## 🎯 MVP版本功能

- **用户认证**: 学生注册/登录系统
- **OKR管理**: 创建和管理学习目标与关键结果
- **AI助手**: 基于OKR的每日任务推荐和知识库问答
- **聊天记录**: 保存和查看与AI的对话历史
- **响应式设计**: 支持桌面和移动设备

## 🚀 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **后端服务**: Supabase (Auth, Database, pgvector)
- **AI集成**: OpenAI API (计划中)

## 📁 项目结构

```
src/
├── components/          # 可复用组件
├── views/              # 页面组件
│   ├── Login.vue       # 登录页面
│   ├── Register.vue    # 注册页面
│   └── Dashboard.vue   # 主仪表板
├── stores/             # Pinia状态管理
│   ├── auth.js         # 认证状态
│   ├── okr.js          # OKR管理
│   └── chat.js         # 聊天状态
├── router/             # 路由配置
│   └── index.js
├── lib/                # 第三方库配置
│   └── supabase.js     # Supabase客户端
├── style.css           # 全局样式
└── main.js             # 应用入口
```

## 🛠️ 快速开始

### 1. 环境要求

- Node.js 16+
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制 `env.example` 文件为 `.env.local` 并填写配置：

```bash
cp env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run build
```

## 🗄️ 数据库设置

在Supabase中执行以下SQL创建必要的表结构：

```sql
-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- OKR表
CREATE TABLE public.okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    key_results JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 聊天记录表
CREATE TABLE public.chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    message JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 知识库向量表
CREATE TABLE public.knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536)
);

-- 启用行级安全策略
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "用户只能操作自己的OKR" ON public.okrs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的聊天记录" ON public.chat_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "对所有认证用户开放读取权限" ON public.knowledge_chunks FOR SELECT USING (auth.role() = 'authenticated');
```

## 🔧 开发指南

### 添加新组件

```bash
# 在src/components/目录下创建新组件
touch src/components/NewComponent.vue
```

### 添加新页面

1. 在 `src/views/` 目录下创建页面组件
2. 在 `src/router/index.js` 中添加路由配置
3. 更新导航菜单（如需要）

### 状态管理

使用Pinia进行状态管理，每个功能模块创建独立的store：

```javascript
// src/stores/example.js
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', () => {
  // 状态和方法定义
})
```

## 🚀 部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 其他平台

项目使用Vite构建，可以部署到任何支持静态网站的平台上。

## 🔮 后续扩展计划

### 第二阶段：教师功能
- 班级学情看板
- 学生风险预警
- 自动化报告生成

### 第三阶段：学院管理
- 学院健康度大屏
- 资源优化建议
- AIP平台集成

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

**启明星平台** - 让AI成为每个学生的成长伙伴 ✨
