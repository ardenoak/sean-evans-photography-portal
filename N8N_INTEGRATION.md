# N8N Integration Guide for Sean Evans Photography Portal

## Overview

Your portal now has API endpoints that n8n can call to automate timeline tasks and power the Session Concierge AI chat. This creates a fully automated photography business workflow.

## API Endpoints

### 1. Timeline Automation (`/api/n8n/timeline`)

#### GET - Get Pending AI Tasks
```bash
GET /api/n8n/timeline?sessionId=optional&upcoming=true
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid",
      "sessionId": "session-uuid",
      "sessionTitle": "Branding Session for John Doe",
      "clientName": "John Doe",
      "clientEmail": "john@example.com",
      "taskName": "Style guide & mood board creation",
      "dueDate": "2025-10-15",
      "automationStatus": "pending",
      "approvalRequired": true,
      "estimatedHours": 2.0,
      "canBeBatched": false
    }
  ]
}
```

#### POST - Submit AI Content for Approval
```bash
POST /api/n8n/timeline
Content-Type: application/json

{
  "taskId": "task-uuid",
  "aiContent": "Generated style guide content...",
  "contentType": "style_guide",
  "metadata": {
    "model": "gpt-4",
    "confidence": 0.95
  }
}
```

#### PUT - Mark Task Complete
```bash
PUT /api/n8n/timeline
Content-Type: application/json

{
  "taskId": "task-uuid",
  "completed": true,
  "executedBy": "ai_agent"
}
```

### 2. Session Data (`/api/n8n/sessions`)

#### GET - Get Session Information
```bash
GET /api/n8n/sessions?sessionId=uuid
GET /api/n8n/sessions?clientEmail=john@example.com
GET /api/n8n/sessions?upcoming=true
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "title": "Branding Session",
    "type": "Branding Session",
    "date": "2025-10-22",
    "time": "10:00 AM",
    "location": "Downtown Studio",
    "client": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}
```

### 3. Session Concierge Chat (`/api/n8n/chat`)

#### POST - Process Chat Message
```bash
POST /api/n8n/chat
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "clientMessage": "What should I wear for my session?",
  "aiResponse": "For your branding session, I recommend...",
  "metadata": {
    "intent": "wardrobe_advice",
    "confidence": 0.92
  }
}
```

## N8N Workflow Examples

### 1. Timeline Task Automation

**Trigger:** Schedule (every 15 minutes)
1. **HTTP Request** → `GET /api/n8n/timeline` (get pending tasks)
2. **Switch Node** → Route by task type
3. **AI Processing** → Generate content based on task
4. **HTTP Request** → `POST /api/n8n/timeline` (submit for approval)

### 2. Session Concierge AI

**Trigger:** Webhook (from chat widget)
1. **Webhook** → Receive chat message
2. **AI Agent** → Process with session context
3. **HTTP Request** → `POST /api/n8n/chat` (log interaction)
4. **Return Response** → Send AI reply back to widget

### 3. Email Automation

**Trigger:** Timeline task due
1. **HTTP Request** → Get session data
2. **AI Email Generator** → Create personalized email
3. **HTTP Request** → Submit for approval
4. **Wait for Approval** → Human review
5. **Email Send** → Send approved email
6. **HTTP Request** → Mark task complete

## Sample N8N Workflows

### Style Guide Generator
```json
{
  "trigger": "schedule",
  "nodes": [
    {
      "type": "http_request",
      "url": "{{$env.PORTAL_URL}}/api/n8n/timeline",
      "method": "GET",
      "parameters": {
        "taskType": "style_guide"
      }
    },
    {
      "type": "ai_agent",
      "prompt": "Generate a style guide for {{$json.sessionType}} session for {{$json.clientName}}..."
    },
    {
      "type": "http_request", 
      "url": "{{$env.PORTAL_URL}}/api/n8n/timeline",
      "method": "POST",
      "body": {
        "taskId": "{{$json.taskId}}",
        "aiContent": "{{$json.styleGuide}}",
        "contentType": "style_guide"
      }
    }
  ]
}
```

## Environment Variables for N8N

```env
PORTAL_URL=https://your-portal-domain.com
PORTAL_API_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
PHOTOGRAPHER_EMAIL=sean@seanevansphotography.com
```

## Task Types Available for Automation

| Task | Automation Level | Approval Required |
|------|------------------|-------------------|
| Contract & payment confirmed | ✅ Full | ❌ No |
| Brand questionnaire sent | ✅ Full | ✅ Yes |
| Style guide & mood board | ✅ AI Generate | ✅ Yes |
| Preview gallery delivery | ✅ Full | ❌ No |
| Email communications | ✅ AI Generate | ✅ Yes |
| Client follow-ups | ✅ AI Generate | ✅ Yes |

## Webhook URLs to Configure

1. **Timeline Tasks:** `https://your-n8n-instance.com/webhook/timeline-tasks`
2. **Chat Messages:** `https://your-n8n-instance.com/webhook/chat-message`
3. **Session Updates:** `https://your-n8n-instance.com/webhook/session-update`

## Getting Started

1. **Setup Chat System:** Visit `/setup-chat` in your portal
2. **Test API Endpoints:** Use the URLs above with your session data
3. **Create N8N Workflows:** Import the sample workflows
4. **Configure Webhooks:** Point chat widget to your n8n webhooks
5. **Test Automation:** Create a test session and watch the magic happen!

## Next Steps

- Connect to your email provider (Gmail, Outlook, etc.)
- Integrate with your calendar system
- Add SMS notifications via Twilio
- Connect to your accounting software
- Build client feedback collection workflows

Your photography business is now AI-powered! 🤖📸