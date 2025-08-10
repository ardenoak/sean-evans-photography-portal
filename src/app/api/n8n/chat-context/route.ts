import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for API operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/n8n/chat-context - Get rich session context for AI
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    
    // Get session details with client info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients!inner(*)
      `)
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    
    // Get timeline with completion status
    const { data: timeline, error: timelineError } = await supabase
      .from('session_timelines')
      .select('*')
      .eq('session_id', sessionId)
      .order('task_order', { ascending: true });
    
    // Get previous sessions for this client (history)
    const { data: previousSessions, error: historyError } = await supabase
      .from('sessions')
      .select('id, session_type, session_date, status, session_title')
      .eq('client_id', session.client_id)
      .neq('id', sessionId)
      .order('session_date', { ascending: false })
      .limit(5);
    
    // Get recent chat history
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_interactions')
      .select('client_message, ai_response, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Calculate session progress
    const completedTasks = timeline?.filter(t => t.is_completed) || [];
    const totalTasks = timeline?.length || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    
    // Determine session phase
    const today = new Date().toISOString().split('T')[0];
    const sessionDate = session.session_date;
    const daysUntilSession = Math.ceil((new Date(sessionDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    
    let sessionPhase = 'upcoming';
    if (daysUntilSession < 0) {
      sessionPhase = 'completed';
    } else if (daysUntilSession <= 3) {
      sessionPhase = 'imminent';
    } else if (daysUntilSession <= 7) {
      sessionPhase = 'preparation';
    }
    
    // Get upcoming tasks
    const upcomingTasks = timeline?.filter(t => !t.is_completed && new Date(t.adjusted_date || t.calculated_date) >= new Date()) || [];
    const overdueTasks = timeline?.filter(t => !t.is_completed && new Date(t.adjusted_date || t.calculated_date) < new Date()) || [];
    
    // Build rich context for AI
    const context = {
      session: {
        id: session.id,
        title: session.session_title,
        type: session.session_type,
        date: session.session_date,
        time: session.session_time,
        location: session.location,
        duration: session.duration,
        investment: session.investment,
        status: session.status,
        phase: sessionPhase,
        daysUntilSession,
        progress: {
          percentage: progressPercentage,
          completedTasks: completedTasks.length,
          totalTasks: totalTasks,
          upcomingTasks: upcomingTasks.length,
          overdueTasks: overdueTasks.length
        }
      },
      client: {
        firstName: session.clients.first_name,
        lastName: session.clients.last_name,
        fullName: `${session.clients.first_name} ${session.clients.last_name}`,
        email: session.clients.email,
        phone: session.clients.phone,
        location: session.clients.city && session.clients.state ? `${session.clients.city}, ${session.clients.state}` : null,
        isReturning: (previousSessions?.length || 0) > 0
      },
      timeline: {
        nextTask: upcomingTasks[0] ? {
          name: upcomingTasks[0].task_name,
          dueDate: upcomingTasks[0].adjusted_date || upcomingTasks[0].calculated_date,
          canBeAutomated: upcomingTasks[0].can_be_automated
        } : null,
        recentlyCompleted: completedTasks.slice(-3).map(t => ({
          name: t.task_name,
          completedDate: t.completed_at,
          completedBy: t.completed_by
        })),
        overdue: overdueTasks.map(t => ({
          name: t.task_name,
          dueDate: t.adjusted_date || t.calculated_date
        }))
      },
      history: {
        previousSessions: previousSessions?.map(s => ({
          type: s.session_type,
          date: s.session_date,
          title: s.session_title,
          status: s.status
        })) || [],
        recentChats: chatHistory?.slice(0, 3).map(c => ({
          question: c.client_message,
          response: c.ai_response?.substring(0, 100) + '...',
          date: c.created_at
        })) || []
      },
      photographer: {
        name: 'Sean Evans',
        email: 'sean@seanevansphotography.com',
        phone: session.photographer === 'Sean Evans' ? '+1 (555) 123-4567' : null,
        specialty: 'Editorial Portraiture'
      },
      businessContext: {
        seasonalNote: getSeasonalNote(sessionDate),
        locationWeather: session.location ? getLocationContext(session.location) : null,
        sessionTypeAdvice: getSessionTypeAdvice(session.session_type)
      }
    };
    
    return NextResponse.json({
      success: true,
      context,
      suggestedPrompts: generateSuggestedPrompts(context),
      aiPersonality: {
        tone: 'warm, professional, knowledgeable',
        role: 'personal session concierge',
        expertise: ['photography preparation', 'wardrobe styling', 'location logistics', 'timeline management'],
        approach: 'proactive, detail-oriented, supportive'
      }
    });
    
  } catch (error) {
    console.error('Chat context error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getSeasonalNote(sessionDate: string): string {
  const month = new Date(sessionDate).getMonth();
  const seasonal = {
    'winter': 'Perfect time for cozy indoor portraits and dramatic lighting',
    'spring': 'Beautiful natural light and fresh outdoor locations available', 
    'summer': 'Golden hour sessions and vibrant outdoor settings',
    'fall': 'Gorgeous autumn colors and warm, rich tones'
  };
  
  if (month >= 2 && month <= 4) return seasonal.spring;
  if (month >= 5 && month <= 7) return seasonal.summer;
  if (month >= 8 && month <= 10) return seasonal.fall;
  return seasonal.winter;
}

function getLocationContext(location: string): string {
  if (location.toLowerCase().includes('studio')) {
    return 'Controlled lighting environment, climate controlled, multiple backdrop options';
  }
  if (location.toLowerCase().includes('outdoor')) {
    return 'Natural lighting dependent, weather contingency plans in place';
  }
  return 'Unique location with custom lighting setup';
}

function getSessionTypeAdvice(sessionType: string): string {
  const advice = {
    'Branding Session': 'Focus on authentic professional imagery that tells your brand story',
    'Portrait Session': 'Emphasis on personal expression and capturing your unique personality',
    'Executive Session': 'Professional headshots optimized for LinkedIn and corporate use',
    'Family Session': 'Relaxed, natural interactions showcasing family connections'
  };
  return advice[sessionType as keyof typeof advice] || 'Custom session tailored to your specific vision';
}

function generateSuggestedPrompts(context: any): string[] {
  const prompts = [];
  
  if (context.session.daysUntilSession <= 7) {
    prompts.push("What should I do to prepare for my session this week?");
  }
  
  if (context.timeline.nextTask) {
    prompts.push(`Tell me about "${context.timeline.nextTask.name}"`);
  }
  
  if (context.client.isReturning) {
    prompts.push("How will this session be different from my previous ones?");
  }
  
  prompts.push(
    "What should I wear for my session?",
    "Can you tell me about the location?",
    "What happens after the session?"
  );
  
  return prompts.slice(0, 4);
}