'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      console.log('Loading all clients...');
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c';
      console.log('Using API Key:', apiKey ? 'Key present' : 'No key found');
      console.log('Environment:', process.env.NODE_ENV);
      
      const response = await fetch('/api/clients', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      const result = await response.json();

      console.log('Clients API result:', result);
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('Error loading clients:', result.error);
        // Still try to set clients data if it exists in the result
        if (result.data) {
          console.log('Setting clients data despite error status');
          setClients(result.data);
        }
      } else {
        setClients(result.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
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
            <p className="text-charcoal/70 font-light tracking-wide">Loading client data</p>
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

  return (
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
            <p className="text-base font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
              Manage client relationships, contact information, and communication history
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Client Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-charcoal tracking-wide mb-8">Client Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{clients.length}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Clients</div>
                  </div>
                  <div className="w-12 h-12 bg-charcoal/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{clients.filter(c => c.session_count && c.session_count > 0).length}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Active Clients</div>
                  </div>
                  <div className="w-12 h-12 bg-verde/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{clients.filter(c => c.admin_created).length}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Admin Created</div>
                  </div>
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{clients.reduce((sum, c) => sum + (c.session_count || 0), 0)}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Sessions</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Management Tools */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-charcoal tracking-wide">Client Directory</h2>
            <button
              onClick={() => setShowAddClient(true)}
              className="bg-charcoal text-white px-6 py-3 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-colors"
            >
              + Add Client
            </button>
          </div>
          
          <div className="border border-charcoal/20 bg-white p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-sm font-light focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal"
              />
              <div className="text-sm text-charcoal/60">
                {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="border border-charcoal/20 bg-white">
          {filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-charcoal/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-charcoal/60 font-light">
                {searchTerm ? 'No clients found' : 'No clients yet'}
              </p>
              <p className="text-charcoal/40 text-sm mt-2">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'Add your first client to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddClient(true)}
                  className="mt-6 bg-charcoal text-white px-6 py-3 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-colors"
                >
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-charcoal/10">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-6 hover:bg-ivory/30 cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-charcoal to-warm-gray rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getClientInitials(client.first_name, client.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-light text-charcoal mb-1">
                          {client.first_name} {client.last_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-charcoal/70 mb-2">
                          <span>{client.email}</span>
                          {client.phone && (
                            <>
                              <span>•</span>
                              <span>{client.phone}</span>
                            </>
                          )}
                        </div>
                        
                        {(client.address || client.city) && (
                          <div className="text-sm text-charcoal/60 mb-2">
                            📍 {client.address && `${client.address}, `}
                            {client.city}{client.city && client.state && ', '}{client.state} {client.zip}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="inline-flex items-center px-3 py-1 bg-charcoal/5 text-charcoal rounded">
                            📅 Joined {formatDate(client.created_at)}
                          </span>
                          {client.admin_created && (
                            <span className="inline-flex items-center px-3 py-1 bg-verde/10 text-verde rounded">
                              ⚡ Admin Created
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-6">
                      <div className="text-right">
                        <div className="text-2xl font-light text-charcoal">{client.session_count || 0}</div>
                        <div className="text-xs font-light tracking-wider uppercase text-charcoal/60">Sessions</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/clients/${client.id}`);
                        }}
                        className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  );
}