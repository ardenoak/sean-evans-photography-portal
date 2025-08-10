import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for API operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/n8n/chat - Handle AI chat responses for Session Concierge
export async function POST(request: NextRequest) {
  try {
    console.log('Chat API called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { sessionId, clientMessage, aiResponse, metadata } = body;
    
    if (!sessionId || !aiResponse) {
      console.log('Missing required fields:', { sessionId: !!sessionId, aiResponse: !!aiResponse });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('Attempting to insert chat interaction...');
    
    // Store chat interaction
    const { data: chatLog, error: chatError } = await supabase
      .from('chat_interactions')
      .insert({
        session_id: sessionId,
        client_message: clientMessage,
        ai_response: aiResponse,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (chatError) {
      console.error('Supabase chat error:', chatError);
      return NextResponse.json({ error: chatError.message }, { status: 500 });
    }
    
    console.log('Chat log inserted successfully:', chatLog?.id);
    
    return NextResponse.json({
      success: true,
      chatId: chatLog.id,
      response: aiResponse
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/n8n/chat - Get chat history for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    
    const { data: chats, error } = await supabase
      .from('chat_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      chats: chats || []
    });
    
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}