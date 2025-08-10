'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
import { supabase } from '@/lib/supabase';

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
    photographer: 'Sean Evans',
    investment: '',
    status: 'Confirmed & Scheduled'
  });
  const router = useRouter();

  useEffect(() => {
    loadSessions();
    loadClients();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients!inner(first_name, last_name, email)
        `)
        .order('session_date', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) {
        console.error('Error loading clients:', error);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session status:', error);
        alert('Error updating session status');
      } else {
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
      const { error } = await supabase
        .from('sessions')
        .insert([newSession]);

      if (error) {
        console.error('Error creating session:', error);
        alert('Error creating session');
      } else {
        setShowCreateModal(false);
        setNewSession({
          client_id: '',
          session_type: 'Portrait Session',
          session_title: '',
          session_date: '',
          session_time: '',
          location: '',
          duration: '2 Hours',
          photographer: 'Sean Evans',
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
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Direct admin access without auth

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Compact Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
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
                <h1 className="text-lg font-didot text-charcoal">Sessions</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {upcomingSessions > 0 && (
                <div className="bg-verde text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  📅 {upcomingSessions} Upcoming
                </div>
              )}
              {/* No sign out needed - direct access */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-charcoal">{sessions.length}</div>
            <div className="text-xs text-warm-gray">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-verde">{statusCounts['Confirmed & Scheduled'] || 0}</div>
            <div className="text-xs text-warm-gray">Confirmed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-gold">{statusCounts.Completed || 0}</div>
            <div className="text-xs text-warm-gray">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{upcomingSessions}</div>
            <div className="text-xs text-warm-gray">Upcoming</div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold text-sm"
            >
              <option value="all">All Status</option>
              <option value="Confirmed & Scheduled">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="flex-1 px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold text-sm"
            />
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm font-medium"
            >
              + Add Session
            </button>
          </div>
        </div>

        {/* Compact Sessions List */}
        <div className="bg-white rounded-lg shadow">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-warm-gray">No sessions found</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-gray/20">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 hover:bg-ivory/30 cursor-pointer transition-colors relative ${
                    isUpcoming(session.session_date) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  {/* Upcoming Indicator */}
                  {isUpcoming(session.session_date) && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-charcoal truncate">
                            {session.session_title}
                          </p>
                          {isUpcoming(session.session_date) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
                              UPCOMING
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warm-gray truncate">
                          {session.clients.first_name} {session.clients.last_name} • {session.session_type}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-charcoal bg-ivory/50 px-2 py-0.5 rounded">
                            {session.session_date}
                          </span>
                          {session.session_time && (
                            <span className="text-xs text-charcoal bg-gold/20 px-2 py-0.5 rounded">
                              {session.session_time}
                            </span>
                          )}
                          {session.investment && (
                            <span className="text-xs text-charcoal bg-verde/20 px-2 py-0.5 rounded">
                              {session.investment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(session.status)}`}>
                        {session.status === 'Confirmed & Scheduled' ? 'CONFIRMED' : session.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-warm-gray">
                        {formatDate(session.session_date)}
                      </span>
                    </div>
                  </div>

                  {session.location && (
                    <div className="mt-2">
                      <p className="text-xs text-warm-gray line-clamp-1">
                        📍 {session.location}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                    View Portal
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
  );
}