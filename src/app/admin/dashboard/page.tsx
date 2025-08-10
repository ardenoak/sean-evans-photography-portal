'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  pendingInvitations: number;
  upcomingSessions: number;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    pendingInvitations: 0,
    upcomingSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadDashboardStats();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadDashboardStats = async () => {
    try {
      // Load total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Load total sessions
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      // Load pending invitations (if table exists)
      const { count: invitationCount } = await supabase
        .from('client_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Load upcoming sessions (sessions in the future)
      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_date', today);

      setStats({
        totalClients: clientCount || 0,
        totalSessions: sessionCount || 0,
        pendingInvitations: invitationCount || 0,
        upcomingSessions: upcomingCount || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading admin dashboard...</p>
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
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto"
                priority
              />
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <div>
                <h1 className="text-xl font-didot text-charcoal">Admin Portal</h1>
                <p className="text-sm text-warm-gray">Photographer Dashboard</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-didot text-charcoal mb-2">
            Dashboard Overview
          </h2>
          <p className="text-warm-gray">
            Manage your clients, sessions, and portal access
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-verde/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <span className="text-2xl font-bold text-charcoal">{stats.totalClients}</span>
            </div>
            <h3 className="text-lg font-semibold text-charcoal">Total Clients</h3>
            <p className="text-warm-gray text-sm">Registered clients</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <span className="text-2xl font-bold text-charcoal">{stats.totalSessions}</span>
            </div>
            <h3 className="text-lg font-semibold text-charcoal">Total Sessions</h3>
            <p className="text-warm-gray text-sm">All time sessions</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-charcoal/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <span className="text-2xl font-bold text-charcoal">{stats.pendingInvitations}</span>
            </div>
            <h3 className="text-lg font-semibold text-charcoal">Pending Invites</h3>
            <p className="text-warm-gray text-sm">Awaiting registration</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-verde/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <span className="text-2xl font-bold text-charcoal">{stats.upcomingSessions}</span>
            </div>
            <h3 className="text-lg font-semibold text-charcoal">Upcoming</h3>
            <p className="text-warm-gray text-sm">Future sessions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-didot text-charcoal mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => router.push('/admin/leads')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold">Lead Management</div>
              <div className="text-sm opacity-90">Track potential clients</div>
            </button>

            <button
              onClick={() => router.push('/contact')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-2">📞</div>
              <div className="font-semibold">Contact Form</div>
              <div className="text-sm opacity-90">View live contact form</div>
            </button>

            <button
              onClick={() => router.push('/admin/clients')}
              className="bg-gradient-to-r from-verde to-verde/90 text-white p-6 rounded-lg hover:from-verde/90 hover:to-verde transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Manage Clients</div>
              <div className="text-sm opacity-90">Add, edit, and view clients</div>
            </button>

            <button
              onClick={() => router.push('/admin/sessions')}
              className="bg-gradient-to-r from-gold to-gold/90 text-white p-6 rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-2">📸</div>
              <div className="font-semibold">Manage Sessions</div>
              <div className="text-sm opacity-90">Create and schedule sessions</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}