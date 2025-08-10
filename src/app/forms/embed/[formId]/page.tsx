'use client';
import { useState, useEffect, use } from 'react';
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

export default function EmbeddableForm({ params }: { params: Promise<{ formId: string }> }) {
  const resolvedParams = use(params);
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

  // Hide any Next.js development overlays or branding in iframe
  useEffect(() => {
    // Hide Next.js development indicators
    const style = document.createElement('style');
    style.textContent = `
      #__next-dev-tools, 
      #__next-build-watcher,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay] {
        display: none !important;
      }
      body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
        className="w-full h-screen overflow-hidden bg-transparent"
        style={{ 
          fontFamily: formConfig.styling.fontFamily 
        }}
      >
        <div className="h-full flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center"
              style={{ backgroundColor: formConfig.styling.primaryColor }}
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: formConfig.styling.textColor }}>
              Thank You!
            </h2>
            <p className="text-sm sm:text-lg opacity-80 leading-relaxed" style={{ color: formConfig.styling.textColor }}>
              {formConfig.settings.thankYouMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen overflow-hidden bg-transparent"
      style={{ 
        fontFamily: formConfig.styling.fontFamily 
      }}
    >
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-2 sm:p-4 py-4">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-8">
              <div className="mb-4 sm:mb-8 text-center">
                <h1 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4" style={{ color: formConfig.styling.textColor }}>
                  {formConfig.title}
                </h1>
                <p className="text-sm sm:text-lg opacity-80" style={{ color: formConfig.styling.textColor }}>
                  {formConfig.description}
                </p>
              </div>

              {error && (
                <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                      style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                      style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                      Session Type
                    </label>
                    <select
                      name="session_type_interest"
                      value={formData.session_type_interest}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                      style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                    >
                      <option value="">Select type...</option>
                      <option value="Editorial Portrait">Editorial</option>
                      <option value="Branding Session">Branding</option>
                      <option value="Headshots">Headshots</option>
                      <option value="Creative Portrait">Creative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                      Budget Range
                    </label>
                    <select
                      name="budget_range"
                      value={formData.budget_range}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                      style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                    >
                      <option value="">Budget...</option>
                      <option value="Under $1,000">Under $1K</option>
                      <option value="$1,000 - $2,000">$1K - $2K</option>
                      <option value="$2,000 - $3,000">$2K - $3K</option>
                      <option value="$3,000 - $5,000">$3K - $5K</option>
                      <option value="$5,000+">$5K+</option>
                      <option value="Let's discuss">Let's discuss</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                    Timeline
                  </label>
                  <select
                    name="preferred_timeline"
                    value={formData.preferred_timeline}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                  >
                    <option value="">When...</option>
                    <option value="ASAP">ASAP</option>
                    <option value="Within 1 month">Within 1 month</option>
                    <option value="1-3 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: formConfig.styling.textColor }}>
                    How did you hear about us?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Instagram', 'Website', 'Google', 'Referral', 'Other'].map((source) => (
                      <label key={source} className="flex items-center text-xs sm:text-sm">
                        <input
                          type="radio"
                          name="lead_source"
                          value={source}
                          checked={formData.lead_source === source}
                          onChange={handleRadioChange}
                          className="mr-2 focus:ring-2"
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
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: formConfig.styling.textColor }}>
                    Tell us about your vision
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe your project and style preferences..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors resize-none"
                    style={{ '--tw-ring-color': formConfig.styling.primaryColor } as React.CSSProperties}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-semibold text-white text-sm sm:text-base transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: formConfig.styling.primaryColor }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      </div>
    </div>
  );
}