'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  is_active: boolean;
  can_manage_leads: boolean;
  can_manage_clients: boolean;
  can_manage_sessions: boolean;
  can_manage_admins: boolean;
  can_view_analytics: boolean;
  last_login_at?: string;
}

interface AdminAuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: 'leads' | 'clients' | 'sessions' | 'admins' | 'analytics') => boolean;
  refreshAdminUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = adminUser?.is_active === true;
  const isSuperAdmin = adminUser?.role === 'super_admin';

  // Function to load admin user data from database
  const loadAdminUser = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading admin user:', error);
        setAdminUser(null);
        return;
      }

      if (data) {
        setAdminUser(data as AdminUser);
        
        // Update last login timestamp
        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error loading admin user:', error);
      setAdminUser(null);
    }
  };

  const refreshAdminUser = async () => {
    if (user?.email) {
      await loadAdminUser(user.email);
    }
  };

  useEffect(() => {
    // Get initial session with timeout to prevent hanging
    const getInitialSession = async () => {
      try {
        console.log('AdminAuth: Getting initial session...');
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initial session timeout')), 10000);
        });
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const authUser = session?.user ?? null;
        setUser(authUser);
        console.log('AdminAuth: Initial session loaded:', !!authUser);
        
        if (authUser?.email) {
          await loadAdminUser(authUser.email);
        }
        
      } catch (error) {
        console.log('AdminAuth: Initial session failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);
        
        if (authUser?.email) {
          await loadAdminUser(authUser.email);
        } else {
          setAdminUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (permission: 'leads' | 'clients' | 'sessions' | 'admins' | 'analytics'): boolean => {
    if (!adminUser?.is_active) return false;
    
    switch (permission) {
      case 'leads':
        return adminUser.can_manage_leads;
      case 'clients':
        return adminUser.can_manage_clients;
      case 'sessions':
        return adminUser.can_manage_sessions;
      case 'admins':
        return adminUser.can_manage_admins;
      case 'analytics':
        return adminUser.can_view_analytics;
      default:
        return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AdminAuth: Starting sign in process for:', email);
      
      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign in timeout after 15 seconds')), 15000);
      });
      
      const signInPromise = (async () => {
        // Try to sign in first with shorter timeout
        console.log('AdminAuth: Attempting auth.signInWithPassword...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('AdminAuth: signInWithPassword result:', { data: !!data, error });
        if (error) return { error };

        // Then check if this email is an admin in the database
        console.log('AdminAuth: Checking admin privileges...');
        const { data: adminCheck, error: adminError } = await supabase
          .from('admin_users')
          .select('is_active')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        console.log('AdminAuth: Admin check result:', { adminCheck, adminError });
        if (adminError || !adminCheck) {
          // Sign out the user if they're not an admin
          console.log('AdminAuth: Access denied, signing out user');
          await supabase.auth.signOut();
          return { error: { message: 'Access denied. Admin credentials required.' } };
        }
        
        console.log('AdminAuth: Sign in successful');
        return { data };
      })();

      // Race between sign in and timeout
      return await Promise.race([signInPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('Admin sign in error:', error);
      return { error: error instanceof Error ? error : { message: 'Unknown sign in error' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (error) return { error };
      
      return { data };
    } catch (error) {
      console.error('Admin Google sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  };

  const value = {
    user,
    adminUser,
    loading,
    isAdmin,
    isSuperAdmin,
    signIn,
    signInWithGoogle,
    signOut,
    hasPermission,
    refreshAdminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};