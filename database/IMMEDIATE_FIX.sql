-- 立即修复：OKR表结构问题
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
ORDER BY table_name, ordinal_position;