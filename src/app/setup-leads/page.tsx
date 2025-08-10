'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SetupLeadsPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runLeadsSetup = async () => {
    setLoading(true);
    setStatus('Setting up leads system...');

    try {
      // First, create the leads table
      const { error: leadsError } = await supabase.rpc('create_leads_table', {});
      
      if (leadsError) {
        console.error('Error creating leads table:', leadsError);
        // Try manual table creation
        await createTablesManually();
      } else {
        setStatus('✅ Leads system setup complete!');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setStatus('❌ Setup failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const createTablesManually = async () => {
    try {
      setStatus('Creating leads table...');
      
      // Create leads table
      const { error: createLeadsError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

      if (createLeadsError && createLeadsError.code === '42P01') {
        // Table doesn't exist, we need to create it
        setStatus('Table needs to be created manually in Supabase dashboard');
        return;
      }

      // Insert sample data
      setStatus('Inserting sample leads...');
      
      const sampleLeads = [
        {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          session_type_interest: 'Editorial Portrait',
          budget_range: '$2,000 - $3,000',
          preferred_timeline: 'Next 2 months',
          lead_source: 'Instagram',
          status: 'new',
          priority: 'high',
          message: 'Hi! I saw your work on Instagram and love your editorial style. I\'m a startup founder looking for professional headshots and brand photos. Would love to discuss!'
        },
        {
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'mchen@techstartup.com',
          phone: '(555) 987-6543',
          session_type_interest: 'Branding Session',
          budget_range: '$3,000 - $5,000',
          preferred_timeline: '1 month',
          lead_source: 'Website',
          status: 'contacted',
          priority: 'medium',
          message: 'Our tech startup needs professional photos for our team and marketing materials. Looking for a modern, professional aesthetic.'
        },
        {
          first_name: 'Emma',
          last_name: 'Williams',
          email: 'emma.w@agency.com',
          phone: '(555) 456-7890',
          session_type_interest: 'Editorial Portrait',
          budget_range: '$1,500 - $2,500',
          preferred_timeline: 'Flexible',
          lead_source: 'Referral',
          status: 'qualified',
          priority: 'medium',
          message: 'Referred by Jessica Martinez. Need executive portraits for our agency\'s new website and marketing campaigns.'
        }
      ];

      const { error: insertError } = await supabase
        .from('leads')
        .insert(sampleLeads);

      if (insertError) {
        console.error('Error inserting sample leads:', insertError);
        setStatus(`❌ Error inserting sample data: ${insertError.message}`);
      } else {
        setStatus('✅ Sample leads inserted successfully!');
      }

    } catch (error) {
      console.error('Manual setup error:', error);
      setStatus('❌ Manual setup failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-didot text-charcoal mb-4">
              Setup Leads Management System
            </h1>
            <p className="text-warm-gray">
              This will create the necessary database tables and sample data for the leads management system.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-ivory/50 rounded-lg p-4">
              <h3 className="font-semibold text-charcoal mb-2">What this will create:</h3>
              <ul className="text-sm text-warm-gray space-y-1">
                <li>• Leads table for tracking potential clients</li>
                <li>• Lead interactions table for communication history</li>
                <li>• Lead documents table for proposals and files</li>
                <li>• Sample lead data for development</li>
                <li>• Row Level Security policies for admin access</li>
              </ul>
            </div>

            {status && (
              <div className="bg-white border border-warm-gray/20 rounded-lg p-4">
                <p className="text-sm text-charcoal">{status}</p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={runLeadsSetup}
                disabled={loading}
                className="bg-gradient-to-r from-gold to-gold/90 text-white px-8 py-3 rounded-lg font-semibold hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up...</span>
                  </div>
                ) : (
                  'Setup Leads System'
                )}
              </button>

              <a
                href="/admin/dashboard"
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                Back to Dashboard
              </a>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="text-yellow-800">
                <strong>Note:</strong> If automatic setup fails, you'll need to run the SQL script manually in your Supabase dashboard:
                <br />
                <code className="bg-yellow-100 px-2 py-1 rounded mt-2 block">
                  scripts/create-leads-system.sql
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}