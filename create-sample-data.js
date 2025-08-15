const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleData() {
  console.log('🎭 Creating sample dashboard data...\n');
  
  try {
    // 1. Create sample leads
    console.log('📝 Creating sample leads...');
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          first_name: 'Emma',
          last_name: 'Johnson',
          email: 'emma.johnson@email.com',
          phone: '555-0123',
          session_type_interest: 'Portrait Session',
          budget_range: '$1000-$2000',
          message: 'Looking for professional headshots for my business.',
          status: 'new'
        },
        {
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'michael.chen@email.com',
          phone: '555-0124',
          session_type_interest: 'Family Session',
          budget_range: '$800-$1500',
          message: 'Want family photos for our holiday cards.',
          status: 'contacted'
        },
        {
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah.williams@email.com',
          phone: '555-0125',
          session_type_interest: 'Wedding',
          budget_range: '$3000+',
          message: 'Planning a spring wedding, need photographer.',
          status: 'proposal_sent'
        }
      ])
      .select();
    
    if (leadError) {
      console.log('❌ Leads error:', leadError.message);
    } else {
      console.log('✅ Created', leads?.length || 0, 'sample leads');
    }

    // 2. Create sample clients (check what columns exist first)
    console.log('\n👥 Creating sample clients...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          first_name: 'Jessica',
          last_name: 'Davis',
          email: 'jessica.davis@email.com',
          phone: '555-0126'
        },
        {
          first_name: 'David',
          last_name: 'Rodriguez',
          email: 'david.rodriguez@email.com',
          phone: '555-0127'
        }
      ])
      .select();
    
    if (clientError) {
      console.log('❌ Clients error:', clientError.message);
    } else {
      console.log('✅ Created', clients?.length || 0, 'sample clients');
    }

    // 3. Create sample sessions
    console.log('\n📸 Creating sample sessions...');
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const futureDate2 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    const pastDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .insert([
        {
          client_id: clients?.[0]?.id,
          session_type: 'Portrait Session',
          session_title: 'Professional Headshots - Jessica',
          session_date: futureDate1.toISOString().split('T')[0],
          session_time: '10:00 AM',
          location: 'Studio A',
          duration: '2 hours',
          photographer: process.env.PHOTOGRAPHER_NAME || 'Professional Photographer',
          investment: '$1,200',
          status: 'Confirmed & Scheduled'
        },
        {
          client_id: clients?.[1]?.id,
          session_type: 'Family Session',
          session_title: 'Family Portraits - Rodriguez Family',
          session_date: futureDate2.toISOString().split('T')[0],
          session_time: '2:00 PM',
          location: 'Central Park',
          duration: '3 hours',
          photographer: process.env.PHOTOGRAPHER_NAME || 'Professional Photographer',
          investment: '$1,800',
          status: 'Confirmed & Scheduled'
        },
        {
          client_id: clients?.[0]?.id,
          session_type: 'Corporate Event',
          session_title: 'Company Holiday Party',
          session_date: pastDate.toISOString().split('T')[0],
          session_time: '6:00 PM',
          location: 'Downtown Office',
          duration: '4 hours',
          photographer: process.env.PHOTOGRAPHER_NAME || 'Professional Photographer',
          investment: '$2,500',
          status: 'Completed'
        }
      ])
      .select();
    
    if (sessionError) {
      console.log('❌ Sessions error:', sessionError.message);
    } else {
      console.log('✅ Created', sessions?.length || 0, 'sample sessions');
      console.log('   - 2 upcoming sessions');
      console.log('   - 1 completed session');
    }

    console.log('\n🎉 Sample data creation complete!');
    console.log('Dashboard should now show:');
    console.log('- Total Clients: 2');
    console.log('- Total Sessions: 3'); 
    console.log('- Total Leads: 3');
    console.log('- Upcoming Sessions: 2');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
}

createSampleData();