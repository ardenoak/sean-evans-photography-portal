'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<Partial<ClientProfile>>({});
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserProfile();
    }
  }, [user, authLoading, router]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Loading profile for user:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile query result:', { profileData, profileError });

      if (profileError) {
        console.error('Error loading profile:', profileError);
        
        // If no profile exists, create one from user metadata using upsert
        if (profileError.code === 'PGRST116') {
          console.log('No profile found, creating one with upsert...');
          const { data: newProfile, error: createError } = await supabase
            .from('clients')
            .upsert({
              user_id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || 'User',
              last_name: user.user_metadata?.last_name || '',
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating/updating profile:', createError);
          } else {
            console.log('Profile created/updated:', newProfile);
            setProfile(newProfile);
            setFormData(newProfile);
          }
        }
      } else if (profileData) {
        setProfile(profileData);
        setFormData(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        })
        .eq('id', profile.id);

      if (error) {
        setMessage('Error updating profile. Please try again.');
        console.error('Update error:', error);
      } else {
        setMessage('Profile updated successfully!');
        setProfile({ ...profile, ...formData });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
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
          <p className="text-warm-gray">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-gray">Profile not found</p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors flex items-center space-x-2 group"
                title="Back to Dashboard"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">←</span>
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </button>
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <Image
                src="/tally-logo.png"
                alt="Tally Photography Management"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto cursor-pointer"
                onClick={() => router.push('/dashboard')}
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-warm-gray text-sm hidden sm:inline">
                Welcome back, {profile.first_name}
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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-8 pt-6 pb-2">
        <div className="flex items-center text-sm text-warm-gray space-x-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="hover:text-charcoal transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-charcoal font-medium">Profile Settings</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-charcoal to-charcoal/90 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-didot">Profile Settings</h1>
                <p className="text-white/80">Update your personal information</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-sm ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-charcoal">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg bg-gray-50 text-gray-500"
                    placeholder="Email address"
                  />
                  <p className="text-xs text-warm-gray mt-1">
                    Email changes require admin assistance for security
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-charcoal">Address Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    placeholder="Charleston"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                      placeholder="SC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip || ''}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                      placeholder="29401"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-warm-gray/20 flex justify-end space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-warm-gray/30 text-warm-gray rounded-lg hover:text-charcoal hover:border-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white rounded-lg hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}