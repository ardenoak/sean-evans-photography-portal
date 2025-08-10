'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_type_interest?: string;
  budget_range?: string;
  preferred_timeline?: string;
  lead_source?: string;
  status: string;
  priority: string;
  message?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
  next_follow_up?: string;
}

export default function AdminLeadsPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadLeads();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading leads:', error);
      } else {
        setLeads(data || []);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        alert('Error updating lead status');
      } else {
        loadLeads(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'proposal_sent': 'bg-orange-100 text-orange-800',
      'converted': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-600',
      'medium': 'bg-blue-100 text-blue-600',
      'high': 'bg-red-100 text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-600';
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

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading leads...</p>
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
                <h1 className="text-xl font-didot text-charcoal">Lead Management</h1>
                <p className="text-sm text-warm-gray">Track and manage potential clients</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">Total Leads</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-charcoal">{leads.length}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">New Leads</h3>
              <span className="text-2xl">🆕</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.new || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">Qualified</h3>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.qualified || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-warm-gray">Converted</h3>
              <span className="text-2xl">🎉</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.converted || 0}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-charcoal mb-1">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-charcoal mb-1">
                  Search Leads
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              
              <button className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold/90 transition-colors mt-6">
                + New Lead
              </button>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-warm-gray/20">
            <h2 className="text-xl font-didot text-charcoal">
              Leads ({filteredLeads.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-ivory rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-didot text-charcoal mb-2">No leads found</h3>
                <p className="text-warm-gray">
                  {searchQuery || selectedStatus !== 'all' 
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first lead to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="border border-warm-gray/20 rounded-lg p-4 hover:border-gold transition-colors cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-charcoal">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <p className="text-sm text-warm-gray">{lead.email}</p>
                        {lead.phone && (
                          <p className="text-sm text-warm-gray">{lead.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                      {lead.session_type_interest && (
                        <div>
                          <p className="text-xs text-warm-gray">Interest</p>
                          <p className="text-sm text-charcoal">{lead.session_type_interest}</p>
                        </div>
                      )}
                      {lead.budget_range && (
                        <div>
                          <p className="text-xs text-warm-gray">Budget</p>
                          <p className="text-sm text-charcoal">{lead.budget_range}</p>
                        </div>
                      )}
                      {lead.lead_source && (
                        <div>
                          <p className="text-xs text-warm-gray">Source</p>
                          <p className="text-sm text-charcoal">{lead.lead_source}</p>
                        </div>
                      )}
                    </div>
                    
                    {lead.message && (
                      <div className="bg-ivory/50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-charcoal line-clamp-2">{lead.message}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-warm-gray">
                      <span>Created: {formatDate(lead.created_at)}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLeadStatus(lead.id, lead.status === 'new' ? 'contacted' : 'qualified');
                          }}
                          className="bg-gold text-white px-3 py-1 rounded text-xs hover:bg-gold/90 transition-colors"
                        >
                          {lead.status === 'new' ? 'Mark Contacted' : 'Update Status'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-didot text-charcoal">
                    {selectedLead.first_name} {selectedLead.last_name}
                  </h3>
                  <p className="text-warm-gray">{selectedLead.email}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
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
                  <span className={`inline-block px-2 py-1 text-sm rounded-full ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-warm-gray">Priority</p>
                  <span className={`inline-block px-2 py-1 text-sm rounded-full ${getPriorityColor(selectedLead.priority)}`}>
                    {selectedLead.priority}
                  </span>
                </div>
                {selectedLead.session_type_interest && (
                  <div>
                    <p className="text-sm text-warm-gray">Session Interest</p>
                    <p className="text-charcoal">{selectedLead.session_type_interest}</p>
                  </div>
                )}
                {selectedLead.budget_range && (
                  <div>
                    <p className="text-sm text-warm-gray">Budget Range</p>
                    <p className="text-charcoal">{selectedLead.budget_range}</p>
                  </div>
                )}
                {selectedLead.lead_source && (
                  <div>
                    <p className="text-sm text-warm-gray">Lead Source</p>
                    <p className="text-charcoal">{selectedLead.lead_source}</p>
                  </div>
                )}
                {selectedLead.preferred_timeline && (
                  <div>
                    <p className="text-sm text-warm-gray">Timeline</p>
                    <p className="text-charcoal">{selectedLead.preferred_timeline}</p>
                  </div>
                )}
              </div>

              {selectedLead.message && (
                <div className="mb-6">
                  <p className="text-sm text-warm-gray mb-2">Initial Message</p>
                  <div className="bg-ivory/50 rounded-lg p-4">
                    <p className="text-charcoal">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {selectedLead.notes && (
                <div className="mb-6">
                  <p className="text-sm text-warm-gray mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-charcoal">{selectedLead.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-warm-gray">
                  <p>Created: {formatDate(selectedLead.created_at)}</p>
                  <p>Updated: {formatDate(selectedLead.updated_at)}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Add Note
                  </button>
                  <button className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors">
                    Convert to Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}