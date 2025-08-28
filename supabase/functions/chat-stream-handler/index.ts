import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StreamChatRequest {
  sessionId: string
  message: string
  userId: string
  context?: any
  aiConfig?: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request
    const { sessionId, message, userId, context = {}, aiConfig = {} }: StreamChatRequest = await req.json()

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
      stream: true,
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
        createSSEResponse('error', { 
          error: 'No active n8n workflow found for user. Please configure your n8n integration first.' 
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      )
    }

    // Build context for AI
    const contextData = await buildStreamContext(supabaseClient, userId, sessionId, message)
    
    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection confirmation
          controller.enqueue(createSSEChunk('connected', { message: 'Stream connected' }))

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
            stream: true,
            timestamp: new Date().toISOString()
          }

          const startTime = Date.now()

          // Call n8n workflow with streaming support
          const n8nResponse = await fetch(workflow.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            },
            body: JSON.stringify(n8nRequest),
            signal: AbortSignal.timeout((workflow.timeout_seconds || 60) * 1000)
          })

          if (!n8nResponse.ok) {
            const errorMsg = `n8n workflow failed: ${n8nResponse.status} ${n8nResponse.statusText}`
            
            // Log the failure
            await logN8NRequest(supabaseClient, workflow.id, sessionId, null, {
              request: n8nRequest,
              error: errorMsg,
              status_code: n8nResponse.status,
              response_time: Date.now() - startTime
            })

            controller.enqueue(createSSEChunk('error', { error: errorMsg }))
            controller.close()
            return
          }

          // Handle streaming response from n8n
          if (n8nResponse.body) {
            const reader = n8nResponse.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedContent = ''
            let finalResult = null

            try {
              while (true) {
                const { value, done } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6))
                      
                      if (data.type === 'content' || data.type === 'delta') {
                        // Stream content to client
                        const content = data.content || data.delta || data.data
                        accumulatedContent += content
                        controller.enqueue(createSSEChunk('content', accumulatedContent))
                      } else if (data.type === 'done' || data.done) {
                        finalResult = {
                          content: accumulatedContent,
                          tokens_used: data.tokens_used || 0,
                          model: data.model || finalConfig.model_name,
                          execution_id: data.execution_id,
                          ...data.metadata
                        }
                        break
                      } else if (data.type === 'error') {
                        controller.enqueue(createSSEChunk('error', { error: data.error }))
                        controller.close()
                        return
                      }
                    } catch (parseError) {
                      console.error('Error parsing n8n streaming data:', parseError)
                    }
                  }
                }

                if (finalResult) break
              }
            } catch (readerError) {
              console.error('n8n streaming read error:', readerError)
              controller.enqueue(createSSEChunk('error', { error: 'Streaming read error' }))
              controller.close()
              return
            }

            const responseTime = Date.now() - startTime

            // Log successful request
            await logN8NRequest(supabaseClient, workflow.id, sessionId, null, {
              request: n8nRequest,
              response: finalResult,
              status_code: n8nResponse.status,
              response_time: responseTime
            })

            // Send final result
            const aiResponse = {
              content: accumulatedContent,
              tokens_used: finalResult?.tokens_used || 0,
              model: finalResult?.model || finalConfig.model_name,
              metadata: {
                workflow_id: workflow.id,
                n8n_execution_id: finalResult?.execution_id,
                response_time: responseTime,
                context_used: Object.keys(contextData).length > 0,
                stream: true,
                ...finalResult?.metadata
              }
            }

            controller.enqueue(createSSEChunk('done', aiResponse))
          } else {
            // Fallback: simulate streaming for non-streaming n8n response
            const result = await n8nResponse.json()
            const content = result.response || result.content || result.message || "AI回复解析失败"
            
            // Simulate character-by-character streaming
            for (let i = 0; i <= content.length; i++) {
              const partialContent = content.substring(0, i)
              controller.enqueue(createSSEChunk('content', partialContent))
              
              // Small delay to simulate streaming
              if (i < content.length) {
                await new Promise(resolve => setTimeout(resolve, 20))
              }
            }

            const responseTime = Date.now() - startTime
            const aiResponse = {
              content,
              tokens_used: result.tokens_used || 0,
              model: result.model || finalConfig.model_name,
              metadata: {
                workflow_id: workflow.id,
                n8n_execution_id: result.execution_id,
                response_time: responseTime,
                context_used: Object.keys(contextData).length > 0,
                stream: true,
                simulated: true
              }
            }

            controller.enqueue(createSSEChunk('done', aiResponse))
          }

        } catch (error) {
          console.error('Stream processing error:', error)
          controller.enqueue(createSSEChunk('error', { 
            error: error.message || 'Stream processing failed' 
          }))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
      }
    })

  } catch (error) {
    console.error('Chat stream handler error:', error)
    
    return new Response(
      createSSEResponse('error', { 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    )
  }
})

// Helper function to create SSE chunk
function createSSEChunk(type: string, data: any): Uint8Array {
  const chunk = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
  return new TextEncoder().encode(chunk)
}

// Helper function to create SSE response
function createSSEResponse(type: string, data: any): string {
  return `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
}

// Helper function to build context (simplified for streaming)
async function buildStreamContext(supabaseClient: any, userId: string, sessionId: string, query: string) {
  const context: any = {}

  try {
    // Get essential context in parallel
    const [profile, okrs, messages] = await Promise.all([
      // User profile
      supabaseClient
        .from('user_profiles')
        .select('username, major, grade, learning_goals')
        .eq('user_id', userId)
        .single()
        .then((result: any) => result.data),
      
      // Active OKRs (limited)
      supabaseClient
        .from('okrs')
        .select('title, progress, status')
        .eq('user_id', userId)
        .in('status', ['active', 'in_progress'])
        .limit(3)
        .then((result: any) => result.data || []),
      
      // Recent messages (limited)
      supabaseClient
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(4)
        .then((result: any) => result.data || [])
    ])

    if (profile) {
      context.user_profile = {
        username: profile.username || '同学',
        major: profile.major,
        grade: profile.grade,
        learning_goals: profile.learning_goals || []
      }
    }

    if (okrs.length > 0) {
      context.active_okrs = okrs.map((okr: any) => ({
        title: okr.title,
        progress: okr.progress,
        status: okr.status
      }))
    }

    if (messages.length > 0) {
      context.conversation_history = messages
        .reverse()
        .slice(-3)
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content
        }))
    }

  } catch (error) {
    console.error('Context building error:', error)
  }

  return context
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
