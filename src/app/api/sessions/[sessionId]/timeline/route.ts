import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = getSupabaseAdmin();

    console.log('Loading timeline for session:', sessionId);

    // Load timeline items for this session
    const { data: timelineData, error: timelineError } = await supabase
      .from('session_timelines')
      .select('*')
      .eq('session_id', sessionId)
      .order('task_order', { ascending: true });

    if (timelineError) {
      console.error('Timeline query error:', timelineError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to load timeline',
        details: timelineError.message 
      }, { status: 404 });
    }

    console.log('Timeline data loaded:', timelineData?.length || 0, 'items');

    return NextResponse.json({ 
      success: true,
      data: timelineData || []
    });

  } catch (error) {
    console.error('Error in timeline API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}