'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import TallyLayout from '@/components/TallyLayout';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import Logo from '@/components/Logo';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  
  // Feature flags
  const enhancedSearchEnabled = useFeatureFlag('enhancedSearch');
  const dashboardAnalyticsEnabled = useFeatureFlag('dashboardAnalytics');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      fetchClients();
    };

    checkAuth();
  }, [router]);

  const fetchClients = async () => {
    try {
      console.log('Loading clients via API...');
      const response = await fetch('/api/clients');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded', data.length, 'clients');
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search functionality when feature flag is enabled
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true;
    
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
            <h2 className="text-2xl font-light text-charcoal tracking-wide">Loading Client Relations</h2>
            <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            <p className="text-charcoal/60 font-light">Preparing your photography client portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TallyLayout>
      <div className="bg-ivory">
        <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">
                  Tally • Client Relations
                </h1>
                <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              {dashboardAnalyticsEnabled ? (
                <p className="text-lg text-charcoal/70 font-light max-w-2xl mx-auto leading-relaxed">
                  Advanced client relationship management with portfolio tracking, communication history, and growth analytics for your photography business.
                </p>
              ) : (
                <p className="text-lg text-charcoal/70 font-light max-w-2xl mx-auto leading-relaxed">
                  Manage your photography client relationships and build lasting connections that grow your business.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-8">
              {/* Enhanced Search */}
              {enhancedSearchEnabled && (
                <div className="bg-white border border-charcoal/20 p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-light text-charcoal tracking-wide">Advanced Client Search</h3>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 border border-charcoal/20 text-charcoal placeholder-charcoal/50 bg-white/50 focus:outline-none focus:border-verde transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Client Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-verde/10 to-verde/5 border border-verde/20 p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-light text-verde tracking-wide">{filteredClients.length}</div>
                    <div className="text-sm text-charcoal/70 font-light tracking-wide uppercase">Total Clients</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-light text-gold tracking-wide">
                      {clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}
                    </div>
                    <div className="text-sm text-charcoal/70 font-light tracking-wide uppercase">New This Month</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-charcoal/10 to-charcoal/5 border border-charcoal/20 p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-light text-charcoal tracking-wide">
                      {Math.round(clients.length / Math.max(1, new Date().getMonth() + 1))}
                    </div>
                    <div className="text-sm text-charcoal/70 font-light tracking-wide uppercase">Monthly Average</div>
                  </div>
                </div>
              </div>

              {/* Client List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-charcoal tracking-wide">Client Portfolio</h2>
                  <button
                    onClick={() => setShowAddClient(true)}
                    className="bg-verde text-white px-6 py-2 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-colors"
                  >
                    Add Client
                  </button>
                </div>

                {filteredClients.length === 0 ? (
                  <div className="bg-white border border-charcoal/20 p-12 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-charcoal/10 rounded-full mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-charcoal/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-light text-charcoal tracking-wide">No Clients Found</h3>
                      <p className="text-charcoal/60 font-light">
                        {searchTerm ? 'No clients match your search criteria.' : 'Start building your client portfolio by adding your first client.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredClients.map((client) => (
                      <div key={client.id} className="bg-white border border-charcoal/20 p-6 hover:border-verde/30 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-verde to-verde/80 text-white rounded-full flex items-center justify-center text-sm font-medium tracking-wide">
                            {getClientInitials(client.first_name, client.last_name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-light text-charcoal tracking-wide group-hover:text-verde transition-colors">
                                  {client.first_name} {client.last_name}
                                </h3>
                                <div className="space-y-1">
                                  <p className="text-sm text-charcoal/60 font-light">{client.email}</p>
                                  {client.phone && (
                                    <p className="text-sm text-charcoal/60 font-light">{client.phone}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-xs text-charcoal/50 font-light tracking-wide uppercase">Member Since</div>
                                <div className="text-sm text-charcoal/70 font-light">{formatDate(client.created_at)}</div>
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
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-charcoal/20 max-w-md w-full">
              <div className="p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-light text-charcoal tracking-wide">Add New Client</h3>
                    <div className="w-12 h-px bg-charcoal/30 mx-auto"></div>
                  </div>
                  <p className="text-charcoal/70 font-light leading-relaxed">
                    This feature will be available in the next update. For now, clients can register themselves through the client portal login page.
                  </p>
                  <button
                    onClick={() => setShowAddClient(false)}
                    className="w-full bg-charcoal text-white py-3 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-colors"
                  >
                    Understood
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