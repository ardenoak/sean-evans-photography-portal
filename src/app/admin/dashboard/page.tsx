'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  totalLeads: number;
  upcomingSessions: number;
  totalQuotes: number;
  totalContracts: number;
  pendingPayments: number;
  recentLeads: any[];
  recentSessions: any[];
  recentQuotes: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    totalLeads: 0,
    upcomingSessions: 0,
    totalQuotes: 0,
    totalContracts: 0,
    pendingPayments: 0,
    recentLeads: [],
    recentSessions: [],
    recentQuotes: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardStats();
    
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading timeout, forcing completion');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const loadDashboardStats = async () => {
    try {
      console.log('Loading dashboard stats...');
      // Load leads data using the same API as leads page
      let leadCount = 0;
      let recentLeads: any[] = [];
      try {
        const leadsResponse = await fetch('/api/admin/leads');
        if (leadsResponse.ok) {
          const leadsResult = await leadsResponse.json();
          console.log('Leads API response:', leadsResult);
          if (leadsResult.data && Array.isArray(leadsResult.data)) {
            leadCount = leadsResult.data.length;
            recentLeads = leadsResult.data.slice(0, 5); // Get first 5 for recent leads
            console.log('Processed leads:', { leadCount, recentLeadsCount: recentLeads.length });
          }
        }
      } catch (e) {
        console.warn('Leads API not available:', e);
      }

      // Load clients data using clients API
      let clientCount = 0;
      try {
        const clientsResponse = await fetch('/api/admin/clients');
        if (clientsResponse.ok) {
          const clientsResult = await clientsResponse.json();
          console.log('Clients API response:', clientsResult);
          if (clientsResult.data && Array.isArray(clientsResult.data)) {
            clientCount = clientsResult.data.length;
            console.log('Processed clients:', { clientCount });
          }
        }
      } catch (e) {
        console.warn('Clients API not available:', e);
      }

      // Load sessions data using sessions API
      let sessionCount = 0;
      let upcomingCount = 0;
      let recentSessions: any[] = [];
      try {
        const sessionsResponse = await fetch('/api/admin/sessions');
        if (sessionsResponse.ok) {
          const sessionsResult = await sessionsResponse.json();
          console.log('Sessions API response:', sessionsResult);
          if (sessionsResult.data && Array.isArray(sessionsResult.data)) {
            const sessionsData = sessionsResult.data;
            sessionCount = sessionsData.length;
            recentSessions = sessionsData.slice(0, 5);
            
            // Calculate upcoming sessions (next 7 days)
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            upcomingCount = sessionsData.filter((session: any) => {
              const sessionDate = new Date(session.session_date);
              return sessionDate >= today && sessionDate <= nextWeek;
            }).length;
            
            console.log('Processed sessions:', { sessionCount, upcomingCount, recentSessionsCount: recentSessions.length });
          }
        }
      } catch (e) {
        console.warn('Sessions API not available:', e);
      }


      // Load quotes data using quotes API
      let quoteCount = 0;
      let recentQuotes: any[] = [];
      try {
        const quotesResponse = await fetch('/api/admin/quotes');
        if (quotesResponse.ok) {
          const quotesResult = await quotesResponse.json();
          console.log('Quotes API response:', quotesResult);
          if (quotesResult.data && Array.isArray(quotesResult.data)) {
            quoteCount = quotesResult.data.length;
            recentQuotes = quotesResult.data.slice(0, 5);
            console.log('Processed quotes:', { quoteCount, recentQuotesCount: recentQuotes.length });
          }
        }
      } catch (e) {
        console.warn('Quotes API not available:', e);
      }

      // Load contracts data using contracts API
      let contractCount = 0;
      try {
        const contractsResponse = await fetch('/api/admin/contracts');
        if (contractsResponse.ok) {
          const contractsResult = await contractsResponse.json();
          console.log('Contracts API response:', contractsResult);
          if (contractsResult.data && Array.isArray(contractsResult.data)) {
            contractCount = contractsResult.data.length;
            console.log('Processed contracts:', { contractCount });
          }
        }
      } catch (e) {
        console.warn('Contracts API not available:', e);
      }

      // Load payments data using payments API
      let pendingPaymentCount = 0;
      try {
        const paymentsResponse = await fetch('/api/admin/payments');
        if (paymentsResponse.ok) {
          const paymentsResult = await paymentsResponse.json();
          console.log('Payments API response:', paymentsResult);
          if (paymentsResult.data && Array.isArray(paymentsResult.data)) {
            // Count only pending payments
            pendingPaymentCount = paymentsResult.data.filter(payment => payment.status === 'pending').length;
            console.log('Processed payments:', { totalPayments: paymentsResult.data.length, pendingPaymentCount });
          }
        }
      } catch (e) {
        console.warn('Payments API not available:', e);
      }

      console.log('Dashboard stats loaded:', {
        totalClients: clientCount,
        totalSessions: sessionCount,
        totalLeads: leadCount,
        upcomingSessions: upcomingCount,
        totalQuotes: quoteCount,
        totalContracts: contractCount,
        pendingPayments: pendingPaymentCount
      });

      setStats({
        totalClients: clientCount,
        totalSessions: sessionCount,
        totalLeads: leadCount,
        upcomingSessions: upcomingCount,
        totalQuotes: quoteCount,
        totalContracts: contractCount,
        pendingPayments: pendingPaymentCount,
        recentLeads: recentLeads,
        recentSessions: recentSessions,
        recentQuotes: recentQuotes
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats({
        totalClients: 0,
        totalSessions: 0,
        totalLeads: 0,
        upcomingSessions: 0,
        totalQuotes: 0,
        totalContracts: 0,
        pendingPayments: 0,
        recentLeads: [],
        recentSessions: [],
        recentQuotes: []
      });
    } finally {
      setLoading(false);
    }
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
            <p className="text-charcoal/70 font-light tracking-wide">Loading dashboard</p>
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
                Business Dashboard
              </h1>
              <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            </div>
            <p className="text-base font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
              Today's priorities and business performance insights
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-charcoal tracking-wide">Today's Priorities</h2>
            <span className="text-sm text-charcoal/60">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-orange-800">Action Required</h3>
                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-light text-orange-800">{stats.recentLeads.length}</span>
                </div>
              </div>
              <p className="text-sm text-orange-700 mb-4">New leads need response</p>
              <button
                onClick={() => router.push('/admin/leads')}
                className="w-full bg-orange-600 text-white py-2 px-4 text-sm font-light tracking-wide uppercase hover:bg-orange-700 transition-colors"
              >
                Review Leads
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-blue-800">Upcoming Sessions</h3>
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-light text-blue-800">{stats.upcomingSessions}</span>
                </div>
              </div>
              <p className="text-sm text-blue-700 mb-4">Sessions scheduled this week</p>
              <button
                onClick={() => router.push('/admin/sessions')}
                className="w-full bg-blue-600 text-white py-2 px-4 text-sm font-light tracking-wide uppercase hover:bg-blue-700 transition-colors"
              >
                View Schedule
              </button>
            </div>

            <div className="bg-gradient-to-br from-verde/20 to-verde/30 border border-verde/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-verde-dark">Payment Follow-up</h3>
                <div className="w-10 h-10 bg-verde/40 rounded-full flex items-center justify-center">
                  <span className="text-lg font-light text-verde-dark">{stats.pendingPayments}</span>
                </div>
              </div>
              <p className="text-sm text-verde-dark/80 mb-4">Payments awaiting collection</p>
              <button
                onClick={() => router.push('/admin/leads')}
                className="w-full bg-verde text-white py-2 px-4 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-colors"
              >
                Follow Up
              </button>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-light text-charcoal tracking-wide mb-8">Business Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.totalLeads}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Leads</div>
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
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.totalClients}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Clients</div>
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
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.totalSessions}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Sessions</div>
                  </div>
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.upcomingSessions}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Upcoming Sessions</div>
                  </div>
                  <div className="w-12 h-12 bg-warm-brown/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-charcoal tracking-wide">Sales Pipeline</h2>
            <div className="text-sm text-charcoal/60">
              Conversion Rate: {stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0}%
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.totalQuotes}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Quotes</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.totalContracts}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Contracts</div>
                  </div>
                  <div className="w-12 h-12 bg-verde/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-charcoal mb-2">{stats.pendingPayments}</div>
                    <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Pending Payments</div>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3 bg-white border border-charcoal/20 p-8">
            <h3 className="text-lg font-light text-charcoal mb-6">Pipeline Flow</h3>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-charcoal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-light text-charcoal">{stats.totalLeads}</span>
                </div>
                <div className="text-sm font-light text-charcoal/70">Leads</div>
              </div>
              <div className="w-8 h-px bg-charcoal/20"></div>
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-light text-blue-600">{stats.totalQuotes}</span>
                </div>
                <div className="text-sm font-light text-charcoal/70">Quotes</div>
              </div>
              <div className="w-8 h-px bg-charcoal/20"></div>
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-verde/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-light text-verde">{stats.totalContracts}</span>
                </div>
                <div className="text-sm font-light text-charcoal/70">Contracts</div>
              </div>
              <div className="w-8 h-px bg-charcoal/20"></div>
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-light text-gold">{stats.totalSessions}</span>
                </div>
                <div className="text-sm font-light text-charcoal/70">Sessions</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-light text-charcoal tracking-wide mb-8">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => router.push('/admin/leads')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-6 group-hover:shadow-lg group-hover:border-charcoal/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-charcoal/10 flex items-center justify-center rounded">
                    <svg className="w-5 h-5 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-charcoal/50 group-hover:text-charcoal/70 transition-colors">→</span>
                </div>
                <h3 className="text-base font-light text-charcoal tracking-wide mb-2">Lead Management</h3>
                <p className="text-charcoal/60 text-xs font-light leading-relaxed mb-3">Manage inquiries and create proposals</p>
                <div className="text-xs text-charcoal/50">{stats.totalLeads} total leads</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/packages')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-6 group-hover:shadow-lg group-hover:border-verde/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-verde/10 flex items-center justify-center rounded">
                    <svg className="w-5 h-5 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-xs text-charcoal/50 group-hover:text-charcoal/70 transition-colors">→</span>
                </div>
                <h3 className="text-base font-light text-charcoal tracking-wide mb-2">Packages & Pricing</h3>
                <p className="text-charcoal/60 text-xs font-light leading-relaxed mb-3">Standard package management & pricing strategy</p>
                <div className="text-xs text-verde">Centralized pricing control</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/sessions')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-6 group-hover:shadow-lg group-hover:border-gold/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gold/10 flex items-center justify-center rounded">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-charcoal/50 group-hover:text-charcoal/70 transition-colors">→</span>
                </div>
                <h3 className="text-base font-light text-charcoal tracking-wide mb-2">Session Calendar</h3>
                <p className="text-charcoal/60 text-xs font-light leading-relaxed mb-3">Schedule and manage photo sessions</p>
                <div className="text-xs text-gold">{stats.upcomingSessions} upcoming sessions</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/clients')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-6 group-hover:shadow-lg group-hover:border-warm-brown/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-warm-brown/10 flex items-center justify-center rounded">
                    <svg className="w-5 h-5 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-charcoal/50 group-hover:text-charcoal/70 transition-colors">→</span>
                </div>
                <h3 className="text-base font-light text-charcoal tracking-wide mb-2">Client Relations</h3>
                <p className="text-charcoal/60 text-xs font-light leading-relaxed mb-3">Manage client relationships & contacts</p>
                <div className="text-xs text-warm-brown">{stats.totalClients} active clients</div>
              </div>
            </button>
          </div>
        </div>

        {(stats.recentLeads.length > 0 || stats.recentQuotes.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light text-charcoal tracking-wide">Activity & Insights</h2>
              <div className="text-sm text-charcoal/60">Last 7 days</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {stats.recentLeads.length > 0 && (
                <div className="border border-charcoal/20 bg-gradient-to-br from-orange-50 to-white">
                  <div className="p-6 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-light text-charcoal">Hot Leads</h3>
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">{stats.recentLeads.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.recentLeads.slice(0, 3).map((lead: any, index: number) => (
                        <div key={lead.id} className="flex items-center justify-between py-2 border-b border-orange-100 last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-light text-charcoal">{lead.first_name} {lead.last_name}</div>
                              {index === 0 && <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">NEW</span>}
                            </div>
                            <div className="text-sm text-charcoal/60">{lead.session_type_interest || 'No session type'}</div>
                            <div className="text-xs text-orange-600 mt-1">
                              Needs response • {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60))}h ago
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => router.push('/admin/leads')}
                      className="mt-4 w-full bg-orange-500 text-white py-2 px-4 text-sm font-light tracking-wide uppercase hover:bg-orange-600 transition-colors"
                    >
                      Respond to Leads
                    </button>
                  </div>
                </div>
              )}

              {stats.recentQuotes.length > 0 && (
                <div className="border border-charcoal/20 bg-white">
                  <div className="p-6 border-b border-charcoal/10">
                    <h3 className="text-lg font-light text-charcoal">Recent Quotes</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.recentQuotes.slice(0, 3).map((quote: any) => (
                        <div key={quote.id} className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-light text-charcoal">{quote.quote_number}</div>
                            <div className="text-sm text-charcoal/60">{quote.client_name}</div>
                            <div className="text-xs text-charcoal/60">
                              {formatCurrency(quote.total_amount)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="px-2 py-1 text-xs font-light tracking-wide uppercase bg-charcoal/20 text-charcoal">
                              {quote.status}
                            </div>
                            <div className="text-xs text-charcoal/60 mt-1">
                              {new Date(quote.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => router.push('/admin/leads')}
                      className="mt-4 text-sm text-charcoal hover:text-charcoal/70 transition-colors"
                    >
                      View All Quotes →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}