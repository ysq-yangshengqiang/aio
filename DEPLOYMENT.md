# 🚀 启明星平台部署指南

## 📋 前置要求

- Supabase项目已创建
- 项目URL和API密钥已获取
- 本地开发环境已配置

## 🗄️ 数据库初始化

### 1. 在Supabase中执行SQL脚本

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor** 页面
4. 复制 `database-init.sql` 文件中的所有内容
5. 粘贴到SQL编辑器中
6. 点击 **Run** 执行脚本

### 2. 验证表结构

执行完成后，在 **Table Editor** 中应该能看到以下表：

- `user_profiles` - 用户档案
- `okrs` - OKR目标管理
- `chat_history` - 聊天记录
- `knowledge_chunks` - 知识库
- `learning_activities` - 学习活动
- `skill_tags` - 技能标签
- `user_skills` - 用户技能

### 3. 检查行级安全策略

在 **Authentication > Policies** 中确认所有表都已启用RLS策略。

## 🔧 环境变量配置

### 1. 创建本地环境文件

在项目根目录创建 `.env.local` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=https://loshwjvlhpohvdsxcjgi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2h3anZsaHBvaHZkc3hjamdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDIyNzEsImV4cCI6MjA3MTMxODI3MX0.QR2ddh0dPzqQXzPsF4-Dntz9We7ijVhgiRcGp9fkTdk

# AI API配置 (后续扩展使用)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_API_URL=https://api.openai.com/v1
```

### 2. 重启开发服务器

```bash
npm run dev
```

## 🧪 功能测试

### 1. 用户注册测试

1. 访问应用首页
2. 点击"立即注册"
3. 填写注册信息（姓名、邮箱、密码、学号）
4. 提交注册表单
5. 检查数据库中是否创建了用户档案

### 2. 用户登录测试

1. 使用注册的邮箱和密码登录
2. 检查是否成功跳转到仪表板
3. 检查用户档案是否正确加载

### 3. OKR创建测试

1. 在仪表板中点击"创建OKR"
2. 填写学习目标和关键结果
3. 提交表单
4. 检查OKR是否正确显示

### 4. AI聊天测试

1. 在聊天框中输入"解释一下B+树"
2. 检查是否从知识库返回相关答案
3. 测试其他问题类型

## 🔍 常见问题排查

### 1. 环境变量问题

**症状**: 控制台显示"Missing Supabase environment variables"

**解决**: 
- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确
- 重启开发服务器

### 2. 数据库连接问题

**症状**: 注册/登录失败，控制台显示数据库错误

**解决**:
- 检查Supabase项目状态
- 确认API密钥正确
- 检查网络连接

### 3. 权限问题

**症状**: 某些操作返回权限错误

**解决**:
- 检查RLS策略是否正确配置
- 确认用户认证状态
- 检查表权限设置

### 4. 向量搜索问题

**症状**: 知识库搜索失败

**解决**:
- 确认pgvector扩展已启用
- 检查向量索引是否正确创建
- 验证搜索函数是否存在

## 📊 监控和维护

### 1. 数据库性能监控

在Supabase Dashboard中监控：
- 查询性能
- 存储使用情况
- 连接数

### 2. 日志分析

查看应用日志和数据库日志，识别潜在问题。

### 3. 定期备份

Supabase自动提供数据库备份，建议定期验证备份完整性。

## 🚀 生产环境部署

### 1. 构建生产版本

```bash
npm run build
```

### 2. 部署到Vercel

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 3. 配置域名

在Vercel中配置自定义域名（可选）。

## 📚 后续扩展

### 1. 集成真实AI服务

- 配置OpenAI API
- 实现向量化搜索
- 添加智能推荐

### 2. 添加更多功能

- 学习进度追踪
- 技能评估
- 社交学习功能

### 3. 性能优化

- 实现缓存策略
- 优化数据库查询
- 添加CDN支持

---

## 🆘 获取帮助

如果遇到问题：

1. 检查本文档的常见问题部分
2. 查看Supabase官方文档
3. 在项目Issues中提问
4. 联系技术支持团队

**祝您部署顺利！** 🎉
