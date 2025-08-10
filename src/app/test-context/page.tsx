'use client';
import { useState } from 'react';

export default function TestContextPage() {
  const [result, setResult] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const testContextAPI = async () => {
    if (!sessionId.trim()) {
      setResult('Please enter a session ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/n8n/chat-context?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setResult(`Error: ${data.error || response.statusText}`);
      }
    } catch (error) {
      setResult(`Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testChatAPI = async () => {
    if (!sessionId.trim()) {
      setResult('Please enter a session ID');
      return;
    }

    setLoading(true);
    try {
      // Test the webhook format that n8n sends
      const response = await fetch(`/api/n8n/chat-context?sessionId=${sessionId}`);
      const contextData = await response.json();
      
      if (!response.ok) {
        setResult(`Context API failed: ${contextData.error}`);
        return;
      }

      // Test the chat API
      const chatResponse = await fetch('/api/n8n/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          clientMessage: 'What should I wear for my session?',
          aiResponse: 'This is a test AI response for testing.',
          metadata: { test: true }
        }),
      });

      const chatData = await chatResponse.json();
      
      setResult(`Context API: ✅ Success\nChat API: ${chatResponse.ok ? '✅ Success' : '❌ Failed'}\n\nContext Data:\n${JSON.stringify(contextData, null, 2)}\n\nChat Result:\n${JSON.stringify(chatData, null, 2)}`);
      
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test N8N API Endpoints</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Session ID:</label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter a session ID from your admin panel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from /debug-timeline or your admin session detail page URL
          </p>
        </div>
        
        <div className="space-x-4 mb-6">
          <button
            onClick={testContextAPI}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Context API'}
          </button>
          
          <button
            onClick={testChatAPI}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Full Flow'}
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap max-h-96">
            {result || 'No test run yet'}
          </pre>
        </div>
        
        <div className="text-sm text-gray-600">
          <h4 className="font-semibold">Debug Steps:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Get a session ID from /debug-timeline page</li>
            <li>Add your SUPABASE_SERVICE_ROLE_KEY to .env.local</li>
            <li>Restart your dev server (npm run dev)</li>
            <li>Test the Context API first</li>
            <li>If that works, test the Full Flow</li>
          </ol>
        </div>
      </div>
    </div>
  );
}