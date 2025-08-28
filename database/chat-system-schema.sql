-- AI聊天助手系统数据库架构设计
-- 基于Supabase PostgreSQL

-- 1. 聊天会话表 (扩展现有表)
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 为会话表添加索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity_at DESC);

-- 2. 消息表 (扩展现有表)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating VARCHAR(10) CHECK (rating IN ('like', 'dislike')),
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS thread_id UUID;

-- 为消息表添加索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_rating ON chat_messages(rating) WHERE rating IS NOT NULL;

-- 3. AI配置表 (用户个性化AI设置)
CREATE TABLE IF NOT EXISTS ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_name VARCHAR(100) NOT NULL DEFAULT 'default',
    model_provider VARCHAR(50) NOT NULL DEFAULT 'n8n',
    model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0 AND max_tokens <= 8000),
    system_prompt TEXT,
    custom_settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, config_name)
);

-- 为AI配置表添加索引
CREATE INDEX IF NOT EXISTS idx_ai_configurations_user ON ai_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_default ON ai_configurations(user_id, is_default) WHERE is_default = TRUE;

-- 4. 对话上下文管理表
CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL, -- 'user_profile', 'okr_data', 'conversation_history', 'knowledge_base'
    context_data JSONB NOT NULL,
    context_summary TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为上下文表添加索引
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_session ON conversation_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_type ON conversation_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_relevance ON conversation_contexts(relevance_score DESC);

-- 5. AI响应缓存表 (优化性能)
CREATE TABLE IF NOT EXISTS ai_response_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the processed prompt
    context_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the context
    response_content TEXT NOT NULL,
    model_config JSONB NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    hit_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(prompt_hash, context_hash)
);

-- 为缓存表添加索引
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_hash ON ai_response_cache(prompt_hash, context_hash);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);

-- 6. 聊天统计表
CREATE TABLE IF NOT EXISTS chat_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0,
    sessions_created INTEGER DEFAULT 0,
    ai_provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date, ai_provider)
);

-- 为统计表添加索引
CREATE INDEX IF NOT EXISTS idx_chat_statistics_user_date ON chat_statistics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_statistics_provider ON chat_statistics(ai_provider, date DESC);

-- 7. n8n工作流集成表
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_name VARCHAR(100) NOT NULL,
    workflow_id VARCHAR(100) NOT NULL, -- n8n workflow ID
    webhook_url TEXT NOT NULL,
    workflow_type VARCHAR(50) NOT NULL DEFAULT 'chat', -- 'chat', 'analysis', 'planning', etc.
    input_schema JSONB,
    output_schema JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit INTEGER DEFAULT 100, -- requests per hour
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, workflow_name)
);

-- 为n8n工作流表添加索引
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_user ON n8n_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_type ON n8n_workflows(workflow_type);

-- 8. n8n请求日志表
CREATE TABLE IF NOT EXISTS n8n_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES n8n_workflows(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    response_time INTEGER, -- milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为请求日志表添加索引
CREATE INDEX IF NOT EXISTS idx_n8n_request_logs_workflow ON n8n_request_logs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_request_logs_session ON n8n_request_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_request_logs_status ON n8n_request_logs(status_code);

-- 9. 创建视图：用户聊天概览
CREATE OR REPLACE VIEW user_chat_overview AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(cm.id) as total_messages,
    COUNT(CASE WHEN cm.role = 'user' THEN 1 END) as user_messages,
    COUNT(CASE WHEN cm.role = 'assistant' THEN 1 END) as ai_messages,
    SUM(cm.tokens_used) as total_tokens_used,
    AVG(cm.response_time) as avg_response_time,
    MAX(cs.updated_at) as last_chat_at
FROM auth.users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY u.id, u.email;

-- 10. 创建函数：清理过期数据
CREATE OR REPLACE FUNCTION cleanup_expired_data() 
RETURNS void AS $$
BEGIN
    -- 清理过期的AI响应缓存
    DELETE FROM ai_response_cache 
    WHERE expires_at < NOW();
    
    -- 清理30天前的请求日志
    DELETE FROM n8n_request_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- 清理过期的上下文数据
    DELETE FROM conversation_contexts 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- 更新统计信息
    ANALYZE chat_sessions, chat_messages, ai_response_cache;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建触发器：自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用更新时间戳触发器
CREATE TRIGGER update_ai_configurations_updated_at 
    BEFORE UPDATE ON ai_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_contexts_updated_at 
    BEFORE UPDATE ON conversation_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_n8n_workflows_updated_at 
    BEFORE UPDATE ON n8n_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Row Level Security (RLS) 策略
-- AI配置表RLS
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_configurations_policy ON ai_configurations
    FOR ALL USING (auth.uid() = user_id);

-- 上下文表RLS（通过session关联）
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_contexts_policy ON conversation_contexts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE id = conversation_contexts.session_id 
            AND user_id = auth.uid()
        )
    );

-- n8n工作流表RLS
ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY n8n_workflows_policy ON n8n_workflows
    FOR ALL USING (auth.uid() = user_id);

-- 请求日志表RLS（只读）
ALTER TABLE n8n_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY n8n_request_logs_policy ON n8n_request_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM n8n_workflows 
            WHERE id = n8n_request_logs.workflow_id 
            AND user_id = auth.uid()
        )
    );

-- 13. 创建初始AI配置
INSERT INTO ai_configurations (user_id, config_name, system_prompt, is_default)
SELECT 
    id,
    'default',
    '你是启明星AI学习助手，专门帮助用户制定和跟踪学习目标。你具有以下特点：
1. 友善、耐心、专业
2. 基于用户的OKR数据提供个性化建议
3. 能够分析学习进度并给出具体的改进建议
4. 擅长制定可执行的学习计划
5. 用简洁清晰的语言回答问题

请始终保持积极正面的态度，鼓励用户持续学习和进步。',
    true
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM ai_configurations 
    WHERE ai_configurations.user_id = auth.users.id
);

-- 完成数据库架构设置
COMMENT ON TABLE ai_configurations IS 'AI配置表，存储用户个性化的AI设置';
COMMENT ON TABLE conversation_contexts IS '对话上下文管理表，存储会话相关的上下文信息';
COMMENT ON TABLE ai_response_cache IS 'AI响应缓存表，提高响应速度和降低成本';
COMMENT ON TABLE chat_statistics IS '聊天统计表，记录用户使用情况';
COMMENT ON TABLE n8n_workflows IS 'n8n工作流集成表，管理外部AI服务';
COMMENT ON TABLE n8n_request_logs IS 'n8n请求日志表，记录API调用情况';