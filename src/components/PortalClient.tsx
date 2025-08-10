'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SessionData, TimelineItem, QuickAction, ActiveTab } from '@/types/portal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardTab from '@/components/DashboardTab';
import ResourcesTab from '@/components/ResourcesTab';
import GalleryTab from '@/components/GalleryTab';
import ChatWidget from '@/components/ChatWidget';

interface PortalClientProps {
  sessionId: string;
}

export default function PortalClient({ sessionId }: PortalClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      console.log('Loading session data for ID:', sessionId);
      
      // Load session with client info
      const { data: sessionResult, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          clients!inner(first_name, last_name, user_id)
        `)
        .eq('id', sessionId)
        .eq('clients.user_id', user.id)
        .single();

      console.log('Session query result:', { sessionResult, sessionError });

      if (sessionError) {
        console.error('Error loading session:', sessionError);
        router.push('/dashboard');
        return;
      }

      if (sessionResult) {
        const clientName = `${sessionResult.clients.first_name} ${sessionResult.clients.last_name}`;
        
        setSessionData({
          clientName,
          sessionType: sessionResult.session_type,
          date: sessionResult.session_date,
          time: sessionResult.session_time,
          location: sessionResult.location,
          duration: sessionResult.duration,
          photographer: sessionResult.photographer,
          investment: sessionResult.investment,
          status: sessionResult.status
        });

        // Load timeline for this session
        await loadSessionTimeline();
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionTimeline = async () => {
    try {
      console.log('Loading timeline for session:', sessionId);

      // Load timeline items for this session
      const { data: timelineData, error: timelineError } = await supabase
        .from('session_timelines')
        .select('*')
        .eq('session_id', sessionId)
        .order('task_order', { ascending: true });

      console.log('Timeline query result:', { timelineData, timelineError });

      if (timelineError) {
        console.error('Error loading timeline:', timelineError);
        // Fallback to generating timeline if none exists
        await generateFallbackTimeline();
      } else if (timelineData && timelineData.length > 0) {
        // Transform database timeline to client format with completion status
        const clientTimeline = timelineData.map(item => ({
          date: formatTimelineDate(item.adjusted_date || item.calculated_date),
          task: item.task_name,
          highlight: item.task_name.toLowerCase().includes('session day'),
          completed: item.is_completed || false,
          completedDate: item.completed_at ? formatTimelineDate(item.completed_at) : null
        }));
        setTimeline(clientTimeline);
      } else {
        // No timeline exists, generate one
        await generateFallbackTimeline();
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      await generateFallbackTimeline();
    }
  };

  const generateFallbackTimeline = async () => {
    console.log('Generating fallback timeline...');
    // Create a simple timeline based on session data
    if (sessionData) {
      const sessionDate = new Date(sessionData.date);
      const fallbackTimeline: TimelineItem[] = [
        {
          date: formatTimelineDate(new Date(sessionDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()),
          task: 'Contract & payment confirmed'
        },
        {
          date: formatTimelineDate(new Date(sessionDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          task: 'Style guide & preparation materials sent'
        },
        {
          date: formatTimelineDate(new Date(sessionDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()),
          task: 'Pre-session consultation call'
        },
        {
          date: sessionData.date,
          task: 'Session day',
          highlight: true
        },
        {
          date: formatTimelineDate(new Date(sessionDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()),
          task: 'Preview gallery delivery'
        },
        {
          date: formatTimelineDate(new Date(sessionDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()),
          task: 'Complete gallery delivery'
        }
      ];
      setTimeline(fallbackTimeline);
    }
  };

  const formatTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-verde to-gold rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray">Session not found</p>
        </div>
      </div>
    );
  }

  const quickActions: QuickAction[] = [
    { label: 'View Contract', icon: '📄' },
    { label: 'Style Guide', icon: '👗' },
    { label: 'Location Details', icon: '📍' },
    { label: 'Contact Sean', icon: '💬' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            sessionData={sessionData!}
            timeline={timeline}
            quickActions={quickActions}
            onChatOpen={() => setIsChatOpen(true)}
          />
        );
      case 'resources':
        return <ResourcesTab sessionId={sessionId} />;
      case 'gallery':
        return <GalleryTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors flex items-center space-x-2 group flex-shrink-0"
                title="Back to Dashboard"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">←</span>
                <span className="text-xs sm:text-sm">Dashboard</span>
              </button>
              <div className="h-6 sm:h-8 w-px bg-warm-gray/30 hidden sm:block"></div>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={300}
                height={120}
                className="h-8 sm:h-10 md:h-14 w-auto cursor-pointer"
                onClick={() => router.push('/dashboard')}
                priority
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-8">
              <nav className="flex items-center space-x-2 sm:space-x-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`text-xs sm:text-sm tracking-wide transition-colors relative px-2 py-1 rounded-md ${
                    activeTab === 'dashboard' 
                      ? 'text-charcoal bg-gold/10' 
                      : 'text-warm-gray hover:text-charcoal hover:bg-ivory'
                  }`}
                >
                  Overview
                  {activeTab === 'dashboard' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`text-xs sm:text-sm tracking-wide transition-colors relative flex items-center px-2 py-1 rounded-md ${
                    activeTab === 'resources' 
                      ? 'text-charcoal bg-gold/10' 
                      : 'text-warm-gray hover:text-charcoal hover:bg-ivory'
                  }`}
                >
                  Resources
                  <span className="ml-1 sm:ml-2 bg-verde text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
                  {activeTab === 'resources' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('gallery')}
                  className={`text-xs sm:text-sm tracking-wide transition-colors relative px-2 py-1 rounded-md ${
                    activeTab === 'gallery' 
                      ? 'text-charcoal bg-gold/10' 
                      : 'text-warm-gray hover:text-charcoal hover:bg-ivory'
                  }`}
                >
                  Gallery
                  {activeTab === 'gallery' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                  )}
                </button>
              </nav>
              <span className="text-warm-gray text-xs sm:text-sm hidden sm:inline">
                Welcome back, {sessionData!.clientName.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2">
        <div className="flex items-center text-sm text-warm-gray space-x-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="hover:text-charcoal transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-charcoal font-medium">
            {sessionData?.sessionType || 'Session Details'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 transition-all duration-500 ease-in-out">
        {renderTabContent()}
      </div>

      {/* Chat Widget */}
      <ChatWidget 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        clientName={sessionData!.clientName}
        sessionId={sessionId}
      />
    </div>
  );
}