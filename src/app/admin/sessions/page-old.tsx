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
  const { user, loading: false, true, signOut } = useAdminAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  // Form state for creating sessions
  const [formData, setFormData] = useState({
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!false && (false )) {
      return;
    }

    if ({
      loadSessions();
      loadClients();
    }
  }, [ router]);

  const loadSessions = async () => {
    try {
      console.log('Loading all sessions...');
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          clients!inner(first_name, last_name, email)
        `)
        .order('session_date', { ascending: false });

      console.log('Sessions query result:', { sessionsData, sessionsError });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
      } else if (sessionsData) {
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      } else if (clientsData) {
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateSession = async () => {
    if (!formData.client_id || !formData.session_title || !formData.session_date) {
      alert('Please fill in all required fields: Client, Session Title, and Date');
      return;
    }

    setSaving(true);

    try {
      console.log('Creating session with data:', formData);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert([formData])
        .select(`
          *,
          clients!inner(first_name, last_name, email)
        `)
        .single();

      console.log('Session creation result:', { data, error });

      if (error) {
        console.error('Detailed error creating session:', error);
        alert(`Error creating session: ${error.message}. Please check the console for details.`);
      } else {
        console.log('Session created successfully:', data);
        setSessions(prev => [data, ...prev]);
        setShowCreateSession(false);
        setFormData({
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
        alert('Session created successfully!');
      }
    } catch (error) {
      console.error('Exception creating session:', error);
      alert(`Exception creating session: ${error}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setFormData({
      client_id: session.client_id,
      session_type: session.session_type,
      session_title: session.session_title,
      session_date: session.session_date,
      session_time: session.session_time,
      location: session.location,
      duration: session.duration,
      photographer: session.photographer,
      investment: session.investment,
      status: session.status
    });
    setShowEditSession(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession || !formData.client_id || !formData.session_title || !formData.session_date) {
      alert('Please fill in all required fields: Client, Session Title, and Date');
      return;
    }

    setSaving(true);

    try {
      console.log('Updating session with data:', formData);
      
      const { data, error } = await supabase
        .from('sessions')
        .update(formData)
        .eq('id', editingSession.id)
        .select(`
          *,
          clients!inner(first_name, last_name, email)
        `)
        .single();

      console.log('Session update result:', { data, error });

      if (error) {
        console.error('Detailed error updating session:', error);
        alert(`Error updating session: ${error.message}. Please check the console for details.`);
      } else {
        console.log('Session updated successfully:', data);
        setSessions(prev => prev.map(session => 
          session.id === editingSession.id ? data : session
        ));
        setShowEditSession(false);
        setEditingSession(null);
        setFormData({
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
        alert('Session updated successfully!');
      }
    } catch (error) {
      console.error('Exception updating session:', error);
      alert(`Exception updating session: ${error}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  // Removed sign out

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.clients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.clients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if ( loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (!true) {
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
                title="Back to Admin Dashboard"
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
                <h1 className="text-xl font-didot text-charcoal">Session Management</h1>
                <p className="text-sm text-warm-gray">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-gray text-sm hidden sm:inline">
                              </span>
              <button
                onClick={handleSignOut}
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
          <span className="text-charcoal font-medium">Session Management</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-didot text-charcoal mb-2">
              Session Management
            </h2>
            <p className="text-warm-gray">
              Create and manage photography sessions for your clients
            </p>
          </div>
          <button
            onClick={() => setShowCreateSession(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-gold to-gold/90 text-white px-6 py-3 rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Create Session</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="Confirmed & Scheduled">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <span className="text-sm text-warm-gray">
                {filteredSessions.length} sessions
              </span>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid gap-6">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-ivory rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-didot text-charcoal mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No sessions found' : 'No sessions yet'}
              </h3>
              <p className="text-warm-gray mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first session to get started'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateSession(true)}
                  className="bg-gradient-to-r from-gold to-gold/90 text-white px-6 py-3 rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Create Your First Session
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-charcoal mb-1">
                        {session.session_title}
                      </h3>
                      <p className="text-warm-gray text-sm mb-2">
                        {session.session_type}
                      </p>
                      <p className="text-charcoal font-medium">
                        {session.clients.first_name} {session.clients.last_name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-warm-gray">Date</p>
                      <p className="text-charcoal font-medium">{session.session_date}</p>
                    </div>
                    <div>
                      <p className="text-warm-gray">Time</p>
                      <p className="text-charcoal font-medium">{session.session_time}</p>
                    </div>
                    <div>
                      <p className="text-warm-gray">Duration</p>
                      <p className="text-charcoal font-medium">{session.duration}</p>
                    </div>
                    <div>
                      <p className="text-warm-gray">Investment</p>
                      <p className="text-charcoal font-medium">{session.investment}</p>
                    </div>
                  </div>
                  
                  {session.location && (
                    <div className="mb-4">
                      <p className="text-warm-gray text-sm">Location</p>
                      <p className="text-charcoal">{session.location}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-warm-gray/10">
                    <div className="text-sm text-warm-gray">
                      Created {formatDate(session.created_at)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/sessions/${session.id}`)}
                        className="text-sm text-gold hover:text-gold/80 transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleEditSession(session)}
                        className="text-sm text-warm-gray hover:text-charcoal transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => window.open(`/portal/${session.id}`, '_blank')}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        As Client
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-didot text-charcoal">Create New Session</h3>
              <button
                onClick={() => setShowCreateSession(false)}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Type
                </label>
                <select
                  value={formData.session_type}
                  onChange={(e) => handleInputChange('session_type', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                >
                  <option value="Portrait Session">Portrait Session</option>
                  <option value="Family Session">Family Session</option>
                  <option value="Executive Session">Executive Session</option>
                  <option value="Branding Session">Branding Session</option>
                  <option value="Engagement Session">Engagement Session</option>
                  <option value="Wedding">Wedding</option>
                </select>
              </div>

              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.session_title}
                  onChange={(e) => handleInputChange('session_title', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Professional Headshots & Brand Photography"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Time
                </label>
                <input
                  type="text"
                  value={formData.session_time}
                  onChange={(e) => handleInputChange('session_time', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="10:00 AM"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Downtown Studio & Waterfront Location"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
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

              {/* Investment */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Investment
                </label>
                <input
                  type="text"
                  value={formData.investment}
                  onChange={(e) => handleInputChange('investment', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="$897"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                >
                  <option value="Confirmed & Scheduled">Confirmed & Scheduled</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Photographer */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Photographer
                </label>
                <input
                  type="text"
                  value={formData.photographer}
                  onChange={(e) => handleInputChange('photographer', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Sean Evans"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowCreateSession(false)}
                className="px-6 py-3 border border-warm-gray/30 text-warm-gray rounded-lg hover:text-charcoal hover:border-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Session'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditSession && editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-didot text-charcoal">Edit Session</h3>
              <button
                onClick={() => {
                  setShowEditSession(false);
                  setEditingSession(null);
                }}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection - Disabled for edit */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Client
                </label>
                <input
                  type="text"
                  value={`${editingSession.clients.first_name} ${editingSession.clients.last_name} (${editingSession.clients.email})`}
                  disabled
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-warm-gray mt-1">
                  Cannot change client for existing session
                </p>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Type
                </label>
                <select
                  value={formData.session_type}
                  onChange={(e) => handleInputChange('session_type', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                >
                  <option value="Portrait Session">Portrait Session</option>
                  <option value="Family Session">Family Session</option>
                  <option value="Executive Session">Executive Session</option>
                  <option value="Branding Session">Branding Session</option>
                  <option value="Engagement Session">Engagement Session</option>
                  <option value="Wedding">Wedding</option>
                </select>
              </div>

              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.session_title}
                  onChange={(e) => handleInputChange('session_title', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Professional Headshots & Brand Photography"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Session Time
                </label>
                <input
                  type="text"
                  value={formData.session_time}
                  onChange={(e) => handleInputChange('session_time', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="10:00 AM"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Downtown Studio & Waterfront Location"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
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

              {/* Investment */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Investment
                </label>
                <input
                  type="text"
                  value={formData.investment}
                  onChange={(e) => handleInputChange('investment', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="$897"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                >
                  <option value="Confirmed & Scheduled">Confirmed & Scheduled</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Photographer */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Photographer
                </label>
                <input
                  type="text"
                  value={formData.photographer}
                  onChange={(e) => handleInputChange('photographer', e.target.value)}
                  className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  placeholder="Sean Evans"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowEditSession(false);
                  setEditingSession(null);
                }}
                className="px-6 py-3 border border-warm-gray/30 text-warm-gray rounded-lg hover:text-charcoal hover:border-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSession}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Session'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}