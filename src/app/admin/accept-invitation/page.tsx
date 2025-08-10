'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  expires_at: string;
  invited_by: string;
}

function AcceptInvitationForm() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      console.log('Looking for invitation with token:', token);
      
      // First, let's see if the invitation exists at all
      const { data: allInvitations, error: allError } = await supabase
        .from('admin_invitations')
        .select('*');
      
      console.log('All invitations in database:', allInvitations);
      
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('Invitation query result:', { data, error });

      if (error || !data) {
        console.log('No invitation found with token:', token);
        setError('Invitation not found or has already been used');
      } else {
        console.log('Found invitation:', data);
        
        // Check status
        if (data.status !== 'pending') {
          setError(`This invitation has already been ${data.status}`);
          return;
        }
        
        // Check if invitation has expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        console.log('Checking expiration:', { now, expiresAt, expired: now > expiresAt });
        
        if (now > expiresAt) {
          setError('This invitation has expired');
        } else {
          setInvitation(data);
        }
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Error loading invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    if (!invitation) return;

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      });

      if (authError) {
        setError(`Error creating account: ${authError.message}`);
        setSubmitting(false);
        return;
      }

      // 2. Create the admin user record
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          role: invitation.role,
          can_manage_leads: invitation.role !== 'viewer',
          can_manage_clients: invitation.role !== 'viewer',
          can_manage_sessions: invitation.role !== 'viewer',
          can_manage_admins: invitation.role === 'super_admin',
          can_view_analytics: true,
          created_by: invitation.invited_by,
          activated_at: new Date().toISOString(),
          is_active: true
        }]);

      if (adminError) {
        setError(`Error creating admin account: ${adminError.message}`);
        setSubmitting(false);
        return;
      }

      // 3. Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('admin_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (inviteError) {
        console.error('Error updating invitation:', inviteError);
        // Don't fail the whole process for this
      }

      setSuccess(true);
      
      // Redirect to admin login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Error accepting invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-white">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Image
            src="/sean-evans-logo.png"
            alt="Sean Evans Photography"
            width={300}
            height={120}
            className="h-16 w-auto mx-auto mb-8 brightness-0 invert"
            priority
          />
          
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Welcome to the Team!</h2>
            <p>Your admin account has been created successfully.</p>
            <p className="text-sm mt-2">Redirecting to login page...</p>
          </div>
          
          <button
            onClick={() => router.push('/admin/login')}
            className="text-gold hover:text-gold/80 transition-colors"
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Image
            src="/sean-evans-logo.png"
            alt="Sean Evans Photography"
            width={300}
            height={120}
            className="h-16 w-auto mx-auto mb-8 brightness-0 invert"
            priority
          />
          
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-2">Invitation Error</h2>
            <p>{error}</p>
          </div>
          
          <button
            onClick={() => router.push('/admin/login')}
            className="text-gold hover:text-gold/80 transition-colors"
          >
            ← Back to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Image
            src="/sean-evans-logo.png"
            alt="Sean Evans Photography"
            width={300}
            height={120}
            className="h-16 w-auto mx-auto mb-4 brightness-0 invert"
            priority
          />
          <h1 className="text-2xl font-didot text-white mb-2">Complete Your Setup</h1>
          <p className="text-gold/80 text-sm">Welcome to the Sean Evans Photography admin team</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-charcoal mb-2">
              Welcome, {invitation?.first_name} {invitation?.last_name}!
            </h2>
            <p className="text-warm-gray text-sm">
              You're being added as an <strong>{invitation?.role}</strong>
            </p>
          </div>

          <form onSubmit={handleAcceptInvitation} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                Create Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-gold to-gold/90 text-white py-3 px-6 rounded-lg font-semibold hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Accept Invitation & Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AcceptInvitationForm />
    </Suspense>
  );
}