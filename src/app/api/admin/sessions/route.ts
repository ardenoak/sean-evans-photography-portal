import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/sessions - Get all sessions
export async function GET() {
  try {
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

// POST /api/admin/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
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

// PUT /api/admin/sessions - Update session
export async function PUT(request: NextRequest) {
  try {
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

// DELETE /api/admin/sessions - Delete session
export async function DELETE(request: NextRequest) {
  try {
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