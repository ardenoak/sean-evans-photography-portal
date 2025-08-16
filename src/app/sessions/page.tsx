'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
import { supabase } from '@/lib/supabase';
import { authenticatedFetch, authenticatedPost } from '@/lib/auth-fetch';
import Logo from '@/components/Logo';
import TallyLayout from '@/components/TallyLayout';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

interface Session {
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
  };
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminSessionsPage() {
  // Removed auth
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newSession, setNewSession] = useState({
    client_id: '',
    session_type: 'Portrait Session',
    session_title: '',
    session_date: '',
    session_time: '',
    location: '',
    duration: '2 Hours',
    photographer: process.env.NEXT_PUBLIC_PHOTOGRAPHER_NAME || 'Professional Photographer',
    investment: '',
    status: 'Confirmed & Scheduled'
  });
  const router = useRouter();
  
  // Feature flags
  const enhancedSearchEnabled = useFeatureFlag('enhancedSearch');
  const dashboardAnalyticsEnabled = useFeatureFlag('dashboardAnalytics');

  useEffect(() => {
    loadSessions();
    loadClients();
  }, []);

  const loadSessions = async () => {
    try {
      console.log('🔑 [SESSIONS] Loading sessions with authenticated fetch');
      console.log('🌍 [SESSIONS] Environment:', process.env.NODE_ENV);
      
      const response = await authenticatedFetch('/api/sessions');
      const result = await response.json();
      console.log('📅 [SESSIONS] API result:', result);
      console.log('📡 [SESSIONS] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [SESSIONS] Error response:', result.error);
        // Still try to set sessions data if it exists in the result
        if (result.data) {
          console.log('✅ [SESSIONS] Setting sessions data despite error status');
          setSessions(result.data);
        }
      } else {
        setSessions(result.data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      console.log('🔑 [SESSIONS-CLIENTS] Loading clients with authenticated fetch');
      console.log('🌍 [SESSIONS-CLIENTS] Environment:', process.env.NODE_ENV);
      
      const response = await authenticatedFetch('/api/clients');
      const result = await response.json();
      console.log('👥 [SESSIONS-CLIENTS] API result:', result);
      console.log('📡 [SESSIONS-CLIENTS] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [SESSIONS-CLIENTS] Error response:', result.error);
        // Still try to set clients data if it exists in the result
        if (result.data) {
          console.log('✅ [SESSIONS-CLIENTS] Setting clients data despite error status');
          setClients(result.data);
        }
      } else {
        setClients(result.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      console.log('🔑 [SESSION-UPDATE] Updating session with authenticated fetch');
      console.log('🌍 [SESSION-UPDATE] Environment:', process.env.NODE_ENV);
      
      const response = await authenticatedFetch('/api/sessions', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionId, status: newStatus })
      });

      const result = await response.json();
      console.log('📝 [SESSION-UPDATE] API result:', result);
      console.log('📡 [SESSION-UPDATE] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [SESSION-UPDATE] Error response:', result.error);
        alert('Error updating session status');
      } else {
        console.log('✅ [SESSION-UPDATE] Session status updated successfully');
        loadSessions();
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Confirmed & Scheduled': 'bg-verde text-white',
      'Completed': 'bg-gold text-white',
      'Pending': 'bg-warm-gray text-white',
      'Cancelled': 'bg-red-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-warm-gray text-white';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isUpcoming = (dateString: string) => {
    const sessionDate = new Date(dateString);
    const now = new Date();
    const diffTime = sessionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Upcoming if within next 7 days
  };

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      session.session_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.clients.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.clients.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.session_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statusCounts = sessions.reduce((acc, session) => {
    acc[session.status] = (acc[session.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const upcomingSessions = sessions.filter(session => isUpcoming(session.session_date) && session.status === 'Confirmed & Scheduled').length;

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      console.log('🔑 [SESSION-CREATE] Creating session with authenticated fetch');
      console.log('🌍 [SESSION-CREATE] Environment:', process.env.NODE_ENV);
      console.log('📅 [SESSION-CREATE] Session data:', newSession);
      
      const response = await authenticatedPost('/api/sessions', newSession);

      const result = await response.json();
      console.log('📝 [SESSION-CREATE] API result:', result);
      console.log('📡 [SESSION-CREATE] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [SESSION-CREATE] Error response:', result.error);
        alert('Error creating session: ' + (result.error || 'Unknown error'));
      } else {
        console.log('✅ [SESSION-CREATE] Session created successfully');
        setShowCreateModal(false);
        setNewSession({
          client_id: '',
          session_type: 'Portrait Session',
          session_title: '',
          session_date: '',
          session_time: '',
          location: '',
          duration: '2 Hours',
          photographer: process.env.NEXT_PUBLIC_PHOTOGRAPHER_NAME || 'Professional Photographer',
          investment: '',
          status: 'Confirmed & Scheduled'
        });
        loadSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleNewSessionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSession(prev => ({ ...prev, [name]: value }));
  };

  // Removed sign out

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <Logo 
              width={200} 
              height={67} 
              variant="light" 
              className="opacity-90 animate-pulse"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] rounded"></div>
          </div>
          <div className="space-y-3">
            <p className="text-charcoal/70 font-light tracking-wide">Loading session data</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Direct admin access without auth

  return (
    <TallyLayout>
      <div className="bg-ivory">
        {/* Compact Header */}
        <div className="border-b border-charcoal/10 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-charcoal">Sessions</h1>
                <p className="text-sm text-charcoal/70 mt-1">Photography session scheduling and management</p>
              </div>
              {upcomingSessions > 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium">
                  {upcomingSessions} upcoming session{upcomingSessions !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-4">

        {/* Compact Session Management */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div></div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-verde text-white px-4 py-2 text-sm font-medium hover:bg-verde/90 transition-colors rounded"
            >
              + New Session
            </button>
          </div>
          
          {/* Compact Filters */}
          <div className="border border-charcoal/20 bg-white p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-charcoal/20 text-sm focus:ring-1 focus:ring-verde focus:border-verde rounded"
              >
                <option value="all">All Status</option>
                <option value="Confirmed & Scheduled">✓ Confirmed</option>
                <option value="Completed">★ Completed</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Cancelled">⚠ Cancelled</option>
              </select>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="flex-1 px-3 py-2 border border-charcoal/20 text-sm focus:ring-1 focus:ring-verde focus:border-verde rounded"
              />
              
              <div className="text-sm text-charcoal/60 flex items-center px-2">
                {filteredSessions.length} of {sessions.length} sessions
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table - Dense List Format */}
        <div className="border border-charcoal/20 bg-white">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-charcoal/5 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-charcoal/60 font-light text-sm">No sessions found</p>
              <p className="text-charcoal/40 text-xs mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              {/* Table Header - Desktop Only */}
              <div className="hidden md:block border-b border-charcoal/10 bg-charcoal/5">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-charcoal/70 uppercase tracking-wide">
                  <div className="col-span-3">Date & Client</div>
                  <div className="col-span-2">Session Type</div>
                  <div className="col-span-2">Time & Duration</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Investment</div>
                  <div className="col-span-1">Status</div>
                </div>
              </div>

              {/* Sessions Rows */}
              <div className="divide-y divide-charcoal/5">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`relative hover:bg-ivory/50 cursor-pointer transition-all duration-200 ${
                      isUpcoming(session.session_date) ? 'bg-blue-50/30 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    {/* Desktop Table Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm">
                      {/* Date & Client */}
                      <div className="col-span-3">
                        <div className="space-y-1">
                          <div className="font-medium text-charcoal flex items-center space-x-2">
                            <span>{session.session_date}</span>
                            {isUpcoming(session.session_date) && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <div className="text-charcoal/70 text-xs">
                            {session.clients.first_name} {session.clients.last_name}
                          </div>
                        </div>
                      </div>

                      {/* Session Type */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="font-medium text-charcoal truncate">{session.session_type}</div>
                          <div className="text-charcoal/60 text-xs truncate">{session.session_title}</div>
                        </div>
                      </div>

                      {/* Time & Duration */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="text-charcoal">{session.session_time || 'All Day'}</div>
                          <div className="text-charcoal/60 text-xs">{session.duration}</div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="col-span-2">
                        <div className="text-charcoal/70 text-xs truncate">
                          {session.location || 'Location TBD'}
                        </div>
                      </div>

                      {/* Investment */}
                      <div className="col-span-2">
                        <div className="font-medium text-verde">
                          {session.investment || 'Quote Pending'}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === 'Confirmed & Scheduled' ? 'bg-verde text-white' :
                          session.status === 'Completed' ? 'bg-gold text-white' :
                          session.status === 'Pending' ? 'bg-orange-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {session.status === 'Confirmed & Scheduled' ? '✓' : 
                           session.status === 'Completed' ? '★' :
                           session.status === 'Pending' ? '⏳' : '⚠'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-charcoal text-sm">{session.session_date}</span>
                          {isUpcoming(session.session_date) && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            session.status === 'Confirmed & Scheduled' ? 'bg-verde text-white' :
                            session.status === 'Completed' ? 'bg-gold text-white' :
                            session.status === 'Pending' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {session.status === 'Confirmed & Scheduled' ? '✓' : 
                             session.status === 'Completed' ? '★' :
                             session.status === 'Pending' ? '⏳' : '⚠'}
                          </span>
                        </div>
                        <div className="text-verde font-medium text-sm">{session.investment || 'Quote'}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-charcoal font-medium">{session.clients.first_name} {session.clients.last_name}</div>
                        <div className="text-charcoal/70 text-sm">{session.session_type} • {session.session_time || 'All Day'}</div>
                        {session.location && (
                          <div className="text-charcoal/60 text-xs">{session.location}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Detail Modal - Similar to Lead Detail */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-didot text-charcoal">
                      {selectedSession.session_title}
                    </h3>
                    {isUpcoming(selectedSession.session_date) && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-500 text-white animate-pulse">
                        UPCOMING
                      </span>
                    )}
                  </div>
                  <p className="text-warm-gray">
                    {selectedSession.clients.first_name} {selectedSession.clients.last_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-warm-gray hover:text-charcoal transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-warm-gray">Status</p>
                  <span className={`inline-block px-2 py-1 text-sm rounded-full ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-warm-gray">Session Type</p>
                  <p className="text-charcoal">{selectedSession.session_type}</p>
                </div>
                <div>
                  <p className="text-sm text-warm-gray">Date & Time</p>
                  <p className="text-charcoal">{selectedSession.session_date} {selectedSession.session_time}</p>
                </div>
                <div>
                  <p className="text-sm text-warm-gray">Duration</p>
                  <p className="text-charcoal">{selectedSession.duration}</p>
                </div>
                {selectedSession.investment && (
                  <div>
                    <p className="text-sm text-warm-gray">Investment</p>
                    <p className="text-charcoal">{selectedSession.investment}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-warm-gray">Photographer</p>
                  <p className="text-charcoal">{selectedSession.photographer}</p>
                </div>
              </div>

              {selectedSession.location && (
                <div className="mb-6">
                  <p className="text-sm text-warm-gray mb-2">Location</p>
                  <div className="bg-ivory/50 rounded-lg p-4">
                    <p className="text-charcoal">{selectedSession.location}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-4 border-t border-warm-gray/20">
                <div className="text-sm text-warm-gray">
                  <p>Created: {formatDate(selectedSession.created_at)}</p>
                  <p>Client: {selectedSession.clients.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateSessionStatus(selectedSession.id, selectedSession.status === 'Pending' ? 'Confirmed & Scheduled' : 'Completed')}
                    className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm"
                  >
                    {selectedSession.status === 'Pending' ? 'Confirm Session' : 'Mark Complete'}
                  </button>
                  <button 
                    onClick={() => window.open(`/portal/${selectedSession.id}`, '_blank')}
                    className="bg-verde text-white px-4 py-2 rounded-lg hover:bg-verde/90 transition-colors text-sm"
                  >
                    👁️ View Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-didot text-charcoal">Add New Session</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-warm-gray hover:text-charcoal transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Client *
                  </label>
                  <select
                    name="client_id"
                    value={newSession.client_id}
                    onChange={handleNewSessionChange}
                    required
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    name="session_title"
                    value={newSession.session_title}
                    onChange={handleNewSessionChange}
                    required
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Professional Headshots & Brand Photography"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Session Type
                    </label>
                    <select
                      name="session_type"
                      value={newSession.session_type}
                      onChange={handleNewSessionChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="Portrait Session">Portrait Session</option>
                      <option value="Family Session">Family Session</option>
                      <option value="Executive Session">Executive Session</option>
                      <option value="Branding Session">Branding Session</option>
                      <option value="Engagement Session">Engagement Session</option>
                      <option value="Wedding">Wedding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Duration
                    </label>
                    <select
                      name="duration"
                      value={newSession.duration}
                      onChange={handleNewSessionChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="1 Hour">1 Hour</option>
                      <option value="1.5 Hours">1.5 Hours</option>
                      <option value="2 Hours">2 Hours</option>
                      <option value="2.5 Hours">2.5 Hours</option>
                      <option value="3 Hours">3 Hours</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Full Day">Full Day</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Session Date *
                    </label>
                    <input
                      type="date"
                      name="session_date"
                      value={newSession.session_date}
                      onChange={handleNewSessionChange}
                      required
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Time
                    </label>
                    <select
                      name="session_time"
                      value={newSession.session_time}
                      onChange={handleNewSessionChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="">Select time...</option>
                      <option value="8:00 AM">8:00 AM</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={newSession.location}
                    onChange={handleNewSessionChange}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Downtown Studio & Waterfront Location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Investment
                    </label>
                    <select
                      name="investment"
                      value={newSession.investment}
                      onChange={handleNewSessionChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="">Select investment...</option>
                      <option value="$500">$500</option>
                      <option value="$750">$750</option>
                      <option value="$1,000">$1,000</option>
                      <option value="$1,250">$1,250</option>
                      <option value="$1,500">$1,500</option>
                      <option value="$1,750">$1,750</option>
                      <option value="$2,000">$2,000</option>
                      <option value="$2,500">$2,500</option>
                      <option value="$3,000">$3,000</option>
                      <option value="$3,500">$3,500</option>
                      <option value="$4,000">$4,000</option>
                      <option value="$5,000">$5,000</option>
                      <option value="$7,500">$7,500</option>
                      <option value="$10,000">$10,000</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newSession.status}
                      onChange={handleNewSessionChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="Confirmed & Scheduled">Confirmed & Scheduled</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-warm-gray/20">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-warm-gray hover:text-charcoal transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2 bg-verde text-white rounded-lg hover:bg-verde/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {createLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </TallyLayout>
  );
}