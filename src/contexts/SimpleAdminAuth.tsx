'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface SimpleAdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, stayLoggedIn?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const SimpleAdminAuthContext = createContext<SimpleAdminAuthContextType | undefined>(undefined);

const SESSION_KEY = 'admin_session_expires';
const STAY_LOGGED_IN_KEY = 'admin_stay_logged_in';

export function SimpleAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if session has expired
  const isSessionExpired = () => {
    if (typeof window === 'undefined') return false; // Skip during SSR
    
    const stayLoggedIn = localStorage.getItem(STAY_LOGGED_IN_KEY) === 'true';
    if (stayLoggedIn) return false;
    
    const expiresAt = localStorage.getItem(SESSION_KEY);
    if (!expiresAt) return true;
    
    return Date.now() > parseInt(expiresAt);
  };

  // Set session expiry (30 minutes default)
  const setSessionExpiry = (stayLoggedIn: boolean = false) => {
    if (typeof window === 'undefined') return; // Skip during SSR
    
    localStorage.setItem(STAY_LOGGED_IN_KEY, stayLoggedIn.toString());
    if (!stayLoggedIn) {
      const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
      localStorage.setItem(SESSION_KEY, expiresAt.toString());
    }
  };

  // Load admin user data
  const loadAdminUser = async (email: string): Promise<AdminUser | null> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Admin user not found:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        role: data.role || 'admin'
      };
    } catch (error) {
      console.error('Error loading admin user:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check if session expired
        if (isSessionExpired()) {
          console.log('Session expired, logging out');
          await logout();
          return;
        }

        // Check current Supabase session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
        });

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (session?.user?.email) {
          console.log('Found session, loading admin user...');
          const adminUser = await loadAdminUser(session.user.email);
          if (adminUser) {
            console.log('Admin user loaded:', adminUser.email);
            setUser(adminUser);
          } else {
            console.log('Admin user not found, signing out');
            await supabase.auth.signOut();
          }
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up periodic session check (every 5 minutes)
    const sessionCheck = setInterval(() => {
      if (isSessionExpired() && user) {
        console.log('Session expired during use, logging out');
        logout();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(sessionCheck);
  }, []);

  const login = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login for:', email);

      // Step 1: Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: authError.message };
      }

      if (!data.user?.email) {
        return { success: false, error: 'Authentication failed' };
      }

      // Step 2: Load admin user data
      const adminUser = await loadAdminUser(data.user.email);
      
      if (!adminUser) {
        await supabase.auth.signOut();
        return { success: false, error: 'Access denied. Admin credentials required.' };
      }

      // Step 3: Set session and user state
      setSessionExpiry(stayLoggedIn);
      setUser(adminUser);

      console.log('Login successful for:', adminUser.email);
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STAY_LOGGED_IN_KEY);
      }
      
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <SimpleAdminAuthContext.Provider value={value}>
      {children}
    </SimpleAdminAuthContext.Provider>
  );
}

export const useSimpleAdminAuth = () => {
  const context = useContext(SimpleAdminAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAdminAuth must be used within a SimpleAdminAuthProvider');
  }
  return context;
};