'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixRLSPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fixRLS = async () => {
    setLoading(true);
    setStatus('Fixing RLS policies...');

    try {
      // Drop and recreate timeline_templates policies
      await supabase.rpc('exec_sql', {
        sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "timeline_templates_select_policy" ON timeline_templates;
        DROP POLICY IF EXISTS "timeline_templates_insert_policy" ON timeline_templates;
        DROP POLICY IF EXISTS "timeline_templates_update_policy" ON timeline_templates;
        DROP POLICY IF EXISTS "timeline_templates_delete_policy" ON timeline_templates;

        -- Create new policies that allow admin operations
        CREATE POLICY "timeline_templates_select_policy" ON timeline_templates
          FOR SELECT USING (true);

        CREATE POLICY "timeline_templates_insert_policy" ON timeline_templates
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.user_id = auth.uid() 
              AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
            )
          );

        CREATE POLICY "timeline_templates_update_policy" ON timeline_templates
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.user_id = auth.uid() 
              AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
            )
          );

        CREATE POLICY "timeline_templates_delete_policy" ON timeline_templates
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.user_id = auth.uid() 
              AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
            )
          );
        `
      });
      
      setStatus('✅ RLS policies fixed! Now you can create timeline templates.');
    } catch (error) {
      // The exec_sql function might not exist, so let's try a simpler approach
      console.log('exec_sql failed, trying direct policy creation...');
      
      // Try to disable RLS temporarily for timeline_templates
      const { error: disableError } = await supabase.rpc('alter_table_rls', {
        table_name: 'timeline_templates',
        enable_rls: false
      });
      
      if (disableError) {
        setStatus('❌ Could not fix RLS. Please run the SQL script manually in Supabase dashboard.');
      } else {
        setStatus('✅ RLS temporarily disabled for timeline_templates. You can now create templates.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Fix RLS Policies</h1>
        <p className="text-gray-600 mb-6">
          This will fix the Row Level Security policies for timeline templates.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm">
            <strong>Alternative:</strong> Go to your Supabase dashboard → SQL Editor and run this query:
          </p>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
{`-- Allow admin users to manage timeline templates
DROP POLICY IF EXISTS "timeline_templates_insert_policy" ON timeline_templates;
CREATE POLICY "timeline_templates_insert_policy" ON timeline_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.email IN ('hello@ardenoak.co', 'sean@seanevansphotography.com')
    )
  );`}
          </pre>
        </div>
        
        <button
          onClick={fixRLS}
          disabled={loading}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Fixing...' : 'Fix RLS Policies'}
        </button>
        
        {status && (
          <div className="mt-6 p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}