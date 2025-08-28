-- 检查chat_sessions表的实际结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chat_sessions'
ORDER BY ordinal_position;

-- 如果表不存在，创建最简单的版本
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) DEFAULT '新对话',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略并重新创建
DROP POLICY IF EXISTS "用户只能操作自己的聊天会话" ON public.chat_sessions;
CREATE POLICY "用户只能操作自己的聊天会话" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 确保chat_messages表也存在
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 创建消息策略
DROP POLICY IF EXISTS "用户只能操作自己会话的消息" ON public.chat_messages;
CREATE POLICY "用户只能操作自己会话的消息" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 通知PostgREST重新加载模式
NOTIFY pgrst, 'reload schema';