const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  console.log('🧪 Creating test packages...\n');
  
  // 1. Create test categories (let database generate UUIDs)
  try {
    const { data: categories, error: catError } = await supabase
      .from('package_categories')
      .insert([
        { name: 'Experiences', description: 'Photography session packages', display_order: 1, is_active: true },
        { name: 'Enhancements', description: 'Add-on services', display_order: 2, is_active: true }
      ])
      .select();
    
    if (catError && !catError.message.includes('duplicate key')) {
      throw catError;
    }
    
    // Get all categories
    const { data: allCategories } = await supabase
      .from('package_categories')
      .select('*')
      .order('display_order');
      
    console.log('✅ Categories available:', allCategories?.length || 0);
    
    if (allCategories && allCategories.length > 0) {
      const experienceCat = allCategories.find(cat => cat.name === 'Experiences');
      
      // 2. Create test packages using real category ID
      if (experienceCat) {
        const { data: packages, error: pkgError } = await supabase
          .from('custom_packages')
          .insert([
            {
              category_id: experienceCat.id,
              name: 'ELEGANCE',
              title: 'The Elegance Experience',
              description: 'Our signature photography experience with premium styling and editing.',
              price: 1350,
              sessions: '3 Hours',
              locations: '3',
              gallery: '40-60 Images',
              looks: '3',
              delivery: '10 Day Delivery',
              highlights: ['Professional styling', 'Edited gallery', 'Print release'],
              is_active: true,
              is_template: true
            },
            {
              category_id: experienceCat.id,
              name: 'SIGNATURE',
              title: 'The Signature Package',
              description: 'Perfect for those who want a comprehensive photography experience.',
              price: 950,
              discount_type: 'percentage',
              discount_value: 15,
              discount_label: 'Limited Time Offer',
              discount_expires_at: '2025-12-31',
              sessions: '2 Hours',
              locations: '2',
              gallery: '30-40 Images',
              looks: '2',
              delivery: '14 Day Delivery',
              highlights: ['Professional editing', 'Digital gallery', 'Print release'],
              is_active: true,
              is_template: true
            }
          ])
          .select();
        
        if (pkgError && !pkgError.message.includes('duplicate key')) {
          throw pkgError;
        }
        console.log('✅ Test packages created:', packages?.length || 'already exist');
        
        if (packages) {
          packages.forEach(pkg => {
            console.log(`  - ${pkg.title} ($${pkg.price})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🎉 Test data setup complete!');
  console.log('Visit http://localhost:3001/admin/packages to see the packages.');
}

createTestData();