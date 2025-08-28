-- 紧急修复：确保chat_sessions表结构正确
-- 这个脚本修复当前遇到的 'context' 列问题

DO $$
BEGIN
    -- 确保chat_sessions表存在
    CREATE TABLE IF NOT EXISTS public.chat_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title VARCHAR(200) DEFAULT '新对话',
        context JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 确保context列存在且类型正确
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='chat_sessions' AND column_name='context' AND table_schema='public'
    ) THEN
        ALTER TABLE public.chat_sessions ADD COLUMN context JSONB DEFAULT '{}';
        RAISE NOTICE 'Added context column to chat_sessions table';
    END IF;
    
    -- 确保chat_messages表存在
    CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 启用RLS如果尚未启用
    ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    
    -- 创建或替换策略
    DROP POLICY IF EXISTS "用户只能操作自己的聊天会话" ON public.chat_sessions;
    CREATE POLICY "用户只能操作自己的聊天会话" ON public.chat_sessions
        FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "用户只能操作自己会话的消息" ON public.chat_messages;
    CREATE POLICY "用户只能操作自己会话的消息" ON public.chat_messages
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.chat_sessions 
                WHERE chat_sessions.id = chat_messages.session_id 
                AND chat_sessions.user_id = auth.uid()
            )
        );
    
    -- 创建索引（如果不存在）
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
    
    RAISE NOTICE 'Chat tables structure verified and fixed if needed';
END $$;