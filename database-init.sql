-- 启明星平台数据库初始化脚本
-- 在Supabase SQL Editor中执行此脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建用户档案表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT,
    student_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建OKR表
CREATE TABLE IF NOT EXISTS public.okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    key_results JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建聊天记录表
CREATE TABLE IF NOT EXISTS public.chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID DEFAULT uuid_generate_v4(),
    message JSONB NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建知识库向量表
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'formula')),
    source TEXT,
    tags TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建学习活动表
CREATE TABLE IF NOT EXISTS public.learning_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('study', 'exercise', 'project', 'exam')),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    related_okr_id UUID REFERENCES public.okrs(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建技能标签表
CREATE TABLE IF NOT EXISTS public.skill_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建用户技能关联表
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skill_tags(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    acquired_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_id ON public.learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_okr_id ON public.learning_activities(related_okr_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);

-- 启用行级安全策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- 创建安全策略

-- 用户档案策略
CREATE POLICY "用户只能查看和修改自己的档案" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- OKR策略
CREATE POLICY "用户只能操作自己的OKR" ON public.okrs
    FOR ALL USING (auth.uid() = user_id);

-- 聊天记录策略
CREATE POLICY "用户只能操作自己的聊天记录" ON public.chat_history
    FOR ALL USING (auth.uid() = user_id);

-- 知识库策略 - 所有认证用户可读，只有管理员可写
CREATE POLICY "所有认证用户可读知识库" ON public.knowledge_chunks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "只有管理员可写知识库" ON public.knowledge_chunks
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- 学习活动策略
CREATE POLICY "用户只能操作自己的学习活动" ON public.learning_activities
    FOR ALL USING (auth.uid() = user_id);

-- 技能标签策略 - 所有用户可读
CREATE POLICY "所有用户可读技能标签" ON public.skill_tags
    FOR SELECT USING (true);

-- 用户技能策略
CREATE POLICY "用户只能操作自己的技能" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);

-- 创建触发器函数来更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON public.okrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_chunks_updated_at BEFORE UPDATE ON public.knowledge_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_activities_updated_at BEFORE UPDATE ON public.learning_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例技能标签
INSERT INTO public.skill_tags (name, category, description) VALUES
('数据结构', '计算机科学', '包括数组、链表、栈、队列、树、图等数据结构'),
('算法设计', '计算机科学', '包括排序、搜索、动态规划、贪心算法等'),
('Web开发', '软件开发', '包括HTML、CSS、JavaScript、前端框架等'),
('数据库设计', '软件开发', '包括关系型数据库、SQL、数据库优化等'),
('机器学习', '人工智能', '包括监督学习、无监督学习、深度学习等'),
('项目管理', '软技能', '包括敏捷开发、Scrum、项目规划等')
ON CONFLICT (name) DO NOTHING;

-- 创建一些示例知识库内容
INSERT INTO public.knowledge_chunks (title, content, content_type, source, tags) VALUES
('B+树基础概念', 'B+树是一种多路平衡查找树，常用于数据库和文件系统。它的特点是：1. 所有叶子节点都在同一层 2. 叶子节点包含所有关键字 3. 非叶子节点只存储索引信息 4. 支持范围查询和顺序访问', 'text', '数据结构教材', ARRAY['数据结构', 'B+树', '数据库']),
('快速排序算法', '快速排序是一种高效的排序算法，平均时间复杂度为O(nlogn)。它使用分治策略，选择一个基准元素，将数组分为两部分，递归地对子数组进行排序。', 'text', '算法导论', ARRAY['算法', '排序', '分治']),
('Vue.js组件通信', 'Vue.js中组件间通信有多种方式：1. Props向下传递 2. Emit向上传递 3. Provide/Inject跨层级传递 4. Vuex状态管理 5. 事件总线', 'text', 'Vue.js官方文档', ARRAY['Vue.js', '前端开发', '组件通信'])
ON CONFLICT DO NOTHING;

-- 创建函数来获取用户的OKR进度
CREATE OR REPLACE FUNCTION get_user_okr_progress(user_uuid UUID)
RETURNS TABLE (
    okr_id UUID,
    objective TEXT,
    progress INTEGER,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.objective,
        o.progress,
        CASE 
            WHEN o.end_date IS NOT NULL THEN 
                GREATEST(0, (o.end_date - CURRENT_DATE))
            ELSE NULL
        END as days_remaining
    FROM public.okrs o
    WHERE o.user_id = user_uuid AND o.status = 'active'
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数来搜索知识库
CREATE OR REPLACE FUNCTION search_knowledge(query_text TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    content TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.title,
        k.content,
        (k.embedding <=> query_text::vector) as similarity
    FROM public.knowledge_chunks k
    WHERE k.embedding IS NOT NULL
    ORDER BY similarity ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予必要的权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 创建默认角色字段（如果需要）
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- 插入默认管理员用户（需要手动创建）
-- 注意：这里只是示例，实际使用时需要根据真实用户ID来设置
-- INSERT INTO public.user_profiles (user_id, name, role) VALUES 
-- ('your-admin-user-id', '系统管理员', 'admin');

COMMENT ON TABLE public.user_profiles IS '用户档案表，存储用户的基本信息';
COMMENT ON TABLE public.okrs IS 'OKR目标管理表，存储用户的学习目标';
COMMENT ON TABLE public.chat_history IS '聊天记录表，存储用户与AI的对话';
COMMENT ON TABLE public.knowledge_chunks IS '知识库表，存储学习资料和向量化内容';
COMMENT ON TABLE public.learning_activities IS '学习活动表，记录用户的学习行为';
COMMENT ON TABLE public.skill_tags IS '技能标签表，定义可学习的技能';
COMMENT ON TABLE public.user_skills IS '用户技能关联表，记录用户掌握的技能水平';
