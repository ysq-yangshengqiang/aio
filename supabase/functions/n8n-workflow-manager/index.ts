/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface WorkflowConfig {
  workflow_name: string
  workflow_id?: string
  webhook_url: string
  workflow_type: string
  input_schema?: any
  output_schema?: any
  is_active?: boolean
  rate_limit?: number
  timeout_seconds?: number
  retry_attempts?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await handleGetWorkflows(supabaseClient, userId)
      
      case 'POST':
        const createData = await req.json()
        return await handleCreateWorkflow(supabaseClient, userId, createData)
      
      case 'PUT':
        const updateData = await req.json()
        return await handleUpdateWorkflow(supabaseClient, userId, updateData)
      
      case 'DELETE':
        const url = new URL(req.url)
        const workflowId = url.searchParams.get('workflow_id')
        return await handleDeleteWorkflow(supabaseClient, userId, workflowId)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('n8n workflow manager error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Handle GET - List workflows
async function handleGetWorkflows(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('n8n_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data: data || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Get workflows error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle POST - Create workflow
async function handleCreateWorkflow(supabaseClient: any, userId: string, config: WorkflowConfig) {
  try {
    // Validate required fields
    if (!config.workflow_name || !config.webhook_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: workflow_name, webhook_url'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate webhook URL
    try {
      new URL(config.webhook_url)
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid webhook URL format'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test webhook connection
    const testResult = await testWebhookConnection(config.webhook_url)
    if (!testResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook test failed: ${testResult.error}`,
          test_result: testResult
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create workflow record
    const workflowData = {
      user_id: userId,
      workflow_name: config.workflow_name,
      workflow_id: config.workflow_id || `workflow_${Date.now()}`,
      webhook_url: config.webhook_url,
      workflow_type: config.workflow_type || 'chat',
      input_schema: config.input_schema || getDefaultInputSchema(),
      output_schema: config.output_schema || getDefaultOutputSchema(),
      is_active: config.is_active !== false, // Default to true
      rate_limit: config.rate_limit || 100,
      timeout_seconds: config.timeout_seconds || 30,
      retry_attempts: config.retry_attempts || 3
    }

    const { data, error } = await supabaseClient
      .from('n8n_workflows')
      .insert(workflowData)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data,
        test_result: testResult
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Create workflow error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle PUT - Update workflow
async function handleUpdateWorkflow(supabaseClient: any, userId: string, config: any) {
  try {
    if (!config.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing workflow ID'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseClient
      .from('n8n_workflows')
      .select('id')
      .eq('id', config.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Workflow not found or access denied'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test webhook if URL changed
    let testResult = null
    if (config.webhook_url) {
      testResult = await testWebhookConnection(config.webhook_url)
      if (!testResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Webhook test failed: ${testResult.error}`,
            test_result: testResult
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Update workflow
    const updateData = {
      ...config,
      updated_at: new Date().toISOString()
    }
    delete updateData.id // Remove ID from update data

    const { data, error } = await supabaseClient
      .from('n8n_workflows')
      .update(updateData)
      .eq('id', config.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data,
        test_result: testResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Update workflow error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle DELETE - Delete workflow
async function handleDeleteWorkflow(supabaseClient: any, userId: string, workflowId: string | null) {
  try {
    if (!workflowId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing workflow ID'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data, error } = await supabaseClient
      .from('n8n_workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', userId)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Workflow not found or access denied'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Workflow deleted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Delete workflow error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Test webhook connection
async function testWebhookConnection(webhookUrl: string) {
  try {
    const testPayload = {
      test: true,
      message: "Connection test from n8n workflow manager",
      timestamp: new Date().toISOString()
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status_code: response.status
      }
    }

    const result = await response.json().catch(() => ({}))

    return {
      success: true,
      status_code: response.status,
      response: result,
      message: 'Webhook connection test successful'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Webhook connection test failed'
    }
  }
}

// Get default input schema
function getDefaultInputSchema() {
  return {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'User input message'
      },
      context: {
        type: 'object',
        description: 'User context information'
      },
      config: {
        type: 'object',
        description: 'AI configuration'
      },
      user_id: {
        type: 'string',
        description: 'User ID'
      },
      session_id: {
        type: 'string',
        description: 'Chat session ID'
      }
    },
    required: ['prompt', 'user_id', 'session_id']
  }
}

// Get default output schema
function getDefaultOutputSchema() {
  return {
    type: 'object',
    properties: {
      response: {
        type: 'string',
        description: 'AI generated response'
      },
      tokens_used: {
        type: 'integer',
        description: 'Number of tokens used'
      },
      model: {
        type: 'string',
        description: 'AI model used'
      },
      execution_id: {
        type: 'string',
        description: 'n8n execution ID'
      }
    },
    required: ['response']
  }
}