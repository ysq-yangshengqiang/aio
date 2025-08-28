# Supabase Edge Functions Configuration

## Available Functions

### 1. chat-ai-handler
**Path**: `/functions/v1/chat-ai-handler`
**Method**: POST
**Description**: Main AI chat processing function with n8n workflow integration

**Request Body**:
```json
{
  "sessionId": "string",
  "message": "string",
  "userId": "string",
  "context": "object (optional)",
  "aiConfig": "object (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "content": "AI response text",
    "tokens_used": 150,
    "model": "gpt-3.5-turbo",
    "metadata": {
      "workflow_id": "uuid",
      "response_time": 1500,
      "context_used": true
    }
  }
}
```

### 2. chat-stream-handler
**Path**: `/functions/v1/chat-stream-handler`
**Method**: POST
**Description**: Streaming AI chat responses for real-time experience

**Request Body**: Same as chat-ai-handler

**Response**: Server-Sent Events (SSE) stream
```
data: {"type": "content", "data": "Partial response...", "done": false}
data: {"type": "done", "data": {"content": "Full response", "metadata": {}}, "done": true}
```

### 3. n8n-workflow-manager
**Path**: `/functions/v1/n8n-workflow-manager`
**Methods**: GET, POST, PUT, DELETE
**Description**: Manage user's n8n workflow configurations

**Query Parameters**:
- `user_id` (required)
- `action` (optional: 'test', 'active')
- `workflow_id` (for DELETE)

**Create/Update Body**:
```json
{
  "name": "My Chat Workflow",
  "webhook_url": "https://n8n.example.com/webhook/chat",
  "workflow_type": "chat",
  "description": "Main chat processing workflow",
  "timeout_seconds": 30,
  "is_active": true,
  "configuration": {}
}
```

## Environment Variables Required

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## Database Tables Required

Make sure these tables exist (run the SQL in `/database/chat-system-schema.sql`):
- `chat_sessions`
- `chat_messages`
- `ai_configurations`
- `conversation_contexts`
- `n8n_workflows`
- `n8n_request_logs`
- `user_profiles`
- `okrs`
- `key_results`
- `learning_activities`

## N8N Workflow Setup

### Chat Workflow Requirements:
1. **Webhook Trigger**: Accept POST requests
2. **Input Processing**: Handle the request format above
3. **AI Integration**: Connect to your preferred AI provider (OpenAI, Anthropic, etc.)
4. **Response Format**: Return JSON with `response` or `content` field

### Example N8N Workflow Structure:
```
Webhook Trigger → HTTP Request (to AI API) → Format Response → Response
```

### Required Response Format:
```json
{
  "response": "AI generated response text",
  "tokens_used": 150,
  "model": "gpt-3.5-turbo",
  "execution_id": "n8n-execution-id",
  "metadata": {}
}
```

### Streaming Workflow (Optional):
For real-time streaming, your n8n workflow should:
1. Accept `stream: true` in config
2. Return Server-Sent Events format
3. Send incremental content updates

## Testing the Functions

### Test Chat AI Handler:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat-ai-handler' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "test-session",
    "message": "Hello, how can you help me with my learning goals?",
    "userId": "test-user-id"
  }'
```

### Test Workflow Manager:
```bash
# Create workflow
curl -X POST 'https://your-project.supabase.co/functions/v1/n8n-workflow-manager?user_id=test-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Workflow",
    "webhook_url": "https://your-n8n.com/webhook/test",
    "workflow_type": "chat",
    "is_active": true
  }'

# Get workflows
curl 'https://your-project.supabase.co/functions/v1/n8n-workflow-manager?user_id=test-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Deployment

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy functions: `supabase functions deploy`

Or deploy individual functions:
```bash
supabase functions deploy chat-ai-handler
supabase functions deploy chat-stream-handler
supabase functions deploy n8n-workflow-manager
```

## Frontend Integration

Update your frontend services to use these Edge Functions instead of direct API calls. See the updated service files:
- `src/services/chat-ai.service.js`
- `src/services/realtime-chat.service.js`