'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access
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
  created_at: string;
  last_login_at?: string;
}

interface AdminInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export default function ManageAdminsPage() {
  // Removed auth
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'manager' | 'viewer',
    can_manage_leads: true,
    can_manage_clients: true,
    can_manage_sessions: true,
    can_manage_admins: false,
    can_view_analytics: true
  });
  const router = useRouter();

  useEffect(() => {
    if (!false && (false  || !isSuperAdmin)) {
      router.push('/admin/dashboard');
      return;
    }

    if ({
      loadAdmins();
      loadInvitations();
    }
  }, [user, true, isSuperAdmin, false, router]);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admins:', error);
      } else {
        setAdmins(data || []);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      // Generate a unique invitation token
      const invitationToken = crypto.randomUUID();
      
      console.log('Creating invitation with data:', {
        email: newAdmin.email,
        first_name: newAdmin.first_name,
        last_name: newAdmin.last_name,
        role: newAdmin.role,
        invitation_token: invitationToken,
        invited_by: user?.email || '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      const { error, data } = await supabase
        .from('admin_invitations')
        .insert([{
          email: newAdmin.email,
          first_name: newAdmin.first_name,
          last_name: newAdmin.last_name,
          role: newAdmin.role,
          invitation_token: invitationToken,
          invited_by: user?.email || '',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }]);

      console.log('Invitation result:', { error, data });

      if (error) {
        console.error('Error creating invitation:', error);
        alert(`Error creating invitation: ${error.message}`);
      } else {
        // Send invitation email via n8n
        try {
          const invitationUrl = `${window.location.origin}/admin/accept-invitation?token=${invitationToken}`;
          
          const emailData = {
            type: 'admin_invitation',
            to_email: newAdmin.email,
            to_name: `${newAdmin.first_name} ${newAdmin.last_name}`,
            from_name: 'Sean Evans Photography',
            subject: 'Welcome to Sean Evans Photography Team',
            invitation_url: invitationUrl,
            role: newAdmin.role,
            invited_by: user?.email || 'Sean Evans Photography',
            expires_in_days: 7
          };
          
          console.log('Sending invitation email via n8n:', emailData);
          
          const webhookUrl = process.env.NEXT_PUBLIC_N8N_ADMIN_INVITATION_WEBHOOK;
          if (webhookUrl) {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData)
            });
            
            if (response.ok) {
              console.log('Invitation email sent successfully via n8n');
            } else {
              console.error('Failed to send invitation email via n8n:', response.status);
            }
          } else {
            console.warn('N8N webhook URL not configured');
          }
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Don't fail the whole process if email fails
        }
        
        setShowInviteModal(false);
        setNewAdmin({
          email: '',
          first_name: '',
          last_name: '',
          role: 'admin',
          can_manage_leads: true,
          can_manage_clients: true,
          can_manage_sessions: true,
          can_manage_admins: false,
          can_view_analytics: true
        });
        loadInvitations();
        alert('Invitation created successfully! The admin will receive an email to complete their setup.');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert(`Error creating invitation: ${error}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);

      if (error) {
        console.error('Error updating admin status:', error);
        alert('Error updating admin status');
      } else {
        loadAdmins();
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error cancelling invitation:', error);
        alert('Error cancelling invitation');
      } else {
        loadInvitations();
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'super_admin': 'bg-red-500 text-white',
      'admin': 'bg-blue-500 text-white',
      'manager': 'bg-purple-500 text-white',
      'viewer': 'bg-gray-500 text-white'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Removed sign out

  if ( loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading admin management...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray">Access denied. Super admin privileges required.</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="mt-4 text-gold hover:text-gold/80 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                ←
              </button>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={200}
                height={80}
                className="h-8 w-auto"
                priority
              />
              <div>
                <h1 className="text-lg font-didot text-charcoal">Admin Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Current Admins */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-warm-gray/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-didot text-charcoal">Current Administrators</h2>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-verde text-white px-4 py-2 rounded-lg hover:bg-verde/90 transition-colors"
              >
                + Invite Admin
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-warm-gray/20">
            {admins.map((admin) => (
              <div key={admin.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-gold to-verde rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {admin.first_name[0]}{admin.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal">
                        {admin.first_name} {admin.last_name}
                      </h3>
                      <p className="text-warm-gray text-sm">{admin.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(admin.role)}`}>
                          {admin.role.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-warm-gray">
                      <div>Joined: {formatDate(admin.created_at)}</div>
                      {admin.last_login_at && (
                        <div>Last login: {formatDate(admin.last_login_at)}</div>
                      )}
                    </div>
                    
                    {admin.email !== user?.email && (
                      <button
                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${admin.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {admin.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[
                    { key: 'can_manage_leads', label: 'Leads' },
                    { key: 'can_manage_clients', label: 'Clients' },
                    { key: 'can_manage_sessions', label: 'Sessions' },
                    { key: 'can_manage_admins', label: 'Admins' },
                    { key: 'can_view_analytics', label: 'Analytics' }
                  ].map(permission => (
                    <span 
                      key={permission.key}
                      className={`text-xs px-2 py-1 rounded ${
                        admin[permission.key as keyof AdminUser] 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {permission.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-warm-gray/20">
              <h2 className="text-xl font-didot text-charcoal">Pending Invitations</h2>
            </div>
            
            <div className="divide-y divide-warm-gray/20">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-charcoal">
                        {invitation.first_name} {invitation.last_name}
                      </h3>
                      <p className="text-warm-gray text-sm">{invitation.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(invitation.role)}`}>
                          {invitation.role.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                          PENDING
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-warm-gray">
                        <div>Invited: {formatDate(invitation.created_at)}</div>
                        <div>Expires: {formatDate(invitation.expires_at)}</div>
                      </div>
                      
                      <button
                        onClick={() => cancelInvitation(invitation.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-warm-gray/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-didot text-charcoal">Invite New Admin</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-warm-gray hover:text-charcoal transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleInviteAdmin} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newAdmin.first_name}
                      onChange={(e) => setNewAdmin({...newAdmin, first_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newAdmin.last_name}
                      onChange={(e) => setNewAdmin({...newAdmin, last_name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Role *
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="viewer">Viewer - Can view data only</option>
                    <option value="manager">Manager - Can manage specific areas</option>
                    <option value="admin">Admin - Full management access</option>
                    <option value="super_admin">Super Admin - Full system access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'can_manage_leads', label: 'Manage Leads' },
                      { key: 'can_manage_clients', label: 'Manage Clients' },
                      { key: 'can_manage_sessions', label: 'Manage Sessions' },
                      { key: 'can_manage_admins', label: 'Manage Admins' },
                      { key: 'can_view_analytics', label: 'View Analytics' }
                    ].map(permission => (
                      <label key={permission.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAdmin[permission.key as keyof typeof newAdmin] as boolean}
                          onChange={(e) => setNewAdmin({
                            ...newAdmin, 
                            [permission.key]: e.target.checked
                          })}
                          className="mr-2 text-gold focus:ring-gold"
                        />
                        <span className="text-sm text-charcoal">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-warm-gray/20">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-warm-gray hover:text-charcoal transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-2 bg-verde text-white rounded-lg hover:bg-verde/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}