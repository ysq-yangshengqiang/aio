-- 为 key_results 表添加缺失的 progress 列
-- 执行时间: 2025-01-27
-- 目的: 修复 API 查询中 key_results.progress 字段不存在的错误

-- 添加 progress 列到 key_results 表
ALTER TABLE public.key_results 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- 为现有记录计算并设置进度值
-- 基于 current_value 和 target_value 的比例计算
UPDATE public.key_results 
SET progress = CASE 
    WHEN target_value IS NOT NULL AND target_value > 0 
    THEN LEAST(ROUND((current_value / target_value) * 100), 100)
    ELSE 0 
END
WHERE progress IS NULL OR progress = 0;

-- 添加注释说明
COMMENT ON COLUMN public.key_results.progress IS '关键结果完成进度百分比 (0-100)';

-- 创建函数：自动更新关键结果进度
CREATE OR REPLACE FUNCTION update_key_result_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 当 current_value 或 target_value 更新时，自动计算进度
    IF (TG_OP = 'UPDATE' AND (OLD.current_value != NEW.current_value OR OLD.target_value != NEW.target_value)) 
       OR TG_OP = 'INSERT' THEN
        
        IF NEW.target_value IS NOT NULL AND NEW.target_value > 0 THEN
            NEW.progress = LEAST(ROUND((NEW.current_value / NEW.target_value) * 100), 100);
        ELSE
            NEW.progress = 0;
        END IF;
        
        -- 如果进度达到100%，自动设置状态为已完成
        IF NEW.progress >= 100 THEN
            NEW.status = 'completed';
        ELSIF NEW.progress > 0 AND NEW.status = 'active' THEN
            NEW.status = 'in_progress';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新关键结果进度
DROP TRIGGER IF EXISTS trigger_update_key_result_progress ON public.key_results;
CREATE TRIGGER trigger_update_key_result_progress
    BEFORE INSERT OR UPDATE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_key_result_progress();

-- 创建函数：自动更新OKR总体进度
CREATE OR REPLACE FUNCTION update_okr_progress_from_key_results()
RETURNS TRIGGER AS $$
DECLARE
    okr_progress INTEGER;
    total_key_results INTEGER;
    completed_key_results INTEGER;
BEGIN
    -- 获取该OKR下所有关键结果的统计
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN progress >= 100 THEN 1 END),
        COALESCE(AVG(progress), 0)
    INTO 
        total_key_results,
        completed_key_results,
        okr_progress
    FROM public.key_results 
    WHERE okr_id = COALESCE(NEW.okr_id, OLD.okr_id);
    
    -- 更新OKR的进度
    UPDATE public.okrs 
    SET 
        progress = okr_progress,
        status = CASE 
            WHEN completed_key_results = total_key_results AND total_key_results > 0 THEN 'completed'
            WHEN okr_progress > 0 THEN 'in_progress'
            ELSE 'active'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.okr_id, OLD.okr_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：关键结果变化时自动更新OKR进度
DROP TRIGGER IF EXISTS trigger_update_okr_progress ON public.key_results;
CREATE TRIGGER trigger_update_okr_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_okr_progress_from_key_results();

-- 验证迁移结果
DO $$
BEGIN
    -- 检查 progress 列是否存在
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'key_results' 
        AND column_name = 'progress'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ key_results.progress 列已成功添加';
    ELSE
        RAISE EXCEPTION '❌ key_results.progress 列添加失败';
    END IF;
    
    -- 显示当前表结构
    RAISE NOTICE '📋 key_results 表当前结构:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'key_results' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
END $$;