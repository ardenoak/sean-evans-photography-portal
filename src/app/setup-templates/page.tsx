'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SetupTemplatesPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createTemplates = async () => {
    setLoading(true);
    setStatus('Creating timeline templates...');

    const templates = [
      {
        session_type: 'Branding Session',
        tasks: [
          { task: "Contract & payment confirmed", offset_days: -14, order: 1, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Brand questionnaire sent & completed", offset_days: -10, order: 2, can_be_automated: true, approval_required: true, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true },
          { task: "Style guide & mood board creation", offset_days: -7, order: 3, can_be_automated: true, approval_required: true, estimated_hours: 2.0, requires_photographer: true, can_be_batched: false },
          { task: "Location scouting & preparation", offset_days: -5, order: 4, can_be_automated: false, approval_required: false, estimated_hours: 1.5, requires_photographer: true, can_be_batched: false },
          { task: "Pre-session consultation call", offset_days: -2, order: 5, can_be_automated: false, approval_required: false, estimated_hours: 0.5, requires_photographer: true, can_be_batched: false },
          { task: "Session day - Branding photography", offset_days: 0, order: 6, can_be_automated: false, approval_required: false, estimated_hours: 3.0, requires_photographer: true, can_be_batched: false },
          { task: "Initial photo selection & editing", offset_days: 2, order: 7, can_be_automated: false, approval_required: false, estimated_hours: 4.0, requires_photographer: true, can_be_batched: true },
          { task: "Preview gallery delivery", offset_days: 3, order: 8, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Client selection & final editing", offset_days: 10, order: 9, can_be_automated: false, approval_required: false, estimated_hours: 3.0, requires_photographer: true, can_be_batched: true },
          { task: "Complete brand package delivery", offset_days: 14, order: 10, can_be_automated: true, approval_required: false, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true }
        ]
      },
      {
        session_type: 'Portrait Session',
        tasks: [
          { task: "Contract & payment confirmed", offset_days: -14, order: 1, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Style guide & preparation materials sent", offset_days: -7, order: 2, can_be_automated: true, approval_required: true, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true },
          { task: "Pre-session consultation call", offset_days: -3, order: 3, can_be_automated: false, approval_required: false, estimated_hours: 0.5, requires_photographer: true, can_be_batched: false },
          { task: "Session day - Portrait photography", offset_days: 0, order: 4, can_be_automated: false, approval_required: false, estimated_hours: 2.0, requires_photographer: true, can_be_batched: false },
          { task: "Photo editing & enhancement", offset_days: 2, order: 5, can_be_automated: false, approval_required: false, estimated_hours: 3.0, requires_photographer: true, can_be_batched: true },
          { task: "Preview gallery delivery", offset_days: 3, order: 6, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Final selection & delivery", offset_days: 7, order: 7, can_be_automated: true, approval_required: false, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true }
        ]
      },
      {
        session_type: 'Executive Session',
        tasks: [
          { task: "Contract & payment confirmed", offset_days: -21, order: 1, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Executive style consultation", offset_days: -14, order: 2, can_be_automated: true, approval_required: true, estimated_hours: 1.5, requires_photographer: false, can_be_batched: false },
          { task: "Wardrobe & styling guide delivery", offset_days: -10, order: 3, can_be_automated: true, approval_required: true, estimated_hours: 2.0, requires_photographer: false, can_be_batched: true },
          { task: "Location & setup planning", offset_days: -7, order: 4, can_be_automated: false, approval_required: false, estimated_hours: 1.0, requires_photographer: true, can_be_batched: false },
          { task: "Pre-session strategy call", offset_days: -2, order: 5, can_be_automated: false, approval_required: false, estimated_hours: 0.75, requires_photographer: true, can_be_batched: false },
          { task: "Session day - Executive portraits", offset_days: 0, order: 6, can_be_automated: false, approval_required: false, estimated_hours: 2.5, requires_photographer: true, can_be_batched: false },
          { task: "Professional retouching & editing", offset_days: 2, order: 7, can_be_automated: false, approval_required: false, estimated_hours: 4.0, requires_photographer: true, can_be_batched: true },
          { task: "Preview gallery with selections", offset_days: 4, order: 8, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Final high-resolution delivery", offset_days: 7, order: 9, can_be_automated: true, approval_required: false, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true },
          { task: "LinkedIn & website optimization guide", offset_days: 10, order: 10, can_be_automated: true, approval_required: true, estimated_hours: 1.5, requires_photographer: false, can_be_batched: true }
        ]
      },
      {
        session_type: 'Family Session',
        tasks: [
          { task: "Contract & payment confirmed", offset_days: -14, order: 1, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Family preparation guide sent", offset_days: -10, order: 2, can_be_automated: true, approval_required: true, estimated_hours: 1.0, requires_photographer: false, can_be_batched: true },
          { task: "Location & timing consultation", offset_days: -7, order: 3, can_be_automated: false, approval_required: false, estimated_hours: 0.5, requires_photographer: true, can_be_batched: false },
          { task: "Pre-session family call", offset_days: -2, order: 4, can_be_automated: false, approval_required: false, estimated_hours: 0.5, requires_photographer: true, can_be_batched: false },
          { task: "Session day - Family portraits", offset_days: 0, order: 5, can_be_automated: false, approval_required: false, estimated_hours: 1.5, requires_photographer: true, can_be_batched: false },
          { task: "Photo editing & enhancement", offset_days: 2, order: 6, can_be_automated: false, approval_required: false, estimated_hours: 3.0, requires_photographer: true, can_be_batched: true },
          { task: "Online gallery delivery", offset_days: 5, order: 7, can_be_automated: true, approval_required: false, estimated_hours: 0.5, requires_photographer: false, can_be_batched: true },
          { task: "Print & product ordering consultation", offset_days: 14, order: 8, can_be_automated: true, approval_required: false, estimated_hours: 1.0, requires_photographer: false, can_be_batched: false }
        ]
      }
    ];

    try {
      // Clear existing templates first
      await supabase.from('timeline_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert new templates
      for (const template of templates) {
        const { error } = await supabase
          .from('timeline_templates')
          .insert({
            template_name: `${template.session_type} Standard Timeline`,
            session_type: template.session_type,
            tasks: template.tasks
          });
          
        if (error) {
          setStatus(`Error creating ${template.session_type}: ${error.message}`);
          setLoading(false);
          return;
        }
      }
      
      setStatus('✅ Timeline templates created successfully! Now generating timelines for existing sessions...');
      
      // Generate timelines for existing sessions
      await generateTimelinesForExistingSessions();
      
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
    
    setLoading(false);
  };

  const generateTimelinesForExistingSessions = async () => {
    // Get all sessions without timelines
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, session_type, session_date');
      
    if (sessionsError) {
      setStatus(prev => prev + `\n❌ Error getting sessions: ${sessionsError.message}`);
      return;
    }

    for (const session of sessions || []) {
      // Check if session already has timeline
      const { count } = await supabase
        .from('session_timelines')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);
        
      if (count === 0) {
        // Generate timeline for this session
        await generateTimelineForSession(session.id, session.session_type, session.session_date);
      }
    }
    
    setStatus(prev => prev + '\n✅ Timelines generated for all existing sessions!');
  };

  const generateTimelineForSession = async (sessionId: string, sessionType: string, sessionDate: string) => {
    // Get template for this session type
    const { data: template, error: templateError } = await supabase
      .from('timeline_templates')
      .select('*')
      .eq('session_type', sessionType)
      .single();
      
    if (templateError || !template) {
      console.log(`No template found for ${sessionType}`);
      return;
    }

    const sessionDateObj = new Date(sessionDate);
    
    // Create timeline items
    for (const task of template.tasks) {
      const calculatedDate = new Date(sessionDateObj);
      calculatedDate.setDate(calculatedDate.getDate() + task.offset_days);
      
      await supabase
        .from('session_timelines')
        .insert({
          session_id: sessionId,
          task_name: task.task,
          calculated_date: calculatedDate.toISOString().split('T')[0],
          adjusted_date: calculatedDate.toISOString().split('T')[0],
          days_offset: task.offset_days,
          task_order: task.order,
          can_be_automated: task.can_be_automated,
          approval_required: task.approval_required,
          estimated_work_hours: task.estimated_hours,
          requires_photographer: task.requires_photographer,
          can_be_batched: task.can_be_batched
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Setup Timeline Templates</h1>
        <p className="text-gray-600 mb-6">
          This will create timeline templates for different session types and generate timelines for existing sessions.
        </p>
        
        <button
          onClick={createTemplates}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Create Timeline Templates'}
        </button>
        
        {status && (
          <div className="mt-6 p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}