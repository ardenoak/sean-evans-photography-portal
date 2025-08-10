'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

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
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'design' | 'settings' | 'embed'>('fields');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }
  }, [user, isAdmin, authLoading, router]);

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      name: 'new_field',
      required: false
    };
    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, newField]
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  };

  const removeField = (fieldId: string) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.filter(field => field.id !== fieldId)
    });
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = formConfig.fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formConfig.fields.length) return;
    
    const newFields = [...formConfig.fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    
    setFormConfig({
      ...formConfig,
      fields: newFields
    });
  };

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<iframe src="${baseUrl}/forms/embed/${formConfig.id || 'preview'}" width="100%" height="800" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading form builder...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors flex items-center space-x-2 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">←</span>
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </button>
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto cursor-pointer"
                onClick={() => router.push('/admin/dashboard')}
                priority
              />
              <div className="h-8 w-px bg-warm-gray/30"></div>
              <div>
                <h1 className="text-xl font-didot text-charcoal">Form Builder</h1>
                <p className="text-sm text-warm-gray">Create embeddable contact forms</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
              <span className="text-warm-gray text-sm hidden sm:inline">
                Welcome, {user?.email?.split('@')[0]}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {!previewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Builder */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-warm-gray/20">
                <h2 className="text-xl font-didot text-charcoal mb-4">Form Configuration</h2>
                
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: 'fields', label: 'Fields' },
                    { id: 'design', label: 'Design' },
                    { id: 'settings', label: 'Settings' },
                    { id: 'embed', label: 'Embed Code' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-charcoal shadow-sm'
                          : 'text-warm-gray hover:text-charcoal'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {activeTab === 'fields' && (
                  <div className="space-y-4">
                    {/* Form Title & Description */}
                    <div className="space-y-4 mb-6 p-4 bg-ivory/50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Form Title</label>
                        <input
                          type="text"
                          value={formConfig.title}
                          onChange={(e) => setFormConfig({...formConfig, title: e.target.value})}
                          className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
                        <textarea
                          value={formConfig.description}
                          onChange={(e) => setFormConfig({...formConfig, description: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Fields List */}
                    <div className="space-y-3">
                      {formConfig.fields.map((field, index) => (
                        <div key={field.id} className="border border-warm-gray/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-warm-gray">#{index + 1}</span>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="font-medium text-charcoal bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => moveField(field.id, 'up')}
                                disabled={index === 0}
                                className="text-warm-gray hover:text-charcoal disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveField(field.id, 'down')}
                                disabled={index === formConfig.fields.length - 1}
                                className="text-warm-gray hover:text-charcoal disabled:opacity-30"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => removeField(field.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-warm-gray mb-1">Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                className="w-full px-2 py-1 text-sm border border-warm-gray/30 rounded focus:ring-1 focus:ring-gold"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="textarea">Textarea</option>
                                <option value="select">Dropdown</option>
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Checkbox</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-warm-gray mb-1">Field Name</label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateField(field.id, { name: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-warm-gray/30 rounded focus:ring-1 focus:ring-gold"
                              />
                            </div>
                          </div>

                          {(field.type === 'select' || field.type === 'radio') && (
                            <div className="mt-3">
                              <label className="block text-xs text-warm-gray mb-1">Options (one per line)</label>
                              <textarea
                                value={field.options?.join('\n') || ''}
                                onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                                rows={3}
                                className="w-full px-2 py-1 text-sm border border-warm-gray/30 rounded focus:ring-1 focus:ring-gold"
                              />
                            </div>
                          )}

                          <div className="mt-3 flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="mr-2 text-gold focus:ring-gold"
                              />
                              <span className="text-xs text-warm-gray">Required</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addField}
                      className="w-full bg-gold text-white py-3 rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      + Add Field
                    </button>
                  </div>
                )}

                {activeTab === 'design' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Primary Color</label>
                      <input
                        type="color"
                        value={formConfig.styling.primaryColor}
                        onChange={(e) => setFormConfig({
                          ...formConfig,
                          styling: { ...formConfig.styling, primaryColor: e.target.value }
                        })}
                        className="w-full h-12 rounded-lg border border-warm-gray/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Background Color</label>
                      <input
                        type="color"
                        value={formConfig.styling.backgroundColor}
                        onChange={(e) => setFormConfig({
                          ...formConfig,
                          styling: { ...formConfig.styling, backgroundColor: e.target.value }
                        })}
                        className="w-full h-12 rounded-lg border border-warm-gray/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Text Color</label>
                      <input
                        type="color"
                        value={formConfig.styling.textColor}
                        onChange={(e) => setFormConfig({
                          ...formConfig,
                          styling: { ...formConfig.styling, textColor: e.target.value }
                        })}
                        className="w-full h-12 rounded-lg border border-warm-gray/30"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Thank You Message</label>
                      <textarea
                        value={formConfig.settings.thankYouMessage}
                        onChange={(e) => setFormConfig({
                          ...formConfig,
                          settings: { ...formConfig.settings, thankYouMessage: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Redirect URL (optional)</label>
                      <input
                        type="url"
                        value={formConfig.settings.redirectUrl || ''}
                        onChange={(e) => setFormConfig({
                          ...formConfig,
                          settings: { ...formConfig.settings, redirectUrl: e.target.value }
                        })}
                        placeholder="https://your-website.com/thank-you"
                        className="w-full px-3 py-2 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formConfig.settings.emailNotifications}
                          onChange={(e) => setFormConfig({
                            ...formConfig,
                            settings: { ...formConfig.settings, emailNotifications: e.target.checked }
                          })}
                          className="mr-3 text-gold focus:ring-gold"
                        />
                        <span className="text-sm text-charcoal">Send email notifications for new submissions</span>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'embed' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Embed Code</label>
                      <p className="text-sm text-warm-gray mb-3">Copy this code to embed the form in your website:</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                        <code>{generateEmbedCode()}</code>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
                        className="mt-3 bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Usage Instructions:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Paste this code into your HTML where you want the form to appear</li>
                        <li>• The form will automatically match your design settings</li>
                        <li>• Submissions will create leads in your admin panel</li>
                        <li>• Adjust width and height as needed for your layout</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-warm-gray/20">
                <h2 className="text-xl font-didot text-charcoal">Live Preview</h2>
                <p className="text-sm text-warm-gray">See how your form will look</p>
              </div>
              <div className="p-6">
                <FormPreview config={formConfig} />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <FormPreview config={formConfig} />
          </div>
        )}
      </div>
    </div>
  );
}

// Form Preview Component
function FormPreview({ config }: { config: FormConfig }) {
  return (
    <div 
      className="rounded-xl p-8 shadow-lg"
      style={{ 
        backgroundColor: config.styling.backgroundColor,
        color: config.styling.textColor,
        fontFamily: config.styling.fontFamily
      }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: config.styling.textColor }}>
          {config.title}
        </h2>
        <p className="opacity-80">{config.description}</p>
      </div>

      <form className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
              <input
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': config.styling.primaryColor,
                  borderColor: '#d1d5db'
                } as React.CSSProperties}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': config.styling.primaryColor,
                  borderColor: '#d1d5db'
                } as React.CSSProperties}
              />
            ) : field.type === 'select' ? (
              <select
                required={field.required}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': config.styling.primaryColor,
                  borderColor: '#d1d5db'
                } as React.CSSProperties}
              >
                <option value="">Select an option...</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name={field.name}
                      value={option}
                      required={field.required}
                      className="mr-3"
                      style={{ accentColor: config.styling.primaryColor }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-4 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: config.styling.primaryColor }}
        >
          Send Message
        </button>
      </form>
    </div>
  );
}