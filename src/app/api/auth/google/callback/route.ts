import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect('/admin/calendar?error=access_denied');
  }

  if (!code) {
    return NextResponse.redirect('/admin/calendar?error=no_code');
  }

  try {
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${request.nextUrl.origin}/api/auth/google/callback`
    );

    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // In a real implementation, you would:
    // 1. Get the current admin user ID from the session
    // 2. Store the tokens in the database
    // 3. Associate them with the admin user
    
    /*
    const { error: dbError } = await supabase
      .from('admin_auth_tokens')
      .upsert({
        admin_id: adminUserId, // Get this from session
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_expires_at: new Date(tokens.expiry_date).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    */

    // For now, just redirect back to calendar with success
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/calendar?connected=true`);
    
  } catch (error) {
    console.error('Google Calendar connection error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/calendar?error=connection_failed`);
  }
}