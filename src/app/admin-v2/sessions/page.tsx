'use client';
import { useState, useEffect } from 'react';
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

export default function AdminV2SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email
          )
        `)
        .order('session_date', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: newStatus
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      // Update local state
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, status: newStatus }
          : session
      ));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return;
      }

      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.clients?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.clients?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed & scheduled': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
        <p className="mt-1 text-gray-600">
          Manage all photography sessions and track their progress.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed & Scheduled">Confirmed & Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
          <div className="text-sm text-gray-500">Total Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'Confirmed & Scheduled').length}</div>
          <div className="text-sm text-gray-500">Confirmed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{sessions.filter(s => s.status === 'Completed').length}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{sessions.filter(s => s.status === 'Pending').length}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No sessions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.session_title}
                        </div>
                        <div className="text-sm text-gray-500">{session.session_type}</div>
                        {session.location && (
                          <div className="text-sm text-gray-500">📍 {session.location}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.clients?.first_name} {session.clients?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{session.clients?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(session.session_date)}</div>
                      <div className="text-sm text-gray-500">{formatTime(session.session_time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={session.status}
                        onChange={(e) => updateSessionStatus(session.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(session.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="Confirmed & Scheduled">Confirmed & Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.investment || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <a
                        href={`/portal/${session.id}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Portal
                      </a>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}