'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';
import TallyLayout from '@/components/TallyLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import PriorityCard from '@/components/dashboard/PriorityCard';
import ActivityCard from '@/components/dashboard/ActivityCard';
import ResponsiveGrid from '@/components/dashboard/ResponsiveGrid';
import CollapsibleSection from '@/components/dashboard/CollapsibleSection';
import SkeletonLoader from '@/components/dashboard/SkeletonLoader';
import AnimatedCounter from '@/components/dashboard/AnimatedCounter';

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
      console.log('🔵 [DASHBOARD] Loading consolidated dashboard stats...');
      const startTime = Date.now();
      
      // Use the new consolidated API endpoint
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard API responded with ${response.status}`);
      }

      const result = await response.json();
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
          <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-charcoal tracking-wide">
                    Business Dashboard
                  </h1>
                  <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
                </div>
                <p className="text-base font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
                  Loading your business insights...
                </p>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
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
        <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-charcoal tracking-wide">
                  Business Dashboard
                </h1>
                <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              <p className="text-base font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
                Today's priorities and business performance insights
              </p>
              <div className="text-sm text-charcoal/60">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 md:space-y-12">
          <CollapsibleSection title="Today's Priorities" subtitle="Items requiring immediate attention">
            <ResponsiveGrid variant="priorities">
              <PriorityCard
                title="Action Required"
                description="New leads need response"
                count={stats.recentLeads.length}
                urgency={stats.recentLeads.length > 3 ? 'high' : 'medium'}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                action={{
                  label: 'Review Leads',
                  onClick: () => router.push('/leads')
                }}
              />
              
              <PriorityCard
                title="Upcoming Sessions"
                description="Sessions scheduled this week"
                count={stats.upcomingSessions}
                urgency="low"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                action={{
                  label: 'View Schedule',
                  onClick: () => router.push('/sessions')
                }}
              />
              
              <PriorityCard
                title="Payment Follow-up"
                description="Payments awaiting collection"
                count={stats.pendingPayments}
                urgency={stats.pendingPayments > 5 ? 'high' : 'medium'}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                action={{
                  label: 'Follow Up',
                  onClick: () => router.push('/leads')
                }}
              />
            </ResponsiveGrid>
          </CollapsibleSection>

          <CollapsibleSection title="Business Performance" subtitle="Key metrics and insights">
            <ResponsiveGrid variant="metrics">
              <MetricCard
                title="Total Leads"
                value={<AnimatedCounter value={stats.totalLeads} />}
                subtitle="Potential clients in pipeline"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                iconColor="charcoal/60"
                action={{
                  label: 'View Leads',
                  onClick: () => router.push('/leads')
                }}
              />
              
              <MetricCard
                title="Total Clients"
                value={<AnimatedCounter value={stats.totalClients} />}
                subtitle="Active client relationships"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconColor="verde"
                action={{
                  label: 'View Clients',
                  onClick: () => router.push('/clients')
                }}
              />
              
              <MetricCard
                title="Total Sessions"
                value={<AnimatedCounter value={stats.totalSessions} />}
                subtitle="Completed photo sessions"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                iconColor="gold"
                action={{
                  label: 'View Sessions',
                  onClick: () => router.push('/sessions')
                }}
              />
              
              <MetricCard
                title="This Week"
                value={<AnimatedCounter value={stats.upcomingSessions} />}
                subtitle="Upcoming sessions scheduled"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                iconColor="warm-brown"
                trend={{
                  value: 12,
                  label: 'vs last week',
                  isPositive: true
                }}
              />
            </ResponsiveGrid>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Sales Pipeline" 
            subtitle={`Conversion Rate: ${stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0}%`}
          >
            <div className="space-y-8">
              <ResponsiveGrid variant="priorities">
                <MetricCard
                  title="Total Quotes"
                  value={<AnimatedCounter value={stats.totalQuotes} />}
                  subtitle="Proposals sent to clients"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  iconColor="blue-500"
                />
                
                <MetricCard
                  title="Total Contracts"
                  value={<AnimatedCounter value={stats.totalContracts} />}
                  subtitle="Signed agreements"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconColor="verde"
                  trend={{
                    value: stats.totalQuotes > 0 ? Math.round((stats.totalContracts / stats.totalQuotes) * 100) : 0,
                    label: 'conversion rate',
                    isPositive: true
                  }}
                />
                
                <MetricCard
                  title="Pending Payments"
                  value={<AnimatedCounter value={stats.pendingPayments} />}
                  subtitle="Outstanding invoices"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  }
                  iconColor="orange-500"
                />
              </ResponsiveGrid>
              
              <div className="bg-white border border-charcoal/10 p-6 md:p-8 rounded-lg">
                <h3 className="text-lg font-light text-charcoal mb-6">Pipeline Flow</h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 bg-charcoal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AnimatedCounter value={stats.totalLeads} className="text-xl font-light text-charcoal" />
                    </div>
                    <div className="text-sm font-light text-charcoal/70">Leads</div>
                  </div>
                  <div className="w-8 h-px bg-charcoal/20 hidden sm:block"></div>
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AnimatedCounter value={stats.totalQuotes} className="text-xl font-light text-blue-600" />
                    </div>
                    <div className="text-sm font-light text-charcoal/70">Quotes</div>
                  </div>
                  <div className="w-8 h-px bg-charcoal/20 hidden sm:block"></div>
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 bg-verde/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AnimatedCounter value={stats.totalContracts} className="text-xl font-light text-verde" />
                    </div>
                    <div className="text-sm font-light text-charcoal/70">Contracts</div>
                  </div>
                  <div className="w-8 h-px bg-charcoal/20 hidden sm:block"></div>
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AnimatedCounter value={stats.totalSessions} className="text-xl font-light text-gold" />
                    </div>
                    <div className="text-sm font-light text-charcoal/70">Sessions</div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Quick Actions" subtitle="Navigate to key business areas">
            <ResponsiveGrid variant="tools">
              <MetricCard
                title="Lead Management"
                value={stats.totalLeads}
                subtitle="Manage inquiries and create proposals"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                iconColor="charcoal/60"
                action={{
                  label: 'Manage Leads',
                  onClick: () => router.push('/leads')
                }}
              />
              
              <MetricCard
                title="Packages & Pricing"
                value="✓"
                subtitle="Standard package management & pricing strategy"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                iconColor="verde"
                action={{
                  label: 'Edit Packages',
                  onClick: () => router.push('/packages')
                }}
              />
              
              <MetricCard
                title="Session Calendar"
                value={stats.upcomingSessions}
                subtitle="Schedule and manage photo sessions"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                iconColor="gold"
                action={{
                  label: 'View Calendar',
                  onClick: () => router.push('/sessions')
                }}
              />
              
              <MetricCard
                title="Client Relations"
                value={stats.totalClients}
                subtitle="Manage client relationships & contacts"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconColor="warm-brown"
                action={{
                  label: 'View Clients',
                  onClick: () => router.push('/clients')
                }}
              />
            </ResponsiveGrid>
          </CollapsibleSection>

          {(stats.recentLeads.length > 0 || stats.recentQuotes.length > 0 || stats.recentSessions.length > 0) && (
            <CollapsibleSection title="Recent Activity" subtitle="Latest business activity and insights">
              <ResponsiveGrid variant="activities">
                {stats.recentLeads.length > 0 && (
                  <ActivityCard
                    title="Hot Leads"
                    items={formatActivityItems(stats.recentLeads.slice(0, 5), 'leads')}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    maxVisible={3}
                    emptyMessage="No recent leads"
                    action={{
                      label: 'Respond to Leads',
                      onClick: () => router.push('/leads')
                    }}
                  />
                )}
                
                {stats.recentSessions.length > 0 && (
                  <ActivityCard
                    title="Recent Sessions"
                    items={formatActivityItems(stats.recentSessions.slice(0, 5), 'sessions')}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    maxVisible={3}
                    emptyMessage="No recent sessions"
                    action={{
                      label: 'View All Sessions',
                      onClick: () => router.push('/sessions')
                    }}
                  />
                )}
                
                {stats.recentQuotes.length > 0 && (
                  <ActivityCard
                    title="Recent Quotes"
                    items={formatActivityItems(stats.recentQuotes.slice(0, 5), 'quotes')}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    maxVisible={3}
                    emptyMessage="No recent quotes"
                    action={{
                      label: 'View All Quotes',
                      onClick: () => router.push('/leads')
                    }}
                  />
                )}
              </ResponsiveGrid>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </TallyLayout>
  );
}