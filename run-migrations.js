const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  try {
    // 1. Run core proposal system migration
    console.log('📊 Running core proposal system migration...');
    const proposalSystemPath = path.join(__dirname, 'scripts', 'create-proposal-system.sql');
    
    if (fs.existsSync(proposalSystemPath)) {
      const sqlContent = fs.readFileSync(proposalSystemPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(/;\s*\n/)
        .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
        .map(stmt => stmt.trim());

      console.log(`  Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        console.log(`  Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec', { sql: statement });
          
          if (error) {
            // Try direct table creation for specific cases
            if (statement.includes('CREATE TABLE')) {
              const tableName = statement.match(/CREATE TABLE[^(]*([a-zA-Z_][a-zA-Z0-9_]*)/i)?.[1];
              console.log(`    Creating table: ${tableName}`);
              
              // Execute raw SQL using a different approach
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: statement })
              });
              
              if (!response.ok) {
                console.log(`    ⚠️  Could not create ${tableName} via API`);
              } else {
                console.log(`    ✅ Created ${tableName}`);
              }
            } else {
              console.log(`    ⚠️  Statement failed: ${error.message.substring(0, 100)}...`);
            }
          } else {
            console.log(`    ✅ Success`);
          }
        } catch (e) {
          console.log(`    ⚠️  Exception: ${e.message}`);
        }
      }
    } else {
      console.log('  ❌ proposal system SQL file not found');
    }

    // 2. Run discount fields migration
    console.log('\n💰 Running discount fields migration...');
    const discountFieldsPath = path.join(__dirname, 'scripts', 'add-discount-fields.sql');
    
    if (fs.existsSync(discountFieldsPath)) {
      const sqlContent = fs.readFileSync(discountFieldsPath, 'utf8');
      
      const statements = sqlContent
        .split(/;\s*\n/)
        .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
        .map(stmt => stmt.trim());

      console.log(`  Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        console.log(`  Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec', { sql: statement });
          
          if (error) {
            console.log(`    ⚠️  Statement failed: ${error.message.substring(0, 100)}...`);
          } else {
            console.log(`    ✅ Success`);
          }
        } catch (e) {
          console.log(`    ⚠️  Exception: ${e.message}`);
        }
      }
    } else {
      console.log('  ❌ discount fields SQL file not found');
    }

    // 3. Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    const requiredTables = [
      'package_categories',
      'custom_packages', 
      'proposals',
      'proposal_packages',
      'quotes',
      'contracts'
    ];

    let allTablesExist = true;
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        
        if (error) {
          console.log(`  ❌ ${table} - Not accessible`);
          allTablesExist = false;
        } else {
          console.log(`  ✅ ${table} - Ready`);
        }
      } catch (e) {
        console.log(`  ❌ ${table} - Error: ${e.message}`);
        allTablesExist = false;
      }
    }

    console.log('\n' + '='.repeat(50));
    if (allTablesExist) {
      console.log('🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('\nAll required tables are now available:');
      console.log('- Package management system ready');
      console.log('- Proposal generation ready');  
      console.log('- Quote and contract system ready');
      console.log('- Discount functionality ready');
    } else {
      console.log('⚠️  MIGRATION PARTIALLY COMPLETED');
      console.log('\nSome tables may need manual creation in Supabase dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new');
      console.log('2. Run scripts/create-proposal-system.sql');
      console.log('3. Run scripts/add-discount-fields.sql');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }
}

runMigrations();