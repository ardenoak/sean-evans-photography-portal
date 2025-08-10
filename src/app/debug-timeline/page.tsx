'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugTimelinePage() {
  const [debugInfo, setDebugInfo] = useState('Loading...');

  useEffect(() => {
    debugTimeline();
  }, []);

  const debugTimeline = async () => {
    let info = '🔍 Timeline Debug Report\n\n';
    
    try {
      // Check timeline templates
      info += '1. Timeline Templates:\n';
      const { data: templates, error: templatesError } = await supabase
        .from('timeline_templates')
        .select('*');
      
      if (templatesError) {
        info += `❌ Error: ${templatesError.message}\n`;
      } else {
        info += `✅ Found ${templates?.length || 0} templates\n`;
        templates?.forEach(template => {
          info += `   - ${template.session_type}: ${template.tasks?.length || 0} tasks\n`;
        });
      }
      
      // Check recent sessions
      info += '\n2. Recent Sessions:\n';
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, session_type, session_title, session_date, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (sessionsError) {
        info += `❌ Error: ${sessionsError.message}\n`;
      } else {
        info += `✅ Found ${sessions?.length || 0} sessions\n`;
        for (const session of sessions || []) {
          info += `   - ${session.session_title} (${session.session_type})\n`;
          info += `     ID: ${session.id}\n`;
          info += `     Date: ${session.session_date}\n`;
          
          // Check timeline for this session
          const { data: timeline, error: timelineError } = await supabase
            .from('session_timelines')
            .select('*')
            .eq('session_id', session.id);
            
          if (timelineError) {
            info += `     ❌ Timeline error: ${timelineError.message}\n`;
          } else {
            info += `     Timeline items: ${timeline?.length || 0}\n`;
            timeline?.forEach(item => {
              info += `       • ${item.task_name} (${item.calculated_date})\n`;
            });
          }
          info += '\n';
        }
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Timeline Debug Info</h1>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
          {debugInfo}
        </pre>
      </div>
    </div>
  );
}