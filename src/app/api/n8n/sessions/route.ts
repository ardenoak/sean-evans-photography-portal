import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for API operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/n8n/sessions - Get session data for AI processing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const clientEmail = searchParams.get('clientEmail');
    const upcoming = searchParams.get('upcoming') === 'true';
    
    let query = supabase
      .from('sessions')
      .select(`
        *,
        clients!inner(*)
      `);
    
    if (sessionId) {
      query = query.eq('id', sessionId);
    } else if (clientEmail) {
      query = query.eq('clients.email', clientEmail);
    } else if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('session_date', today).order('session_date', { ascending: true });
    }
    
    const { data: sessions, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      title: session.session_title,
      type: session.session_type,
      date: session.session_date,
      time: session.session_time,
      location: session.location,
      duration: session.duration,
      photographer: session.photographer,
      investment: session.investment,
      status: session.status,
      client: {
        id: session.clients.id,
        firstName: session.clients.first_name,
        lastName: session.clients.last_name,
        email: session.clients.email,
        phone: session.clients.phone,
        address: session.clients.address,
        city: session.clients.city,
        state: session.clients.state,
        zip: session.clients.zip
      },
      createdAt: session.created_at
    })) || [];
    
    if (sessionId) {
      return NextResponse.json({
        success: true,
        session: formattedSessions[0] || null
      });
    }
    
    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });
    
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}