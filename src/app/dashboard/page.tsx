'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authenticatedFetch } from '@/lib/auth-fetch';
import Logo from '@/components/Logo';
import TallyLayout from '@/components/TallyLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import PriorityCard from '@/components/dashboard/PriorityCard';
import ActivityCard from '@/components/dashboard/ActivityCard';
import ResponsiveGrid from '@/components/dashboard/ResponsiveGrid';
import CollapsibleSection from '@/components/dashboard/CollapsibleSection';
import SkeletonLoader from '@/components/dashboard/SkeletonLoader';
import AnimatedCounter from '@/components/dashboard/AnimatedCounter';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useLuxuryTokens } from '@/components/design-system/foundations/useLuxuryTokens';

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
  const { tokens } = useLuxuryTokens();
  
  // Enhanced feature flags for luxury dashboard
  const dashboardAnalyticsEnabled = useFeatureFlag('dashboardAnalytics');
  const enhancedSearchEnabled = useFeatureFlag('enhancedSearch');

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
      console.log('🔵 [DASHBOARD] Loading consolidated dashboard stats...');
      const startTime = Date.now();
      
      // Use the new consolidated API endpoint with secure authentication
      console.log('🔑 [DASHBOARD] Using secure authentication');
      console.log('🌍 [DASHBOARD] Environment:', process.env.NODE_ENV);
      
      const response = await authenticatedFetch('/api/dashboard/stats');

      const result = await response.json();
      console.log('📊 [DASHBOARD] API result:', result);
      console.log('📡 [DASHBOARD] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [DASHBOARD] Error response:', result.error);
        // Still try to use data if it exists in the result
        if (result.data) {
          console.log('✅ [DASHBOARD] Setting dashboard data despite error status');
        } else {
          throw new Error(`Dashboard API responded with ${response.status}: ${result.error || response.statusText}`);
        }
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [DASHBOARD] Stats loaded in ${duration}ms (${result.meta?.cached ? 'cached' : 'fresh'}):`, {
        totalLeads: result.data.totalLeads,
        totalClients: result.data.totalClients,
        totalSessions: result.data.totalSessions,
        totalQuotes: result.data.totalQuotes,
        totalContracts: result.data.totalContracts,
        upcomingSessions: result.data.upcomingSessions,
        pendingPayments: result.data.pendingPayments,
        requestTime: result.meta?.requestTime,
        cached: result.meta?.cached
      });

      // Extract the consolidated stats
      const dashboardData = result.data;
      
      setStats({
        totalClients: dashboardData.totalClients,
        totalSessions: dashboardData.totalSessions,
        totalLeads: dashboardData.totalLeads,
        upcomingSessions: dashboardData.upcomingSessions,
        totalQuotes: dashboardData.totalQuotes,
        totalContracts: dashboardData.totalContracts,
        pendingPayments: dashboardData.pendingPayments,
        recentLeads: dashboardData.recentLeads,
        recentSessions: dashboardData.recentSessions,
        recentQuotes: dashboardData.recentQuotes
      });
      
    } catch (error) {
      console.error('❌ [DASHBOARD] Error loading dashboard stats:', error);
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
      <TallyLayout>
        <div className="bg-ivory min-h-screen">
          {/* Enhanced Luxury Header with Sophisticated Gradient */}
          <div className="relative bg-gradient-to-br from-charcoal/8 via-verde/3 to-gold/5 overflow-hidden">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(67,56,202,0.05)_1px,transparent_0)] bg-[length:24px_24px] opacity-40"></div>
            
            <div className="relative max-w-7xl mx-auto px-luxury-lg pt-luxury-2xl pb-luxury-xl">
              <div className="text-center space-y-luxury-lg">
                <div className="space-y-luxury-md">
                  <h1 className="text-luxury-4xl md:text-luxury-5xl lg:text-luxury-6xl font-light text-charcoal tracking-luxury-wide">
                    {dashboardAnalyticsEnabled ? 'Business Analytics Dashboard' : 'Business Dashboard'}
                  </h1>
                  <div className="w-luxury-xl h-px bg-gradient-to-r from-transparent via-charcoal/40 to-transparent mx-auto"></div>
                  {dashboardAnalyticsEnabled && (
                    <div className="inline-flex items-center px-luxury-md py-luxury-sm bg-verde/10 text-verde rounded-luxury-full border border-verde/20 shadow-luxury-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-luxury-sm font-medium">Enhanced Analytics Active</span>
                    </div>
                  )}
                </div>
                <p className="text-luxury-lg font-light text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
                  Loading your {dashboardAnalyticsEnabled ? 'advanced business insights and analytics' : 'business insights'}...
                </p>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-luxury-lg py-luxury-xl space-y-luxury-2xl">
            {/* Enhanced Loading Skeletons with Luxury Styling */}
            <div className="space-y-luxury-lg">
              <div className="text-center">
                <div className="inline-flex items-center space-x-luxury-md text-charcoal/60">
                  <div className="w-luxury-xs h-luxury-xs bg-verde rounded-full animate-pulse"></div>
                  <span className="text-luxury-sm font-light tracking-wide">Preparing your insights</span>
                  <div className="w-luxury-xs h-luxury-xs bg-gold rounded-full animate-pulse [animation-delay:0.5s]"></div>
                </div>
              </div>
              
              <ResponsiveGrid variant="priorities">
                <SkeletonLoader variant="priority" />
                <SkeletonLoader variant="priority" />
                <SkeletonLoader variant="priority" />
              </ResponsiveGrid>
              
              <ResponsiveGrid variant="metrics">
                <SkeletonLoader variant="metric" />
                <SkeletonLoader variant="metric" />
                <SkeletonLoader variant="metric" />
                <SkeletonLoader variant="metric" />
              </ResponsiveGrid>
              
              <ResponsiveGrid variant="activities">
                <SkeletonLoader variant="activity" />
                <SkeletonLoader variant="activity" />
              </ResponsiveGrid>
            </div>
          </div>
        </div>
      </TallyLayout>
    );
  }

  const formatActivityItems = (items: any[], type: 'leads' | 'sessions' | 'quotes') => {
    return items.map(item => {
      if (type === 'leads') {
        return {
          id: item.id,
          title: `${item.first_name} ${item.last_name}`,
          subtitle: item.session_type_interest || 'No session type',
          metadata: `Needs response • ${Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60))}h ago`,
          status: { label: 'New', variant: 'warning' as const },
          priority: true
        };
      }
      if (type === 'sessions') {
        return {
          id: item.id,
          title: `${item.client_name || 'Unknown Client'}`,
          subtitle: item.session_type || 'Session',
          metadata: new Date(item.session_date).toLocaleDateString(),
          status: { label: 'Scheduled', variant: 'info' as const }
        };
      }
      if (type === 'quotes') {
        return {
          id: item.id,
          title: item.quote_number || 'Quote',
          subtitle: item.client_name || 'Unknown Client',
          metadata: `$${item.total_amount?.toLocaleString() || '0'}`,
          status: { label: item.status || 'Draft', variant: 'info' as const },
          timestamp: new Date(item.created_at).toLocaleDateString()
        };
      }
      return item;
    });
  };

  return (
    <TallyLayout>
      <div className="bg-ivory min-h-screen">
        {/* Compact Header */}
        <div className="border-b border-charcoal/10 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
                <p className="text-sm text-charcoal/70 mt-1">Business overview and performance metrics</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-charcoal/60">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                {dashboardAnalyticsEnabled && (
                  <div className="flex items-center gap-1 bg-verde/10 text-verde px-2 py-1 rounded text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 1. Action Required - Most Urgent */}
          <div className="bg-white border border-charcoal/20 rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-charcoal/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-charcoal">🚨 Action Required</h2>
                <div className="text-xs text-charcoal/60">
                  {stats.recentLeads.length + stats.pendingPayments} items need attention
                </div>
              </div>
              <p className="text-sm text-charcoal/60">Items needing your immediate attention</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div 
                  onClick={() => router.push('/leads')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-charcoal">
                      {stats.recentLeads.length}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded ${
                      stats.recentLeads.length > 3 
                        ? 'bg-red-100 text-red-700' 
                        : stats.recentLeads.length > 0 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {stats.recentLeads.length > 3 ? 'Urgent' : stats.recentLeads.length > 0 ? 'Medium' : 'Good'}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">New Leads</div>
                  <div className="text-xs text-charcoal/60">Awaiting first response</div>
                </div>
                
                <div 
                  onClick={() => router.push('/sessions')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-charcoal">
                      {stats.upcomingSessions}
                    </div>
                    <div className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      This Week
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Upcoming Sessions</div>
                  <div className="text-xs text-charcoal/60">Sessions to prepare</div>
                </div>
                
                <div 
                  onClick={() => router.push('/leads')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-charcoal">
                      {stats.pendingPayments}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded ${
                      stats.pendingPayments > 5 
                        ? 'bg-red-100 text-red-700' 
                        : stats.pendingPayments > 0 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {stats.pendingPayments > 5 ? 'Urgent' : stats.pendingPayments > 0 ? 'Follow-up' : 'Current'}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Outstanding Payments</div>
                  <div className="text-xs text-charcoal/60">Invoices to collect</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Business Performance Overview */}
          <div className="bg-white border-b border-charcoal/10 mb-8">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-charcoal mb-4">📊 Business Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">
                    <AnimatedCounter value={stats.totalLeads} />
                  </div>
                  <div className="text-xs text-charcoal/60 uppercase tracking-wide">Active Leads</div>
                  <div className="text-xs text-charcoal/50 mt-1">In pipeline</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-verde">
                    <AnimatedCounter value={stats.totalClients} />
                  </div>
                  <div className="text-xs text-charcoal/60 uppercase tracking-wide">Total Clients</div>
                  <div className="text-xs text-charcoal/50 mt-1">Relationships</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">
                    <AnimatedCounter value={stats.totalSessions} />
                  </div>
                  <div className="text-xs text-charcoal/60 uppercase tracking-wide">Sessions</div>
                  <div className="text-xs text-charcoal/50 mt-1">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">
                    {stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0}%
                  </div>
                  <div className="text-xs text-charcoal/60 uppercase tracking-wide">Conversion</div>
                  <div className="text-xs text-charcoal/50 mt-1">Quote to contract</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sales Pipeline Overview */}
          <div className="bg-white border border-charcoal/20 rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-charcoal/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-charcoal">💰 Sales Pipeline</h2>
                <div className="text-sm text-charcoal/60">
                  Conversion Rate: <span className="font-semibold text-verde">
                    {stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-charcoal/60">Revenue pipeline and conversion tracking</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Sales Metrics Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 border border-charcoal/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-500">
                        <AnimatedCounter value={stats.totalQuotes} />
                      </div>
                      <div className="text-xs text-charcoal/50">Total Quotes</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Proposals Sent</div>
                  <div className="text-xs text-charcoal/60">Active in pipeline</div>
                </div>

                <div className="p-4 border border-charcoal/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-verde">
                        <AnimatedCounter value={stats.totalContracts} />
                      </div>
                      <div className="text-xs text-charcoal/50">Contracts</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Signed Agreements</div>
                  <div className="text-xs text-charcoal/60">
                    {stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0}% conversion rate
                  </div>
                </div>

                <div className="p-4 border border-charcoal/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-500">
                        <AnimatedCounter value={stats.pendingPayments} />
                      </div>
                      <div className="text-xs text-charcoal/50">Pending</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Payment Follow-up</div>
                  <div className="text-xs text-charcoal/60">Outstanding invoices</div>
                </div>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="bg-gray-50 border border-charcoal/10 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-charcoal mb-4">Pipeline Flow</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-charcoal/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AnimatedCounter value={stats.totalLeads} className="text-sm font-semibold text-charcoal" />
                    </div>
                    <div className="text-xs font-medium text-charcoal">Leads</div>
                    <div className="text-xs text-charcoal/60">Initial Contact</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AnimatedCounter value={stats.totalQuotes} className="text-sm font-semibold text-blue-600" />
                    </div>
                    <div className="text-xs font-medium text-charcoal">Quotes</div>
                    <div className="text-xs text-charcoal/60">Proposals</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-verde/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AnimatedCounter value={stats.totalContracts} className="text-sm font-semibold text-verde" />
                    </div>
                    <div className="text-xs font-medium text-charcoal">Contracts</div>
                    <div className="text-xs text-charcoal/60">Signed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AnimatedCounter value={stats.totalSessions} className="text-sm font-semibold text-gold" />
                    </div>
                    <div className="text-xs font-medium text-charcoal">Sessions</div>
                    <div className="text-xs text-charcoal/60">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Recent Activity */}
          {(stats.recentLeads.length > 0 || stats.recentQuotes.length > 0 || stats.recentSessions.length > 0) && (
            <div className="bg-white border border-charcoal/20 rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-charcoal/10">
                <h2 className="text-lg font-semibold text-charcoal">⚡ Recent Activity</h2>
                <p className="text-sm text-charcoal/60">Latest business activity and insights</p>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Hot Leads Activity */}
                  {stats.recentLeads.length > 0 && (
                    <div className="border border-charcoal/20 rounded-lg">
                      <div className="px-4 py-3 border-b border-charcoal/10 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-charcoal">Hot Leads</span>
                          </div>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{stats.recentLeads.length}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {formatActivityItems(stats.recentLeads.slice(0, 3), 'leads').map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-charcoal/10 last:border-b-0">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-charcoal">{item.title}</div>
                              <div className="text-xs text-charcoal/60">{item.subtitle}</div>
                            </div>
                            <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              {item.status.label}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => router.push('/leads')}
                          className="w-full text-xs text-verde hover:text-verde/80 font-medium py-2 border-t border-charcoal/10"
                        >
                          Respond to All Leads →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions Activity */}
                  {stats.recentSessions.length > 0 && (
                    <div className="border border-charcoal/20 rounded-lg">
                      <div className="px-4 py-3 border-b border-charcoal/10 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium text-charcoal">Recent Sessions</span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{stats.recentSessions.length}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {formatActivityItems(stats.recentSessions.slice(0, 3), 'sessions').map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-charcoal/10 last:border-b-0">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-charcoal">{item.title}</div>
                              <div className="text-xs text-charcoal/60">{item.subtitle}</div>
                            </div>
                            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {item.status.label}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => router.push('/sessions')}
                          className="w-full text-xs text-verde hover:text-verde/80 font-medium py-2 border-t border-charcoal/10"
                        >
                          View All Sessions →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recent Quotes Activity */}
                  {stats.recentQuotes.length > 0 && (
                    <div className="border border-charcoal/20 rounded-lg">
                      <div className="px-4 py-3 border-b border-charcoal/10 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-charcoal">Recent Quotes</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{stats.recentQuotes.length}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {formatActivityItems(stats.recentQuotes.slice(0, 3), 'quotes').map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-charcoal/10 last:border-b-0">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-charcoal">{item.title}</div>
                              <div className="text-xs text-charcoal/60">{item.subtitle}</div>
                            </div>
                            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {item.metadata}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => router.push('/leads')}
                          className="w-full text-xs text-verde hover:text-verde/80 font-medium py-2 border-t border-charcoal/10"
                        >
                          View All Quotes →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Detailed Business Metrics */}
          <div className="bg-white border border-charcoal/20 rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-charcoal/10">
              <h2 className="text-lg font-semibold text-charcoal">📈 Detailed Metrics</h2>
              <p className="text-sm text-charcoal/60">Detailed performance indicators and insights</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div 
                  onClick={() => router.push('/leads')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-charcoal">
                        <AnimatedCounter value={stats.totalLeads} />
                      </div>
                      <div className="text-xs text-charcoal/50">Total Leads</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Lead Pipeline</div>
                  <div className="text-xs text-charcoal/60">Potential clients</div>
                </div>

                <div 
                  onClick={() => router.push('/clients')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-verde">
                        <AnimatedCounter value={stats.totalClients} />
                      </div>
                      <div className="text-xs text-charcoal/50">Total Clients</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Client Base</div>
                  <div className="text-xs text-charcoal/60">Active relationships</div>
                </div>

                <div 
                  onClick={() => router.push('/sessions')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 712-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 711.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 712 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 616 0z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gold">
                        <AnimatedCounter value={stats.totalSessions} />
                      </div>
                      <div className="text-xs text-charcoal/50">Sessions</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Photo Sessions</div>
                  <div className="text-xs text-charcoal/60">Completed shoots</div>
                </div>

                <div className="p-4 border border-charcoal/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-xl font-bold text-warm-brown">
                        <AnimatedCounter value={stats.upcomingSessions} />
                      </div>
                      <div className="text-xs text-charcoal/50">This Week</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-charcoal">Upcoming</div>
                  <div className="text-xs text-charcoal/60">Scheduled shoots</div>
                  <div className="flex items-center mt-2 text-xs text-green-600">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l2-2 4 4 8-8" />
                    </svg>
                    +12% vs last week
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Quick Actions Navigation */}
          <div className="bg-white border border-charcoal/20 rounded-lg">
            <div className="px-6 py-4 border-b border-charcoal/10">
              <h2 className="text-lg font-semibold text-charcoal">🔧 Quick Actions</h2>
              <p className="text-sm text-charcoal/60">Navigate to key business areas</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => router.push('/leads')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-charcoal/60 group-hover:text-verde transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="text-lg font-bold text-charcoal">{stats.totalLeads}</div>
                  </div>
                  <div className="text-sm font-medium text-charcoal group-hover:text-verde transition-colors">Lead Management</div>
                  <div className="text-xs text-charcoal/60">Manage inquiries & proposals</div>
                </div>

                <div 
                  onClick={() => router.push('/packages')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-verde group-hover:text-verde transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div className="text-lg font-bold text-verde">✓</div>
                  </div>
                  <div className="text-sm font-medium text-charcoal group-hover:text-verde transition-colors">Packages & Pricing</div>
                  <div className="text-xs text-charcoal/60">Package management</div>
                </div>

                <div 
                  onClick={() => router.push('/sessions')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-gold group-hover:text-verde transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 712-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 711.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 712 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 616 0z" />
                    </svg>
                    <div className="text-lg font-bold text-gold">{stats.upcomingSessions}</div>
                  </div>
                  <div className="text-sm font-medium text-charcoal group-hover:text-verde transition-colors">Session Calendar</div>
                  <div className="text-xs text-charcoal/60">Schedule & manage shoots</div>
                </div>

                <div 
                  onClick={() => router.push('/clients')}
                  className="p-4 border border-charcoal/20 rounded-lg hover:border-verde hover:bg-verde/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <svg className="w-6 h-6 text-warm-brown group-hover:text-verde transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-lg font-bold text-warm-brown">{stats.totalClients}</div>
                  </div>
                  <div className="text-sm font-medium text-charcoal group-hover:text-verde transition-colors">Client Relations</div>
                  <div className="text-xs text-charcoal/60">Manage relationships</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TallyLayout>
  );
}