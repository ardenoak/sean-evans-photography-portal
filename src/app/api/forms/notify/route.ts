import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { formData } = await request.json();
    
    console.log('New form submission notification:', {
      name: `${formData.first_name} ${formData.last_name}`,
      email: formData.email,
      sessionType: formData.session_type_interest,
      budget: formData.budget_range
    });
    
    // Here you could integrate with email services like:
    // - SendGrid
    // - Mailgun  
    // - Resend
    // - Or any SMTP service
    
    // For now, we'll just log the notification
    // In production, you'd send an actual email notification
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully' 
    });
    
  } catch (error) {
    console.error('Form notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}