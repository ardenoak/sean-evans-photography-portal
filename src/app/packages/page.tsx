'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authenticatedFetch, authenticatedPost } from '@/lib/auth-fetch';
import Logo from '@/components/Logo';
import TallyLayout from '@/components/TallyLayout';

interface CustomPackage {
  id: string;
  category_id?: string;
  package_type?: 'package' | 'enhancement' | 'motion';
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
}

interface Experience {
  id: string;
  title: string;
  status: string;
  client_name: string;
  custom_message: string;
  subtotal: number;
  total_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  created_at: string;
  category?: string; // We'll extract this from custom_message
}

// Helper function to extract package type from theme_keywords
const getPackageTypeFromThemeKeywords = (themeKeywords?: string): 'package' | 'enhancement' | 'motion' => {
  if (!themeKeywords) return 'package';
  const match = themeKeywords.match(/package_type:([^|]+)/);
  // Convert old 'experience' to new 'package'
  const type = match ? match[1] : 'package';
  return type === 'experience' ? 'package' : (type as 'package' | 'enhancement' | 'motion');
};

// Helper function to get clean theme keywords without package type
const getCleanThemeKeywords = (themeKeywords?: string): string => {
  if (!themeKeywords) return '';
  return themeKeywords.replace(/package_type:[^|]+\|?/, '').trim();
};

// Helper function to calculate experience total (only required items)
const calculateExperienceTotal = (
  selectedPackages: CustomPackage[],
  selectedEnhancements: {package: CustomPackage, required: boolean}[],
  selectedMotion: {package: CustomPackage, required: boolean}[]
): number => {
  let total = 0;
  
  // Always include all selected packages (these are customer options)
  if (selectedPackages.length > 0) {
    total += selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
  }
  
  // Only include required enhancements in base price
  const requiredEnhancements = selectedEnhancements.filter(item => item.required);
  if (requiredEnhancements.length > 0) {
    total += requiredEnhancements.reduce((sum, item) => sum + item.package.price, 0);
  }
  
  // Only include required motion in base price
  const requiredMotion = selectedMotion.filter(item => item.required);
  if (requiredMotion.length > 0) {
    total += requiredMotion.reduce((sum, item) => sum + item.package.price, 0);
  }
  
  return total;
};

