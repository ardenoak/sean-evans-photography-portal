'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FormSubmission {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_type_interest?: string;
  budget_range?: string;
  preferred_timeline?: string;
  lead_source?: string;
  message?: string;
  [key: string]: any;
}

export default function EmbeddableForm({ params }: { params: { formId: string } }) {
  const [formData, setFormData] = useState<FormSubmission>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    session_type_interest: '',
    budget_range: '',
    preferred_timeline: '',
    lead_source: 'Website Form',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // This would typically load form configuration from database
  // For now, using default configuration
  const formConfig = {
    title: "Let's Create Something Beautiful Together",
    description: "Tell us about your vision and let's bring it to life.",
    styling: {
      primaryColor: '#D4AF37',
      backgroundColor: '#FFFEF7',
      textColor: '#2C2C2C',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    settings: {
      thankYouMessage: "Thank you for your inquiry! We'll be in touch within 24 hours to discuss your vision."
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create lead in database
      const leadData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        session_type_interest: formData.session_type_interest || null,
        budget_range: formData.budget_range || null,
        preferred_timeline: formData.preferred_timeline || null,
        lead_source: formData.lead_source || 'Website Form',
        message: formData.message || null,
        status: 'new',
        priority: 'medium'
      };

      const { error: insertError } = await supabase
        .from('leads')
        .insert([leadData]);

      if (insertError) {
        console.error('Error creating lead:', insertError);
        setError('There was an error submitting your form. Please try again.');
        return;
      }

      setSubmitted(true);

      // Optional: Send email notification
      if (formConfig.settings) {
        try {
          await fetch('/api/forms/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData: leadData })
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          // Don't show error to user since form submission succeeded
        }
      }

    } catch (error) {
      console.error('Form submission error:', error);
      setError('There was an error submitting your form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ 
          backgroundColor: formConfig.styling.backgroundColor,
          fontFamily: formConfig.styling.fontFamily 
        }}
      >
        <div className="max-w-md w-full text-center">
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: formConfig.styling.primaryColor }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: formConfig.styling.textColor }}>
            Thank You!
          </h2>
          <p className="text-lg opacity-80" style={{ color: formConfig.styling.textColor }}>
            {formConfig.settings.thankYouMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: formConfig.styling.backgroundColor,
        fontFamily: formConfig.styling.fontFamily 
      }}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4" style={{ color: formConfig.styling.textColor }}>
              {formConfig.title}
            </h1>
            <p className="text-lg opacity-80" style={{ color: formConfig.styling.textColor }}>
              {formConfig.description}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                  Session Type Interest
                </label>
                <select
                  name="session_type_interest"
                  value={formData.session_type_interest}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                >
                  <option value="">Select a session type...</option>
                  <option value="Editorial Portrait">Editorial Portrait</option>
                  <option value="Branding Session">Branding Session</option>
                  <option value="Headshots">Headshots</option>
                  <option value="Creative Portrait">Creative Portrait</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                  Budget Range
                </label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                >
                  <option value="">Select budget range...</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $2,000">$1,000 - $2,000</option>
                  <option value="$2,000 - $3,000">$2,000 - $3,000</option>
                  <option value="$3,000 - $5,000">$3,000 - $5,000</option>
                  <option value="$5,000+">$5,000+</option>
                  <option value="Let's discuss">Let's discuss</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                Timeline
              </label>
              <select
                name="preferred_timeline"
                value={formData.preferred_timeline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
              >
                <option value="">Select timeline...</option>
                <option value="ASAP">ASAP</option>
                <option value="Within 1 month">Within 1 month</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: formConfig.styling.textColor }}>
                How did you hear about us?
              </label>
              <div className="space-y-2">
                {['Instagram', 'Website', 'Google Search', 'Referral', 'Other'].map((source) => (
                  <label key={source} className="flex items-center">
                    <input
                      type="radio"
                      name="lead_source"
                      value={source}
                      checked={formData.lead_source === source}
                      onChange={handleRadioChange}
                      className="mr-3 text-4 focus:ring-2"
                      style={{ 
                        accentColor: formConfig.styling.primaryColor,
                        '--tw-ring-color': formConfig.styling.primaryColor
                      } as React.CSSProperties}
                    />
                    <span style={{ color: formConfig.styling.textColor }}>{source}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                Tell us about your vision
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                placeholder="Describe your project, style preferences, or any specific ideas you have in mind..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors resize-none"
                style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-8 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: formConfig.styling.primaryColor }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}