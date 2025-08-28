-- 修复 user_profiles 表结构
-- 确保 full_name 列存在并修复触发器函数

-- 检查并添加 full_name 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name VARCHAR(100);
        RAISE NOTICE 'Added full_name column to user_profiles table';
    ELSE
        RAISE NOTICE 'full_name column already exists in user_profiles table';
    END IF;
END $$;

-- 删除现有的触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 重新创建触发器函数，确保正确处理元数据
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入用户档案，使用多种可能的元数据字段
    INSERT INTO public.user_profiles (user_id, full_name)
    VALUES (
        NEW.id, 
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        )
    );
    
    -- 插入成长画像
    INSERT INTO public.growth_profiles (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 记录错误但不阻止用户创建
        RAISE WARNING 'Error in handle_new_user(): %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 验证表结构
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'user_profiles.full_name column verified successfully';
    ELSE
        RAISE EXCEPTION 'user_profiles.full_name column still missing after migration';
    END IF;
END $$;