const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTimeline() {
  console.log('🔍 Debugging Timeline System...\n');
  
  // Check if timeline_templates table exists and has data
  console.log('1. Checking timeline templates...');
  const { data: templates, error: templatesError } = await supabase
    .from('timeline_templates')
    .select('*');
  
  if (templatesError) {
    console.error('❌ Error loading templates:', templatesError);
  } else {
    console.log('✅ Timeline templates found:', templates?.length || 0);
    templates?.forEach(template => {
      console.log(`   - ${template.session_type}: ${template.tasks?.length || 0} tasks`);
    });
  }
  
  // Check recent sessions
  console.log('\n2. Checking recent sessions...');
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, session_type, session_title, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (sessionsError) {
    console.error('❌ Error loading sessions:', sessionsError);
  } else {
    console.log('✅ Recent sessions:');
    sessions?.forEach(session => {
      console.log(`   - ${session.session_title} (${session.session_type}) - ${session.id}`);
    });
  }
  
  // Check if any session has timeline items
  if (sessions?.length > 0) {
    const latestSession = sessions[0];
    console.log(`\n3. Checking timeline for latest session: ${latestSession.session_title}`);
    
    const { data: timeline, error: timelineError } = await supabase
      .from('session_timelines')
      .select('*')
      .eq('session_id', latestSession.id)
      .order('task_order', { ascending: true });
      
    if (timelineError) {
      console.error('❌ Error loading timeline:', timelineError);
    } else {
      console.log(`✅ Timeline items found: ${timeline?.length || 0}`);
      timeline?.forEach(item => {
        console.log(`   - ${item.task_name} (due: ${item.calculated_date})`);
      });
    }
  }
}

debugTimeline().catch(console.error);