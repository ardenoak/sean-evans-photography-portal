'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
import { supabase } from '@/lib/supabase';

interface SessionDetail {
  id: string;
  session_type: string;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  duration: string;
  photographer: string;
  investment: string;
  status: string;
  client_id: string;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface TimelineItem {
  id: string;
  task_name: string;
  calculated_date: string;
  adjusted_date?: string;
  is_completed: boolean;
  can_be_automated: boolean;
  approval_required: boolean;
  approval_status: string;
  automation_status: string;
  task_order: number;
  completed_by?: string;
  completed_at?: string;
}

export default function AdminSessionDetailPage() {
  // Removed auth
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    if (!false && (false )) {
      return;
    }

    if ({
      loadSessionDetail();
    }
  }, [ sessionId, router]);

  const loadSessionDetail = async () => {
    try {
      console.log('Loading session detail for:', sessionId);

      // Load session with client details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          clients!inner(*)
        `)
        .eq('id', sessionId)
        .single();

      console.log('Session detail result:', { sessionData, sessionError });

      if (sessionError) {
        console.error('Error loading session:', sessionError);
        router.push('/admin/sessions');
        return;
      }

      if (sessionData) {
        setSession(sessionData);
      }

      // Load timeline for this session
      const { data: timelineData, error: timelineError } = await supabase
        .from('session_timelines')
        .select('*')
        .eq('session_id', sessionId)
        .order('task_order', { ascending: true });

      console.log('Timeline result:', { timelineData, timelineError });

      if (timelineError) {
        console.error('Error loading timeline:', timelineError);
      } else if (timelineData) {
        setTimeline(timelineData);
      }

    } catch (error) {
      console.error('Error loading session detail:', error);
      router.push('/admin/sessions');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    setUpdatingTask(taskId);

    try {
      const { error } = await supabase
        .from('session_timelines')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
          completed_by: !currentStatus ? 'admin' : null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        alert('Error updating task completion');
      } else {
        // Update local state
        setTimeline(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                is_completed: !currentStatus,
                completed_at: !currentStatus ? new Date().toISOString() : undefined,
                completed_by: !currentStatus ? 'admin' : undefined
              }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task completion');
    } finally {
      setUpdatingTask(null);
    }
  };

  // Removed sign out

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Confirmed & Scheduled': 'bg-verde/20 text-verde',
      'Completed': 'bg-gold/20 text-gold',
      'Pending': 'bg-warm-gray/20 text-warm-gray',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getAutomationStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-700',
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved_ready_to_execute': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if ( loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!true || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/sessions')}
                className="text-warm-gray hover:text-charcoal transition-colors flex items-center space-x-2 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">←</span>
                <span className="hidden sm:inline text-sm">Sessions</span>
              </button>
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto cursor-pointer"
                onClick={() => router.push('/admin/dashboard')}
                priority
              />
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <div>
                <h1 className="text-xl font-didot text-charcoal">Session Management</h1>
                <p className="text-sm text-warm-gray">Admin Detail View</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.open(`/portal/${sessionId}`, '_blank')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] text-sm"
              >
                View as Client
              </button>
              <span className="text-warm-gray text-sm hidden sm:inline">
                              </span>
              <button
                onClick={
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-8 pt-6 pb-2">
        <div className="flex items-center text-sm text-warm-gray space-x-2">
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="hover:text-charcoal transition-colors"
          >
            Admin Dashboard
          </button>
          <span>/</span>
          <button 
            onClick={() => router.push('/admin/sessions')}
            className="hover:text-charcoal transition-colors"
          >
            Sessions
          </button>
          <span>/</span>
          <span className="text-charcoal font-medium">{session.session_title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Session Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-gold to-gold/90 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-didot mb-1">{session.session_title}</h2>
                    <p className="text-white/90">{session.session_type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)} bg-white/20 text-white`}>
                    {session.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-warm-gray text-sm">Date</p>
                    <p className="text-charcoal font-medium">{session.session_date}</p>
                  </div>
                  <div>
                    <p className="text-warm-gray text-sm">Time</p>
                    <p className="text-charcoal font-medium">{session.session_time}</p>
                  </div>
                  <div>
                    <p className="text-warm-gray text-sm">Duration</p>
                    <p className="text-charcoal font-medium">{session.duration}</p>
                  </div>
                  <div>
                    <p className="text-warm-gray text-sm">Investment</p>
                    <p className="text-charcoal font-medium">{session.investment}</p>
                  </div>
                </div>

                {session.location && (
                  <div className="mb-6">
                    <p className="text-warm-gray text-sm">Location</p>
                    <p className="text-charcoal">{session.location}</p>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push(`/admin/sessions/${sessionId}/edit`)}
                    className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    Edit Session
                  </button>
                  <button
                    onClick={() => window.open(`/portal/${sessionId}`, '_blank')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View as Client
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Management */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-warm-gray/20">
                <h3 className="text-xl font-didot text-charcoal">Timeline Management</h3>
                <p className="text-warm-gray text-sm">Manage session timeline and AI automation</p>
              </div>

              <div className="p-6">
                {timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-warm-gray">No timeline items found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((item) => (
                      <div
                        key={item.id}
                        className="border border-warm-gray/20 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <button
                              onClick={() => toggleTaskCompletion(item.id, item.is_completed)}
                              disabled={updatingTask === item.id}
                              className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                                item.is_completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-warm-gray/30 hover:border-green-500'
                              } ${updatingTask === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {updatingTask === item.id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : item.is_completed ? (
                                <span className="text-xs font-bold">✓</span>
                              ) : null}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm sm:text-base ${item.is_completed ? 'text-warm-gray line-through' : 'text-charcoal'}`}>
                                {item.task_name}
                              </h4>
                              <p className="text-xs sm:text-sm text-warm-gray">
                                Due: {formatDate(item.adjusted_date || item.calculated_date)}
                              </p>
                              {item.is_completed && item.completed_at && (
                                <p className="text-xs text-green-600">
                                  Completed {formatDate(item.completed_at)} by {item.completed_by}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-1 sm:flex-nowrap sm:space-x-2 sm:ml-4">
                            {item.can_be_automated && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                                🤖 AI
                              </span>
                            )}
                            {item.approval_required && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                                📝 Approval
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getAutomationStatusColor(item.automation_status)}`}>
                              {item.automation_status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-warm-gray/20">
                <h3 className="text-xl font-didot text-charcoal">Client Information</h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center pb-4 border-b border-warm-gray/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
                    {session.clients.first_name?.charAt(0)}{session.clients.last_name?.charAt(0)}
                  </div>
                  <h4 className="text-lg font-semibold text-charcoal">
                    {session.clients.first_name} {session.clients.last_name}
                  </h4>
                  <p className="text-warm-gray">{session.clients.email}</p>
                </div>

                <div className="space-y-3">
                  {session.clients.phone && (
                    <div>
                      <p className="text-sm text-warm-gray">Phone</p>
                      <p className="text-charcoal">{session.clients.phone}</p>
                    </div>
                  )}

                  {(session.clients.address || session.clients.city) && (
                    <div>
                      <p className="text-sm text-warm-gray">Address</p>
                      <div className="text-charcoal text-sm">
                        {session.clients.address && <div>{session.clients.address}</div>}
                        {(session.clients.city || session.clients.state) && (
                          <div>
                            {session.clients.city}{session.clients.city && session.clients.state && ', '}{session.clients.state} {session.clients.zip}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-warm-gray/20">
                  <button
                    onClick={() => router.push(`/admin/clients/${session.client_id}`)}
                    className="w-full bg-ivory text-charcoal py-2 px-4 rounded-lg hover:bg-gold hover:text-white transition-colors text-sm"
                  >
                    View Full Client Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg mt-6">
              <div className="p-6">
                <h4 className="font-semibold text-charcoal mb-4">Session Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-warm-gray text-sm">Timeline Tasks</span>
                    <span className="text-charcoal font-medium">{timeline.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray text-sm">Completed</span>
                    <span className="text-charcoal font-medium">
                      {timeline.filter(t => t.is_completed).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray text-sm">AI Tasks</span>
                    <span className="text-charcoal font-medium">
                      {timeline.filter(t => t.can_be_automated).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray text-sm">Need Approval</span>
                    <span className="text-charcoal font-medium">
                      {timeline.filter(t => t.approval_required && t.approval_status === 'pending_review').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}