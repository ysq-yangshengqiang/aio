-- 手动修复 user_profiles 表结构的 SQL 脚本
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本

-- 1. 检查并添加 full_name 列
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name VARCHAR(100);
        RAISE NOTICE '✅ 已添加 full_name 列到 user_profiles 表';
    ELSE
        RAISE NOTICE '✅ user_profiles 表中已存在 full_name 列';
    END IF;
END $$;

-- 2. 删除现有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 重新创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入用户档案
    INSERT INTO public.user_profiles (user_id, full_name)
    VALUES (
        NEW.id, 
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        )
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            user_profiles.full_name,
            NEW.email
        ),
        updated_at = NOW();
    
    -- 插入成长画像（如果不存在）
    INSERT INTO public.growth_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 记录错误但不阻止用户创建
        RAISE WARNING '用户档案创建错误: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 验证修复结果
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 检查触发器是否正确创建
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

RAISE NOTICE '🎉 数据库修复完成！现在可以正常注册用户了。';