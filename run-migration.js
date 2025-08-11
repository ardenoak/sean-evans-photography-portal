const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running database migration...\n');
  
  const sqlPath = path.join(__dirname, 'scripts', 'create-proposal-system.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Parse SQL content into individual statements
  const statements = sqlContent
    .split(/;\s*$/gm)
    .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
    .map(stmt => stmt.trim());
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip empty statements and comments
    if (!stmt || stmt.startsWith('--')) continue;
    
    // Use Supabase admin client to run raw SQL
    try {
      // For table creation and data manipulation, we'll use direct API calls
      if (stmt.includes('CREATE TABLE') || stmt.includes('INSERT INTO') || stmt.includes('ALTER TABLE')) {
        console.log(`Statement ${i + 1}: Processing...`);
        
        // Create a custom RPC function approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (response.ok) {
          console.log(`  ✅ Success`);
          successCount++;
        } else {
          // Try alternative approach
          console.log(`  ⚠️  Manual execution needed for this statement`);
          errorCount++;
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Statement ${i + 1}: Needs manual execution`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Migration Summary:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ⚠️  Need manual: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n📌 To complete the migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new');
    console.log('2. Copy the content from: scripts/create-proposal-system.sql');
    console.log('3. Paste and click "Run"');
    console.log('\nThis will create all the tables and seed data needed for the proposal system.');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }
  
  console.log('='.repeat(50));
}

runMigration().catch(console.error);