-- Chat System Enhancement Migration
-- 为现有数据库添加AI聊天系统增强功能
-- 执行时间: 2025-01-28

-- 1. 检查并添加缺失的AI配置表
CREATE TABLE IF NOT EXISTS public.ai_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_name VARCHAR(50) DEFAULT 'default',
    model_provider VARCHAR(50) DEFAULT 'n8n',
    model_name VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, config_name)
);

-- 2. 检查并添加缺失的对话上下文表
CREATE TABLE IF NOT EXISTS public.conversation_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type VARCHAR(50) DEFAULT 'full_context',
    context_data JSONB DEFAULT '{}',
    context_summary TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 0.0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 检查并添加缺失的AI响应缓存表
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    prompt_hash VARCHAR(64) NOT NULL,
    response_content TEXT NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    context_summary TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    hit_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 检查并添加缺失的聊天统计表
CREATE TABLE IF NOT EXISTS public.chat_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    assistant_messages INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 5. 检查并添加缺失的N8N工作流表
CREATE TABLE IF NOT EXISTS public.n8n_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    webhook_url TEXT NOT NULL,
    workflow_type VARCHAR(50) DEFAULT 'chat' CHECK (workflow_type IN ('chat', 'chat_stream', 'context', 'custom')),
    description TEXT,
    timeout_seconds INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT false,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workflow_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- 6. 检查并添加缺失的N8N请求日志表
CREATE TABLE IF NOT EXISTS public.n8n_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES public.n8n_workflows(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time INTEGER, -- milliseconds
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 检查chat_sessions表是否缺少列，如果缺少则添加
DO $$
BEGIN
    -- 检查并添加status列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='chat_sessions' AND column_name='status'
    ) THEN
        ALTER TABLE public.chat_sessions ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- 检查并添加ai_config列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='chat_sessions' AND column_name='ai_config'
    ) THEN
        ALTER TABLE public.chat_sessions ADD COLUMN ai_config JSONB DEFAULT '{}';
    END IF;
END $$;

-- 8. 检查user_profiles表是否缺少列，如果缺少则添加
DO $$
BEGIN
    -- 检查并添加learning_goals列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_profiles' AND column_name='learning_goals'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN learning_goals JSONB DEFAULT '[]';
    END IF;
    
    -- 检查并添加skills列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_profiles' AND column_name='skills'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN skills JSONB DEFAULT '[]';
    END IF;
    
    -- 检查并添加username列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_profiles' AND column_name='username'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN username VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- 9. 检查learning_activities表是否缺少列
DO $$
BEGIN
    -- 检查并添加tags列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='learning_activities' AND column_name='tags'
    ) THEN
        ALTER TABLE public.learning_activities ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
END $$;

-- 10. 检查okrs表是否缺少列
DO $$
BEGIN
    -- 检查并添加is_public列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='okrs' AND column_name='is_public'
    ) THEN
        ALTER TABLE public.okrs ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 11. 创建新增表的索引
CREATE INDEX IF NOT EXISTS idx_ai_configurations_user_id ON public.ai_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_active ON public.ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_session_id ON public.conversation_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON public.conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_user_id ON public.ai_response_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires_at ON public.ai_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_statistics_user_id_date ON public.chat_statistics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_user_id ON public.n8n_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON public.n8n_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_n8n_request_logs_workflow_id ON public.n8n_request_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_n8n_request_logs_session_id ON public.n8n_request_logs(session_id);

-- 12. 启用新表的行级安全策略
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_request_logs ENABLE ROW LEVEL SECURITY;

-- 13. 创建新表的RLS策略
-- AI配置策略
CREATE POLICY "用户只能操作自己的AI配置" ON public.ai_configurations
    FOR ALL USING (auth.uid() = user_id);

-- 对话上下文策略
CREATE POLICY "用户只能操作自己的对话上下文" ON public.conversation_contexts
    FOR ALL USING (auth.uid() = user_id);

-- AI响应缓存策略
CREATE POLICY "用户只能操作自己的AI缓存" ON public.ai_response_cache
    FOR ALL USING (auth.uid() = user_id);

-- 聊天统计策略
CREATE POLICY "用户只能操作自己的聊天统计" ON public.chat_statistics
    FOR ALL USING (auth.uid() = user_id);

-- N8N工作流策略
CREATE POLICY "用户只能操作自己的N8N工作流" ON public.n8n_workflows
    FOR ALL USING (auth.uid() = user_id);

-- N8N请求日志策略
CREATE POLICY "用户只能操作自己的N8N日志" ON public.n8n_request_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.n8n_workflows 
            WHERE n8n_workflows.id = n8n_request_logs.workflow_id 
            AND n8n_workflows.user_id = auth.uid()
        )
    );

-- 14. 为新表创建updated_at触发器
CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON public.ai_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_n8n_workflows_updated_at BEFORE UPDATE ON public.n8n_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. 创建清理过期数据的函数
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_data()
RETURNS void AS $$
BEGIN
    -- 清理过期的对话上下文
    DELETE FROM public.conversation_contexts 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- 清理过期的AI响应缓存
    DELETE FROM public.ai_response_cache 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- 清理超过30天的N8N请求日志
    DELETE FROM public.n8n_request_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE '清理完成：过期的对话上下文、AI缓存和旧日志已删除';
END;
$$ LANGUAGE plpgsql;

-- 16. 创建定期清理任务的调度函数（需要pg_cron扩展）
-- 注意：这需要超级用户权限和pg_cron扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-expired-chat-data', '0 2 * * *', 'SELECT public.cleanup_expired_chat_data();');

-- 17. 创建统计更新函数
CREATE OR REPLACE FUNCTION public.update_chat_statistics()
RETURNS TRIGGER AS $$
DECLARE
    session_user_id UUID;
BEGIN
    -- 获取会话的用户ID
    SELECT user_id INTO session_user_id 
    FROM public.chat_sessions 
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    -- 更新今日统计
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.chat_statistics (user_id, date, total_messages, user_messages, assistant_messages)
        VALUES (
            session_user_id, 
            CURRENT_DATE, 
            1, 
            CASE WHEN NEW.role = 'user' THEN 1 ELSE 0 END,
            CASE WHEN NEW.role = 'assistant' THEN 1 ELSE 0 END
        )
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
            total_messages = chat_statistics.total_messages + 1,
            user_messages = chat_statistics.user_messages + CASE WHEN NEW.role = 'user' THEN 1 ELSE 0 END,
            assistant_messages = chat_statistics.assistant_messages + CASE WHEN NEW.role = 'assistant' THEN 1 ELSE 0 END;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 18. 创建消息统计触发器
DROP TRIGGER IF EXISTS update_chat_statistics_trigger ON public.chat_messages;
CREATE TRIGGER update_chat_statistics_trigger
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_statistics();

-- 完成消息
SELECT 'Chat System Enhancement Migration Completed Successfully' as status;