-- 启明星学生AI管理系统数据库表结构
-- 创建时间: 2025-01-27

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 用户扩展信息表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(100),
    major VARCHAR(100),
    grade INTEGER,
    class_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OKR目标表
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

-- 关键结果表
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

-- 聊天会话表
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) DEFAULT '新对话',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知识库向量表
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200),
    content TEXT NOT NULL,
    source VARCHAR(200),
    category VARCHAR(50),
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习活动记录表
CREATE TABLE IF NOT EXISTS public.learning_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    okr_id UUID REFERENCES public.okrs(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI推荐表
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    okr_id UUID REFERENCES public.okrs(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 成长画像表
CREATE TABLE IF NOT EXISTS public.growth_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_tags JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    learning_path JSONB DEFAULT '{}',
    strengths JSONB DEFAULT '[]',
    improvement_areas JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知表
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON public.okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_id ON public.learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 启用行级安全策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户档案策略
CREATE POLICY "用户只能操作自己的档案" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

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

-- 聊天会话策略
CREATE POLICY "用户只能操作自己的聊天会话" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 聊天消息策略
CREATE POLICY "用户只能操作自己会话的消息" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 学习活动策略
CREATE POLICY "用户只能操作自己的学习活动" ON public.learning_activities
    FOR ALL USING (auth.uid() = user_id);

-- AI推荐策略
CREATE POLICY "用户只能操作自己的AI推荐" ON public.ai_recommendations
    FOR ALL USING (auth.uid() = user_id);

-- 成长画像策略
CREATE POLICY "用户只能操作自己的成长画像" ON public.growth_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 通知策略
CREATE POLICY "用户只能操作自己的通知" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- 知识库策略（所有认证用户可读）
CREATE POLICY "认证用户可以读取知识库" ON public.knowledge_chunks
    FOR SELECT USING (auth.role() = 'authenticated');

-- 创建触发器函数：自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON public.okrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_profiles_updated_at BEFORE UPDATE ON public.growth_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建用户注册后自动创建档案的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    INSERT INTO public.growth_profiles (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册后自动创建档案
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建获取用户统计数据的函数
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalOkrs', (SELECT COUNT(*) FROM public.okrs WHERE user_id = user_uuid),
        'activeOkrs', (SELECT COUNT(*) FROM public.okrs WHERE user_id = user_uuid AND status = 'active'),
        'completedOkrs', (SELECT COUNT(*) FROM public.okrs WHERE user_id = user_uuid AND status = 'completed'),
        'averageProgress', (
            SELECT COALESCE(AVG(progress), 0)::INTEGER 
            FROM public.okrs 
            WHERE user_id = user_uuid
        ),
        'totalActivities', (SELECT COUNT(*) FROM public.learning_activities WHERE user_id = user_uuid),
        'totalChatSessions', (SELECT COUNT(*) FROM public.chat_sessions WHERE user_id = user_uuid),
        'unreadNotifications', (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND is_read = FALSE)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建RAG搜索函数
CREATE OR REPLACE FUNCTION public.search_knowledge(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    content TEXT,
    source VARCHAR(200),
    category VARCHAR(50),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        knowledge_chunks.id,
        knowledge_chunks.title,
        knowledge_chunks.content,
        knowledge_chunks.source,
        knowledge_chunks.category,
        1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_chunks
    WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;