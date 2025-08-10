'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed AdminAuth - direct access

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

interface FormConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  fields: FormField[];
  styling: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  settings: {
    redirectUrl?: string;
    thankYouMessage: string;
    emailNotifications: boolean;
  };
}

const defaultFormConfig: FormConfig = {
  id: '',
  name: 'Contact Form',
  title: 'Let\'s Create Something Beautiful Together',
  description: 'Tell us about your vision and let\'s bring it to life.',
  fields: [
    { id: '1', type: 'text', label: 'First Name', name: 'first_name', required: true },
    { id: '2', type: 'text', label: 'Last Name', name: 'last_name', required: true },
    { id: '3', type: 'email', label: 'Email Address', name: 'email', required: true },
    { id: '4', type: 'phone', label: 'Phone Number', name: 'phone', required: false },
    { 
      id: '5', 
      type: 'select', 
      label: 'Session Type Interest', 
      name: 'session_type_interest', 
      required: false,
      options: ['Editorial Portrait', 'Branding Session', 'Headshots', 'Creative Portrait', 'Other']
    },
    { 
      id: '6', 
      type: 'select', 
      label: 'Budget Range', 
      name: 'budget_range', 
      required: false,
      options: ['Under $1,000', '$1,000 - $2,000', '$2,000 - $3,000', '$3,000 - $5,000', '$5,000+', 'Let\'s discuss']
    },
    { 
      id: '7', 
      type: 'select', 
      label: 'Timeline', 
      name: 'preferred_timeline', 
      required: false,
      options: ['ASAP', 'Within 1 month', '1-3 months', '3-6 months', 'Flexible']
    },
    { 
      id: '8', 
      type: 'radio', 
      label: 'How did you hear about us?', 
      name: 'lead_source', 
      required: false,
      options: ['Instagram', 'Website', 'Google Search', 'Referral', 'Other']
    },
    { id: '9', type: 'textarea', label: 'Tell us about your vision', name: 'message', required: false, placeholder: 'Describe your project, style preferences, or any specific ideas you have in mind...' }
  ],
  styling: {
    primaryColor: '#D4AF37', // gold
    backgroundColor: '#FFFEF7', // ivory
    textColor: '#2C2C2C', // charcoal
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  settings: {
    thankYouMessage: 'Thank you for your inquiry! We\'ll be in touch within 24 hours to discuss your vision.',
    emailNotifications: true
  }
};

export default function AdminFormsPage() {
  const { user, loading: false, true } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
        }
  }, [ router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
        <p className="text-warm-gray">Opening contact form...</p>
      </div>
    </div>
  );
}