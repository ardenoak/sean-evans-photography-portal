'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_type_interest?: string;
  budget_range?: string;
  message?: string;
}

interface PackageCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface CustomPackage {
  id: string;
  category_id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  sessions?: string;
  locations?: string;
  gallery?: string;
  looks?: string;
  delivery?: string;
  video?: string;
  turnaround?: string;
  fine_art?: string;
  highlights: string[];
  investment_note?: string;
  theme_keywords?: string;
  image_url?: string;
  is_active: boolean;
  category?: PackageCategory;
}

interface SelectedPackage {
  package: CustomPackage;
  quantity: number;
}

export default function CreateProposalPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [packages, setPackages] = useState<CustomPackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadData();
    }
  }, [leadId]);

  const loadData = async () => {
    try {
      // Load lead info
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error loading lead:', leadError);
        // Don't throw, just return to prevent further errors
        setLoading(false);
        return;
      }
      
      if (!leadData) {
        console.error('No lead found with ID:', leadId);
        setLoading(false);
        return;
      }
      
      setLead(leadData);
      setProposalTitle(`Custom Proposal - ${leadData.first_name} ${leadData.last_name}`);

      // Load categories (handle table might not exist)
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('package_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (categoriesError) {
          console.warn('Categories table not available:', categoriesError);
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
        }
      } catch (e) {
        console.warn('Categories table not accessible:', e);
        setCategories([]);
      }

      // Load packages (handle table might not exist)
      try {
        const { data: packagesData, error: packagesError } = await supabase
          .from('custom_packages')
          .select(`
            *,
            category:package_categories(*)
          `)
          .eq('is_active', true)
          .order('created_at');

        if (packagesError) {
          console.warn('Packages table not available:', packagesError);
          setPackages([]);
        } else {
          setPackages(packagesData || []);
        }
      } catch (e) {
        console.warn('Packages table not accessible:', e);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = (pkg: CustomPackage) => {
    const existingIndex = selectedPackages.findIndex(sp => sp.package.id === pkg.id);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedPackages(selectedPackages.filter((_, index) => index !== existingIndex));
    } else {
      // Add with quantity 1
      setSelectedPackages([...selectedPackages, { package: pkg, quantity: 1 }]);
    }
  };

  const updateQuantity = (packageId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    setSelectedPackages(selectedPackages.map(sp => 
      sp.package.id === packageId 
        ? { ...sp, quantity } 
        : sp
    ));
  };

  const calculateTotal = () => {
    return selectedPackages.reduce((total, sp) => {
      return total + (sp.package.price * sp.quantity);
    }, 0);
  };

  const saveProposal = async () => {
    if (!lead || selectedPackages.length === 0) return;

    setSaving(true);
    try {
      const total = calculateTotal();

      // Create proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          lead_id: leadId,
          title: proposalTitle,
          status: 'draft',
          client_name: `${lead.first_name} ${lead.last_name}`,
          client_email: lead.email,
          custom_message: customMessage,
          subtotal: total,
          total_amount: total
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Add selected packages to proposal
      const proposalPackages = selectedPackages.map(sp => ({
        proposal_id: proposalData.id,
        package_id: sp.package.id,
        package_snapshot: sp.package,
        quantity: sp.quantity,
        unit_price: sp.package.price,
        total_price: sp.package.price * sp.quantity
      }));

      const { error: packagesError } = await supabase
        .from('proposal_packages')
        .insert(proposalPackages);

      if (packagesError) throw packagesError;

      // Redirect back to leads with success
      router.push('/admin/leads?proposal_created=true');
    } catch (error) {
      console.error('Error saving proposal:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading proposal builder...</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Lead not found</div>
          <button 
            onClick={() => router.push('/admin/leads')}
            className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  // If no packages are available, show setup message
  if (packages.length === 0 || categories.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="text-charcoal text-xl mb-4">Database Setup Required</div>
          <p className="text-charcoal/70 mb-6">
            The proposal system requires database tables to be created. Please run the migration scripts in your Supabase dashboard.
          </p>
          <div className="space-y-4">
            <div className="bg-white border border-charcoal/20 p-6 rounded-lg text-left">
              <h3 className="font-medium text-charcoal mb-2">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-charcoal/70">
                <li>Go to <a href="https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new" target="_blank" className="text-blue-600 underline">Supabase SQL Editor</a></li>
                <li>Copy and paste contents of <code>scripts/create-proposal-system.sql</code></li>
                <li>Click "Run" to create the tables</li>
                <li>Copy and paste contents of <code>scripts/add-discount-fields.sql</code></li>
                <li>Click "Run" to add discount functionality</li>
              </ol>
            </div>
            <div className="flex space-x-4 justify-center">
              <button 
                onClick={() => router.push('/admin/leads')}
                className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
              >
                Back to Leads
              </button>
              <button 
                onClick={() => router.push('/admin/db-status')}
                className="px-6 py-3 border border-charcoal/30 text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
              >
                Check Database Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const packagesByCategory = categories.map(category => ({
    ...category,
    packages: packages.filter(pkg => pkg.category_id === category.id)
  }));

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-light text-charcoal tracking-wide">
                Custom Proposal Builder
              </h1>
              <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-light text-charcoal/70 leading-relaxed">
                Creating proposal for <span className="font-medium text-charcoal">{lead.first_name} {lead.last_name}</span>
              </p>
              <p className="text-sm font-light text-charcoal/60">
                {lead.email} {lead.phone && `• ${lead.phone}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Package Selection */}
          <div className="lg:col-span-2 space-y-12">
            {/* Proposal Details */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light text-charcoal tracking-wide">Proposal Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-charcoal/70 mb-2">Proposal Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                    placeholder="Enter proposal title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-light text-charcoal/70 mb-2">Custom Message</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors resize-none"
                    placeholder="Add a personalized message for this client..."
                  />
                </div>
              </div>
            </div>

            {/* Package Categories */}
            {packagesByCategory.map(category => (
              <div key={category.id} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-charcoal tracking-wide">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm font-light text-charcoal/60">{category.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {category.packages.map(pkg => {
                    const isSelected = selectedPackages.some(sp => sp.package.id === pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        className={`border cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'border-charcoal/50 bg-white shadow-lg' 
                            : 'border-charcoal/20 hover:border-charcoal/40 bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1" onClick={() => togglePackage(pkg)}>
                              <div className="flex items-start gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center mt-1 ${
                                  isSelected 
                                    ? 'border-charcoal bg-charcoal' 
                                    : 'border-charcoal/40 hover:border-charcoal/60'
                                }`}>
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h3 className="text-lg font-light text-charcoal">{pkg.title}</h3>
                                    <div className="text-xl font-light text-charcoal">{formatCurrency(pkg.price)}</div>
                                  </div>
                                  <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                                    {pkg.description.substring(0, 150)}
                                    {pkg.description.length > 150 ? '...' : ''}
                                  </p>
                                  {(pkg.sessions || pkg.locations || pkg.gallery) && (
                                    <div className="flex items-center gap-6 text-xs text-charcoal/60">
                                      {pkg.sessions && <span>Duration: {pkg.sessions}</span>}
                                      {pkg.locations && <span>Locations: {pkg.locations}</span>}
                                      {pkg.gallery && <span>Gallery: {pkg.gallery}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-4 flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(pkg.id, selectedPackages.find(sp => sp.package.id === pkg.id)!.quantity - 1)}
                                  className="w-8 h-8 border border-charcoal/30 bg-white text-charcoal hover:bg-charcoal hover:text-white transition-colors flex items-center justify-center"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-charcoal font-medium">
                                  {selectedPackages.find(sp => sp.package.id === pkg.id)?.quantity || 0}
                                </span>
                                <button
                                  onClick={() => updateQuantity(pkg.id, selectedPackages.find(sp => sp.package.id === pkg.id)!.quantity + 1)}
                                  className="w-8 h-8 border border-charcoal/30 bg-white text-charcoal hover:bg-charcoal hover:text-white transition-colors flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Proposal Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="border border-charcoal/20 bg-white">
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-light text-charcoal tracking-wide">Proposal Summary</h3>
                    <div className="w-12 h-px bg-charcoal/30"></div>
                  </div>

                  {selectedPackages.length === 0 ? (
                    <p className="text-sm text-charcoal/60 font-light">Select packages to build your proposal</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Selected Packages */}
                      <div className="space-y-4">
                        {selectedPackages.map((sp, index) => (
                          <div key={index} className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-light text-charcoal text-sm">{sp.package.title}</div>
                              {sp.quantity > 1 && (
                                <div className="text-xs text-charcoal/60">Qty: {sp.quantity}</div>
                              )}
                            </div>
                            <div className="text-sm font-light text-charcoal">
                              {formatCurrency(sp.package.price * sp.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="pt-4 border-t border-charcoal/20">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-light text-charcoal">Total</div>
                          <div className="text-2xl font-light text-charcoal">
                            {formatCurrency(calculateTotal())}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-8 border-t border-charcoal/20">
                    <button
                      onClick={saveProposal}
                      disabled={selectedPackages.length === 0 || saving}
                      className={`w-full py-4 px-6 text-sm font-light tracking-wide uppercase transition-all duration-300 ${
                        selectedPackages.length > 0 && !saving
                          ? 'bg-charcoal text-white hover:bg-charcoal/90'
                          : 'bg-charcoal/30 text-charcoal/60 cursor-not-allowed'
                      }`}
                    >
                      {saving ? 'Creating Proposal...' : 'Create Proposal'}
                    </button>
                    <button
                      onClick={() => router.push('/admin/leads')}
                      className="w-full py-4 px-6 border border-charcoal/30 text-charcoal text-sm font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}