import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/tally/sessions - Get all sessions
export async function GET(request: NextRequest) {
  // Authentication check in production
  if (process.env.NODE_ENV === 'production') {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
    
    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      console.warn(`[SESSIONS API] Authentication failed - API key mismatch`);
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Invalid or missing API key'
        },
        { status: 401 }
      );
    }
    console.log(`[SESSIONS API] Authentication successful`);
  }
  
  try {
    const supabase = getSupabaseAdmin();
    console.log('Loading sessions via API...');
    
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients!inner(first_name, last_name, email)
      `)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return NextResponse.json(
        { error: 'Failed to load sessions', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Loaded ${data?.length || 0} sessions`);
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tally/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const sessionData = await request.json();
    console.log('Creating session via API:', sessionData);

    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }

    console.log('Session created:', data);
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
    
  } catch (error) {
    console.error('Sessions POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/tally/sessions - Update session
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { id, ...updateData } = await request.json();
    console.log('Updating session via API:', { id, updateData });

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json(
        { error: 'Failed to update session', details: error.message },
        { status: 500 }
      );
    }

    console.log('Session updated:', data);
    return NextResponse.json({ data: data?.[0] });
    
  } catch (error) {
    console.error('Sessions PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tally/sessions - Delete session
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await request.json();
    console.log('Deleting session via API:', id);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      return NextResponse.json(
        { error: 'Failed to delete session', details: error.message },
        { status: 500 }
      );
    }

    console.log('Session deleted:', id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Sessions DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}