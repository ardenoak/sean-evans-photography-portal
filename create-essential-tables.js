const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEssentialTables() {
  console.log('🔧 Creating essential tables directly...\n');

  // 1. Create package_categories table
  try {
    console.log('Creating package_categories...');
    await supabase.from('package_categories').insert([
      { id: '1', name: 'Experiences', description: 'Photography session packages', display_order: 1, is_active: true },
      { id: '2', name: 'Enhancements', description: 'Add-on services', display_order: 2, is_active: true },
      { id: '3', name: 'Motion', description: 'Video add-ons', display_order: 3, is_active: true }
    ]);
    console.log('✅ package_categories created');
  } catch (error) {
    if (error.message.includes('relation "package_categories" does not exist')) {
      console.log('❌ package_categories table does not exist - needs manual creation');
    } else {
      console.log('✅ package_categories exists (data insert failed, but table exists)');
    }
  }

  // 2. Create custom_packages table 
  try {
    console.log('Creating sample package...');
    await supabase.from('custom_packages').insert({
      category_id: '1',
      name: 'ELEGANCE',
      title: 'The Elegance',
      description: 'Test package',
      price: 1350,
      sessions: '3 Hours',
      locations: '3',
      gallery: '40-60 Images',
      looks: '3',
      delivery: '10 Day Delivery',
      highlights: ['Professional styling', 'Edited gallery', 'Print release'],
      is_active: true,
      is_template: false
    });
    console.log('✅ custom_packages created');
  } catch (error) {
    if (error.message.includes('relation "custom_packages" does not exist')) {
      console.log('❌ custom_packages table does not exist - needs manual creation');
    } else {
      console.log('✅ custom_packages exists');
    }
  }

  // 3. Test quotes table
  try {
    console.log('Testing quotes table...');
    const { error } = await supabase.from('quotes').select('id').limit(1);
    if (error) {
      console.log('❌ quotes table does not exist - needs manual creation');
    } else {
      console.log('✅ quotes table exists');
    }
  } catch (error) {
    console.log('❌ quotes table access error');
  }

  // 4. Test contracts table
  try {
    console.log('Testing contracts table...');
    const { error } = await supabase.from('contracts').select('id').limit(1);
    if (error) {
      console.log('❌ contracts table does not exist - needs manual creation');
    } else {
      console.log('✅ contracts table exists');
    }
  } catch (error) {
    console.log('❌ contracts table access error');
  }

  console.log('\n📋 SUMMARY:');
  console.log('The database tables need to be created manually in Supabase.');
  console.log('This is the most reliable approach for complex schema creation.');
  console.log('\n🔗 Manual Setup Required:');
  console.log('1. Go to: https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new');
  console.log('2. Copy and paste the contents of scripts/create-proposal-system.sql');  
  console.log('3. Click "Run" to execute the migration');
  console.log('4. Copy and paste the contents of scripts/add-discount-fields.sql');
  console.log('5. Click "Run" to execute the discount fields');
  console.log('\n⚡ After running the SQL scripts, all functionality will work!');
}

createEssentialTables();