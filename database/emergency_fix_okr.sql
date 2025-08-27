-- 紧急修复：为OKR功能创建完整表结构
-- 在Supabase SQL Editor中执行此脚本

-- 1. 检查现有表（可选）
DO $$ 
BEGIN
    RAISE NOTICE '检查现有表...';
    
    -- 显示现有的okrs表结构（如果存在）
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'okrs') THEN
        RAISE NOTICE 'okrs表已存在';
        
        -- 显示列信息
        PERFORM column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'okrs';
    ELSE
        RAISE NOTICE 'okrs表不存在，将创建新表';
    END IF;
END $$;

-- 2. 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. 删除现有表（如果需要重建）
-- 警告：这会删除所有数据！
-- DROP TABLE IF EXISTS public.key_results CASCADE;
-- DROP TABLE IF EXISTS public.okrs CASCADE;

-- 4. 创建OKR表
CREATE TABLE IF NOT EXISTS public.okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'learning',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    start_date DATE,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT okrs_progress_check CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT okrs_status_check CHECK (status IN ('active', 'completed', 'paused', 'draft')),
    CONSTRAINT okrs_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT okrs_category_check CHECK (category IN ('learning', 'career', 'personal', 'health', 'project'))
);

-- 5. 创建关键结果表
CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    okr_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT key_results_okr_id_fkey FOREIGN KEY (okr_id) REFERENCES public.okrs(id) ON DELETE CASCADE,
    CONSTRAINT key_results_status_check CHECK (status IN ('active', 'completed', 'paused'))
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_category ON public.okrs(category);
CREATE INDEX IF NOT EXISTS idx_okrs_created_at ON public.okrs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);

-- 7. 启用行级安全 (RLS)
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- 8. 删除可能存在的旧策略
DROP POLICY IF EXISTS "users_can_crud_own_okrs" ON public.okrs;
DROP POLICY IF EXISTS "users_can_crud_own_key_results" ON public.key_results;

-- 9. 创建RLS策略
CREATE POLICY "users_can_crud_own_okrs" ON public.okrs
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_crud_own_key_results" ON public.key_results
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.okrs 
            WHERE okrs.id = key_results.okr_id 
            AND okrs.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.okrs 
            WHERE okrs.id = key_results.okr_id 
            AND okrs.user_id = auth.uid()
        )
    );

-- 10. 创建触发器函数（自动更新 updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 创建触发器
DROP TRIGGER IF EXISTS update_okrs_updated_at ON public.okrs;
DROP TRIGGER IF EXISTS update_key_results_updated_at ON public.key_results;

CREATE TRIGGER update_okrs_updated_at 
    BEFORE UPDATE ON public.okrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at 
    BEFORE UPDATE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 验证表结构
SELECT 
    'okrs' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'okrs'
ORDER BY ordinal_position;

SELECT 
    'key_results' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'key_results'
ORDER BY ordinal_position;

-- 13. 测试数据插入（可选）
-- INSERT INTO public.okrs (user_id, title, description, category, priority)
-- VALUES (auth.uid(), '测试OKR', '这是一个测试OKR', 'learning', 'medium');

-- 显示成功消息
SELECT 'OKR表结构创建完成！' as result;