// Helper function to apply discount to total
const calculateDiscountedPrice = (total: number, discount: { type: string; value: string }) => {
  if (!discount.type || !discount.value) return total;
  const discountValue = parseFloat(discount.value);
  if (discount.type === 'percentage') {
    return total * (1 - discountValue / 100);
  } else if (discount.type === 'fixed') {
    return Math.max(0, total - discountValue);
  }
  return total;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<CustomPackage[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all'); // 'all', 'standards', 'custom', 'experiences'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExperienceBuilder, setShowExperienceBuilder] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CustomPackage | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Experience Builder State
  const [selectedPackages, setSelectedPackages] = useState<CustomPackage[]>([]);
  const [selectedEnhancements, setSelectedEnhancements] = useState<{package: CustomPackage, required: boolean}[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<{package: CustomPackage, required: boolean}[]>([]);
  const [experienceTitle, setExperienceTitle] = useState('');
  const [experienceImageUrl, setExperienceImageUrl] = useState('');
  const [experienceType, setExperienceType] = useState<'standard' | 'custom'>('custom');
  const [experienceDiscount, setExperienceDiscount] = useState({ type: '', value: '', label: 'Limited Time Offer' });
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [newPackage, setNewPackage] = useState({
    category_id: '',
    package_type: 'package', // experience, enhancement, motion
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
    is_active: true,
    is_template: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔍 LoadData function started');
    try {
      // Load packages
      console.log('📦 Loading packages...');
      const { data: packagesData, error: packagesError } = await supabase
        .from('custom_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      console.log('📦 Packages loaded:', packagesData?.length || 0);
      setPackages(packagesData || []);

      // Load experiences (from proposals table with template status)
      console.log('✨ Loading experiences from proposals table...');
      
      // DEBUGGING: Let's check ALL proposals first
      const { data: allProposals, error: allError } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
        
      console.log('🔍 ALL proposals in database:', allProposals);
      console.log('🔍 Proposal details:', allProposals?.map(p => ({ 
        id: p.id, 
        status: p.status, 
        title: p.title, 
        lead_id: p.lead_id,
        client_name: p.client_name 
      })));
      
      // For now, let's include ALL statuses to see everything and filter in the UI
      const { data: experiencesData, error: experiencesError } = await supabase
        .from('proposals')
        .select('*')
        .in('status', ['template', 'custom_template', 'draft'])
        .order('created_at', { ascending: false });

      if (experiencesError) {
        console.error('❌ Error loading experiences:', experiencesError);
        throw experiencesError;
      }
      
      console.log('✨ Raw experiences data:', experiencesData);
      console.log('✨ Experiences count:', experiencesData?.length || 0);
      console.log('✨ Template experiences:', experiencesData?.filter(exp => exp.status === 'template').length || 0);
      
      // TEMPORARY FIX: Convert the "A standard test" experience to be a proper template
      const standardTestExperience = experiencesData?.find(exp => exp.title === 'A standard test' && exp.status === 'draft' && exp.lead_id);
      if (standardTestExperience) {
        console.log('🔧 Found misclassified standard experience, fixing it...');
        const { error: updateError } = await supabase
          .from('proposals')
          .update({ 
            status: 'template',
            lead_id: null,
            client_name: 'Standard Experience'
          })
          .eq('id', standardTestExperience.id);
          
        if (updateError) {
          console.error('❌ Error fixing experience:', updateError);
        } else {
          console.log('✅ Successfully fixed experience to be a standard template');
          // Reload the data to reflect changes
          const { data: updatedExperiences } = await supabase
            .from('proposals')
            .select('*')
            .in('status', ['template', 'custom_template', 'draft'])
            .order('created_at', { ascending: false });
          setExperiences(updatedExperiences || []);
          return;
        }
      }
      
      setExperiences(experiencesData || []);
    } catch (error) {
      console.error('💥 Error loading data:', error);
    } finally {
      console.log('🏁 LoadData function completed');
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const packageType = getPackageTypeFromThemeKeywords(pkg.theme_keywords);
    const categoryMatch = selectedCategory === 'all' || packageType === selectedCategory;
    const typeMatch = selectedType === 'all' || 
      (selectedType === 'templates' && pkg.is_template) ||
      (selectedType === 'custom' && !pkg.is_template);
    return categoryMatch && typeMatch;
  });

  const resetForm = () => {
    setNewPackage({
      category_id: '',
      package_type: 'package',
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
      is_active: true,
      is_template: false
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

  const copyPackage = (pkg: CustomPackage) => {
    // Pre-fill form with package data for copying
    setNewPackage({
      category_id: '',
      package_type: getPackageTypeFromThemeKeywords(pkg.theme_keywords),
      name: `${pkg.name} Copy`,
      title: `${pkg.title} (Copy)`,
      description: pkg.description,
      price: pkg.price.toString(),
      original_price: pkg.original_price?.toString() || '',
      discount_type: pkg.discount_type || '',
      discount_value: pkg.discount_value?.toString() || '',
      discount_label: pkg.discount_label || 'Limited Time Offer',
      discount_expires_at: pkg.discount_expires_at || '',
      sessions: pkg.sessions || '',
      locations: pkg.locations || '',
      gallery: pkg.gallery || '',
      looks: pkg.looks || '',
      delivery: pkg.delivery || '',
      video: pkg.video || '',
      turnaround: pkg.turnaround || '',
      fine_art: pkg.fine_art || '',
      highlights: pkg.highlights.length > 0 ? [...pkg.highlights] : [''],
      investment_note: pkg.investment_note || '',
      theme_keywords: getCleanThemeKeywords(pkg.theme_keywords),
      image_url: pkg.image_url || '',
      is_main_offer: false, // Always false for copies
      is_active: true,
      is_template: false // Default for copies
    });
    setEditingPackage(null);
    setShowCreateModal(true);
  };

  const editPackage = (pkg: CustomPackage) => {
    // Pre-fill form with package data for editing
    setNewPackage({
      category_id: '',
      package_type: getPackageTypeFromThemeKeywords(pkg.theme_keywords),
      name: pkg.name,
      title: pkg.title,
      description: pkg.description,
      price: pkg.price.toString(),
      original_price: pkg.original_price?.toString() || '',
      discount_type: pkg.discount_type || '',
      discount_value: pkg.discount_value?.toString() || '',
      discount_label: pkg.discount_label || 'Limited Time Offer',
      discount_expires_at: pkg.discount_expires_at || '',
      sessions: pkg.sessions || '',
      locations: pkg.locations || '',
      gallery: pkg.gallery || '',
      looks: pkg.looks || '',
      delivery: pkg.delivery || '',
      video: pkg.video || '',
      turnaround: pkg.turnaround || '',
      fine_art: pkg.fine_art || '',
      highlights: pkg.highlights.length > 0 ? [...pkg.highlights] : [''],
      investment_note: pkg.investment_note || '',
      theme_keywords: getCleanThemeKeywords(pkg.theme_keywords),
      image_url: pkg.image_url || '',
      is_main_offer: pkg.is_main_offer || false,
      is_active: pkg.is_active,
      is_template: pkg.is_template
    });
    setEditingPackage(pkg);
    setShowCreateModal(true);
  };

  const deletePackage = async (pkg: CustomPackage) => {
    if (!confirm(`Are you sure you want to delete "${pkg.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🔑 [PACKAGE-DELETE] Deleting package with authenticated fetch');
      console.log('🌍 [PACKAGE-DELETE] Environment:', process.env.NODE_ENV);
      console.log('🗑️ [PACKAGE-DELETE] Deleting package:', pkg.id, pkg.title);
      
      const response = await authenticatedFetch('/api/packages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: pkg.id })
      });

      const result = await response.json();
      console.log('📝 [PACKAGE-DELETE] API result:', result);
      console.log('📡 [PACKAGE-DELETE] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [PACKAGE-DELETE] Error response:', result.error);
        throw new Error('Failed to delete package: ' + (result.error || response.statusText));
      }

      console.log('✅ [PACKAGE-DELETE] Package deleted successfully');
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Error deleting package. Please try again.');
    }
  };

  const savePackage = async () => {
    if (!newPackage.name || !newPackage.title || !newPackage.price) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Store package_type in theme_keywords temporarily until column exists
      const packageData = {
        name: newPackage.name,
        title: newPackage.title,
        description: newPackage.description,
        price: parseFloat(newPackage.price),
        original_price: newPackage.original_price ? parseFloat(newPackage.original_price) : null,
        discount_value: newPackage.discount_value ? parseFloat(newPackage.discount_value) : null,
        discount_type: newPackage.discount_type || null,
        discount_label: newPackage.discount_label || null,
        discount_expires_at: newPackage.discount_expires_at || null,
        highlights: newPackage.highlights.filter(h => h.trim() !== ''),
        sessions: newPackage.sessions || null,
        locations: newPackage.locations || null,
        gallery: newPackage.gallery || null,
        looks: newPackage.looks || null,
        delivery: newPackage.delivery || null,
        video: newPackage.video || null,
        turnaround: newPackage.turnaround || null,
        fine_art: newPackage.fine_art || null,
        investment_note: newPackage.investment_note || null,
        theme_keywords: `package_type:${newPackage.package_type}|${newPackage.theme_keywords || ''}`,
        image_url: newPackage.image_url || null,
        is_main_offer: newPackage.is_main_offer,
        is_active: newPackage.is_active,
        is_template: newPackage.is_template
      };

      const isEditing = editingPackage !== null;
      const url = '/api/packages';
      const method = isEditing ? 'PUT' : 'POST';
      
      let requestBody: any = packageData;
      if (isEditing) {
        requestBody = { ...packageData, id: editingPackage.id };
      }
      
      console.log('Sending package data:', requestBody);

      console.log(`🔑 [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Using authenticated fetch`);
      console.log(`🌍 [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Environment:`, process.env.NODE_ENV);
      console.log(`📦 [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Package data:`, requestBody);
      
      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log(`📝 [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] API result:`, result);
      console.log(`📡 [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Response status:`, response.status, response.statusText);

      if (!response.ok) {
        console.error(`❌ [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Error response:`, result.error);
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} package: ` + (result.error || response.statusText));
      }
      
      console.log(`✅ [PACKAGE-${isEditing ? 'UPDATE' : 'CREATE'}] Package ${isEditing ? 'updated' : 'created'} successfully`);

      // Reload data and close modal
      await loadData();
      setShowCreateModal(false);
      setEditingPackage(null);
      resetForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert(`Error ${editingPackage ? 'updating' : 'creating'} package. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const saveExperience = async () => {
    // Validate required fields
    if (!experienceTitle.trim()) {
      alert('Please enter an experience title.');
      return;
    }
    
    if (selectedPackages.length === 0) {
      alert('Please select at least one package. A package is required to create an experience.');
      return;
    }

    setSaving(true);
    try {
      const subtotal = calculateExperienceTotal(selectedPackages, selectedEnhancements, selectedMotion);
      const finalAmount = calculateDiscountedPrice(subtotal, experienceDiscount);

      // Check if we're creating this for a specific lead
      // BUT if experienceType is 'standard', ignore any leadId and create as template
      const leadId = experienceType === 'standard' ? null : sessionStorage.getItem('leadId');
      const isForLead = !!leadId;

      // Calculate discount amounts for the database
      const discountAmount = experienceDiscount.type === 'fixed' && experienceDiscount.value 
        ? parseFloat(experienceDiscount.value) 
        : 0;
      const discountPercentage = experienceDiscount.type === 'percentage' && experienceDiscount.value 
        ? parseFloat(experienceDiscount.value) 
        : 0;

      let leadData = null;
      if (isForLead) {
        // Fetch lead data to personalize the experience
        console.log('🔑 [LEAD-FETCH] Fetching lead with authenticated fetch');
        console.log('🌍 [LEAD-FETCH] Environment:', process.env.NODE_ENV);
        console.log('🎯 [LEAD-FETCH] Fetching lead:', leadId);
        
        const response = await authenticatedFetch(`/api/leads/${leadId}`);
        const result = await response.json();
        console.log('📝 [LEAD-FETCH] API result:', result);
        console.log('📡 [LEAD-FETCH] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ [LEAD-FETCH] Error response:', result.error);
          // Still try to set lead data if it exists in the result
          if (result.data) {
            console.log('✅ [LEAD-FETCH] Setting lead data despite error status');
            leadData = result.data;
          }
        } else {
          leadData = result.data;
        }
      }

      // Prepare package snapshots for storage (including experience metadata)
      const packageSnapshots = {
        // Experience metadata
        experience_image_url: experienceImageUrl || null,
        experience_title: experienceTitle,
        // Components
        packages: selectedPackages.map(pkg => ({
          ...pkg,
          type: 'package',
          is_required: true // Packages are always required for selection
        })),
        enhancements: selectedEnhancements.map(item => ({
          ...item.package,
          type: 'enhancement',
          is_required: item.required
        })),
        motion: selectedMotion.map(item => ({
          ...item.package,
          type: 'motion',
          is_required: item.required
        }))
      };

      console.log('💾 Saving experience with package snapshots:', packageSnapshots);

      let proposalData;
      
      // Check if we're editing an existing experience
      if (editingExperience) {
        console.log('✏️ Updating existing experience:', editingExperience.id);
        
        // Update existing experience
        const { data: updatedProposal, error: proposalError } = await supabase
          .from('proposals')
          .update({
            title: isForLead && leadData ? `${experienceTitle} - ${leadData.first_name} ${leadData.last_name}` : experienceTitle,
            custom_message: JSON.stringify({
              text: `Experience Type: ${experienceType === 'standard' ? 'Standard Template' : 'Custom Built'}\nPackages: ${selectedPackages.map(pkg => pkg.title).join(', ')}${selectedEnhancements.length ? `\nEnhancements: ${selectedEnhancements.map(item => `${item.package.title}${item.required ? ' (Required)' : ' (Optional)'}`).join(', ')}` : ''}${selectedMotion.length ? `\nMotion: ${selectedMotion.map(item => `${item.package.title}${item.required ? ' (Required)' : ' (Optional)'}`).join(', ')}` : ''}\nDiscount: ${experienceDiscount.label || 'No discount'}`,
              package_snapshots: packageSnapshots
            }),
            subtotal: subtotal,
            total_amount: finalAmount,
            discount_amount: discountAmount,
            discount_percentage: discountPercentage
          })
          .eq('id', editingExperience.id)
          .select()
          .single();

        if (proposalError) {
          console.error('❌ Error updating experience:', proposalError);
          throw new Error(`Failed to update experience: ${proposalError.message}`);
        }
        proposalData = updatedProposal;
      } else {
        // Create new experience as a proposal (template or lead-specific)
        const { data: newProposal, error: proposalError } = await supabase
          .from('proposals')
          .insert({
          lead_id: isForLead ? leadId : null,
          title: isForLead && leadData ? `${experienceTitle} - ${leadData.first_name} ${leadData.last_name}` : experienceTitle,
          status: isForLead ? 'draft' : (experienceType === 'standard' ? 'template' : 'custom_template'),
          client_name: isForLead && leadData ? `${leadData.first_name} ${leadData.last_name}` : (experienceType === 'standard' ? 'Standard Experience' : 'Custom Experience Template'),
          client_email: isForLead && leadData ? leadData.email : '', 
          custom_message: JSON.stringify({
            text: `Experience Type: ${experienceType === 'standard' ? 'Standard Template' : 'Custom Built'}\nPackages: ${selectedPackages.map(pkg => pkg.title).join(', ')}${selectedEnhancements.length ? `\nEnhancements: ${selectedEnhancements.map(item => `${item.package.title}${item.required ? ' (Required)' : ' (Optional)'}`).join(', ')}` : ''}${selectedMotion.length ? `\nMotion: ${selectedMotion.map(item => `${item.package.title}${item.required ? ' (Required)' : ' (Optional)'}`).join(', ')}` : ''}\nDiscount: ${experienceDiscount.label || 'No discount'}`,
            package_snapshots: packageSnapshots
          }),
          subtotal: subtotal,
          total_amount: finalAmount,
          discount_amount: discountAmount,
          discount_percentage: discountPercentage
        })
        .select()
        .single();

        if (proposalError) {
          console.error('❌ Error creating experience:', proposalError);
          throw new Error(`Failed to create experience: ${proposalError.message}`);
        }
        proposalData = newProposal;
      }

      // Only manage proposal_packages for new proposals (not when editing)
      if (!editingExperience) {
        // Add all components to proposal_packages
        const proposalPackages: any[] = [];
        
        // Add all selected packages
        selectedPackages.forEach(pkg => {
          proposalPackages.push({
            proposal_id: proposalData.id,
            package_id: pkg.id,
            package_snapshot: pkg,
            quantity: 1,
            unit_price: pkg.price,
            total_price: pkg.price
          });
        });

        // Add enhancements (with required flag in snapshot)
        selectedEnhancements.forEach(item => {
          proposalPackages.push({
            proposal_id: proposalData.id,
            package_id: item.package.id,
            package_snapshot: {
              ...item.package,
              is_required: item.required
            },
            quantity: 1,
            unit_price: item.package.price,
            total_price: item.package.price
          });
        });

        // Add motion if selected (with required flag in snapshot)
        selectedMotion.forEach(item => {
          proposalPackages.push({
            proposal_id: proposalData.id,
            package_id: item.package.id,
            package_snapshot: {
              ...item.package,
              is_required: item.required
            },
            quantity: 1,
            unit_price: item.package.price,
            total_price: item.package.price
          });
        });

        const { error: packagesError } = await supabase
          .from('proposal_packages')
          .insert(proposalPackages);

        if (packagesError) {
          console.error('❌ Error inserting proposal packages:', packagesError);
          throw new Error(`Failed to save proposal packages: ${packagesError.message}`);
        }
      } else {
        console.log('✏️ Skipping proposal_packages update for editing - using package_snapshots instead');
      }

      // Close modal and reset form
      setShowExperienceBuilder(false);
      setSelectedPackages([]);
      setSelectedEnhancements([]);
      setSelectedMotion([]);
      setExperienceTitle('');
      setExperienceImageUrl('');
      setExperienceType('custom');
      setExperienceDiscount({ type: '', value: '', label: 'Limited Time Offer' });
      setEditingExperience(null);
      
      if (isForLead) {
        // Clear the lead ID from session storage
        sessionStorage.removeItem('leadId');
        
        // Show success message and redirect back to leads
        alert(`${experienceType === 'standard' ? 'Standard' : 'Custom'} experience created and assigned to ${leadData?.first_name || 'lead'}!`);
        window.location.href = '/leads';
      } else {
        // Template creation
        alert(`${experienceType === 'standard' ? 'Standard' : 'Custom'} experience created successfully!`);
        // Reload data to show the new template
        loadData();
      }
      
    } catch (error) {
      console.error('Error saving experience:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error ${editingExperience ? 'updating' : 'creating'} experience: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const previewExperience = () => {
    try {
      console.log('🔍 [EXPERIENCE-PREVIEW] Starting experience preview creation...');
      console.log('🌍 [EXPERIENCE-PREVIEW] Environment:', process.env.NODE_ENV);
      
      // Validate required fields
      if (!experienceTitle.trim()) {
        console.error('❌ [EXPERIENCE-PREVIEW] Validation failed: Missing experience title');
        alert('Please enter an experience title.');
        return;
      }
      
      if (selectedPackages.length === 0) {
        console.error('❌ [EXPERIENCE-PREVIEW] Validation failed: No packages selected');
        alert('Please select at least one package. A package is required to preview an experience.');
        return;
      }

      console.log('📦 [EXPERIENCE-PREVIEW] Selected packages:', selectedPackages.length, selectedPackages.map(p => p.title));
      console.log('✨ [EXPERIENCE-PREVIEW] Selected enhancements:', selectedEnhancements.length, selectedEnhancements.map(e => `${e.package.title} (${e.required ? 'required' : 'optional'})`));
      console.log('🎥 [EXPERIENCE-PREVIEW] Selected motion:', selectedMotion.length, selectedMotion.map(m => `${m.package.title} (${m.required ? 'required' : 'optional'})`));
      
      // Create a mock experience preview
      const experienceData = {
        title: experienceTitle,
        packages: selectedPackages,
        enhancements: selectedEnhancements.map(item => ({...item.package, is_required: item.required})),
        motion: selectedMotion.map(item => ({...item.package, is_required: item.required})),
        discount: experienceDiscount,
        subtotal: calculateExperienceTotal(selectedPackages, selectedEnhancements, selectedMotion),
        total: calculateDiscountedPrice(
          calculateExperienceTotal(selectedPackages, selectedEnhancements, selectedMotion), 
          experienceDiscount
        )
      };

      console.log('📊 [EXPERIENCE-PREVIEW] Experience data created:', {
        title: experienceData.title,
        packagesCount: experienceData.packages.length,
        enhancementsCount: experienceData.enhancements.length,
        motionCount: experienceData.motion.length,
        subtotal: experienceData.subtotal,
        total: experienceData.total
      });

      // Store in sessionStorage for preview page
      sessionStorage.setItem('experiencePreview', JSON.stringify(experienceData));
      console.log('✅ [EXPERIENCE-PREVIEW] Data stored in sessionStorage successfully');
      
      // Fixed route: Open preview in new tab
      const previewUrl = '/experience-preview';
      console.log('🔗 [EXPERIENCE-PREVIEW] Opening preview URL:', previewUrl);
      window.open(previewUrl, '_blank');
      
    } catch (error) {
      console.error('❌ [EXPERIENCE-PREVIEW] Error creating experience preview:', error);
      alert('Error creating experience preview. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleDeleteExperience = async (experienceId: string) => {
    try {
      // Delete from proposals table
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', experienceId);

      if (error) {
        console.error('Error deleting experience:', error);
        alert('Failed to delete experience. Please try again.');
        return;
      }

      // Reload data to refresh the list
      loadData();
      alert('Experience deleted successfully.');
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('Failed to delete experience. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <Logo 
              width={200} 
              height={67} 
              variant="light" 
              className="opacity-90 animate-pulse"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] rounded"></div>
          </div>
          <div className="space-y-3">
            <p className="text-charcoal/70 font-light tracking-wide">Loading package data</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TallyLayout>
      <div className="min-h-screen bg-ivory">
      {/* Compact Header */}
      <div className="border-b border-charcoal/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-charcoal">Packages & Experiences</h1>
              <p className="text-sm text-charcoal/70 mt-1">Component packages and curated experiences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Compact Management Section */}
        <div className="bg-white px-6 py-4 border-b border-charcoal/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-lg font-semibold text-charcoal">
                  {packages.filter(pkg => getPackageTypeFromThemeKeywords(pkg.theme_keywords) === 'package' && pkg.is_active).length}
                </div>
                <div className="text-xs text-charcoal/60 uppercase tracking-wide">Packages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-charcoal">
                  {packages.filter(pkg => getPackageTypeFromThemeKeywords(pkg.theme_keywords) === 'enhancement' && pkg.is_active).length}
                </div>
                <div className="text-xs text-charcoal/60 uppercase tracking-wide">Enhancements</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-charcoal">
                  {experiences.filter(exp => exp.status === 'template' || (exp.status === 'draft' && !(exp as any).lead_id)).length}
                </div>
                <div className="text-xs text-charcoal/60 uppercase tracking-wide">Experiences</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-verde text-white px-4 py-2 text-sm font-medium hover:bg-verde/90 transition-colors rounded"
              >
                Add Component
              </button>
              <button 
                onClick={() => {
                  sessionStorage.removeItem('leadId');
                  setShowExperienceBuilder(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 text-sm font-medium hover:bg-purple-700 transition-colors rounded"
              >
                Create Experience
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white px-6 py-4 border-b border-charcoal/10">
          <div className="flex items-center gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-charcoal/20 text-sm focus:ring-1 focus:ring-verde focus:border-verde rounded"
            >
              <option value="all">All Categories</option>
              <option value="package">Package</option>
              <option value="enhancement">Enhancement</option>
              <option value="motion">Motion/Video</option>
            </select>

            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-charcoal/20 text-sm focus:ring-1 focus:ring-verde focus:border-verde rounded"
            >
              <option value="all">All Types</option>
              <option value="experiences">Experiences Only</option>
              <option value="templates">Standard Only</option>
              <option value="custom">Custom Only</option>
            </select>
          </div>
        </div>

        {/* Show Experiences when experiences filter is selected */}
        {(() => {
          console.log('🎯 Current selectedType:', selectedType);
          console.log('🎯 Experiences state:', experiences);
          const standardExperiences = experiences.filter(exp => 
            exp.status === 'template' || 
            (exp.status === 'draft' && !(exp as any).lead_id) ||
            (exp.status === 'draft' && exp.title?.toLowerCase().includes('standard'))
          );
          console.log('🎯 Standard experiences:', standardExperiences);
          return selectedType === 'experiences';
        })() ? (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-charcoal tracking-wide mb-4">Standard Experiences</h2>
              <p className="text-charcoal/60 max-w-2xl mx-auto">
                Luxury experience templates ready for your customers to discover and request
              </p>
            </div>

            {experiences.filter(exp => exp.status === 'template' || (exp.status === 'draft' && !(exp as any).lead_id)).length === 0 ? (
              <div className="text-center py-20">
                <div className="space-y-6">
                  <div className="text-charcoal/60 text-xl font-light">
                    No standard experiences found
                  </div>
                  <button 
                    onClick={() => {
                      // Clear any existing leadId from sessionStorage to prevent auto-assignment
                      sessionStorage.removeItem('leadId');
                      setShowExperienceBuilder(true);
                    }}
                    className="px-8 py-4 bg-purple-600 text-white font-light tracking-wide uppercase hover:bg-purple-700 transition-all duration-300"
                  >
                    Create Your First Experience
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {experiences.filter(exp => exp.status === 'template' || (exp.status === 'draft' && !(exp as any).lead_id)).map((experience) => (
                  <div key={experience.id} className="border border-charcoal/20 bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                    {/* Experience Card Header with image or gradient */}
                    <div className="relative h-48 overflow-hidden">
                      {(() => {
                        // Get image URL from custom_message if available
                        try {
                          const customMessage = typeof experience.custom_message === 'string' ? 
                            JSON.parse(experience.custom_message) : experience.custom_message;
                          const packageSnapshots = customMessage?.package_snapshots || {};
                          return packageSnapshots.experience_image_url || null;
                        } catch (e) {
                          return null;
                        }
                      })() ? (
                        <>
                          <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{
                              backgroundImage: `url('${(() => {
                                try {
                                  const customMessage = typeof experience.custom_message === 'string' ? 
                                    JSON.parse(experience.custom_message) : experience.custom_message;
                                  const packageSnapshots = customMessage?.package_snapshots || {};
                                  return packageSnapshots.experience_image_url || '';
                                } catch (e) {
                                  return '';
                                }
                              })()}')`,
                              backgroundPosition: 'center',
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-charcoal"></div>
                          <div className="absolute inset-0 bg-black/20"></div>
                        </>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
                            handleDeleteExperience(experience.id);
                          }
                        }}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors duration-200 opacity-80 hover:opacity-100 z-10"
                        title="Delete experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="space-y-2">
                          <h3 className="text-xl font-light tracking-wide">{experience.title}</h3>
                          <div className="text-sm opacity-80">Starting at {formatCurrency(experience.total_amount)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Experience Details */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-verde/20 text-verde px-3 py-1 text-xs font-medium uppercase tracking-wide">
                          Standard Experience
                        </span>
                        <div className="text-sm text-charcoal/60">
                          {new Date(experience.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="text-sm text-charcoal/70 leading-relaxed">
                        {(() => {
                          try {
                            // Try to parse as JSON to get clean text
                            const customMessage = typeof experience.custom_message === 'string' ? 
                              JSON.parse(experience.custom_message) : experience.custom_message;
                            
                            if (customMessage?.text) {
                              // Extract just the first line of the text field
                              return customMessage.text.split('\n')[0] || 'Luxury experience template';
                            }
                          } catch (e) {
                            // Fallback for old format - just use the first line
                            if (typeof experience.custom_message === 'string') {
                              return experience.custom_message.split('\n')[0] || 'Luxury experience template';
                            }
                          }
                          return 'Luxury experience template';
                        })()}
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button 
                          onClick={() => {
                            // Parse the stored package snapshots from custom_message
                            let packageSnapshots = {};
                            try {
                              const customMessage = typeof experience.custom_message === 'string' ? 
                                JSON.parse(experience.custom_message) : experience.custom_message;
                              packageSnapshots = customMessage?.package_snapshots || {};
                            } catch (e) {
                              // Fallback for old format - might be just text
                              packageSnapshots = {};
                            }
                            
                            console.log('📖 Loading experience preview data:', packageSnapshots);
                            
                            // Handle both old format (array) and new format (object)
                            let packages, enhancements, motion;
                            
                            if (Array.isArray(packageSnapshots)) {
                              // Old format - array of items with type
                              packages = packageSnapshots.filter(item => item.type === 'package');
                              enhancements = packageSnapshots.filter(item => item.type === 'enhancement');
                              motion = packageSnapshots.filter(item => item.type === 'motion');
                            } else {
                              // New format - object with separate arrays
                              packages = (packageSnapshots as any).packages || [];
                              enhancements = (packageSnapshots as any).enhancements || [];
                              motion = (packageSnapshots as any).motion || [];
                            }
                            
                            console.log('🔍 [EXISTING-EXPERIENCE-PREVIEW] Starting existing experience preview...');
                            console.log('🌍 [EXISTING-EXPERIENCE-PREVIEW] Environment:', process.env.NODE_ENV);
                            console.log('📋 [EXISTING-EXPERIENCE-PREVIEW] Experience:', experience.title, experience.id);
                            console.log('📦 [EXISTING-EXPERIENCE-PREVIEW] Parsed packages:', packages.length, packages.map((p: any) => p.title));
                            console.log('✨ [EXISTING-EXPERIENCE-PREVIEW] Parsed enhancements:', enhancements.length, enhancements.map((e: any) => e.title));
                            console.log('🎥 [EXISTING-EXPERIENCE-PREVIEW] Parsed motion:', motion.length, motion.map((m: any) => m.title));
                            
                            const experiencePreviewData = {
                              title: experience.title,
                              packages: packages,
                              enhancements: enhancements,
                              motion: motion,
                              discount: {
                                type: experience.discount_percentage ? 'percentage' : 'fixed',
                                value: experience.discount_percentage || experience.discount_amount || '0',
                                label: 'Experience Discount'
                              },
                              subtotal: experience.subtotal,
                              total: experience.total_amount
                            };
                            
                            console.log('📊 [EXISTING-EXPERIENCE-PREVIEW] Final preview data:', {
                              title: experiencePreviewData.title,
                              packagesCount: experiencePreviewData.packages.length,
                              enhancementsCount: experiencePreviewData.enhancements.length,
                              motionCount: experiencePreviewData.motion.length,
                              subtotal: experiencePreviewData.subtotal,
                              total: experiencePreviewData.total
                            });
                            
                            sessionStorage.setItem('experiencePreview', JSON.stringify(experiencePreviewData));
                            console.log('✅ [EXISTING-EXPERIENCE-PREVIEW] Data stored in sessionStorage successfully');
                            
                            // Fixed route: Open preview in new tab
                            const previewUrl = '/experience-preview';
                            console.log('🔗 [EXISTING-EXPERIENCE-PREVIEW] Opening preview URL:', previewUrl);
                            window.open(previewUrl, '_blank');
                          }}
                          className="flex-1 py-2 px-4 border border-charcoal/30 text-charcoal text-sm font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                        >
                          Preview
                        </button>
                        <button 
                          onClick={() => {
                            // Parse the stored package snapshots from custom_message
                            let packageSnapshots = {};
                            try {
                              const customMessage = typeof experience.custom_message === 'string' ? 
                                JSON.parse(experience.custom_message) : experience.custom_message;
                              packageSnapshots = customMessage?.package_snapshots || {};
                            } catch (e) {
                              // Fallback for old format - might be just text
                              packageSnapshots = {};
                            }
                            
                            console.log('✏️ Editing experience:', experience.title, packageSnapshots);
                            
                            // Handle both old format (array) and new format (object)
                            let packages, enhancements, motion, imageUrl;
                            
                            if (Array.isArray(packageSnapshots)) {
                              // Old format - array of items with type
                              packages = packageSnapshots.filter(item => item.type === 'package');
                              enhancements = packageSnapshots.filter(item => item.type === 'enhancement');
                              motion = packageSnapshots.filter(item => item.type === 'motion');
                              imageUrl = '';
                            } else {
                              // New format - object with separate arrays
                              packages = (packageSnapshots as any).packages || [];
                              enhancements = (packageSnapshots as any).enhancements || [];
                              motion = (packageSnapshots as any).motion || [];
                              imageUrl = (packageSnapshots as any).experience_image_url || '';
                            }
                            
                            // Load the experience data into the form
                            setExperienceTitle(experience.title);
                            setExperienceImageUrl(imageUrl);
                            setExperienceType(experience.status === 'template' ? 'standard' : 'custom');
                            
                            // Set discount information
                            if (experience.discount_percentage) {
                              setExperienceDiscount({
                                type: 'percentage',
                                value: experience.discount_percentage.toString(),
                                label: 'Experience Discount'
                              });
                            } else if (experience.discount_amount) {
                              setExperienceDiscount({
                                type: 'fixed',
                                value: experience.discount_amount.toString(),
                                label: 'Experience Discount'
                              });
                            } else {
                              setExperienceDiscount({ type: '', value: '', label: 'Limited Time Offer' });
                            }
                            
                            // Load packages, enhancements, and motion
                            setSelectedPackages(packages);
                            setSelectedEnhancements(enhancements.map((item: any) => ({
                              package: item,
                              required: item.is_required || false
                            })));
                            setSelectedMotion(motion.map((item: any) => ({
                              package: item,
                              required: item.is_required || false
                            })));
                            
                            // Store the experience ID for updating instead of creating new
                            setEditingExperience(experience);
                            
                            // Open the Experience Builder
                            setShowExperienceBuilder(true);
                          }}
                          className="flex-1 py-2 px-4 bg-purple-600 text-white text-sm font-light tracking-wide uppercase hover:bg-purple-700 transition-all duration-300"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Packages Grid */
          filteredPackages.length === 0 ? (
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
            <>
              {/* Table Header - Desktop Only */}
            <div className="hidden md:block border-b border-charcoal/10 bg-charcoal/5">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-charcoal/70 uppercase tracking-wide">
                <div className="col-span-4">Package & Details</div>
                <div className="col-span-2">Price & Type</div>
                <div className="col-span-3">Components</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Packages Table */}
            <div className="divide-y divide-charcoal/5">
            {filteredPackages.map((pkg) => (
              <div key={pkg.id} className="relative hover:bg-ivory/50 cursor-pointer transition-all duration-200">
                {/* Desktop Table Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                  {/* Package & Details Column */}
                  <div className="col-span-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-charcoal text-sm">{pkg.title}</div>
                        {pkg.is_template && (
                          <span className="bg-verde/20 text-verde px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded">
                            Standard
                          </span>
                        )}
                      </div>
                      <div className="text-charcoal/60 text-xs leading-relaxed">
                        {pkg.description.substring(0, 100)}...
                      </div>
                    </div>
                  </div>
                  
                  {/* Price & Type Column */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <div className="text-charcoal text-sm font-medium">
                        {formatCurrency(pkg.price)}
                      </div>
                      {(() => {
                        const packageType = getPackageTypeFromThemeKeywords(pkg.theme_keywords);
                        const categoryColors = {
                          package: 'bg-blue-100 text-blue-700',
                          enhancement: 'bg-green-100 text-green-700', 
                          motion: 'bg-purple-100 text-purple-700'
                        };
                        return (
                          <div className={`px-2 py-0.5 text-xs uppercase tracking-wide rounded ${categoryColors[packageType]}`}>
                            {packageType === 'motion' ? 'Motion/Video' : packageType}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Components Column */}
                  <div className="col-span-3">
                    <div className="space-y-1 text-xs">
                      {pkg.sessions && (
                        <div><span className="text-charcoal/60">Duration:</span> <span className="text-charcoal">{pkg.sessions}</span></div>
                      )}
                      {pkg.locations && (
                        <div><span className="text-charcoal/60">Locations:</span> <span className="text-charcoal">{pkg.locations}</span></div>
                      )}
                      {pkg.gallery && (
                        <div><span className="text-charcoal/60">Gallery:</span> <span className="text-charcoal">{pkg.gallery}</span></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Column */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <div className={`px-3 py-1 text-xs font-medium rounded ${
                        pkg.is_active 
                          ? 'bg-verde/20 text-verde' 
                          : 'bg-charcoal/20 text-charcoal/60'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-charcoal/60 text-xs">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Column */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => editPackage(pkg)}
                        className="p-1 hover:bg-charcoal/5 rounded transition-colors"
                        title="Edit Package"
                      >
                        <svg className="w-4 h-4 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => copyPackage(pkg)}
                        className="p-1 hover:bg-verde/10 rounded transition-colors"
                        title="Copy Package"
                      >
                        <svg className="w-4 h-4 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deletePackage(pkg)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete Package"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-charcoal">{pkg.title}</div>
                          {pkg.is_template && (
                            <span className="bg-verde/20 text-verde px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded">
                              Standard
                            </span>
                          )}
                        </div>
                        <div className="text-charcoal text-lg font-medium mt-1">{formatCurrency(pkg.price)}</div>
                      </div>
                      <div className={`px-3 py-1 text-xs font-medium rounded ${
                        pkg.is_active 
                          ? 'bg-verde/20 text-verde' 
                          : 'bg-charcoal/20 text-charcoal/60'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="text-charcoal/70 text-sm">
                      {pkg.description.substring(0, 120)}...
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {pkg.sessions && (
                        <div>
                          <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Duration</div>
                          <div className="text-charcoal">{pkg.sessions}</div>
                        </div>
                      )}
                      {pkg.locations && (
                        <div>
                          <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Locations</div>
                          <div className="text-charcoal">{pkg.locations}</div>
                        </div>
                      )}
                      {pkg.gallery && (
                        <div>
                          <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Gallery</div>
                          <div className="text-charcoal">{pkg.gallery}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-charcoal/60 text-xs uppercase tracking-wide mb-1">Created</div>
                        <div className="text-charcoal">{new Date(pkg.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-charcoal/10">
                      <button 
                        onClick={() => editPackage(pkg)}
                        className="flex-1 py-2 px-3 border border-charcoal/20 text-charcoal text-xs font-medium hover:bg-charcoal hover:text-white transition-all duration-300 rounded"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => copyPackage(pkg)}
                        className="flex-1 py-2 px-3 border border-verde/20 text-verde text-xs font-medium hover:bg-verde hover:text-white transition-all duration-300 rounded"
                      >
                        Copy
                      </button>
                      <button 
                        onClick={() => deletePackage(pkg)}
                        className="py-2 px-3 border border-red-200 text-red-500 text-xs font-medium hover:bg-red-500 hover:text-white transition-all duration-300 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            </>
          )
        )}
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-charcoal">
                  {editingPackage ? 'Edit Item' : 'Create New Package'}
                </h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPackage(null);
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
                        value={newPackage.package_type}
                        onChange={(e) => handleInputChange('package_type', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                      >
                        <option value="package">Package</option>
                        <option value="enhancement">Enhancement</option>
                        <option value="motion">Motion/Video</option>
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

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_template"
                      checked={newPackage.is_template}
                      onChange={(e) => handleInputChange('is_template', e.target.checked)}
                      className="w-4 h-4 text-verde border-verde/30 focus:ring-verde focus:ring-2"
                    />
                    <label htmlFor="is_template" className="text-sm font-light text-charcoal/70">
                      Standard Package (available in client proposals)
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-8 border-t border-charcoal/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPackage(null);
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
                    {saving 
                      ? (editingPackage ? 'Updating...' : 'Creating...')
                      : (editingPackage ? 'Update Item' : 'Create Package')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Experience Builder Modal */}
      {showExperienceBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-charcoal">
                  {editingExperience ? 'Edit Experience' : 'Experience Builder'}
                </h2>
                <button 
                  onClick={() => {
                    setShowExperienceBuilder(false);
                    setSelectedPackages([]);
                    setSelectedEnhancements([]);
                    setSelectedMotion([]);
                    setExperienceTitle('');
                    setExperienceImageUrl('');
                    setExperienceType('custom');
                    setExperienceDiscount({ type: '', value: '', label: 'Limited Time Offer' });
                    setEditingExperience(null);
                  }}
                  className="text-charcoal/60 hover:text-charcoal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Experience Type Toggle */}
              <div className="mb-8">
                <label className="block text-sm font-light text-charcoal/70 mb-4">Experience Type</label>
                <div className="flex bg-charcoal/5 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setExperienceType('standard')}
                    className={`flex-1 py-3 px-4 text-sm font-light tracking-wide uppercase transition-all duration-300 rounded-md ${
                      experienceType === 'standard'
                        ? 'bg-verde text-white shadow-sm'
                        : 'text-charcoal/60 hover:text-charcoal hover:bg-white/50'
                    }`}
                  >
                    Standard Experience
                  </button>
                  <button
                    type="button"
                    onClick={() => setExperienceType('custom')}
                    className={`flex-1 py-3 px-4 text-sm font-light tracking-wide uppercase transition-all duration-300 rounded-md ${
                      experienceType === 'custom'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-charcoal/60 hover:text-charcoal hover:bg-white/50'
                    }`}
                  >
                    Custom Experience
                  </button>
                </div>
                <div className="mt-2 text-xs text-charcoal/60">
                  {experienceType === 'standard' 
                    ? 'Template experience available to all customers'
                    : 'Custom experience for specific client needs'
                  }
                </div>
              </div>

              {/* Experience Title */}
              <div className="mb-6">
                <label className="block text-sm font-light text-charcoal/70 mb-2">Experience Title *</label>
                <input
                  type="text"
                  value={experienceTitle}
                  onChange={(e) => setExperienceTitle(e.target.value)}
                  placeholder="e.g., Custom Elegance Experience"
                  className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                />
              </div>

              {/* Experience Image URL */}
              <div className="mb-8">
                <label className="block text-sm font-light text-charcoal/70 mb-2">Experience Image URL</label>
                <input
                  type="url"
                  value={experienceImageUrl}
                  onChange={(e) => setExperienceImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                />
                <p className="text-xs text-charcoal/50 mt-1">Optional: URL to an image that represents this experience</p>
              </div>

              {/* Experience Overview */}
              <div className={`${experienceType === 'standard' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border p-6 mb-8 rounded`}>
                <div className="space-y-3">
                  <h3 className="text-lg font-light text-charcoal">Experience Components</h3>
                  <p className="text-sm text-charcoal/60">
                    {experienceType === 'standard' 
                      ? 'Build a standard template experience available to all customers'
                      : 'Build a custom experience where customers choose from your curated options'
                    }
                  </p>
                  <div className="text-sm text-charcoal/70">
                    • Selected packages: {selectedPackages.length} {experienceType === 'custom' ? '(customer will choose from these)' : ''}
                    • Available enhancements: {selectedEnhancements.length} 
                    • Available motion: {selectedMotion.length}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Package Selection - Multiple */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Select Packages * (Choose 1-4 options)</h3>
                  <p className="text-sm text-charcoal/60">Give customers multiple options to choose from (like Elegance, Opulence, Essence)</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {packages.filter(pkg => getPackageTypeFromThemeKeywords(pkg.theme_keywords) === 'package' && pkg.is_active)
                      .sort((a, b) => a.price - b.price) // Sort by price (psychology pricing)
                      .map(pkg => {
                        const isSelected = selectedPackages.some(selected => selected.id === pkg.id);
                        return (
                          <div 
                            key={pkg.id}
                            onClick={() => {
                              if (isSelected) {
                                // Remove if already selected
                                setSelectedPackages(selectedPackages.filter(selected => selected.id !== pkg.id));
                              } else {
                                // Add if not selected (limit to 4)
                                if (selectedPackages.length < 4) {
                                  setSelectedPackages([...selectedPackages, pkg]);
                                }
                              }
                            }}
                            className={`p-4 border rounded cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : selectedPackages.length >= 4 
                                  ? 'border-charcoal/10 bg-gray-50 cursor-not-allowed opacity-50'
                                  : 'border-charcoal/20 hover:border-charcoal/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-charcoal/30'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-charcoal">{pkg.title}</h4>
                                  <p className="text-sm text-charcoal/60">{pkg.description.substring(0, 60)}...</p>
                                </div>
                              </div>
                              <div className="text-lg font-light text-charcoal">{formatCurrency(pkg.price)}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {selectedPackages.length > 0 && (
                    <div className="text-sm text-charcoal/60">
                      Selected: {selectedPackages.map(pkg => pkg.title).join(', ')}
                    </div>
                  )}
                </div>

                {/* Enhancement Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Select Enhancements</h3>
                  <p className="text-sm text-charcoal/60">Optional add-ons customers can choose from</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {packages.filter(pkg => getPackageTypeFromThemeKeywords(pkg.theme_keywords) === 'enhancement' && pkg.is_active).map(pkg => {
                      const selectedItem = selectedEnhancements.find(item => item.package.id === pkg.id);
                      const isSelected = !!selectedItem;
                      
                      return (
                        <div 
                          key={pkg.id}
                          className={`p-4 border rounded transition-all duration-200 ${
                            isSelected
                              ? 'border-green-500 bg-green-50' 
                              : 'border-charcoal/20'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <div 
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedEnhancements(selectedEnhancements.filter(item => item.package.id !== pkg.id));
                                    } else {
                                      setSelectedEnhancements([...selectedEnhancements, {package: pkg, required: false}]);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                    isSelected ? 'border-green-500 bg-green-500' : 'border-charcoal/30 hover:border-charcoal/50'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-charcoal">{pkg.title}</h4>
                                  <p className="text-sm text-charcoal/60">{pkg.description.substring(0, 60)}...</p>
                                </div>
                              </div>
                              <div className="text-lg font-light text-charcoal">{formatCurrency(pkg.price)}</div>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-8 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItem?.required || false}
                                  onChange={(e) => {
                                    setSelectedEnhancements(selectedEnhancements.map(item => 
                                      item.package.id === pkg.id 
                                        ? {...item, required: e.target.checked}
                                        : item
                                    ));
                                  }}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <label className="text-sm text-charcoal/70">
                                  Required (customer must select this)
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Motion Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-charcoal tracking-wide">Select Motion/Video</h3>
                  <p className="text-sm text-charcoal/60">Optional video add-ons customers can choose from</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {packages.filter(pkg => getPackageTypeFromThemeKeywords(pkg.theme_keywords) === 'motion' && pkg.is_active).map(pkg => {
                      const selectedItem = selectedMotion.find(item => item.package.id === pkg.id);
                      const isSelected = !!selectedItem;
                      
                      return (
                        <div 
                          key={pkg.id}
                          className={`p-4 border rounded transition-all duration-200 ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-charcoal/20'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <div 
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedMotion(selectedMotion.filter(item => item.package.id !== pkg.id));
                                    } else {
                                      setSelectedMotion([...selectedMotion, {package: pkg, required: false}]);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-charcoal/30 hover:border-charcoal/50'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-charcoal">{pkg.title}</h4>
                                  <p className="text-sm text-charcoal/60">{pkg.description.substring(0, 60)}...</p>
                                </div>
                              </div>
                              <div className="text-lg font-light text-charcoal">{formatCurrency(pkg.price)}</div>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-8 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItem?.required || false}
                                  onChange={(e) => {
                                    setSelectedMotion(selectedMotion.map(item => 
                                      item.package.id === pkg.id 
                                        ? {...item, required: e.target.checked}
                                        : item
                                    ));
                                  }}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <label className="text-sm text-charcoal/70">
                                  Required (customer must select this)
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Discount Section */}
              <div className="border-t border-charcoal/10 pt-8 mb-8">
                <h3 className="text-lg font-light text-charcoal tracking-wide mb-6">Discount (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-light text-charcoal/70 mb-2">Discount Type</label>
                    <select
                      value={experienceDiscount.type}
                      onChange={(e) => setExperienceDiscount(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                    >
                      <option value="">No Discount</option>
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Dollar Amount Off</option>
                    </select>
                  </div>

                  {experienceDiscount.type && (
                    <>
                      <div>
                        <label className="block text-sm font-light text-charcoal/70 mb-2">
                          {experienceDiscount.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                        </label>
                        <input
                          type="number"
                          value={experienceDiscount.value}
                          onChange={(e) => setExperienceDiscount(prev => ({ ...prev, value: e.target.value }))}
                          placeholder={experienceDiscount.type === 'percentage' ? '10' : '100.00'}
                          step={experienceDiscount.type === 'percentage' ? '1' : '0.01'}
                          min="0"
                          max={experienceDiscount.type === 'percentage' ? '100' : undefined}
                          className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-light text-charcoal/70 mb-2">Display Label</label>
                        <input
                          type="text"
                          value={experienceDiscount.label}
                          onChange={(e) => setExperienceDiscount(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Limited Time Offer"
                          className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-charcoal/10">
                <button
                  type="button"
                  onClick={previewExperience}
                  className="flex items-center gap-2 px-6 py-3 border border-charcoal/30 text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                  disabled={selectedPackages.length === 0 || !experienceTitle.trim()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 12l2-2 2 2 4-4" />
                  </svg>
                  Preview Experience
                </button>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowExperienceBuilder(false)}
                    className="px-6 py-3 border border-charcoal/30 text-charcoal font-light tracking-wide uppercase hover:bg-charcoal hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveExperience}
                    disabled={selectedPackages.length === 0 || !experienceTitle.trim() || saving}
                    className={`px-8 py-3 font-light tracking-wide uppercase transition-all duration-300 ${
                      (selectedPackages.length === 0 || !experienceTitle.trim() || saving)
                        ? 'bg-charcoal/50 text-white cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {saving ? (editingExperience ? 'Updating...' : 'Creating...') : (editingExperience ? 'Update Experience' : 'Create Experience')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </TallyLayout>
  );
}