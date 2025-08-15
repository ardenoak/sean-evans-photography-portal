'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export default function SimpleDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = sessionStorage.getItem('admin_authenticated');
      const userData = sessionStorage.getItem('admin_user');

      if (!isAuthenticated || !userData) {
        router.push('/admin-v2/simple-login');
        return;
      }

      try {
        const adminUser = JSON.parse(userData);
        setUser(adminUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/admin-v2/simple-login');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout error:', error);
    }
    
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_user');
    router.push('/admin-v2/simple-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-charcoal">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="bg-charcoal/95 backdrop-blur-sm border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center justify-center">
                <img
                  src="/tally-logo.png"
                  alt="Tally Photography Management"
                  className="h-16 w-auto brightness-0 invert"
                />
              </div>
              <div className="border-l border-gold/30 pl-6">
                <h1 className="text-xl font-light text-ivory tracking-wide">Admin Portal</h1>
                <span className="text-gold/80 text-xs font-light tracking-wider uppercase">Management Console</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-ivory/90 text-sm font-light">Welcome back,</div>
                <div className="text-gold text-sm font-medium">{user.first_name || user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-charcoal/50 hover:bg-charcoal/70 text-ivory border border-gold/30 hover:border-gold/50 px-4 py-2 rounded-sm text-sm font-light tracking-wide transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-6">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-light text-charcoal tracking-wide mb-4">Administrative Overview</h1>
              <div className="w-24 h-px bg-gold mx-auto mb-4"></div>
              <p className="text-charcoal/70 font-light tracking-wide max-w-2xl mx-auto">
                Welcome to your direct access dashboard. All systems operational.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              <a href="/admin/leads" className="block group" target="_blank">
                <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                      <span className="text-charcoal font-light text-lg">→</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Lead Management</h3>
                  <div className="w-12 h-px bg-gold/30 mb-4"></div>
                  <p className="text-charcoal/70 text-sm font-light leading-relaxed">Access your existing lead management system with full functionality.</p>
                </div>
              </a>

              <a href="/admin/sessions" className="block group" target="_blank">
                <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-verde/20 flex items-center justify-center group-hover:bg-verde/30 transition-colors duration-300">
                      <span className="text-charcoal font-light text-lg">◉</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Session Management</h3>
                  <div className="w-12 h-px bg-verde/30 mb-4"></div>
                  <p className="text-charcoal/70 text-sm font-light leading-relaxed">Coordinate photographic experiences and manage session timelines.</p>
                </div>
              </a>

              <a href="/admin/clients" className="block group" target="_blank">
                <div className="bg-ivory/40 border border-gold/20 p-8 group-hover:bg-ivory/60 transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-warm-brown/20 flex items-center justify-center group-hover:bg-warm-brown/30 transition-colors duration-300">
                      <span className="text-charcoal font-light text-lg">◈</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-light text-charcoal tracking-wide mb-3">Client Relations</h3>
                  <div className="w-12 h-px bg-warm-brown/30 mb-4"></div>
                  <p className="text-charcoal/70 text-sm font-light leading-relaxed">Access client profiles and comprehensive session histories.</p>
                </div>
              </a>
            </div>

            {/* Success Message */}
            <div className="bg-ivory/40 border border-gold/20 backdrop-blur-sm p-8 text-center">
              <div className="w-16 h-16 bg-gold/20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-gold text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-light text-charcoal tracking-wide mb-4">System Access Confirmed</h2>
              <p className="text-charcoal/70 font-light">You now have direct access to all administrative functions without authentication delays.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}