import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  sessionId: string
  message: string
  userId: string
  context?: any
  aiConfig?: any
}

interface N8NWorkflow {
  id: string
  webhook_url: string
  timeout_seconds: number
  is_active: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request
    const { sessionId, message, userId, context = {}, aiConfig = {} }: ChatRequest = await req.json()

    if (!sessionId || !message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, message, userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user's AI configuration
    const { data: userConfig, error: configError } = await supabaseClient
      .from('ai_configurations')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError && configError.code !== 'PGRST116') {
      console.error('Failed to get user AI config:', configError)
    }

    const finalConfig = {
      model_provider: 'n8n',
      model_name: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      ...userConfig,
      ...aiConfig
    }

    // Get n8n workflow configuration
    const { data: workflow, error: workflowError } = await supabaseClient
      .from('n8n_workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('workflow_type', 'chat')
      .eq('is_active', true)
      .single()

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ 
          error: 'No active n8n workflow found for user. Please configure your n8n integration first.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build context for AI
    const contextData = await buildContext(supabaseClient, userId, sessionId, message)
    
    // Prepare request for n8n workflow
    const n8nRequest = {
      prompt: message,
      context: {
        ...context,
        ...contextData
      },
      config: finalConfig,
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    }

    // Call n8n workflow
    const startTime = Date.now()
    const n8nResponse = await fetch(workflow.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(n8nRequest),
      signal: AbortSignal.timeout((workflow.timeout_seconds || 30) * 1000)
    })

    const responseTime = Date.now() - startTime

    if (!n8nResponse.ok) {
      // Log the failure
      await logN8NRequest(supabaseClient, workflow.id, sessionId, null, {
        request: n8nRequest,
        error: `HTTP ${n8nResponse.status}: ${n8nResponse.statusText}`,
        status_code: n8nResponse.status,
        response_time: responseTime
      })

      return new Response(
        JSON.stringify({ 
          error: `n8n workflow failed: ${n8nResponse.status} ${n8nResponse.statusText}`,
          fallback_response: "抱歉，AI服务暂时不可用，请稍后再试。"
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await n8nResponse.json()

    // Log successful request
    await logN8NRequest(supabaseClient, workflow.id, sessionId, null, {
      request: n8nRequest,
      response: result,
      status_code: n8nResponse.status,
      response_time: responseTime
    })

    // Extract AI response
    const aiResponse = {
      content: result.response || result.content || result.message || "AI回复解析失败",
      tokens_used: result.tokens_used || 0,
      model: result.model || finalConfig.model_name,
      metadata: {
        workflow_id: workflow.id,
        n8n_execution_id: result.execution_id,
        response_time: responseTime,
        context_used: Object.keys(contextData).length > 0,
        ...result.metadata
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: aiResponse
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Chat AI handler error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        fallback_response: "抱歉，AI服务遇到了问题，请稍后再试。"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to build context
async function buildContext(supabaseClient: any, userId: string, sessionId: string, query: string) {
  const context: any = {}

  try {
    // Get user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('username, major, grade, bio, learning_goals, skills')
      .eq('user_id', userId)
      .single()

    if (profile) {
      context.user_profile = {
        username: profile.username,
        major: profile.major,
        grade: profile.grade,
        learning_goals: profile.learning_goals || [],
        skills: profile.skills || []
      }
    }

    // Get active OKRs
    const { data: okrs } = await supabaseClient
      .from('okrs')
      .select(`
        title, description, category, priority, status, progress, target_date,
        key_results (title, status, progress, target_value, current_value)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'in_progress'])
      .order('priority', { ascending: false })
      .limit(3)

    if (okrs && okrs.length > 0) {
      context.active_okrs = okrs.map(okr => ({
        title: okr.title,
        category: okr.category,
        progress: okr.progress,
        key_results: okr.key_results?.length || 0
      }))
    }

    // Get recent conversation history
    const { data: messages } = await supabaseClient
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (messages && messages.length > 0) {
      context.conversation_history = messages.reverse().slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content
      }))
    }

    // Search knowledge base (simplified)
    const keywords = extractKeywords(query)
    if (keywords.length > 0) {
      const { data: activities } = await supabaseClient
        .from('learning_activities')
        .select('title, activity_type, tags')
        .eq('user_id', userId)
        .or(keywords.map(k => `title.ilike.%${k}%`).join(','))
        .limit(3)

      if (activities && activities.length > 0) {
        context.related_activities = activities
      }
    }

  } catch (error) {
    console.error('Context building error:', error)
  }

  return context
}

// Helper function to extract keywords
function extractKeywords(text: string): string[] {
  const stopWords = ['的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '个', '有', '和', '与', '或', '但', '如果', '因为', '所以', '可以', '应该', '需要', '想要', '怎么', '什么', '哪里', '为什么', '如何']
  
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .slice(0, 5)
}

// Helper function to log n8n requests
async function logN8NRequest(
  supabaseClient: any, 
  workflowId: string, 
  sessionId: string, 
  messageId: string | null, 
  logData: any
) {
  try {
    await supabaseClient
      .from('n8n_request_logs')
      .insert({
        workflow_id: workflowId,
        session_id: sessionId,
        message_id: messageId,
        request_data: logData.request,
        response_data: logData.response,
        status_code: logData.status_code,
        response_time: logData.response_time,
        error_message: logData.error
      })
  } catch (error) {
    console.error('Failed to log n8n request:', error)
  }
}