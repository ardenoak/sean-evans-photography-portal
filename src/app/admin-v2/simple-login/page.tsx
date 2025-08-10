'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    
    console.log('Direct login attempt for:', email);

    try {
      // Step 1: Direct Supabase auth
      console.log('Step 1: Authenticating with Supabase...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      console.log('Auth successful:', authData.user?.email);

      // Step 2: Check admin status
      console.log('Step 2: Checking admin status...');
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        console.error('Admin check failed:', adminError);
        await supabase.auth.signOut();
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      console.log('Admin verified:', adminData.email);

      // Step 3: Set session storage for the dashboard
      sessionStorage.setItem('admin_user', JSON.stringify(adminData));
      sessionStorage.setItem('admin_authenticated', 'true');

      console.log('Login complete, redirecting...');
      
      // Step 4: Redirect
      window.location.href = '/admin-v2/simple-dashboard';

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-warm-brown flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mx-auto mb-8">
            <img
              src="/sean-evans-logo.png"
              alt="Sean Evans Photography"
              className="h-20 w-auto brightness-0 invert"
            />
          </div>
          <h1 className="text-3xl font-light text-ivory tracking-wide mb-2">Admin Portal</h1>
          <p className="text-gold/80 text-sm font-light tracking-wider uppercase">Direct Access</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-ivory/95 backdrop-blur-sm py-12 px-8 shadow-2xl border border-gold/20">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-light text-charcoal/80 mb-3 tracking-wide">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-0 py-3 border-0 border-b border-charcoal/20 bg-transparent text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-gold focus:ring-0 transition-colors duration-200"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-charcoal/80 mb-3 tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-0 py-3 border-0 border-b border-charcoal/20 bg-transparent text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-gold focus:ring-0 transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-charcoal hover:bg-charcoal/90 text-ivory border border-gold/30 hover:border-gold/50 px-8 py-4 text-sm font-light tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'AUTHENTICATING...' : 'ENTER PORTAL'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-charcoal/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-ivory/95 text-charcoal/60 font-light tracking-wide">Direct Access</span>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-charcoal/50 font-light">
              🔒 Simple authentication • No complex context
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}