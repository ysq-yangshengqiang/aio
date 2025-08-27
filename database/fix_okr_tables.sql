-- 启明星OKR系统表创建脚本
-- 确保所有必需的字段都存在

-- 删除已存在的表（如果需要重建）
-- DROP TABLE IF EXISTS public.key_results;
-- DROP TABLE IF EXISTS public.okrs;

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建OKR目标表
CREATE TABLE IF NOT EXISTS public.okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'learning',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_category ON public.okrs(category);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);

-- 启用行级安全策略
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户只能操作自己的OKR" ON public.okrs;
DROP POLICY IF EXISTS "用户只能操作自己OKR的关键结果" ON public.key_results;

-- 创建RLS策略
-- OKR策略
CREATE POLICY "用户只能操作自己的OKR" ON public.okrs
    FOR ALL USING (auth.uid() = user_id);

-- 关键结果策略
CREATE POLICY "用户只能操作自己OKR的关键结果" ON public.key_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.okrs 
            WHERE okrs.id = key_results.okr_id 
            AND okrs.user_id = auth.uid()
        )
    );

-- 创建触发器函数：自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
DROP TRIGGER IF EXISTS update_okrs_updated_at ON public.okrs;
DROP TRIGGER IF EXISTS update_key_results_updated_at ON public.key_results;

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON public.okrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'okrs'
ORDER BY ordinal_position;