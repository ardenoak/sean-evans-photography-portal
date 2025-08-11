'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
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
  preferred_time?: string;
  preferred_session_date?: string;
  lead_source?: string;
  status: string;
  message?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
  next_follow_up?: string;
  last_viewed_at?: string;
}

export default function AdminLeadsPage() {
  // Direct admin access without auth
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    session_type_interest: '',
    budget_range: '',
    preferred_timeline: '',
    preferred_time: '',
    preferred_session_date: '',
    lead_source: 'Manual Entry',
    message: '',
    client_id: null as string | null
  });
  const [clients, setClients] = useState<any[]>([]);
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadLeads();
    loadClients();
    // Set up real-time updates for new leads
    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClientDropdown && !(event.target as Element).closest('.client-search-container')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientDropdown]);

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/admin/leads');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading leads:', result.error);
      } else {
        setLeads(result.data || []);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
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

  const markLeadAsViewed = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          last_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error marking lead as viewed:', error);
      } else {
        loadLeads();
      }
    } catch (error) {
      console.error('Error marking lead as viewed:', error);
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
        loadLeads();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const saveLeadChanges = async () => {
    if (!editedLead || !selectedLead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: editedLead.status,
          notes: editedLead.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedLead.id);

      if (error) {
        console.error('Error saving lead:', error);
        alert('Error saving lead changes');
      } else {
        setHasUnsavedChanges(false);
        setSelectedLead(editedLead);
        loadLeads();
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleLeadChange = (field: keyof Lead, value: any) => {
    if (!selectedLead) return;
    
    const updated = { ...selectedLead, [field]: value };
    setEditedLead(updated);
    setHasUnsavedChanges(true);
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Error deleting lead:', error);
        alert('Error deleting lead');
      } else {
        setSelectedLead(null);
        loadLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-verde text-white',
      'contacted': 'bg-gold text-white',
      'qualified': 'bg-purple-500 text-white',
      'proposal_sent': 'bg-orange-500 text-white',
      'converted': 'bg-green-500 text-white',
      'lost': 'bg-red-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-warm-gray text-white';
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffHours < 48) {
      return '1 day ago';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isNewLead = (lead: Lead) => {
    // Lead is "new" if it hasn't been viewed yet and was created recently
    if (lead.last_viewed_at) return false; // Already viewed
    
    const leadDate = new Date(lead.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - leadDate.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours <= 24; // New if within 24 hours and not viewed
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

  const newLeadsCount = leads.filter(lead => isNewLead(lead)).length;

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      console.log('Creating lead with data:', newLead);
      
      const leadData = {
        ...newLead,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Convert empty dates to null to avoid PostgreSQL date parsing errors
        preferred_session_date: newLead.preferred_session_date || null
      };
      
      console.log('Final lead data being inserted:', leadData);

      const response = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();
      console.log('API result:', result);

      if (!response.ok) {
        console.error('Error creating lead:', result.error);
        alert(`Error creating lead: ${result.error}`);
      } else {
        setShowCreateModal(false);
        setNewLead({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          session_type_interest: '',
          budget_range: '',
          preferred_timeline: '',
          preferred_time: '',
          preferred_session_date: '',
          lead_source: 'Manual Entry',
          message: '',
          client_id: null
        });
        setClientSearchQuery('');
        setShowClientDropdown(false);
        setIsExistingClient(false);
        loadLeads();
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating lead');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleNewLeadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'client_id' && value) {
      // Auto-fill client details when existing client is selected
      const selectedClient = clients.find(client => client.id === value);
      if (selectedClient) {
        setNewLead(prev => ({
          ...prev,
          client_id: value,
          first_name: selectedClient.first_name,
          last_name: selectedClient.last_name,
          email: selectedClient.email
        }));
      }
    } else {
      setNewLead(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClientTypeChange = (isExisting: boolean) => {
    setIsExistingClient(isExisting);
    if (!isExisting) {
      // Clear client selection when switching to new client
      setNewLead(prev => ({
        ...prev,
        client_id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        preferred_time: '',
        preferred_session_date: ''
      }));
      setClientSearchQuery('');
      setShowClientDropdown(false);
    }
  };

  // Removed sign out

  if ( loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (!true) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Compact Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-none mx-auto px-6 py-3">
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
                <h1 className="text-lg font-didot text-charcoal">Leads</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {newLeadsCount > 0 && (
                <div className="bg-verde text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  🆕 {newLeadsCount} New
                </div>
              )}
              {/* Direct admin access - no auth needed */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-none mx-auto px-6 py-4">
        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-charcoal">{leads.length}</div>
            <div className="text-xs text-warm-gray">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-verde">{statusCounts.new || 0}</div>
            <div className="text-xs text-warm-gray">New</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{statusCounts.qualified || 0}</div>
            <div className="text-xs text-warm-gray">Qualified</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <div className="text-lg font-bold text-green-600">{statusCounts.converted || 0}</div>
            <div className="text-xs text-warm-gray">Converted</div>
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="flex-1 px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold text-sm"
            />
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm font-medium"
            >
              + Add Lead
            </button>
          </div>
        </div>

        {/* Compact Leads List */}
        <div className="bg-white rounded-lg shadow">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-warm-gray">No leads found</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-gray/20">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`p-4 hover:bg-ivory/30 cursor-pointer transition-colors relative ${
                    isNewLead(lead) ? 'bg-green-50 border-l-4 border-l-verde' : ''
                  }`}
                  onClick={() => {
                    setSelectedLead(lead);
                    setEditedLead(lead);
                    setHasUnsavedChanges(false);
                    if (isNewLead(lead)) {
                      markLeadAsViewed(lead.id);
                    }
                  }}
                >
                  {/* New Lead Indicator */}
                  {isNewLead(lead) && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-verde rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-charcoal truncate">
                            {lead.first_name} {lead.last_name}
                          </p>
                          {isNewLead(lead) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-verde text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warm-gray truncate">{lead.email}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          {lead.session_type_interest && (
                            <span className="text-xs text-charcoal bg-ivory/50 px-2 py-0.5 rounded">
                              {lead.session_type_interest}
                            </span>
                          )}
                          {lead.budget_range && (
                            <span className="text-xs text-charcoal bg-gold/20 px-2 py-0.5 rounded">
                              {lead.budget_range}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status === 'new' ? 'NEW' : lead.status.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className="text-xs text-warm-gray">
                        {formatDate(lead.created_at)}
                      </span>
                    </div>
                  </div>

                  {lead.message && (
                    <div className="mt-2">
                      <p className="text-xs text-warm-gray line-clamp-1 italic">
                        "{lead.message.substring(0, 100)}..."
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && editedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-warm-gray/20 bg-gradient-to-r from-ivory to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-didot text-charcoal">
                        {selectedLead.first_name} {selectedLead.last_name}
                      </h3>
                      {isNewLead(selectedLead) && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-verde text-white animate-pulse">
                          NEW LEAD
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-warm-gray">{selectedLead.email}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedLead.email)}
                          className="text-xs text-gold hover:text-gold/80 transition-colors"
                          title="Copy email"
                        >
                          📋
                        </button>
                      </div>
                      {selectedLead.phone && (
                        <div className="flex items-center space-x-2">
                          <p className="text-warm-gray text-sm">{selectedLead.phone}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedLead.phone || '')}
                            className="text-xs text-gold hover:text-gold/80 transition-colors"
                            title="Copy phone"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedLead(null);
                      setEditedLead(null);
                      setHasUnsavedChanges(false);
                    }}
                    className="text-warm-gray hover:text-charcoal transition-colors p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Details - Left Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-warm-gray mb-1">Status</p>
                      <select
                        value={editedLead.status}
                        onChange={(e) => handleLeadChange('status', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border border-warm-gray/30 font-medium focus:ring-2 focus:ring-gold ${getStatusColor(editedLead.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    
                    {selectedLead.session_type_interest && (
                      <div>
                        <p className="text-sm text-warm-gray mb-1">Session Interest</p>
                        <p className="text-charcoal bg-ivory/30 px-3 py-2 rounded-lg text-sm">{selectedLead.session_type_interest}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.budget_range && (
                      <div>
                        <p className="text-sm text-warm-gray mb-1">Budget Range</p>
                        <p className="text-charcoal bg-gold/10 px-3 py-2 rounded-lg text-sm">{selectedLead.budget_range}</p>
                      </div>
                    )}
                    
                    {selectedLead.lead_source && (
                      <div>
                        <p className="text-sm text-warm-gray mb-1">Lead Source</p>
                        <p className="text-charcoal bg-verde/10 px-3 py-2 rounded-lg text-sm">{selectedLead.lead_source}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.preferred_timeline && (
                      <div>
                        <p className="text-sm text-warm-gray mb-1">Timeline</p>
                        <p className="text-charcoal bg-blue-50 px-3 py-2 rounded-lg text-sm">{selectedLead.preferred_timeline}</p>
                      </div>
                    )}
                    
                    {selectedLead.preferred_time && (
                      <div>
                        <p className="text-sm text-warm-gray mb-1">Preferred Time</p>
                        <p className="text-charcoal bg-purple-50 px-3 py-2 rounded-lg text-sm">{selectedLead.preferred_time}</p>
                      </div>
                    )}
                  </div>

                  {selectedLead.preferred_session_date && (
                    <div>
                      <p className="text-sm text-warm-gray mb-1">Preferred Session Date</p>
                      <p className="text-charcoal bg-green-50 px-3 py-2 rounded-lg text-sm">
                        📅 {new Date(selectedLead.preferred_session_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}

                  {selectedLead.message && (
                    <div>
                      <p className="text-sm text-warm-gray mb-2">Initial Message</p>
                      <div className="bg-ivory/50 rounded-lg p-4 border-l-4 border-gold">
                        <p className="text-charcoal italic">"{selectedLead.message}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section - Right Column */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4 h-full">
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      📝 Internal Notes
                    </label>
                    <textarea
                      value={editedLead.notes || ''}
                      onChange={(e) => handleLeadChange('notes', e.target.value)}
                      placeholder="Add your notes about this lead..."
                      rows={12}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none text-sm"
                    />
                    <p className="text-xs text-warm-gray mt-1">
                      These notes are private and only visible to admins
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-6 mt-6 border-t border-warm-gray/20">
                <div className="text-sm text-warm-gray">
                  <p>Created: {formatDate(selectedLead.created_at)} ({isNewLead(selectedLead) ? 'NEW' : 'Viewed'})</p>
                  <p>Updated: {formatDate(selectedLead.updated_at)}</p>
                  {selectedLead.last_viewed_at && (
                    <p>Last Viewed: {formatDate(selectedLead.last_viewed_at)}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                  
                  {hasUnsavedChanges && (
                    <button
                      onClick={saveLeadChanges}
                      className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm font-medium flex items-center space-x-2"
                    >
                      <span>💾</span>
                      <span>Save Changes</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => router.push(`/admin/proposals/${selectedLead.id}`)}
                    className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Generate Proposal</span>
                  </button>
                  
                  <button className="bg-verde text-white px-4 py-2 rounded-lg hover:bg-verde/90 transition-colors text-sm">
                    Convert to Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedLead && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-didot text-charcoal mb-2">
                Delete Lead
              </h3>
              <p className="text-sm text-warm-gray mb-6">
                Are you sure you want to delete <strong>{selectedLead.first_name} {selectedLead.last_name}</strong>? 
                This action cannot be undone and will permanently remove all lead information and notes.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-warm-gray hover:text-charcoal transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteLead(selectedLead.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  🗑️ Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-didot text-charcoal">Add New Lead</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-warm-gray hover:text-charcoal transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateLead} className="p-6">
              <div className="space-y-4">
                {/* Client Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Client Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clientType"
                        checked={!isExistingClient}
                        onChange={() => handleClientTypeChange(false)}
                        className="mr-2 text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-charcoal">New Client</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clientType"
                        checked={isExistingClient}
                        onChange={() => handleClientTypeChange(true)}
                        className="mr-2 text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-charcoal">Existing Client</span>
                    </label>
                  </div>
                </div>

                {/* Existing Client Search */}
                {isExistingClient && (
                  <div className="relative client-search-container">
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Search Existing Client *
                    </label>
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setShowClientDropdown(true);
                        if (!e.target.value) {
                          setNewLead(prev => ({ ...prev, client_id: null, first_name: '', last_name: '', email: '' }));
                        }
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Search by name or email..."
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      required={isExistingClient && !newLead.client_id}
                    />
                    
                    {/* Client Dropdown */}
                    {showClientDropdown && clientSearchQuery && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-warm-gray/30 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {clients
                          .filter(client => 
                            client.first_name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                            client.last_name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                            client.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
                          )
                          .slice(0, 10) // Limit to 10 results
                          .map((client) => (
                            <div
                              key={client.id}
                              onClick={() => {
                                setNewLead(prev => ({
                                  ...prev,
                                  client_id: client.id,
                                  first_name: client.first_name,
                                  last_name: client.last_name,
                                  email: client.email
                                }));
                                setClientSearchQuery(`${client.first_name} ${client.last_name}`);
                                setShowClientDropdown(false);
                              }}
                              className="p-3 hover:bg-ivory/30 cursor-pointer border-b border-warm-gray/10 last:border-b-0"
                            >
                              <div className="text-sm font-medium text-charcoal">
                                {client.first_name} {client.last_name}
                              </div>
                              <div className="text-xs text-warm-gray">
                                {client.email}
                              </div>
                            </div>
                          ))
                        }
                        {clients.filter(client => 
                          client.first_name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          client.last_name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          client.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-3 text-sm text-warm-gray text-center">
                            No clients found matching "{clientSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Name Fields (auto-filled for existing clients) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={newLead.first_name}
                      onChange={handleNewLeadChange}
                      required
                      disabled={isExistingClient}
                      className={`w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent ${
                        isExistingClient ? 'bg-gray-50 text-gray-500' : ''
                      }`}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={newLead.last_name}
                      onChange={handleNewLeadChange}
                      required
                      disabled={isExistingClient}
                      className={`w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent ${
                        isExistingClient ? 'bg-gray-50 text-gray-500' : ''
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newLead.email}
                    onChange={handleNewLeadChange}
                    required
                    disabled={isExistingClient}
                    className={`w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent ${
                      isExistingClient ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newLead.phone}
                    onChange={handleNewLeadChange}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Session Interest
                  </label>
                  <select
                    name="session_type_interest"
                    value={newLead.session_type_interest}
                    onChange={handleNewLeadChange}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    <option value="Editorial Portrait">Editorial Portrait</option>
                    <option value="Branding Session">Branding Session</option>
                    <option value="Headshots">Headshots</option>
                    <option value="Creative Portrait">Creative Portrait</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Budget Range
                    </label>
                    <select
                      name="budget_range"
                      value={newLead.budget_range}
                      onChange={handleNewLeadChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="">Select range...</option>
                      <option value="$500 - $1,000">$500 - $1,000</option>
                      <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                      <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                      <option value="$5,000 - $7,500">$5,000 - $7,500</option>
                      <option value="Let's discuss">Let's discuss</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Timeline
                    </label>
                    <select
                      name="preferred_timeline"
                      value={newLead.preferred_timeline}
                      onChange={handleNewLeadChange}
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="">Select timeline...</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Preferred Session Date
                  </label>
                  <input
                    type="date"
                    name="preferred_session_date"
                    value={newLead.preferred_session_date}
                    onChange={handleNewLeadChange}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Lead Source
                  </label>
                  <select
                    name="lead_source"
                    value={newLead.lead_source}
                    onChange={handleNewLeadChange}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="Manual Entry">Manual Entry</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="Referral">Referral</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Wedding Wire">Wedding Wire</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Notes/Message
                  </label>
                  <textarea
                    name="message"
                    value={newLead.message}
                    onChange={handleNewLeadChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                    placeholder="Any additional notes about this lead..."
                  />
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
                    'Create Lead'
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