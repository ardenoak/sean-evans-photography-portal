import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = getSupabaseAdmin();

    console.log('Loading session data for ID:', sessionId);

    // Get session with client info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients!inner(first_name, last_name, user_id)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Session query error:', sessionError);
      return NextResponse.json({ 
        error: 'Session not found',
        details: sessionError.message 
      }, { status: 404 });
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Flatten the client data for easier consumption
    const sessionData = {
      ...session,
      client_first_name: session.clients.first_name,
      client_last_name: session.clients.last_name,
      client_user_id: session.clients.user_id
    };

    // Remove the nested clients object
    delete sessionData.clients;

    console.log('Session data loaded successfully:', sessionData.id);

    return NextResponse.json({ 
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('Error in session API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}