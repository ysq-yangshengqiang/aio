# N8N工作流设置指南

本文档介绍如何设置n8n工作流来支持AI聊天助手的流式响应。

## 工作流配置

### 基础聊天工作流（非流式）

```json
{
  "meta": {
    "instanceId": "your-instance-id"
  },
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-chat",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook触发器",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "={{$json.config.model_name || 'gpt-3.5-turbo'}}"
            },
            {
              "name": "messages",
              "value": "={{[\n  {\n    role: 'system',\n    content: $json.config.system_prompt || '你是启明星AI学习助手'\n  },\n  {\n    role: 'user', \n    content: $json.prompt\n  }\n]}}"
            },
            {
              "name": "temperature",
              "value": "={{$json.config.temperature || 0.7}}"
            },
            {
              "name": "max_tokens",
              "value": "={{$json.config.max_tokens || 1000}}"
            }
          ]
        }
      },
      "id": "openai-api",
      "name": "OpenAI API调用",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const response = items[0].json;\nconst message = response.choices?.[0]?.message;\n\nreturn {\n  success: true,\n  response: message?.content || '抱歉，无法生成回复',\n  content: message?.content || '抱歉，无法生成回复',\n  tokens_used: response.usage?.total_tokens || 0,\n  model: response.model,\n  execution_id: $execution.id,\n  metadata: {\n    finish_reason: response.choices?.[0]?.finish_reason,\n    prompt_tokens: response.usage?.prompt_tokens,\n    completion_tokens: response.usage?.completion_tokens\n  }\n};"
      },
      "id": "format-response",
      "name": "格式化响应",
      "type": "n8n-nodes-base.code",
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook触发器": {
      "main": [
        [
          {
            "node": "OpenAI API调用",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI API调用": {
      "main": [
        [
          {
            "node": "格式化响应",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 流式聊天工作流

对于流式响应，你需要：

1. **修改OpenAI API调用节点**，添加stream参数：
   ```json
   {
     "name": "stream",
     "value": true
   }
   ```

2. **添加流式处理节点**：
   ```javascript
   // 流式处理代码节点
   const response = items[0].json;
   
   // 检查是否是流式响应
   if (response.object === 'chat.completion.chunk') {
     const delta = response.choices?.[0]?.delta;
     
     if (delta?.content) {
       // 发送流式内容
       return {
         type: 'content',
         content: delta.content,
         data: delta.content
       };
     }
     
     if (response.choices?.[0]?.finish_reason) {
       // 流式完成
       return {
         type: 'done',
         done: true,
         tokens_used: response.usage?.total_tokens || 0,
         model: response.model,
         execution_id: $execution.id
       };
     }
   }
   
   return null;
   ```

## 使用步骤

1. **创建n8n工作流**
   - 登录你的n8n实例
   - 创建新工作流
   - 导入上述JSON配置或手动创建节点

2. **配置OpenAI凭证**
   - 在n8n中添加OpenAI API凭证
   - 确保API密钥有效

3. **激活工作流**
   - 保存并激活工作流
   - 复制Webhook URL

4. **在系统中配置**
   - 进入聊天助手的"N8N工作流配置"页面
   - 添加新工作流
   - 粘贴Webhook URL
   - 选择工作流类型（聊天或流式聊天）
   - 测试连接

## 工作流类型说明

- **chat**: 基础聊天工作流，返回完整响应
- **chat_stream**: 流式聊天工作流，支持实时响应
- **context**: 上下文构建工作流（可选）
- **custom**: 自定义工作流

## 测试工作流

你可以使用以下curl命令测试工作流：

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "你好，请介绍一下你自己",
    "config": {
      "model_name": "gpt-3.5-turbo",
      "temperature": 0.7,
      "max_tokens": 1000
    },
    "context": {},
    "user_id": "test-user",
    "session_id": "test-session"
  }'
```

## 故障排除

1. **连接测试失败**
   - 检查Webhook URL是否正确
   - 确认工作流已激活
   - 检查网络连接

2. **AI响应错误**
   - 检查OpenAI API凭证
   - 确认API配额充足
   - 查看n8n执行日志

3. **流式响应不工作**
   - 确认使用了正确的工作流类型
   - 检查流式处理节点配置
   - 验证SSE格式是否正确

## 高级配置

### 添加上下文支持

你可以在工作流中添加上下文处理：

```javascript
// 上下文处理节点
const context = items[0].json.context || {};
const messages = [
  {
    role: 'system',
    content: `你是启明星AI学习助手。用户信息：${JSON.stringify(context.user_profile || {})}`
  }
];

// 添加对话历史
if (context.conversation_history) {
  messages.push(...context.conversation_history);
}

// 添加当前用户消息
messages.push({
  role: 'user',
  content: items[0].json.prompt
});

return { messages };
```

### 错误处理

添加错误处理节点：

```javascript
// 错误处理节点
try {
  // 你的处理逻辑
  return items[0].json;
} catch (error) {
  return {
    type: 'error',
    error: error.message || '处理请求时出错',
    execution_id: $execution.id
  };
}
```

## 参考资源

- [n8n官方文档](https://docs.n8n.io/)
- [OpenAI API文档](https://platform.openai.com/docs/)
- [Server-Sent Events规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)