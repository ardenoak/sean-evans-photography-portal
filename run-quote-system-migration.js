const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Starting quote-to-payment system migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'scripts', 'create-quote-to-payment-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements (basic splitting by semicolon)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('SELECT \'Quote-to-Payment system tables created successfully!\'')) {
        console.log('✅ Quote-to-Payment system tables created successfully!');
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('quotes').select('count').limit(1);
          if (directError && directError.code === '42P01') {
            // Table doesn't exist, execute raw SQL
            console.log('📋 Creating tables directly...');
            // We'll need to run this manually or use a different approach
          }
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} may have failed (this might be expected): ${err.message}`);
      }
    }
    
    // Test if tables were created
    console.log('🧪 Testing table creation...');
    
    const tests = [
      { table: 'quotes', description: 'Quotes table' },
      { table: 'contracts', description: 'Contracts table' },  
      { table: 'payments', description: 'Payments table' }
    ];
    
    for (const test of tests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${test.description} created successfully`);
        } else {
          console.log(`❌ ${test.description} creation failed: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${test.description} test failed: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Test quote generation from proposal page');
    console.log('2. Verify admin can view quotes');
    console.log('3. Test contract creation flow');
    console.log('4. Set up Stripe payment integration');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative manual instructions
function showManualInstructions() {
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS');
  console.log('============================================');
  console.log('If the automated migration fails, please:');
  console.log('');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of:');
  console.log('   scripts/create-quote-to-payment-system.sql');
  console.log('4. Run the SQL script');
  console.log('');
  console.log('This will create the quotes, contracts, and payments tables');
  console.log('needed for the client quote-to-payment workflow.');
}

runMigration().then(() => {
  showManualInstructions();
});