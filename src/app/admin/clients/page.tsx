'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  admin_created?: boolean;
  session_count?: number;
}

export default function AdminClientsPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadClients();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadClients = async () => {
    try {
      console.log('Loading all clients...');
      
      // Load clients with session counts
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          sessions(count)
        `)
        .order('created_at', { ascending: false });

      console.log('Clients query result:', { clientsData, clientsError });

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      } else if (clientsData) {
        // Transform the data to include session count
        const clientsWithCounts = clientsData.map(client => ({
          ...client,
          session_count: client.sessions?.[0]?.count || 0
        }));
        setClients(clientsWithCounts);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getClientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading clients...</p>
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
                <h1 className="text-xl font-didot text-charcoal">Client Management</h1>
                <p className="text-sm text-warm-gray">Admin Portal</p>
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
          <span className="text-charcoal font-medium">Client Management</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-didot text-charcoal mb-2">
              Client Management
            </h2>
            <p className="text-warm-gray">
              Manage your photography clients and their information
            </p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-verde to-verde/90 text-white px-6 py-3 rounded-lg hover:from-verde/90 hover:to-verde transition-all duration-300 transform hover:scale-[1.02] flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Add New Client</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4 text-sm text-warm-gray">
              <span>{filteredClients.length} clients found</span>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-6">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-ivory rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-didot text-charcoal mb-2">
                {searchTerm ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-warm-gray mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Add your first client to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddClient(true)}
                  className="bg-gradient-to-r from-gold to-gold/90 text-white px-6 py-3 rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gold to-verde rounded-full flex items-center justify-center text-white font-semibold">
                        {getClientInitials(client.first_name, client.last_name)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-charcoal">
                          {client.first_name} {client.last_name}
                        </h3>
                        <p className="text-warm-gray">{client.email}</p>
                        {client.phone && (
                          <p className="text-warm-gray text-sm">{client.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-warm-gray">Sessions</div>
                        <div className="text-xl font-bold text-charcoal">{client.session_count}</div>
                      </div>
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-warm-gray hover:text-charcoal transition-colors"
                      >
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </div>
                  
                  {(client.address || client.city) && (
                    <div className="mt-4 pt-4 border-t border-warm-gray/10">
                      <div className="text-sm text-warm-gray">
                        {client.address && <div>{client.address}</div>}
                        {(client.city || client.state) && (
                          <div>
                            {client.city}{client.city && client.state && ', '}{client.state} {client.zip}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-warm-gray/10 flex items-center justify-between">
                    <div className="text-sm text-warm-gray">
                      Joined {formatDate(client.created_at)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {client.admin_created && (
                        <span className="px-2 py-1 bg-verde/20 text-verde text-xs rounded-full">
                          Admin Created
                        </span>
                      )}
                      <button
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                        className="text-sm text-gold hover:text-gold/80 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Client Modal - Placeholder */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-didot text-charcoal mb-4">Add New Client</h3>
            <p className="text-warm-gray mb-6">
              This feature will be available in the next update. For now, clients can register themselves at the login page.
            </p>
            <button
              onClick={() => setShowAddClient(false)}
              className="w-full bg-gradient-to-r from-gold to-gold/90 text-white py-3 rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}