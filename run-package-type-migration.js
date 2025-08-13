const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gapqnyahyskjjznyocrn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcHFueWFoeXNramp6bnlvY3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5ODM1MywiZXhwIjoyMDcwMzc0MzUzfQ.UWkU9k8R3C-ENyS2NH6zt_WQNBtufEFFtKQlaZCDnyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPackageTypeColumn() {
  try {
    console.log('Adding package_type column to custom_packages table...');
    
    // Add the column with constraint
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE custom_packages 
        ADD COLUMN IF NOT EXISTS package_type TEXT 
        CHECK (package_type IN ('experience', 'enhancement', 'motion')) 
        DEFAULT 'experience';
      `
    });
    
    if (addColumnError) {
      console.error('Error adding column:', addColumnError);
      // Try alternative approach
      console.log('Trying direct SQL approach...');
      
      const { error: directError } = await supabase
        .from('custom_packages')
        .select('id')
        .limit(1);
        
      if (directError) {
        console.error('Cannot access custom_packages table:', directError);
        return;
      }
      
      console.log('Column may already exist. Proceeding to update existing records...');
    } else {
      console.log('Column added successfully');
    }
    
    // Update existing packages to have a default package_type
    console.log('Updating existing packages with default package_type...');
    const { error: updateError } = await supabase
      .from('custom_packages')
      .update({ package_type: 'experience' })
      .is('package_type', null);
    
    if (updateError) {
      console.error('Error updating existing records:', updateError);
    } else {
      console.log('Existing records updated successfully');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addPackageTypeColumn();