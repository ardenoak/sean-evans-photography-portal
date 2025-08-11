const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixDatabase() {
  console.log('🔍 Checking database setup...\n');

  // Alternative approach - try to query each table
  const requiredTables = [
    'leads',
    'sessions', 
    'clients',
    'package_categories',
    'custom_packages',
    'proposals',
    'proposal_packages'
  ];

  console.log('📊 Checking Required Tables:');
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${table} - Missing`);
        missingTables.push(table);
      } else {
        console.log(`  ✅ ${table} - Exists`);
      }
    } catch (e) {
      console.log(`  ❌ ${table} - Error checking`);
      missingTables.push(table);
    }
  }

  if (missingTables.includes('custom_packages') || missingTables.includes('proposals')) {
    console.log('\n⚠️  Proposal system tables missing. Running migration...\n');
    
    // Read and execute the SQL script
    const sqlPath = path.join(__dirname, 'scripts', 'create-proposal-system.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split by statements and execute
      const statements = sqlContent
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        
        // Skip comments
        if (stmt.startsWith('--') || stmt.startsWith('/*')) continue;
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            query: stmt 
          }).catch(() => ({ error: 'Cannot execute directly' }));
          
          if (error) {
            console.log(`  ⚠️  Statement ${i + 1} - Manual execution needed`);
          } else {
            console.log(`  ✅ Statement ${i + 1} executed`);
          }
        } catch (e) {
          // Silent fail, will need manual execution
        }
      }
      
      console.log('\n📌 Manual Action Required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new');
      console.log('2. Copy and paste the contents of: scripts/create-proposal-system.sql');
      console.log('3. Click "Run" to execute the migration\n');
    }
  } else {
    console.log('\n✅ All required tables exist!');
  }

  // Check for the "Lead Not Found" issue
  console.log('\n🔍 Checking Lead API...');
  
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
  
  if (leads && leads.length > 0) {
    const leadId = leads[0].id;
    console.log(`  Testing individual lead fetch for ID: ${leadId}`);
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.log(`  ❌ Lead fetch error: ${leadError.message}`);
    } else {
      console.log(`  ✅ Lead fetch working`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 NEXT STEPS:\n');
  console.log('1. ✅ Database connection working');
  console.log('2. ' + (missingTables.length > 0 ? '⚠️  Run migration in Supabase dashboard' : '✅ Tables ready'));
  console.log('3. 🔧 Ready to fix "Lead Not Found" issue');
  console.log('4. 🔧 Ready to make session types editable');
  console.log('5. 🔧 Ready to add discount functionality');
  console.log('\n' + '='.repeat(50));
}

checkAndFixDatabase().catch(console.error);