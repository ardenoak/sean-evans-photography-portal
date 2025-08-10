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
  event_date?: string;
  venue_location?: string;
  guest_count?: string;
  additional_services?: string[];
  [key: string]: any;
}

export default function ProfessionalEmbeddableForm({ params }: { params: Promise<{ formId: string }> }) {
  const resolvedParams = use(params);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormSubmission>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    session_type_interest: '',
    budget_range: '',
    preferred_timeline: '',
    lead_source: 'Website Form',
    message: '',
    event_date: '',
    venue_location: '',
    guest_count: '',
    additional_services: []
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const totalSteps = 3;

  // Hide Next.js development overlays
  useEffect(() => {
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const formConfig = {
    title: "Let's Create Something Beautiful Together",
    description: "Tell us about your vision and let's bring it to life.",
    styling: {
      primaryColor: '#2563eb', // Modern blue
      secondaryColor: '#f8fafc', // Light background
      accentColor: '#10b981', // Success green
      textColor: '#1e293b', // Dark slate
      mutedColor: '#64748b', // Muted text
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      additional_services: checked
        ? [...(prev.additional_services || []), service]
        : (prev.additional_services || []).filter(s => s !== service)
    }));
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.first_name.trim()) errors.first_name = 'First name is required';
      if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }
    }
    
    if (step === 2) {
      if (!formData.session_type_interest) errors.session_type_interest = 'Please select a session type';
      if (!formData.budget_range) errors.budget_range = 'Please select a budget range';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError('');

    try {
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

    } catch (error) {
      console.error('Form submission error:', error);
      setError('There was an error submitting your form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="h-full flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-xl border p-8">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: formConfig.styling.accentColor }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">
              Thank You!
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {formConfig.settings.thankYouMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-slate-900">
                  {formConfig.title}
                </h1>
                <span className="text-sm text-slate-500">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${(currentStep / totalSteps) * 100}%`,
                    backgroundColor: formConfig.styling.primaryColor 
                  }}
                />
              </div>
              <p className="text-slate-600 mt-4">{formConfig.description}</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-8">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                            validationErrors.first_name 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                          placeholder="Enter your first name"
                        />
                        {validationErrors.first_name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                            validationErrors.last_name 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                          placeholder="Enter your last name"
                        />
                        {validationErrors.last_name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                          validationErrors.email 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                        placeholder="your@email.com"
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Session Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Details</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        What type of session are you interested in? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['Editorial Portrait', 'Branding Session', 'Headshots', 'Creative Portrait', 'Wedding', 'Event', 'Other'].map((type) => (
                          <label key={type} className="relative">
                            <input
                              type="radio"
                              name="session_type_interest"
                              value={type}
                              checked={formData.session_type_interest === type}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.session_type_interest === type
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}>
                              <span className="font-medium">{type}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {validationErrors.session_type_interest && (
                        <p className="mt-2 text-sm text-red-600">{validationErrors.session_type_interest}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Budget Range *
                        </label>
                        <select
                          name="budget_range"
                          value={formData.budget_range}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                            validationErrors.budget_range 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Select budget...</option>
                          <option value="Under $1,000">Under $1,000</option>
                          <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                          <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                          <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                          <option value="$10,000+">$10,000+</option>
                          <option value="Let's discuss">Let's discuss</option>
                        </select>
                        {validationErrors.budget_range && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.budget_range}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Timeline
                        </label>
                        <select
                          name="preferred_timeline"
                          value={formData.preferred_timeline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="">When...</option>
                          <option value="ASAP">ASAP</option>
                          <option value="Within 1 month">Within 1 month</option>
                          <option value="1-3 months">1-3 months</option>
                          <option value="3-6 months">3-6 months</option>
                          <option value="6+ months">6+ months</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Tell Us More</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        How did you hear about us?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Instagram', 'Google', 'Website', 'Referral', 'Wedding Wire', 'Other'].map((source) => (
                          <label key={source} className="flex items-center">
                            <input
                              type="radio"
                              name="lead_source"
                              value={source}
                              checked={formData.lead_source === source}
                              onChange={handleInputChange}
                              className="mr-3 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{source}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tell us about your vision
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="Share your ideas, inspiration, or any specific details about your vision..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      currentStep === 1
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    ← Previous
                  </button>

                  <div className="flex space-x-2">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i + 1 <= currentStep ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}