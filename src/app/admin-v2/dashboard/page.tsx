'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSimpleAdminAuth } from '@/contexts/SimpleAdminAuth';

interface Stats {
  totalLeads: number;
  newLeads: number;
  totalSessions: number;
  activeSessions: number;
}

interface RecentLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminV2Dashboard() {
  const { user } = useSimpleAdminAuth();
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    totalSessions: 0,
    activeSessions: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [leadsData, sessionsData, recentLeadsData] = await Promise.all([
        // Total leads
        supabase.from('leads').select('id, status'),
        
        // Total sessions
        supabase.from('sessions').select('id, status'),
        
        // Recent leads
        supabase
          .from('leads')
          .select('id, first_name, last_name, email, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Calculate stats
      const totalLeads = leadsData.data?.length || 0;
      const newLeads = leadsData.data?.filter(lead => lead.status === 'new').length || 0;
      const totalSessions = sessionsData.data?.length || 0;
      const activeSessions = sessionsData.data?.filter(session => 
        ['confirmed', 'in-progress'].includes(session.status)
      ).length || 0;

      setStats({
        totalLeads,
        newLeads,
        totalSessions,
        activeSessions,
      });

      setRecentLeads(recentLeadsData.data || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'proposal-sent': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading dashboard...</span>
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
          Welcome back, {user?.first_name || 'Admin'}. Your business metrics and recent activities at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.totalLeads}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Leads</div>
            </div>
            <div className="w-12 h-12 bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">L</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.newLeads}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">New Inquiries</div>
            </div>
            <div className="w-12 h-12 bg-verde/20 flex items-center justify-center group-hover:bg-verde/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">N</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.totalSessions}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Total Sessions</div>
            </div>
            <div className="w-12 h-12 bg-warm-brown/20 flex items-center justify-center group-hover:bg-warm-brown/30 transition-colors duration-300">
              <span className="text-charcoal font-light text-lg">S</span>
            </div>
          </div>
        </div>

        <div className="bg-ivory/60 backdrop-blur-sm border border-gold/20 p-8 group hover:bg-ivory/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-charcoal mb-2">{stats.activeSessions}</div>
              <div className="text-sm font-light tracking-wider uppercase text-charcoal/60">Active Projects</div>
            </div>
            <div className="w-12 h-12 bg-charcoal/20 flex items-center justify-center group-hover:bg-charcoal/30 transition-colors duration-300">
              <span className="text-ivory font-light text-lg">A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <Link href="/admin-v2/leads" className="block group">
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">→</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Lead Management</h3>
            <div className="w-12 h-px bg-gold/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Curate inquiries, craft personalized proposals, and nurture client relationships through the sales journey.</p>
          </div>
        </Link>

        <Link href="/admin-v2/sessions" className="block group">
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-verde/20 flex items-center justify-center group-hover:bg-verde/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">◉</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Session Orchestration</h3>
            <div className="w-12 h-px bg-verde/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Coordinate photographic experiences, manage timelines, and oversee the complete creative process.</p>
          </div>
        </Link>

        <Link href="/admin-v2/clients" className="block group">
          <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-warm-brown/20 flex items-center justify-center group-hover:bg-warm-brown/30 transition-colors duration-300">
                <span className="text-charcoal font-light text-lg">◈</span>
              </div>
            </div>
            <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Client Relations</h3>
            <div className="w-12 h-px bg-warm-brown/30 mb-4"></div>
            <p className="text-charcoal/70 text-sm font-light leading-relaxed">Maintain client profiles, preferences, and comprehensive session histories with thoughtful care.</p>
          </div>
        </Link>
      </div>

      {/* Recent Leads */}
      <div className="bg-ivory/40 border border-gold/20 backdrop-blur-sm">
        <div className="px-8 py-6 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-charcoal tracking-wide">Recent Inquiries</h2>
            <div className="w-16 h-px bg-gold/30"></div>
          </div>
        </div>
        <div className="p-8">
          {recentLeads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gold/10 mx-auto mb-4 flex items-center justify-center">
                <span className="text-gold text-2xl">∅</span>
              </div>
              <p className="text-charcoal/60 font-light">No inquiries at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-6 border-b border-gold/10 last:border-b-0 group">
                  <div className="flex-1">
                    <div className="text-lg font-light text-charcoal mb-1">
                      {lead.first_name} {lead.last_name}
                    </div>
                    <div className="text-sm text-charcoal/60 font-light tracking-wide">{lead.email}</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className={`px-3 py-1 text-xs font-light tracking-wider uppercase border ${getStatusColor(lead.status)} transition-colors duration-200`}>
                      {lead.status.replace('-', ' ')}
                    </span>
                    <div className="text-sm text-charcoal/50 font-light">
                      {formatDate(lead.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}