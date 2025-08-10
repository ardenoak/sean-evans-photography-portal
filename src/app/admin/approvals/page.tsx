'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface PendingApproval {
  approval_id: string;
  ai_content_type: string;
  ai_generated_at: string;
  revision_count: number;
  session_title: string;
  session_date: string;
  session_type: string;
  client_name: string;
  client_email: string;
  task_name: string;
  due_date: string;
  content_preview: string;
  ai_generated_content: any;
}

interface Timeline {
  id: string;
  session_id: string;
  task_name: string;
  calculated_date: string;
  adjusted_date?: string;
  is_completed: boolean;
  can_be_automated: boolean;
  approval_required: boolean;
  approval_status: string;
  automation_status: string;
  task_order: number;
}

export default function AdminApprovalsPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentTimelines, setRecentTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadApprovalData();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadApprovalData = async () => {
    try {
      console.log('Loading approval data...');
      
      // Load pending approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('ai_task_approvals')
        .select(`
          id,
          ai_content_type,
          ai_generated_at,
          revision_count,
          ai_generated_content,
          sessions!inner(
            session_title,
            session_date,
            session_type,
            clients!inner(
              first_name,
              last_name,
              email
            )
          ),
          session_timelines!inner(
            task_name,
            adjusted_date,
            calculated_date
          )
        `)
        .eq('approval_status', 'pending_review')
        .order('ai_generated_at', { ascending: true });

      console.log('Approvals data:', { approvalsData, approvalsError });

      if (approvalsError) {
        console.error('Error loading approvals:', approvalsError);
      } else if (approvalsData) {
        const formattedApprovals = approvalsData.map((approval: any) => ({
          approval_id: approval.id,
          ai_content_type: approval.ai_content_type,
          ai_generated_at: approval.ai_generated_at,
          revision_count: approval.revision_count,
          session_title: approval.sessions.session_title,
          session_date: approval.sessions.session_date,
          session_type: approval.sessions.session_type,
          client_name: `${approval.sessions.clients.first_name} ${approval.sessions.clients.last_name}`,
          client_email: approval.sessions.clients.email,
          task_name: approval.session_timelines.task_name,
          due_date: approval.session_timelines.adjusted_date || approval.session_timelines.calculated_date,
          content_preview: getContentPreview(approval.ai_content_type, approval.ai_generated_content),
          ai_generated_content: approval.ai_generated_content
        }));
        setPendingApprovals(formattedApprovals);
      }

      // Load recent timeline activities
      const { data: timelinesData, error: timelinesError } = await supabase
        .from('session_timelines')
        .select(`
          id,
          session_id,
          task_name,
          calculated_date,
          adjusted_date,
          is_completed,
          can_be_automated,
          approval_required,
          approval_status,
          automation_status,
          task_order
        `)
        .order('calculated_date', { ascending: false })
        .limit(10);

      if (timelinesError) {
        console.error('Error loading timelines:', timelinesError);
      } else if (timelinesData) {
        setRecentTimelines(timelinesData);
      }

    } catch (error) {
      console.error('Error loading approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentPreview = (contentType: string, content: any) => {
    if (!content) return `${contentType} content`;
    
    switch (contentType) {
      case 'style_guide':
        return 'Style guide for session';
      case 'gallery_notification':
        return content.subject || 'Gallery notification email';
      case 'final_delivery_email':
        return content.subject || 'Final delivery email';
      default:
        return contentType;
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedApproval || !reviewAction) {
      alert('Please select an action');
      return;
    }

    setProcessing(true);

    try {
      console.log('Submitting review:', {
        approval_id: selectedApproval.approval_id,
        decision: reviewAction,
        notes: reviewNotes
      });

      // Call the review function we created in the database
      const { error } = await supabase.rpc('review_ai_content', {
        p_approval_id: selectedApproval.approval_id,
        p_admin_email: user?.email,
        p_decision: reviewAction,
        p_notes: reviewNotes || null
      });

      if (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
      } else {
        alert('Review submitted successfully!');
        setSelectedApproval(null);
        setReviewAction('');
        setReviewNotes('');
        loadApprovalData(); // Reload data
      }
    } catch (error) {
      console.error('Exception submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'revision_needed': 'bg-orange-100 text-orange-800',
      'pending': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading AI approvals...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
                onClick={() => router.push('/admin/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors flex items-center space-x-2 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">←</span>
                <span className="hidden sm:inline text-sm">Dashboard</span>
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
                <h1 className="text-xl font-didot text-charcoal">AI Approvals</h1>
                <p className="text-sm text-warm-gray">Review AI-generated content</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-gray text-sm hidden sm:inline">
                Welcome, {user?.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">Pending Approvals</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <div className="text-3xl font-bold text-charcoal">{pendingApprovals.length}</div>
            <div className="text-sm text-warm-gray">Require your review</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">AI Tasks Active</h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="text-3xl font-bold text-charcoal">
              {recentTimelines.filter(t => t.can_be_automated).length}
            </div>
            <div className="text-sm text-warm-gray">Automated tasks running</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">Timeline Items</h3>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-charcoal">{recentTimelines.length}</div>
            <div className="text-sm text-warm-gray">Recent timeline activities</div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="p-6 border-b border-warm-gray/20">
            <h2 className="text-xl font-didot text-charcoal">Pending AI Approvals</h2>
            <p className="text-warm-gray text-sm">Review AI-generated content before sending to clients</p>
          </div>

          <div className="p-6">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-ivory rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-didot text-charcoal mb-2">All caught up!</h3>
                <p className="text-warm-gray">No pending AI approvals at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.approval_id}
                    className="border border-warm-gray/20 rounded-lg p-4 hover:border-gold transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-charcoal">{approval.content_preview}</h3>
                        <p className="text-sm text-warm-gray">
                          {approval.client_name} • {approval.session_title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {approval.revision_count > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Revision {approval.revision_count}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {approval.ai_content_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-warm-gray mb-3">
                      Due: {formatDate(approval.due_date)} • Generated: {formatDate(approval.ai_generated_at)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedApproval(approval)}
                        className="bg-gold text-white px-4 py-2 rounded-lg text-sm hover:bg-gold/90 transition-colors"
                      >
                        Review Content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Timeline Activities */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-warm-gray/20">
            <h2 className="text-xl font-didot text-charcoal">Recent Timeline Activities</h2>
            <p className="text-warm-gray text-sm">Overview of automated timeline tasks</p>
          </div>

          <div className="p-6">
            {recentTimelines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-warm-gray">No timeline activities yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTimelines.map((timeline) => (
                  <div
                    key={timeline.id}
                    className="flex items-center justify-between py-3 border-b border-warm-gray/10 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        timeline.is_completed ? 'bg-green-500' : 
                        timeline.can_be_automated ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{timeline.task_name}</p>
                        <p className="text-xs text-warm-gray">
                          Due: {formatDate(timeline.adjusted_date || timeline.calculated_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {timeline.can_be_automated && (
                        <span className="text-xs text-blue-600">🤖 AI</span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(timeline.automation_status)}`}>
                        {timeline.automation_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-didot text-charcoal">Review AI Content</h3>
                  <p className="text-warm-gray">{selectedApproval.client_name} • {selectedApproval.session_title}</p>
                </div>
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="text-warm-gray hover:text-charcoal transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="mb-6">
                <h4 className="font-semibold text-charcoal mb-2">AI Generated Content:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-charcoal">
                    {JSON.stringify(selectedApproval.ai_generated_content, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Review Decision
                  </label>
                  <select
                    value={reviewAction}
                    onChange={(e) => setReviewAction(e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">Select action...</option>
                    <option value="approved">✅ Approve & Send</option>
                    <option value="needs_revision">🔄 Request Revision</option>
                    <option value="rejected">❌ Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Add notes about your decision..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-warm-gray/20 flex justify-end space-x-4">
              <button
                onClick={() => setSelectedApproval(null)}
                className="px-6 py-3 border border-warm-gray/30 text-warm-gray rounded-lg hover:text-charcoal hover:border-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={!reviewAction || processing}
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {processing ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}