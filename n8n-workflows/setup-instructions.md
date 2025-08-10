# N8N Workflows Setup Instructions

## Prerequisites

1. **N8N Instance**: Running n8n (cloud or self-hosted)
2. **OpenAI API Key**: For AI content generation
3. **Portal Environment Variables**:
   ```env
   PORTAL_URL=https://your-portal-domain.com
   OPENAI_API_KEY=your-openai-api-key
   ```

## Workflow Installation

### 1. Session Concierge AI Chat

**File**: `session-concierge-chat.json`

**Setup Steps**:
1. Import the JSON workflow into n8n
2. Configure the Webhook node:
   - Copy the webhook URL
   - Update your ChatWidget to call this webhook
3. Set environment variables:
   - `PORTAL_URL`: Your portal domain
   - `OPENAI_API_KEY`: Your OpenAI key
4. Test with a sample chat message

**Webhook Integration**:
Update your ChatWidget.tsx to call the n8n webhook:
```typescript
// Replace the fetch call in handleSendMessage with:
const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId,
    clientMessage: currentMessage,
    clientName
  }),
});
```

### 2. Timeline Task Automation

**File**: `timeline-automation.json`

**Setup Steps**:
1. Import the JSON workflow into n8n
2. The workflow runs every 15 minutes automatically
3. Configure environment variables (same as above)
4. Enable the workflow to start automation

**What it does**:
- Monitors for pending AI tasks every 15 minutes
- Generates style guides for branding/portrait sessions
- Creates personalized emails for client communications
- Submits all content to your approval dashboard
- Routes different task types to appropriate AI generators

## Environment Configuration

In your n8n instance, set these environment variables:

```env
# Your portal domain (no trailing slash)
PORTAL_URL=https://arden-oak-portal.vercel.app

# OpenAI API key for content generation
OPENAI_API_KEY=sk-your-openai-key

# Optional: Photographer details
PHOTOGRAPHER_NAME=Sean Evans
PHOTOGRAPHER_EMAIL=sean@seanevansphotography.com
PHOTOGRAPHER_PHONE=+1 (555) 123-4567
```

## Testing the Integration

### Test Session Concierge:
1. Open client portal
2. Click Session Concierge chat
3. Ask: "What should I wear for my branding session?"
4. Verify rich, contextual response

### Test Timeline Automation:
1. Create a test session with future date
2. Wait 15 minutes or manually trigger workflow
3. Check `/admin/approvals` for generated content
4. Approve/reject content
5. Verify task completion updates

## Advanced Features

### Session-Aware Responses
The AI has access to:
- Client history and previous sessions
- Current timeline progress
- Upcoming tasks and deadlines
- Session-specific details (location, type, etc.)
- Seasonal and contextual information

### Automatic Content Generation
**Style Guides**: Personalized wardrobe and prep advice
**Emails**: Custom communications for each timeline milestone
**Follow-ups**: Proactive client check-ins
**Reminders**: Smart scheduling based on session proximity

### Approval Workflow
All AI-generated content goes through your approval dashboard where you can:
- Review before sending
- Edit and improve
- Approve for immediate execution
- Reject and provide feedback

## Webhook URLs to Update

After importing workflows, update these in your portal:

1. **ChatWidget.tsx** - Line ~99:
   ```typescript
   const response = await fetch('YOUR_CHAT_WEBHOOK_URL', {
   ```

2. **Optional**: Direct timeline webhook for real-time updates

## Monitoring and Logs

- View workflow executions in n8n dashboard
- Check chat logs in portal admin
- Monitor approval queue for pending items
- Review client satisfaction through chat interactions

## Troubleshooting

**Chat not responding**: Check webhook URL and environment variables
**No tasks being processed**: Verify timeline automation is enabled
**API errors**: Check portal URL and service role key
**OpenAI errors**: Verify API key and quota

Your AI-powered photography business is ready! 🤖📸