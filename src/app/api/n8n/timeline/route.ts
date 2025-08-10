import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for API operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/n8n/timeline - Get pending tasks for AI automation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    let query = supabase
      .from('session_timelines')
      .select(`
        *,
        sessions!inner(
          id,
          session_title,
          session_date,
          client_id,
          clients!inner(first_name, last_name, email)
        )
      `)
      .eq('can_be_automated', true)
      .eq('is_completed', false)
      .in('automation_status', ['pending', 'pending_approval'])
      .order('calculated_date', { ascending: true });
    
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      tasks: tasks?.map(task => ({
        id: task.id,
        sessionId: task.session_id,
        sessionTitle: task.sessions.session_title,
        clientName: `${task.sessions.clients.first_name} ${task.sessions.clients.last_name}`,
        clientEmail: task.sessions.clients.email,
        taskName: task.task_name,
        dueDate: task.adjusted_date || task.calculated_date,
        automationStatus: task.automation_status,
        approvalRequired: task.approval_required,
        estimatedHours: task.estimated_work_hours,
        canBeBatched: task.can_be_batched
      })) || []
    });
    
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/n8n/timeline - Submit AI-generated content for approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, aiContent, contentType, metadata } = body;
    
    if (!taskId || !aiContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create approval request
    const { data: approval, error: approvalError } = await supabase
      .from('ai_task_approvals')
      .insert({
        timeline_task_id: taskId,
        ai_generated_content: aiContent,
        content_type: contentType || 'email',
        metadata: metadata || {},
        approval_status: 'pending_review',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (approvalError) {
      return NextResponse.json({ error: approvalError.message }, { status: 500 });
    }
    
    // Update timeline task status
    const { error: updateError } = await supabase
      .from('session_timelines')
      .update({
        automation_status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      approvalId: approval.id,
      message: 'Content submitted for approval'
    });
    
  } catch (error) {
    console.error('Timeline POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/n8n/timeline - Update task completion status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, completed, executedBy = 'ai_agent' } = body;
    
    if (!taskId || completed === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const updateData: any = {
      is_completed: completed,
      updated_at: new Date().toISOString()
    };
    
    if (completed) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = executedBy;
      updateData.automation_status = 'completed';
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
      updateData.automation_status = 'pending';
    }
    
    const { data: task, error } = await supabase
      .from('session_timelines')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        sessions!inner(
          session_title,
          clients!inner(first_name, last_name, email)
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        taskName: task.task_name,
        completed: task.is_completed,
        completedBy: task.completed_by,
        completedAt: task.completed_at,
        sessionTitle: task.sessions.session_title,
        clientName: `${task.sessions.clients.first_name} ${task.sessions.clients.last_name}`
      }
    });
    
  } catch (error) {
    console.error('Timeline PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}