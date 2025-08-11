'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  totalLeads: number;
  upcomingSessions: number;
  recentLeads: any[];
  recentSessions: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    totalLeads: 0,
    upcomingSessions: 0,
    recentLeads: [],
    recentSessions: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardStats();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading timeout, forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const loadDashboardStats = async () => {
    try {
      // Load total clients (handle table might not exist)
      let clientCount = 0;
      try {
        const clientResult = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });
        clientCount = clientResult.count || 0;
      } catch (e) {
        console.warn('Clients table not available:', e);
      }

      // Load total sessions (handle table might not exist)
      let sessionCount = 0;
      let upcomingCount = 0;
      try {
        const sessionResult = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });
        sessionCount = sessionResult.count || 0;

        // Load upcoming sessions (sessions in the future)
        const today = new Date().toISOString().split('T')[0];
        const upcomingResult = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('session_date', today);
        upcomingCount = upcomingResult.count || 0;
      } catch (e) {
        console.warn('Sessions table not available:', e);
      }

      // Load total leads
      let leadCount = 0;
      try {
        const leadResult = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });
        leadCount = leadResult.count || 0;
      } catch (e) {
        console.warn('Leads table not available:', e);
      }

      // Load recent leads (last 5)
      let recentLeads = [];
      try {
        const { data: recentLeadsData, error: recentLeadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!recentLeadsError) {
          recentLeads = recentLeadsData || [];
        }
      } catch (e) {
        console.warn('Recent leads not available:', e);
      }

      // Load recent sessions (last 5)
      let recentSessions = [];
      try {
        const { data: recentSessionsData, error: recentSessionsError } = await supabase
          .from('sessions')
          .select('*')
          .order('session_date', { ascending: false })
          .limit(5);
        
        if (!recentSessionsError) {
          recentSessions = recentSessionsData || [];
        }
      } catch (e) {
        console.warn('Recent sessions not available:', e);
      }

      setStats({
        totalClients: clientCount,
        totalSessions: sessionCount,
        totalLeads: leadCount,
        upcomingSessions: upcomingCount,
        recentLeads,
        recentSessions
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats({
        totalClients: 0,
        totalSessions: 0,
        totalLeads: 0,
        upcomingSessions: 0,
        recentLeads: [],
        recentSessions: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-light text-charcoal tracking-wide">
                Administrative Overview
              </h1>
              <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            </div>
            <p className="text-lg font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
              Monitor business performance and access management tools
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-light text-charcoal tracking-wide mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <button
              onClick={() => router.push('/admin/leads')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-8 group-hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-charcoal/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-light text-charcoal tracking-wide mb-3">Lead Management</h3>
                <p className="text-charcoal/70 text-sm font-light leading-relaxed">Manage inquiries and create proposals</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/packages')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-8 group-hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-verde/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-light text-charcoal tracking-wide mb-3">Package Management</h3>
                <p className="text-charcoal/70 text-sm font-light leading-relaxed">Create and manage service packages</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/sessions')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-8 group-hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-light text-charcoal tracking-wide mb-3">Session Management</h3>
                <p className="text-charcoal/70 text-sm font-light leading-relaxed">Schedule and manage photo sessions</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/clients')}
              className="block group text-left"
            >
              <div className="border border-charcoal/20 bg-white p-8 group-hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-warm-brown/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-light text-charcoal tracking-wide mb-3">Client Relations</h3>
                <p className="text-charcoal/70 text-sm font-light leading-relaxed">Manage client relationships</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        {(stats.recentLeads.length > 0 || stats.recentSessions.length > 0) && (
          <div>
            <h2 className="text-2xl font-light text-charcoal tracking-wide mb-8">Recent Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Leads */}
              {stats.recentLeads.length > 0 && (
                <div className="border border-charcoal/20 bg-white">
                  <div className="p-6 border-b border-charcoal/10">
                    <h3 className="text-lg font-light text-charcoal">Recent Leads</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.recentLeads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-light text-charcoal">{lead.first_name} {lead.last_name}</div>
                            <div className="text-sm text-charcoal/60">{lead.session_type_interest}</div>
                          </div>
                          <div className="text-sm text-charcoal/60">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => router.push('/admin/leads')}
                      className="mt-4 text-sm text-charcoal hover:text-charcoal/70 transition-colors"
                    >
                      View All Leads →
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {stats.recentSessions.length > 0 && (
                <div className="border border-charcoal/20 bg-white">
                  <div className="p-6 border-b border-charcoal/10">
                    <h3 className="text-lg font-light text-charcoal">Recent Sessions</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.recentSessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-light text-charcoal">{session.session_title}</div>
                            <div className="text-sm text-charcoal/60">{session.session_type}</div>
                          </div>
                          <div className="text-sm text-charcoal/60">
                            {session.session_date}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => router.push('/admin/sessions')}
                      className="mt-4 text-sm text-charcoal hover:text-charcoal/70 transition-colors"
                    >
                      View All Sessions →
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