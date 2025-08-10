'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

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
}

export default function ContactPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormSubmission>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    session_type_interest: '',
    budget_range: '',
    preferred_timeline: '',
    lead_source: 'Website Contact',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
        lead_source: formData.lead_source || 'Website Contact',
        message: formData.message || null,
        status: 'new',
        priority: 'medium'
      };

      const { error: insertError } = await supabase
        .from('leads')
        .insert([leadData]);

      if (insertError) {
        console.error('Error creating lead:', insertError);
        setError('There was an error submitting your inquiry. Please try again.');
        return;
      }

      setSubmitted(true);

    } catch (error) {
      console.error('Form submission error:', error);
      setError('There was an error submitting your inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-xl border border-warm-gray/20 p-8">
          <div className="mb-6">
            <Image
              src="/sean-evans-logo.png"
              alt="Sean Evans Photography"
              width={200}
              height={80}
              className="h-16 w-auto mx-auto mb-6"
              priority
            />
          </div>
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-verde">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-didot font-bold mb-4 text-charcoal">
            Thank You!
          </h2>
          <p className="text-warm-gray leading-relaxed mb-6">
            Your inquiry has been received. We'll be in touch within 24 hours to discuss your vision and next steps.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gold text-white rounded-lg font-medium hover:bg-gold/90 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <Image
              src="/sean-evans-logo.png"
              alt="Sean Evans Photography"
              width={300}
              height={120}
              className="h-20 md:h-24 w-auto mx-auto mb-6"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-didot font-bold text-charcoal mb-4">
            Let's Create Something Beautiful Together
          </h1>
          <p className="text-xl text-warm-gray max-w-2xl mx-auto">
            Tell us about your vision and let's bring it to life through editorial portrait artistry.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-didot font-semibold text-charcoal">
                {currentStep === 1 && "Contact Information"}
                {currentStep === 2 && "Session Details"}  
                {currentStep === 3 && "Tell Us More"}
              </h2>
              <span className="text-sm text-warm-gray bg-white px-4 py-2 rounded-full shadow-sm border border-warm-gray/20">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-warm-gray/20 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500 ease-in-out bg-gold"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-warm-gray/20 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="p-8">
              {/* Step 1: Contact Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-didot font-semibold text-charcoal mb-6">Let's start with the basics</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg ${
                          validationErrors.first_name 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-warm-gray/30 focus:ring-gold'
                        }`}
                        placeholder="Your first name"
                      />
                      {validationErrors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg ${
                          validationErrors.last_name 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-warm-gray/30 focus:ring-gold'
                        }`}
                        placeholder="Your last name"
                      />
                      {validationErrors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg ${
                        validationErrors.email 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-warm-gray/30 focus:ring-gold'
                      }`}
                      placeholder="your@email.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-lg"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Session Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-didot font-semibold text-charcoal mb-6">Tell us about your session</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-4">
                      What type of session interests you? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['Editorial Portrait', 'Branding Session', 'Headshots', 'Creative Portrait', 'Wedding', 'Event'].map((type) => (
                        <label key={type} className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="session_type_interest"
                            value={type}
                            checked={formData.session_type_interest === type}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-lg transition-all text-center ${
                            formData.session_type_interest === type
                              ? 'border-gold bg-gold/10 text-charcoal'
                              : 'border-warm-gray/30 hover:border-warm-gray/50 hover:bg-ivory/50 text-charcoal'
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Investment Range *
                      </label>
                      <select
                        name="budget_range"
                        value={formData.budget_range}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg ${
                          validationErrors.budget_range 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-warm-gray/30 focus:ring-gold'
                        }`}
                      >
                        <option value="">Select investment range...</option>
                        <option value="$500 - $1,000">$500 - $1,000</option>
                        <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                        <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                        <option value="$5,000 - $7,500">$5,000 - $7,500</option>
                        <option value="Let's discuss">Let's discuss</option>
                      </select>
                      {validationErrors.budget_range && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.budget_range}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Preferred Timeline
                      </label>
                      <select
                        name="preferred_timeline"
                        value={formData.preferred_timeline}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-lg"
                      >
                        <option value="">When would you like to shoot?</option>
                        <option value="Within 2 weeks">Within 2 weeks</option>
                        <option value="Within 1 month">Within 1 month</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Just exploring">Just exploring</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-didot font-semibold text-charcoal mb-6">Almost done! Just a few more details</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-4">
                      How did you find us?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {['Instagram', 'Google', 'Referral', 'Website', 'Wedding Wire', 'Other'].map((source) => (
                        <label key={source} className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="lead_source"
                            value={source}
                            checked={formData.lead_source === source}
                            onChange={handleInputChange}
                            className="mr-3 text-gold focus:ring-gold"
                          />
                          <span className="text-charcoal">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Tell us about your vision
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Share your ideas, inspiration, style preferences, or any questions you have. The more details you provide, the better we can prepare for our conversation."
                      className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-colors resize-none text-lg"
                    />
                    <p className="mt-2 text-sm text-warm-gray">This helps us prepare a personalized consultation for you</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-10 flex items-center justify-between pt-8 border-t border-warm-gray/20">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentStep === 1
                      ? 'text-warm-gray/50 cursor-not-allowed'
                      : 'text-warm-gray hover:text-charcoal hover:bg-ivory/50'
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex space-x-2">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i + 1 <= currentStep ? 'bg-gold' : 'bg-warm-gray/30'
                      }`}
                    />
                  ))}
                </div>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 bg-gold text-white rounded-lg font-semibold hover:bg-gold/90 transition-colors"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-verde text-white rounded-lg font-semibold hover:bg-verde/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Inquiry'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}