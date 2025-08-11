'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PackageCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface CustomPackage {
  id: string;
  category_id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value?: number;
  discount_label?: string;
  discount_expires_at?: string;
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
  is_template: boolean;
  is_main_offer?: boolean;
  created_at: string;
  category?: PackageCategory;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<CustomPackage[]>([]);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPackage, setNewPackage] = useState({
    category_id: '',
    name: '',
    title: '',
    description: '',
    price: '',
    original_price: '',
    discount_type: '' as '' | 'percentage' | 'fixed',
    discount_value: '',
    discount_label: 'Limited Time Offer',
    discount_expires_at: '',
    sessions: '',
    locations: '',
    gallery: '',
    looks: '',
    delivery: '',
    video: '',
    turnaround: '',
    fine_art: '',
    highlights: [''],
    investment_note: '',
    theme_keywords: '',
    image_url: '',
    is_main_offer: false,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('package_categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load packages with category info
      const { data: packagesData, error: packagesError } = await supabase
        .from('custom_packages')
        .select(`
          *,
          category:package_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = selectedCategory === 'all' 
    ? packages 
    : packages.filter(pkg => pkg.category_id === selectedCategory);

  const resetForm = () => {
    setNewPackage({
      category_id: '',
      name: '',
      title: '',
      description: '',
      price: '',
      original_price: '',
      discount_type: '' as '' | 'percentage' | 'fixed',
      discount_value: '',
      discount_label: 'Limited Time Offer',
      discount_expires_at: '',
      sessions: '',
      locations: '',
      gallery: '',
      looks: '',
      delivery: '',
      video: '',
      turnaround: '',
      fine_art: '',
      highlights: [''],
      investment_note: '',
      theme_keywords: '',
      image_url: '',
      is_main_offer: false,
      is_active: true
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setNewPackage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHighlightChange = (index: number, value: string) => {
    const updatedHighlights = [...newPackage.highlights];
    updatedHighlights[index] = value;
    setNewPackage(prev => ({
      ...prev,
      highlights: updatedHighlights
    }));
  };

  const addHighlight = () => {
    setNewPackage(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const removeHighlight = (index: number) => {
    if (newPackage.highlights.length > 1) {
      const updatedHighlights = newPackage.highlights.filter((_, i) => i !== index);
      setNewPackage(prev => ({
        ...prev,
        highlights: updatedHighlights
      }));
    }
  };

  const savePackage = async () => {
    if (!newPackage.category_id || !newPackage.name || !newPackage.title || !newPackage.price) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const packageData = {
        ...newPackage,
        price: parseFloat(newPackage.price),
        original_price: newPackage.original_price ? parseFloat(newPackage.original_price) : null,
        discount_value: newPackage.discount_value ? parseFloat(newPackage.discount_value) : null,
        discount_type: newPackage.discount_type || null,
        discount_label: newPackage.discount_label || null,
        discount_expires_at: newPackage.discount_expires_at || null,
        highlights: newPackage.highlights.filter(h => h.trim() !== ''),
        // Remove empty optional fields
        sessions: newPackage.sessions || null,
        locations: newPackage.locations || null,
        gallery: newPackage.gallery || null,
        looks: newPackage.looks || null,
        delivery: newPackage.delivery || null,
        video: newPackage.video || null,
        turnaround: newPackage.turnaround || null,
        fine_art: newPackage.fine_art || null,
        investment_note: newPackage.investment_note || null,
        theme_keywords: newPackage.theme_keywords || null,
        image_url: newPackage.image_url || null
      };

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      });

      if (!response.ok) {
        throw new Error('Failed to create package');
      }

      // Reload data and close modal
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error creating package. Please try again.');
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
          <div className="text-charcoal text-xl mb-4">Loading packages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-light text-charcoal tracking-wide">
                Package Management
              </h1>
              <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
            </div>
            <p className="text-lg font-light text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
              Create and manage custom packages for your proposal system
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Category Filter */}
          <div className="flex-1">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-6 py-4 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Package Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
          >
            Create Package
          </button>
        </div>

        {/* Packages Grid */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-20">
            <div className="space-y-6">
              <div className="text-charcoal/60 text-xl font-light">
                No packages found
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
              >
                Create Your First Package
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredPackages.map((pkg) => (
              <div key={pkg.id} className="border border-charcoal/20 bg-white hover:shadow-lg transition-shadow duration-300">
                <div className="p-8 space-y-6">
                  {/* Package Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-light text-charcoal">{pkg.title}</h3>
                        {pkg.is_template && (
                          <span className="bg-verde/20 text-verde px-3 py-1 text-xs font-medium uppercase tracking-wide">
                            Template
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-charcoal/60">
                        <span>{pkg.category?.name}</span>
                        <span>•</span>
                        <span className="font-medium text-charcoal">{formatCurrency(pkg.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-charcoal/5 rounded transition-colors">
                        <svg className="w-5 h-5 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded transition-colors">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Package Description */}
                  <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                    {pkg.description.substring(0, 200)}
                    {pkg.description.length > 200 ? '...' : ''}
                  </p>

                  {/* Package Details */}
                  {(pkg.sessions || pkg.locations || pkg.gallery) && (
                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-charcoal/10">
                      {pkg.sessions && (
                        <div className="text-xs">
                          <span className="text-charcoal/60">Duration:</span>
                          <span className="ml-2 font-medium text-charcoal">{pkg.sessions}</span>
                        </div>
                      )}
                      {pkg.locations && (
                        <div className="text-xs">
                          <span className="text-charcoal/60">Locations:</span>
                          <span className="ml-2 font-medium text-charcoal">{pkg.locations}</span>
                        </div>
                      )}
                      {pkg.gallery && (
                        <div className="text-xs">
                          <span className="text-charcoal/60">Gallery:</span>
                          <span className="ml-2 font-medium text-charcoal">{pkg.gallery}</span>
                        </div>
                      )}
                      {pkg.delivery && (
                        <div className="text-xs">
                          <span className="text-charcoal/60">Delivery:</span>
                          <span className="ml-2 font-medium text-charcoal">{pkg.delivery}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Package Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-charcoal/10">
                    <div className={`px-3 py-1 text-xs uppercase tracking-wide ${
                      pkg.is_active 
                        ? 'bg-verde/20 text-verde' 
                        : 'bg-charcoal/20 text-charcoal/60'
                    }`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-xs text-charcoal/60">
                      Created {new Date(pkg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-charcoal">Create New Package</h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-charcoal/60 hover:text-charcoal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); savePackage(); }} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Category *</label>
                      <select
                        value={newPackage.category_id}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      >
                        <option value="">Select category...</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Price *</label>
                      <input
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Discount Section */}
                  <div className="space-y-6 pt-6 border-t border-charcoal/10">
                    <h3 className="text-lg font-light text-charcoal tracking-wide">Limited Time Offer (Optional)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-light text-charcoal/70 mb-2">Discount Type</label>
                        <select
                          value={newPackage.discount_type}
                          onChange={(e) => handleInputChange('discount_type', e.target.value)}
                          className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                        >
                          <option value="">No Discount</option>
                          <option value="percentage">Percentage Off</option>
                          <option value="fixed">Dollar Amount Off</option>
                        </select>
                      </div>

                      {newPackage.discount_type && (
                        <>
                          <div>
                            <label className="block text-sm font-light text-charcoal/70 mb-2">
                              {newPackage.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                            </label>
                            <input
                              type="number"
                              value={newPackage.discount_value}
                              onChange={(e) => handleInputChange('discount_value', e.target.value)}
                              placeholder={newPackage.discount_type === 'percentage' ? '10' : '100.00'}
                              step={newPackage.discount_type === 'percentage' ? '1' : '0.01'}
                              min="0"
                              max={newPackage.discount_type === 'percentage' ? '100' : undefined}
                              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-light text-charcoal/70 mb-2">Display Label</label>
                            <input
                              type="text"
                              value={newPackage.discount_label}
                              onChange={(e) => handleInputChange('discount_label', e.target.value)}
                              placeholder="Limited Time Offer"
                              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-light text-charcoal/70 mb-2">Expires On</label>
                            <input
                              type="date"
                              value={newPackage.discount_expires_at}
                              onChange={(e) => handleInputChange('discount_expires_at', e.target.value)}
                              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {newPackage.discount_type && newPackage.discount_value && (
                      <div className="bg-verde/10 border border-verde/20 px-4 py-3 rounded">
                        <p className="text-sm font-light text-charcoal/70">
                          <strong>Preview:</strong> Client will see "{newPackage.discount_label}" with{' '}
                          {newPackage.discount_type === 'percentage' 
                            ? `${newPackage.discount_value}% off` 
                            : `$${newPackage.discount_value} off`
                          }{' '}
                          {newPackage.discount_expires_at && `until ${new Date(newPackage.discount_expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-light text-charcoal/70 mb-2">Package Name *</label>
                    <input
                      type="text"
                      value={newPackage.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., ELEGANCE"
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light text-charcoal/70 mb-2">Package Title *</label>
                    <input
                      type="text"
                      value={newPackage.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., The Elegance"
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light text-charcoal/70 mb-2">Description *</label>
                    <textarea
                      value={newPackage.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Detailed description of this package..."
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Package Details */}
                <div className="space-y-6 pt-6 border-t border-charcoal/10">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Package Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Sessions</label>
                      <input
                        type="text"
                        value={newPackage.sessions}
                        onChange={(e) => handleInputChange('sessions', e.target.value)}
                        placeholder="e.g., 3 Hours"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Locations</label>
                      <input
                        type="text"
                        value={newPackage.locations}
                        onChange={(e) => handleInputChange('locations', e.target.value)}
                        placeholder="e.g., 3"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Gallery</label>
                      <input
                        type="text"
                        value={newPackage.gallery}
                        onChange={(e) => handleInputChange('gallery', e.target.value)}
                        placeholder="e.g., 40-60 Images"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Looks</label>
                      <input
                        type="text"
                        value={newPackage.looks}
                        onChange={(e) => handleInputChange('looks', e.target.value)}
                        placeholder="e.g., 3"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Delivery</label>
                      <input
                        type="text"
                        value={newPackage.delivery}
                        onChange={(e) => handleInputChange('delivery', e.target.value)}
                        placeholder="e.g., 10 Day Delivery"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Video</label>
                      <input
                        type="text"
                        value={newPackage.video}
                        onChange={(e) => handleInputChange('video', e.target.value)}
                        placeholder="e.g., 30 Second Highlight Reel"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Turnaround</label>
                      <input
                        type="text"
                        value={newPackage.turnaround}
                        onChange={(e) => handleInputChange('turnaround', e.target.value)}
                        placeholder="e.g., 48 Hour Sneak Peek"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Fine Art Credit</label>
                      <input
                        type="text"
                        value={newPackage.fine_art}
                        onChange={(e) => handleInputChange('fine_art', e.target.value)}
                        placeholder="e.g., $100 Fine Art Credit"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-6 pt-6 border-t border-charcoal/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-light text-charcoal tracking-wide">Highlights</h3>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="px-4 py-2 text-sm border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                    >
                      Add Highlight
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newPackage.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => handleHighlightChange(index, e.target.value)}
                          placeholder="e.g., Visual Themes: Power, Legacy, Radiance"
                          className="flex-1 px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                        />
                        {newPackage.highlights.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHighlight(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-6 pt-6 border-t border-charcoal/10">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Investment Note</label>
                      <input
                        type="text"
                        value={newPackage.investment_note}
                        onChange={(e) => handleInputChange('investment_note', e.target.value)}
                        placeholder="e.g., (Optional Studio Scene Included)"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-light text-charcoal/70 mb-2">Theme Keywords</label>
                      <input
                        type="text"
                        value={newPackage.theme_keywords}
                        onChange={(e) => handleInputChange('theme_keywords', e.target.value)}
                        placeholder="e.g., clean, powerful, timeless"
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-charcoal/70 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={newPackage.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_main_offer"
                      checked={newPackage.is_main_offer}
                      onChange={(e) => handleInputChange('is_main_offer', e.target.checked)}
                      className="w-4 h-4 text-charcoal border-charcoal/30 focus:ring-charcoal focus:ring-2"
                    />
                    <label htmlFor="is_main_offer" className="text-sm font-light text-charcoal/70">
                      Mark as Main Offer (featured package)
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-8 border-t border-charcoal/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-charcoal/30 text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-8 py-3 font-light tracking-wide uppercase transition-all duration-300 ${
                      saving
                        ? 'bg-charcoal/50 text-white cursor-not-allowed'
                        : 'bg-charcoal text-white hover:bg-charcoal/90'
                    }`}
                  >
                    {saving ? 'Creating...' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}