'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  totalLeads: number;
  upcomingSessions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    totalLeads: 0,
    upcomingSessions: 0
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

      // Load total leads (this table should exist)
      let leadCount = 0;
      try {
        const leadResult = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });
        leadCount = leadResult.count || 0;
      } catch (e) {
        console.warn('Leads table not available:', e);
      }

      setStats({
        totalClients: clientCount,
        totalSessions: sessionCount,
        totalLeads: leadCount,
        upcomingSessions: upcomingCount
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Still set default stats even if there's an error
      setStats({
        totalClients: 0,
        totalSessions: 0,
        totalLeads: 0,
        upcomingSessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gold/20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-gold text-2xl">⟳</span>
          </div>
          <p className="text-charcoal/60 font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-charcoal tracking-wide mb-4">Administrative Overview</h1>
        <div className="w-24 h-px bg-gold mx-auto mb-4"></div>
        <p className="text-charcoal/70 font-light tracking-wide max-w-2xl mx-auto">
          Direct access to your business management tools and performance metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.totalClients}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Clients</div>
            </div>
            <div className="w-12 h-12 bg-verde/20 flex items-center justify-center group-hover:bg-verde/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">C</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.totalSessions}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Sessions</div>
            </div>
            <div className="w-12 h-12 bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">S</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.totalLeads}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Leads</div>
            </div>
            <div className="w-12 h-12 bg-warm-brown/20 flex items-center justify-center group-hover:bg-warm-brown/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">L</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.upcomingSessions}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Upcoming</div>
            </div>
            <div className="w-12 h-12 bg-charcoal/20 flex items-center justify-center group-hover:bg-charcoal/30 transition-colors duration-300">
              <span className="text-ivory font-light text-lg">U</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
        <button
          onClick={() => router.push('/admin/leads')}
          className="block group text-left"
        >
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">→</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Lead Management</h3>
            <div className="w-12 h-px bg-gold/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Curate inquiries, craft personalized proposals, and nurture client relationships.</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/packages')}
          className="block group text-left"
        >
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-charcoal/20 flex items-center justify-center group-hover:bg-charcoal/30 transition-colors duration-300">
                <span className="text-ivory font-light text-lg">◉</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Package Studio</h3>
            <div className="w-12 h-px bg-charcoal/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Design custom packages and services for bespoke proposal creation.</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/sessions')}
          className="block group text-left"
        >
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-verde/20 flex items-center justify-center group-hover:bg-verde/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">◉</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Session Orchestration</h3>
            <div className="w-12 h-px bg-verde/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Coordinate photographic experiences and manage creative timelines.</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/clients')}
          className="block group text-left"
        >
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-warm-brown/20 flex items-center justify-center group-hover:bg-warm-brown/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">◈</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Client Relations</h3>
            <div className="w-12 h-px bg-warm-brown/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Maintain comprehensive client profiles and session histories.</p>
          </div>
        </button>
      </div>

      {/* Success Message */}
      <div className="bg-ivory/40 border border-gold/20 backdrop-blur-sm p-8 text-center">
        <div className="w-16 h-16 bg-gold/20 mx-auto mb-4 flex items-center justify-center">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-light text-charcoal tracking-wide mb-4">Administrative Access Confirmed</h2>
        <p className="text-charcoal/70 font-light">Direct access to all management functions without authentication barriers.</p>
      </div>
    </div>
  );
}