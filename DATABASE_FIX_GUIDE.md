# OKR数据库错误修复指南

## 错误信息
`"message": "Could not find the 'category' column of 'okrs' in the schema cache"`

## 问题诊断
这个错误表明Supabase数据库中的`okrs`表缺少`category`列，或者表结构与代码不匹配。

## 修复步骤

### 1. 访问数据库调试页面
1. 启动应用: http://localhost:3005
2. 登录后访问: http://localhost:3005/debug/database
3. 依次点击测试按钮来诊断问题

### 2. 在Supabase Dashboard执行SQL修复

访问你的Supabase项目控制台 → SQL Editor，执行以下SQL：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'okrs';

-- 如果表存在，检查字段
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'okrs'
ORDER BY ordinal_position;
```

### 3. 创建/修复OKR表结构

```sql
-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建完整的OKR表
CREATE TABLE IF NOT EXISTS public.okrs (
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

-- 创建关键结果表
CREATE TABLE IF NOT EXISTS public.key_results (
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

-- 启用行级安全
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
DROP POLICY IF EXISTS "Users can manage their own OKRs" ON public.okrs;
CREATE POLICY "Users can manage their own OKRs" ON public.okrs
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own key results" ON public.key_results;
CREATE POLICY "Users can manage their own key results" ON public.key_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.okrs 
            WHERE okrs.id = key_results.okr_id 
            AND okrs.user_id = auth.uid()
        )
    );

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_category ON public.okrs(category);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);
```

### 4. 如果表已存在但缺少字段，添加缺失的字段

```sql
-- 添加缺失的category字段
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'learning';

-- 添加其他可能缺失的字段
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
```

### 5. 验证修复

执行SQL验证修复结果：

```sql
-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'okrs'
ORDER BY ordinal_position;

-- 测试插入数据
INSERT INTO public.okrs (user_id, title, description, category, priority)
VALUES (auth.uid(), '测试OKR', '测试描述', 'learning', 'medium');

-- 查看插入的数据
SELECT * FROM public.okrs WHERE user_id = auth.uid();
```

### 6. 前端测试

1. 刷新应用页面
2. 访问: http://localhost:3005/debug/database
3. 运行所有检查，确保都显示绿色✅
4. 测试创建OKR功能
5. 访问OKR列表页面确认功能正常

## 常见问题

### Q: 执行SQL时提示权限错误
**A:** 确保你在Supabase项目的SQL Editor中执行，而不是通过客户端代码

### Q: 表创建成功但RLS策略报错
**A:** 确保你的Supabase项目启用了认证功能，并且用户已登录

### Q: 数据插入成功但查询为空
**A:** 检查RLS策略是否正确，确保 `auth.uid()` 能正确获取当前用户ID

## 预防措施

1. 在开发环境中始终先执行数据库迁移
2. 使用版本控制管理数据库schema变更
3. 在修改表结构前先备份数据
4. 定期检查Supabase控制台的表结构