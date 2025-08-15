'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ClientProfile {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface Session {
  id: string;
  session_type: string;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  duration: string;
  photographer: string;
  investment: string;
  status: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserData();
    }
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && !authLoading) {
        console.warn('Client dashboard loading timeout, forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [user, authLoading, router, loading]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('Loading profile for user:', user.id);
      
      // Load client profile (handle table might not exist)
      let profileData = null;
      try {
        const result = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Profile query result:', result);

        if (result.error) {
          if (result.error.code === 'PGRST116') {
            // No profile found, create a basic one
            console.log('No profile found, creating basic profile...');
            profileData = {
              id: user.id,
              user_id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || 'User',
              last_name: user.user_metadata?.last_name || '',
            };
          } else {
            console.warn('Profile query error:', result.error);
          }
        } else {
          profileData = result.data;
        }
      } catch (e) {
        console.warn('Clients table not available, using user data:', e);
        // Create a basic profile from user data
        profileData = {
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
        };
      }

      if (profileData) {
        setProfile(profileData);

        // Load client sessions (handle table might not exist)
        try {
          console.log('Loading sessions for client_id:', profileData.id);
          
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('client_id', profileData.id)
            .order('session_date', { ascending: false });

          console.log('Sessions query result:', { sessionsData, sessionsError });

          if (sessionsError) {
            console.warn('Error loading sessions:', sessionsError);
            setSessions([]); // Set empty sessions if table doesn't exist
          } else {
            console.log('Setting sessions:', sessionsData);
            setSessions(sessionsData || []);
          }
        } catch (e) {
          console.warn('Sessions table not available:', e);
          setSessions([]); // Set empty sessions if table doesn't exist
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Create a fallback profile even if everything fails
      setProfile({
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || 'User',
        last_name: user.user_metadata?.last_name || '',
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-verde to-gold rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/tally-logo.png"
                alt="Tally Photography Management"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto"
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-gray text-sm hidden sm:inline">
                Welcome back, {profile.first_name}
              </span>
              <button
                onClick={() => router.push('/profile')}
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                Profile
              </button>
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
          <h1 className="text-3xl font-didot text-charcoal mb-2">
            Hello, {profile.first_name}!
          </h1>
          <p className="text-warm-gray">
            Welcome to your personalized client portal
          </p>
        </div>

        {/* Sessions */}
        <div className="grid gap-8">
          <div>
            <h2 className="text-2xl font-didot text-charcoal mb-6">Your Sessions</h2>
            
            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-16 h-16 bg-ivory rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="text-xl font-didot text-charcoal mb-2">No sessions yet</h3>
                <p className="text-warm-gray">
                  Your upcoming photography sessions will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/portal/${session.id}`)}
                    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-didot text-charcoal mb-1">
                          {session.session_title}
                        </h3>
                        <p className="text-warm-gray text-sm">
                          {session.session_type}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'Confirmed & Scheduled' 
                          ? 'bg-verde/20 text-verde' 
                          : 'bg-warm-gray/20 text-warm-gray'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-warm-gray">Date</p>
                        <p className="text-charcoal font-medium">{session.session_date}</p>
                      </div>
                      <div>
                        <p className="text-warm-gray">Time</p>
                        <p className="text-charcoal font-medium">{session.session_time}</p>
                      </div>
                      <div>
                        <p className="text-warm-gray">Location</p>
                        <p className="text-charcoal font-medium">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-warm-gray">Investment</p>
                        <p className="text-charcoal font-medium">{session.investment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}