# 启明星AI学习管理系统 (AIO Learning System)

🌟 **AI驱动的个人学习目标管理平台**

一个基于Vue 3 + Supabase构建的现代化学习管理系统，帮助用户设定、跟踪和实现学习目标，配备智能AI助手提供个性化学习建议。

## ✨ 核心功能

### 🎯 OKR目标管理
- **目标设定**: 创建SMART学习目标
- **进度跟踪**: 实时更新学习进度
- **关键结果**: 量化目标成果
- **智能提醒**: 定期进度提醒
- **数据分析**: 学习效果可视化

### 🤖 AI智能助手
- **个性化建议**: 基于学习数据的智能推荐
- **学习路径**: AI生成的学习计划
- **问答互动**: 24/7学习问题解答
- **进度分析**: 智能学习报告

### 📊 数据分析
- **学习统计**: 详细的学习数据分析
- **进度报告**: 周/月学习总结
- **成就系统**: 学习里程碑追踪
- **趋势分析**: 学习习惯洞察

### 🔔 智能通知
- **学习提醒**: 个性化学习提醒
- **进度通知**: 目标达成通知
- **系统消息**: 重要更新推送
- **偏好设置**: 自定义通知规则

## 🏗️ 技术架构

### 前端技术栈
- **Vue 3**: 现代化前端框架
- **Vite**: 快速构建工具
- **Pinia**: 状态管理
- **Vue Router**: 路由管理
- **VueUse**: 组合式API工具集

### 后端服务
- **Supabase**: 后端即服务平台
- **PostgreSQL**: 关系型数据库
- **实时订阅**: 数据实时同步
- **认证系统**: 用户身份管理
- **文件存储**: 云端文件管理

### 核心服务层
```
src/
├── services/           # 业务逻辑层
│   ├── auth.service.js    # 认证服务
│   ├── okr.service.js     # OKR管理服务
│   ├── chat.service.js    # AI聊天服务
│   ├── user.service.js    # 用户管理服务
│   ├── analytics.service.js # 数据分析服务
│   └── notification.service.js # 通知服务
├── api/               # API控制器层
├── composables/       # 组合式API
├── utils/            # 工具函数
└── config/           # 配置文件
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env` 文件：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📁 项目结构

```
aio/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   │   └── css/          # 样式文件
│   ├── components/        # Vue组件
│   ├── views/            # 页面组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── services/         # 业务服务层
│   ├── api/              # API控制器
│   ├── composables/      # 组合式API
│   ├── utils/            # 工具函数
│   ├── config/           # 配置文件
│   ├── bootstrap/        # 应用启动
│   └── main.js           # 应用入口
├── database-init.sql      # 数据库初始化
├── package.json
└── README.md
```

## 🎨 设计系统

### 主题支持
- 🌞 浅色主题
- 🌙 深色主题
- 🎨 自定义主题

### 响应式设计
- 📱 移动端优先
- 💻 桌面端适配
- 📐 弹性布局

### 组件库
- 🧩 可复用组件
- 📋 表单组件
- 📊 图表组件
- 🔔 通知组件

## 🔧 开发指南

### 代码规范
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 测试
```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 测试UI
npm run test:ui
```

### 构建分析
```bash
# 分析构建包大小
npm run analyze
```

## 📊 数据库设计

### 核心表结构
- `profiles` - 用户档案
- `okrs` - OKR目标
- `chat_messages` - 聊天记录
- `notifications` - 通知消息
- `analytics_events` - 分析事件

### 数据关系
```sql
profiles (1) -> (n) okrs
profiles (1) -> (n) chat_messages
profiles (1) -> (n) notifications
profiles (1) -> (n) analytics_events
```

## 🔐 安全特性

- 🔒 JWT身份认证
- 🛡️ 行级安全策略
- 🔑 API密钥管理
- 🚫 XSS防护
- 🔐 CSRF保护

## 📈 性能优化

- ⚡ 代码分割
- 🗜️ 资源压缩
- 📦 Tree Shaking
- 🎯 懒加载
- 💾 缓存策略

## 🌍 国际化

- 🇨🇳 简体中文
- 🇺🇸 English (计划中)
- 🌐 多语言支持框架

## 📱 PWA支持

- 📲 离线访问
- 🔔 推送通知
- 📱 应用安装
- 🔄 后台同步

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Supabase](https://supabase.com/) - 开源Firebase替代方案
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue状态管理库

## 📞 联系我们

- 📧 Email: support@aio-learning.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/aio-learning-system/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/your-org/aio-learning-system/discussions)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

**让学习更智能，让成长更高效！** 🚀