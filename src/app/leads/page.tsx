'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';
import TallyLayout from '@/components/TallyLayout';

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
  
  // Standard Experience Selection Modal
  const [showStandardExModal, setShowStandardExModal] = useState(false);
  const [standardExperiences, setStandardExperiences] = useState<any[]>([]);
  const [standardExLoading, setStandardExLoading] = useState(false);
  const [assigningExperience, setAssigningExperience] = useState(false);

  // Helper function to calculate timeline
  const getTimelineInfo = (sessionDate: string) => {
    const session = new Date(sessionDate);
    const today = new Date();
    const diffTime = session.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Past Date', color: 'text-red-600' };
    } else if (diffDays <= 7) {
      return { text: 'This Week', color: 'text-orange-600' };
    } else if (diffDays <= 14) {
      return { text: 'Within 2 Weeks', color: 'text-yellow-600' };
    } else if (diffDays <= 30) {
      return { text: 'Within a Month', color: 'text-blue-600' };
    } else if (diffDays <= 90) {
      return { text: 'Within 3 Months', color: 'text-verde' };
    } else {
      return { text: 'More than 3 Months', color: 'text-charcoal/60' };
    }
  };
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
  const [leadProposals, setLeadProposals] = useState<any[]>([]);
  const [leadQuotes, setLeadQuotes] = useState<any[]>([]);
  const [leadContracts, setLeadContracts] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: string, id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [converting, setConverting] = useState(false);
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
      const response = await fetch('/api/leads', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c'
        }
      });
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

  const loadLeadProposals = async (leadId: string) => {
    setProposalsLoading(true);
    try {
      // Load proposals
      const response = await fetch(`/api/proposals?leadId=${leadId}`);
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error loading proposals:', result.error);
      } else {
        setLeadProposals(result.data || []);
      }

      // Load quotes for this lead
      let quotes = [];
      try {
        const quotesResponse = await fetch(`/api/quotes?lead_id=${leadId}`);
        const quotesResult = await quotesResponse.json();
        
        if (quotesResponse.ok && quotesResult.data) {
          quotes = Array.isArray(quotesResult.data) ? quotesResult.data : [quotesResult.data];
          setLeadQuotes(quotes);
        } else {
          setLeadQuotes([]);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
        setLeadQuotes([]);
      }

      // Load contracts for this lead's quotes
      try {
        if (quotes.length > 0) {
          const contractPromises = quotes.map((quote: any) => 
            fetch(`/api/contracts?quote_id=${quote.id}`)
              .then(res => res.json())
              .then(result => result.data)
              .catch(() => null)
          );
          
          const contracts = await Promise.all(contractPromises);
          setLeadContracts(contracts.filter(Boolean));
        } else {
          setLeadContracts([]);
        }
      } catch (error) {
        console.error('Error loading contracts:', error);
        setLeadContracts([]);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  };

  // Convert lead to session
  const convertLeadToSession = async () => {
    if (!selectedLead) return;
    
    setConverting(true);
    try {
      const response = await fetch('/api/convert-lead-to-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to convert lead');
      }

      // Show success message with session details
      alert(`✅ Lead successfully converted to session!

Client: ${selectedLead.first_name} ${selectedLead.last_name}
Session: ${result.data.sessionTitle}
Status: ${result.data.sessionStatus}

The lead status has been updated to "converted" and you can now access the client session in the Sessions management area.`);

      // Close modals and refresh leads
      setShowConvertConfirm(false);
      setSelectedLead(null);
      loadLeads();
      
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('❌ Error converting lead to session. Please try again.\n\n' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setConverting(false);
    }
  };

  // Load standard experiences (templates) for selection
  const loadStandardExperiences = async () => {
    setStandardExLoading(true);
    try {
      const response = await fetch('/api/proposals');
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error loading standard experiences:', result.error);
        setStandardExperiences([]);
      } else {
        // Filter for template experiences only
        const templateExperiences = (result.data || []).filter((exp: any) => exp.status === 'template');
        setStandardExperiences(templateExperiences);
      }
    } catch (error) {
      console.error('Error loading standard experiences:', error);
      setStandardExperiences([]);
    } finally {
      setStandardExLoading(false);
    }
  };

  // Assign selected standard experience to current lead
  const assignStandardExperience = async (experience: any) => {
    if (!selectedLead) return;
    
    setAssigningExperience(true);
    try {
      // Create a copy of the template experience for this specific lead
      const experienceCopy = {
        lead_id: selectedLead.id,
        title: `${experience.title} - ${selectedLead.first_name} ${selectedLead.last_name}`,
        status: 'draft',
        client_name: `${selectedLead.first_name} ${selectedLead.last_name}`,
        client_email: selectedLead.email,
        custom_message: experience.custom_message,
        subtotal: experience.subtotal,
        total_amount: experience.total_amount,
        discount_amount: experience.discount_amount || 0,
        discount_percentage: experience.discount_percentage || 0
      };

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experienceCopy)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign experience');
      }

      // If the experience has packages, copy those too
      if (experience.proposal_packages && experience.proposal_packages.length > 0) {
        const packagesCopy = experience.proposal_packages.map((pkg: any) => ({
          proposal_id: result.data.id,
          package_id: pkg.package_id,
          package_snapshot: pkg.package_snapshot,
          quantity: pkg.quantity,
          unit_price: pkg.unit_price,
          total_price: pkg.total_price
        }));

        const { error: packagesError } = await supabase
          .from('proposal_packages')
          .insert(packagesCopy);

        if (packagesError) {
          console.warn('Error copying packages:', packagesError);
        }
      }

      // Close modal and reload lead data
      setShowStandardExModal(false);
      await loadLeadProposals(selectedLead.id);
      
      alert(`Experience "${experience.title}" has been assigned to ${selectedLead.first_name} ${selectedLead.last_name}!`);
    } catch (error) {
      console.error('Error assigning experience:', error);
      alert('Error assigning experience. Please try again.');
    } finally {
      setAssigningExperience(false);
    }
  };

  const markLeadAsViewed = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c'
        },
        body: JSON.stringify({
          last_viewed_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Error marking lead as viewed:', await response.text());
      } else {
        loadLeads();
      }
    } catch (error) {
      console.error('Error marking lead as viewed:', error);
    }
  };

  const handleDelete = async (type: 'proposal' | 'quote' | 'contract', id: string, name: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !selectedLead) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/delete?type=${deleteConfirm.type}&id=${deleteConfirm.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || `Failed to delete ${deleteConfirm.type}`);
        return;
      }

      // Reload the data for this lead
      await loadLeadProposals(selectedLead.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(`Error deleting ${deleteConfirm.type}. Please try again.`);
    } finally {
      setDeleting(false);
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
      'new': 'bg-charcoal text-ivory',
      'contacted': 'bg-charcoal/70 text-ivory',
      'qualified': 'bg-charcoal/60 text-ivory',
      'proposal_sent': 'bg-charcoal/50 text-ivory',
      'converted': 'bg-charcoal/40 text-ivory',
      'lost': 'bg-charcoal/80 text-ivory'
    };
    return colors[status as keyof typeof colors] || 'bg-charcoal/30 text-ivory';
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

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c'
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
            <p className="text-charcoal/70 font-light tracking-wide">Loading lead data</p>
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

  if (!true) {
    return null;
  }

  return (
    <TallyLayout>
    <div className="bg-ivory">
      <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">
                Tally • Lead Management
              </h1>
              <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            </div>
            <p className="text-base font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
              Manage client inquiries, track communications, and convert leads to bookings
            </p>
            {newLeadsCount > 0 && (
              <div className="inline-flex items-center px-4 py-2 bg-charcoal text-white rounded-full text-sm font-medium">
                🔥 {newLeadsCount} new lead{newLeadsCount !== 1 ? 's' : ''} to review
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-light text-charcoal tracking-wide mb-4">Overview</h2>
          <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
        </div>

        {/* Elegant Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white border border-charcoal/10 p-8 text-center">
            <div className="text-4xl font-light text-charcoal mb-2">{leads.length}</div>
            <div className="text-sm font-light text-charcoal/60 tracking-wide uppercase">Total Leads</div>
          </div>
          <div className="bg-white border border-charcoal/10 p-8 text-center">
            <div className="text-4xl font-light text-charcoal mb-2">{statusCounts.new || 0}</div>
            <div className="text-sm font-light text-charcoal/60 tracking-wide uppercase">New</div>
          </div>
          <div className="bg-white border border-charcoal/10 p-8 text-center">
            <div className="text-4xl font-light text-charcoal mb-2">{statusCounts.qualified || 0}</div>
            <div className="text-sm font-light text-charcoal/60 tracking-wide uppercase">Qualified</div>
          </div>
          <div className="bg-white border border-charcoal/10 p-8 text-center">
            <div className="text-4xl font-light text-charcoal mb-2">{statusCounts.converted || 0}</div>
            <div className="text-sm font-light text-charcoal/60 tracking-wide uppercase">Converted</div>
          </div>
        </div>

        {/* Refined Filters */}
        <div className="bg-white border border-charcoal/10 p-8 mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-charcoal/20 text-sm font-light focus:outline-none focus:border-charcoal transition-colors"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Experience Sent</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="px-4 py-3 border border-charcoal/20 text-sm font-light focus:outline-none focus:border-charcoal transition-colors min-w-64"
              />
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-charcoal text-white px-8 py-3 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
            >
              Add New Lead
            </button>
          </div>
        </div>

        {/* Elegant Leads List */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-4">Client Leads</h3>
            <div className="w-12 h-px bg-charcoal/20 mx-auto"></div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="bg-white border border-charcoal/10 p-16 text-center">
              <div className="text-charcoal/60 text-lg font-light mb-4">No leads found</div>
              <div className="text-charcoal/40 text-sm">Try adjusting your search criteria</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`bg-white border border-charcoal/10 hover:border-charcoal/30 cursor-pointer transition-all duration-300 relative ${
                    isNewLead(lead) ? 'border-l-4 border-l-verde bg-verde/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedLead(lead);
                    setEditedLead(lead);
                    setHasUnsavedChanges(false);
                    setLeadProposals([]);
                    setLeadQuotes([]);
                    setLeadContracts([]);
                    loadLeadProposals(lead.id);
                    if (isNewLead(lead)) {
                      markLeadAsViewed(lead.id);
                    }
                  }}
                >
                  <div className="p-6">
                    {/* New Lead Indicator */}
                    {isNewLead(lead) && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-verde text-white px-3 py-1 text-xs font-medium tracking-wide shadow-sm">
                          NEW
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="text-lg font-light text-charcoal tracking-wide mb-1">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <div className="text-charcoal/60 font-light text-sm">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-charcoal/60 font-light text-xs">{lead.phone}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          {lead.session_type_interest && (
                            <div>
                              <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Session Type</div>
                              <div className="text-charcoal font-light text-sm">{lead.session_type_interest}</div>
                            </div>
                          )}
                          {lead.budget_range && (
                            <div>
                              <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Budget</div>
                              <div className="text-charcoal font-light text-sm">{lead.budget_range}</div>
                            </div>
                          )}
                          {lead.preferred_timeline && (
                            <div>
                              <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Timeline</div>
                              <div className="text-charcoal font-light text-sm">{lead.preferred_timeline}</div>
                            </div>
                          )}
                        </div>

                        {lead.message && (
                          <div className="border-l-2 border-charcoal/20 pl-3 italic text-charcoal/70 font-light text-sm">
                            "{lead.message.substring(0, 120)}..."
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 text-right space-y-2">
                        <div className="text-charcoal/60 text-xs uppercase tracking-wide">Status</div>
                        <div className={`px-3 py-1.5 text-xs font-light tracking-wide ${getStatusColor(lead.status)}`}>
                          {lead.status === 'new' ? 'NEW' : lead.status.toUpperCase().replace('_', ' ')}
                        </div>
                        <div className="text-charcoal/60 text-xs font-light">
                          {formatDate(lead.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal - Updated Design */}
      {selectedLead && editedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-charcoal/10 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Elegant Header */}
            <div className="relative bg-ivory border-b border-charcoal/10">
              <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory/95 to-warm-gray/5"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-light text-charcoal tracking-wide">
                          {selectedLead.first_name} {selectedLead.last_name}
                        </h3>
                        {isNewLead(selectedLead) && (
                          <span className="bg-verde text-white px-3 py-1 text-xs font-medium tracking-wide shadow-sm">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="w-12 h-px bg-charcoal/30 mb-3"></div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-charcoal/70 font-light">{selectedLead.email}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedLead.email)}
                            className="text-xs text-charcoal/50 hover:text-charcoal transition-colors"
                            title="Copy email"
                          >
                            📋
                          </button>
                        </div>
                        {selectedLead.phone && (
                          <div className="flex items-center space-x-2">
                            <p className="text-charcoal/70 font-light text-sm">{selectedLead.phone}</p>
                            <button
                              onClick={() => navigator.clipboard.writeText(selectedLead.phone || '')}
                              className="text-xs text-charcoal/50 hover:text-charcoal transition-colors"
                              title="Copy phone"
                            >
                              📋
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {hasUnsavedChanges && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-verde rounded-full animate-pulse"></div>
                        <span className="text-sm text-charcoal/70 font-light">Unsaved changes</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedLead(null);
                        setEditedLead(null);
                        setHasUnsavedChanges(false);
                      }}
                      className="text-charcoal/60 hover:text-charcoal transition-colors p-2 hover:bg-white/50"
                    >
                      <span className="text-xl">×</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lead Details - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-light text-charcoal tracking-wide mb-2">Lead Details</h4>
                    <div className="w-12 h-px bg-charcoal/20 mx-auto"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Status</p>
                      <select
                        value={editedLead.status}
                        onChange={(e) => handleLeadChange('status', e.target.value)}
                        className={`w-full px-4 py-3 border border-charcoal/20 font-light focus:outline-none focus:border-charcoal transition-colors ${getStatusColor(editedLead.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal_sent">Experience Sent</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    
                    <div>
                      <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Session Type</p>
                      <select
                        value={editedLead.session_type_interest || ''}
                        onChange={(e) => handleLeadChange('session_type_interest', e.target.value)}
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white font-light focus:outline-none focus:border-charcoal transition-colors"
                      >
                        <option value="">Select session type...</option>
                        <option value="Portraiture Session">Portraiture Session</option>
                        <option value="Branding Session">Branding Session</option>
                        <option value="Editorial Session">Editorial Session</option>
                        <option value="Commercial Session">Commercial Session</option>
                        <option value="Fashion Session">Fashion Session</option>
                        <option value="Headshot Session">Headshot Session</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {selectedLead.budget_range && (
                      <div>
                        <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Budget Range</p>
                        <div className="bg-ivory/50 border border-charcoal/10 px-4 py-3 text-charcoal font-light">{selectedLead.budget_range}</div>
                      </div>
                    )}
                    
                    {selectedLead.lead_source && (
                      <div>
                        <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Lead Source</p>
                        <div className="bg-ivory/50 border border-charcoal/10 px-4 py-3 text-charcoal font-light">{selectedLead.lead_source}</div>
                      </div>
                    )}
                  </div>

                  {/* Session Date and Timeline side by side */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Styled Session Date Field */}
                    <div>
                      <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Session Date</p>
                      <div className="relative">
                        <input
                          type="date"
                          value={editedLead.preferred_session_date || ''}
                          onChange={(e) => handleLeadChange('preferred_session_date', e.target.value)}
                          className="w-full px-4 py-3 border border-charcoal/20 bg-white font-light focus:outline-none focus:border-charcoal focus:ring-2 focus:ring-charcoal/10 transition-all duration-300 rounded-sm hover:border-charcoal/40"
                          style={{
                            colorScheme: 'light',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Timeline based on session date */}
                    <div>
                      <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Timeline</p>
                      <div className="px-4 py-3 text-charcoal font-light flex items-center h-[50px]">
                        {editedLead.preferred_session_date ? (
                          <span className={`${getTimelineInfo(editedLead.preferred_session_date).color} font-medium`}>
                            {getTimelineInfo(editedLead.preferred_session_date).text}
                          </span>
                        ) : (
                          <span className="text-charcoal/60">
                            {selectedLead.preferred_timeline || 'Not specified'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferred Time and Session Date */}
                  <div className="grid grid-cols-1 gap-6">
                    {selectedLead.preferred_time && (
                      <div>
                        <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Preferred Time</p>
                        <div className="bg-ivory/50 border border-charcoal/10 px-4 py-3 text-charcoal font-light">{selectedLead.preferred_time}</div>
                      </div>
                    )}

                    {selectedLead.preferred_session_date && (
                      <div>
                        <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Original Preferred Date</p>
                        <div className="bg-ivory/50 border border-charcoal/10 px-4 py-3 text-charcoal font-light">
                          {new Date(selectedLead.preferred_session_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLead.message && (
                    <div>
                      <p className="text-charcoal/60 text-xs uppercase tracking-wide mb-2">Initial Message</p>
                      <div className="bg-ivory/30 border border-charcoal/10 p-4 border-l-4 border-l-charcoal">
                        <p className="text-charcoal font-light italic">"{selectedLead.message}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section - Right Column */}
                <div className="lg:col-span-1">
                  <div className="bg-ivory/30 border border-charcoal/10 p-6 h-full">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-light text-charcoal tracking-wide mb-2">Internal Notes</h4>
                      <div className="w-8 h-px bg-charcoal/20 mx-auto"></div>
                    </div>
                    
                    <textarea
                      value={editedLead.notes || ''}
                      onChange={(e) => handleLeadChange('notes', e.target.value)}
                      placeholder="Add your notes about this lead..."
                      rows={12}
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white font-light focus:outline-none focus:border-charcoal transition-colors resize-none text-sm"
                    />
                    <p className="text-xs text-charcoal/60 font-light mt-2">
                      Private notes visible only to administrators
                    </p>
                  </div>
                </div>
              </div>

              {/* Experiences Section */}
              <div className="mt-8 pt-8 border-t border-charcoal/10">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-light text-charcoal tracking-wide mb-2">Experiences</h4>
                  <div className="w-12 h-px bg-charcoal/20 mx-auto"></div>
                </div>

                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-charcoal/60 font-light">Loading experiences...</div>
                  </div>
                ) : leadProposals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="text-charcoal/60 font-light">No experiences created yet</div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                          onClick={() => {
                            setShowStandardExModal(true);
                            loadStandardExperiences();
                          }}
                          className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
                        >
                          📦 Standard EX
                        </button>
                        <button 
                          onClick={() => {
                            // Store lead ID in session storage for the Experience Builder
                            sessionStorage.setItem('leadId', selectedLead.id);
                            router.push('/tally/packages');
                          }}
                          className="px-6 py-3 border border-charcoal text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                        >
                          🛠️ Custom EX
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {leadProposals.map((proposal: any) => {
                      const formatCurrency = (amount: number) => {
                        return new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0
                        }).format(amount);
                      };

                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'draft': return 'text-charcoal/60 bg-charcoal/10';
                          case 'sent': return 'text-blue-600 bg-blue-100';
                          case 'accepted': return 'text-verde bg-verde/20';
                          case 'rejected': return 'text-red-600 bg-red-100';
                          default: return 'text-charcoal/60 bg-charcoal/10';
                        }
                      };

                      return (
                        <div key={proposal.id} className="border border-charcoal/20 bg-white hover:shadow-sm transition-shadow duration-300">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-light text-charcoal">{proposal.title}</h5>
                                  <span className={`px-3 py-1 text-xs uppercase tracking-wide font-medium ${getStatusColor(proposal.status)}`}>
                                    {proposal.status}
                                  </span>
                                </div>
                                <div className="text-sm text-charcoal/70 font-light mb-3">
                                  Total: {formatCurrency(proposal.total_amount)}
                                </div>
                                {proposal.custom_message && (
                                  <p className="text-sm text-charcoal/80 font-light mb-3 line-clamp-2">
                                    {(() => {
                                      try {
                                        // Try to parse as JSON to get clean text
                                        const customMessage = typeof proposal.custom_message === 'string' ? 
                                          JSON.parse(proposal.custom_message) : proposal.custom_message;
                                        
                                        if (customMessage?.text) {
                                          // Extract just the first part of the text field for display
                                          const cleanText = customMessage.text.split('\n')[0] || 'Experience details';
                                          return cleanText.replace(/^Experience Type: /, '');
                                        }
                                      } catch (e) {
                                        // Fallback for old format or plain text
                                        if (typeof proposal.custom_message === 'string') {
                                          const firstLine = proposal.custom_message.split('\n')[0] || 'Experience details';
                                          return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
                                        }
                                      }
                                      return 'Experience details';
                                    })()}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-charcoal/60">
                                  <span>Created: {new Date(proposal.created_at).toLocaleDateString()}</span>
                                  {proposal.sent_at && (
                                    <span>Sent: {new Date(proposal.sent_at).toLocaleDateString()}</span>
                                  )}
                                  <span>{proposal.proposal_packages?.length || 0} packages</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => window.open(`/proposals/${selectedLead.id}`, '_blank')}
                                  className="px-4 py-2 text-xs border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 uppercase tracking-wide font-light"
                                >
                                  Preview
                                </button>
                                {proposal.status === 'draft' && (
                                  <button className="px-4 py-2 text-xs bg-charcoal text-white hover:bg-charcoal/90 transition-all duration-300 uppercase tracking-wide font-light">
                                    Send
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete('proposal', proposal.id, proposal.title)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-300"
                                  title="Delete proposal"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quotes Section */}
              <div className="mt-8 pt-8 border-t border-charcoal/10">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-light text-charcoal tracking-wide mb-2">Quotes</h4>
                  <div className="w-12 h-px bg-charcoal/20 mx-auto"></div>
                </div>

                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-charcoal/60 font-light">Loading quotes...</div>
                  </div>
                ) : leadQuotes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-charcoal/60 font-light">No quotes generated yet</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leadQuotes.map((quote: any) => {
                      const formatCurrency = (amount: number) => {
                        return new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0
                        }).format(amount);
                      };

                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'draft': return 'text-charcoal/60 bg-charcoal/10';
                          case 'sent': return 'text-blue-600 bg-blue-100';
                          case 'accepted': return 'text-verde bg-verde/20';
                          case 'rejected': return 'text-red-600 bg-red-100';
                          default: return 'text-charcoal/60 bg-charcoal/10';
                        }
                      };

                      return (
                        <div key={quote.id} className="border border-charcoal/20 bg-white hover:shadow-sm transition-shadow duration-300">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-light text-charcoal">{quote.quote_number}</h5>
                                  <span className={`px-3 py-1 text-xs uppercase tracking-wide font-medium ${getStatusColor(quote.status)}`}>
                                    {quote.status}
                                  </span>
                                </div>
                                <div className="text-sm text-charcoal/70 font-light mb-3">
                                  Total: {formatCurrency(quote.total_amount)}
                                </div>
                                <div className="text-sm text-charcoal/80 font-light mb-3">
                                  Package: {quote.selected_package}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-charcoal/60">
                                  <span>Created: {new Date(quote.created_at).toLocaleDateString()}</span>
                                  {quote.accepted_at && (
                                    <span>Accepted: {new Date(quote.accepted_at).toLocaleDateString()}</span>
                                  )}
                                  <span>Valid until: {new Date(quote.valid_until).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => window.open(`/quote/${quote.id}`, '_blank')}
                                  className="px-4 py-2 text-xs border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 uppercase tracking-wide font-light"
                                >
                                  View Quote
                                </button>
                                <button
                                  onClick={() => handleDelete('quote', quote.id, quote.quote_number)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-300"
                                  title="Delete quote"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contracts Section */}
              <div className="mt-8 pt-8 border-t border-charcoal/10">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-light text-charcoal tracking-wide mb-2">Contracts</h4>
                  <div className="w-12 h-px bg-charcoal/20 mx-auto"></div>
                </div>

                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-charcoal/60 font-light">Loading contracts...</div>
                  </div>
                ) : leadContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-charcoal/60 font-light">No contracts generated yet</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leadContracts.map((contract: any) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'pending': return 'text-orange-600 bg-orange-100';
                          case 'signed': return 'text-verde bg-verde/20';
                          case 'cancelled': return 'text-red-600 bg-red-100';
                          default: return 'text-charcoal/60 bg-charcoal/10';
                        }
                      };

                      return (
                        <div key={contract.id} className="border border-charcoal/20 bg-white hover:shadow-sm transition-shadow duration-300">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-light text-charcoal">{contract.contract_number}</h5>
                                  <span className={`px-3 py-1 text-xs uppercase tracking-wide font-medium ${getStatusColor(contract.status)}`}>
                                    {contract.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-charcoal/60">
                                  <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                                  {contract.client_signed_at && (
                                    <span>Signed: {new Date(contract.client_signed_at).toLocaleDateString()}</span>
                                  )}
                                  {contract.client_signature && (
                                    <span>Signed by: {contract.client_signature}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => window.open(`/contract/${contract.quote_id}`, '_blank')}
                                  className="px-4 py-2 text-xs border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 uppercase tracking-wide font-light"
                                >
                                  View Contract
                                </button>
                                <button
                                  onClick={() => handleDelete('contract', contract.id, contract.contract_number)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-300"
                                  title="Delete contract"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Elegant Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pt-8 mt-8 border-t border-charcoal/10">
                <div className="text-sm text-charcoal/60 font-light space-y-1">
                  <p>Created: {formatDate(selectedLead.created_at)} {isNewLead(selectedLead) ? '(New)' : '(Viewed)'}</p>
                  <p>Updated: {formatDate(selectedLead.updated_at)}</p>
                  {selectedLead.last_viewed_at && (
                    <p>Last Viewed: {formatDate(selectedLead.last_viewed_at)}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-charcoal/30 text-charcoal px-4 py-2 text-sm font-light tracking-wide uppercase hover:border-red-500 hover:text-red-500 transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                  
                  {hasUnsavedChanges && (
                    <button
                      onClick={saveLeadChanges}
                      className="bg-verde text-white px-6 py-2 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-all duration-300 flex items-center space-x-2"
                    >
                      <span>💾</span>
                      <span>Save Changes</span>
                    </button>
                  )}
                  
                  {/* Show Create Experience options if no experiences exist OR if existing experience was rejected */}
                  {(leadProposals.length === 0 || leadProposals.some((p: any) => p.status === 'rejected')) && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setShowStandardExModal(true);
                          loadStandardExperiences();
                        }}
                        className="bg-charcoal text-white px-4 py-2 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 flex items-center space-x-2"
                      >
                        <span>📦</span>
                        <span>Standard EX</span>
                      </button>
                      <button 
                        onClick={() => router.push(`/tally/proposals/create-custom/${selectedLead.id}`)}
                        className="border border-charcoal text-charcoal px-4 py-2 text-sm font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300 flex items-center space-x-2"
                      >
                        <span>🛠️</span>
                        <span>Custom EX</span>
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowConvertConfirm(true)}
                    className="border border-charcoal/30 text-charcoal px-4 py-2 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Convert to Session</span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-light text-charcoal mb-4">Delete {deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)}</h3>
              <p className="text-charcoal/70 font-light mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-6 py-3 border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 font-light uppercase tracking-wide disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-all duration-300 font-light uppercase tracking-wide disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Session Confirmation Modal */}
      {showConvertConfirm && selectedLead && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-verde/20 mb-4">
                <span className="text-verde text-xl">🔄</span>
              </div>
              <h3 className="text-lg font-didot text-charcoal mb-2">
                Convert Lead to Session
              </h3>
              <p className="text-sm text-warm-gray mb-6">
                This will create a new client record and session for <strong>{selectedLead.first_name} {selectedLead.last_name}</strong>. 
                The lead status will be updated to "converted" and you'll be able to manage their session in the Sessions area.
              </p>
              
              {/* Show conversion preview info */}
              <div className="bg-ivory/50 border border-charcoal/10 p-4 rounded mb-6 text-left">
                <h4 className="text-sm font-medium text-charcoal mb-2">Conversion Details:</h4>
                <ul className="text-xs text-charcoal/70 space-y-1">
                  <li>• Client: {selectedLead.first_name} {selectedLead.last_name}</li>
                  <li>• Email: {selectedLead.email}</li>
                  <li>• Session Type: {selectedLead.session_type_interest || 'Photography Session'}</li>
                  <li>• Preferred Date: {selectedLead.preferred_session_date || 'To be scheduled'}</li>
                  <li>• Status: {leadQuotes.some(q => leadContracts.some(c => c.quote_id === q.id && c.status === 'signed')) ? 'Confirmed & Scheduled' : 'Pending'}</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowConvertConfirm(false)}
                  disabled={converting}
                  className="px-4 py-2 text-warm-gray hover:text-charcoal transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={convertLeadToSession}
                  disabled={converting}
                  className="bg-verde text-white px-6 py-2 rounded-lg hover:bg-verde/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {converting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Converting...</span>
                    </div>
                  ) : (
                    '🔄 Convert to Session'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Experience Selection Modal */}
      {showStandardExModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-light text-charcoal tracking-wide">
                    Select Standard Experience
                  </h2>
                  <p className="text-charcoal/60 font-light mt-2">
                    Choose a standard experience to assign to {selectedLead?.first_name} {selectedLead?.last_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowStandardExModal(false)}
                  className="p-2 hover:bg-charcoal/5 rounded transition-colors"
                >
                  <svg className="w-6 h-6 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {standardExLoading ? (
                <div className="text-center py-12">
                  <div className="text-charcoal/60 font-light">Loading standard experiences...</div>
                </div>
              ) : standardExperiences.length === 0 ? (
                <div className="text-center py-12">
                  <div className="space-y-4">
                    <div className="text-charcoal/60 font-light">No standard experiences found</div>
                    <div className="text-sm text-charcoal/40">
                      Create some standard experiences in the Experience & Pricing section first.
                    </div>
                    <button
                      onClick={() => {
                        setShowStandardExModal(false);
                        router.push('/tally/packages');
                      }}
                      className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
                    >
                      Create Standard Experience
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {standardExperiences.map((experience) => {
                    const formatCurrency = (amount: number) => {
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0
                      }).format(amount);
                    };

                    return (
                      <div
                        key={experience.id}
                        className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-light text-charcoal">{experience.title}</h3>
                                  <span className="bg-verde/20 text-verde px-3 py-1 text-xs font-medium uppercase tracking-wide">
                                    Standard
                                  </span>
                                </div>
                                <div className="text-2xl font-light text-charcoal">
                                  {formatCurrency(experience.total_amount || 0)}
                                </div>
                                {experience.custom_message && (
                                  <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                                    {(() => {
                                      try {
                                        // Try to parse as JSON to get clean text
                                        const customMessage = typeof experience.custom_message === 'string' ? 
                                          JSON.parse(experience.custom_message) : experience.custom_message;
                                        
                                        if (customMessage?.text) {
                                          // Extract clean description from the text field
                                          const cleanText = customMessage.text.split('\n').slice(1).join(' ') || 'Standard experience template';
                                          return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
                                        }
                                      } catch (e) {
                                        // Fallback for old format or plain text
                                        if (typeof experience.custom_message === 'string') {
                                          return experience.custom_message.length > 200 ? 
                                            experience.custom_message.substring(0, 200) + '...' : 
                                            experience.custom_message;
                                        }
                                      }
                                      return 'Standard experience template';
                                    })()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => assignStandardExperience(experience)}
                              disabled={assigningExperience}
                              className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {assigningExperience ? 'Assigning...' : 'Select This Experience'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-charcoal/10">
                <button
                  onClick={() => setShowStandardExModal(false)}
                  className="px-6 py-3 border border-charcoal/30 text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </TallyLayout>
  );
}