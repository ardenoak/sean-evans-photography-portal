'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'session' | 'google' | 'other';
  description?: string;
  location?: string;
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  session_type?: string;
  status?: string;
}

interface Session {
  id: string;
  session_type: string;
  session_date: string;
  session_time: string;
  duration: number;
  location: string;
  status: string;
  clients: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AdminCalendarPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadSessions();
      checkGoogleCalendarConnection();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients (first_name, last_name, email)
        `)
        .order('session_date', { ascending: true });

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setSessions(data || []);
        convertSessionsToEvents(data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertSessionsToEvents = (sessions: Session[]) => {
    const sessionEvents: CalendarEvent[] = sessions.map(session => {
      const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
      const endDateTime = new Date(sessionDateTime.getTime() + (session.duration || 60) * 60000);
      
      return {
        id: session.id,
        title: `${session.session_type} - ${session.clients.first_name} ${session.clients.last_name}`,
        start: sessionDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type: 'session',
        description: `${session.session_type} session`,
        location: session.location,
        client: session.clients,
        session_type: session.session_type,
        status: session.status
      };
    });

    setEvents(sessionEvents);
  };

  const checkGoogleCalendarConnection = async () => {
    // Check if Google Calendar is connected
    // This would check for stored OAuth tokens
    setGoogleCalendarConnected(false); // For now, assume not connected
  };

  const connectGoogleCalendar = async () => {
    try {
      // Redirect to Google OAuth
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`);
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    }
  };

  const syncWithGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const googleEvents = await response.json();
        // Merge Google events with session events
        const allEvents = [...events, ...googleEvents.map((event: any) => ({
          id: event.id,
          title: event.summary || 'Untitled Event',
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          type: 'google' as const,
          description: event.description,
          location: event.location
        }))];
        setEvents(allEvents);
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'session':
        switch (event.status) {
          case 'confirmed': return 'bg-verde text-white';
          case 'pending': return 'bg-gold text-white';
          case 'cancelled': return 'bg-red-500 text-white';
          default: return 'bg-blue-500 text-white';
        }
      case 'google':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                ←
              </button>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={200}
                height={80}
                className="h-8 w-auto"
                priority
              />
              <div>
                <h1 className="text-lg font-didot text-charcoal">Calendar</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!googleCalendarConnected ? (
                <button
                  onClick={connectGoogleCalendar}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  Connect Google Calendar
                </button>
              ) : (
                <button
                  onClick={syncWithGoogleCalendar}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                >
                  Sync Calendar
                </button>
              )}
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ←
              </button>
              <h2 className="text-2xl font-didot text-charcoal">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                →
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1 text-sm bg-gold text-white rounded hover:bg-gold/90"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-warm-gray border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-24 p-1"></div>;
              }
              
              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`h-24 p-1 border border-gray-200 overflow-hidden ${
                    isToday ? 'bg-gold/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-gold' : 'text-charcoal'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`text-xs px-1 py-0.5 rounded cursor-pointer truncate ${getEventColor(event)}`}
                        title={event.title}
                      >
                        {event.type === 'session' && '📸'} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-warm-gray">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-didot text-charcoal mb-4">Upcoming Sessions</h3>
          <div className="space-y-3">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-warm-gray/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-verde rounded-full"></div>
                  <div>
                    <div className="font-semibold text-charcoal">
                      {session.clients.first_name} {session.clients.last_name}
                    </div>
                    <div className="text-sm text-warm-gray">
                      {session.session_type} • {new Date(session.session_date).toLocaleDateString()} at {session.session_time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 text-xs rounded font-medium ${
                    session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-didot text-charcoal">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-warm-gray hover:text-charcoal"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-warm-gray">Time</div>
                <div className="text-charcoal">
                  {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                </div>
              </div>
              {selectedEvent.location && (
                <div>
                  <div className="text-sm text-warm-gray">Location</div>
                  <div className="text-charcoal">{selectedEvent.location}</div>
                </div>
              )}
              {selectedEvent.client && (
                <div>
                  <div className="text-sm text-warm-gray">Client</div>
                  <div className="text-charcoal">
                    {selectedEvent.client.first_name} {selectedEvent.client.last_name}
                  </div>
                  <div className="text-sm text-warm-gray">{selectedEvent.client.email}</div>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <div className="text-sm text-warm-gray">Description</div>
                  <div className="text-charcoal">{selectedEvent.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}