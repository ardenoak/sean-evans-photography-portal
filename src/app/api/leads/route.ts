import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Authentication check in production
  if (process.env.NODE_ENV === 'production') {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
    
    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      console.warn(`[LEADS API] Authentication failed - API key mismatch`);
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Invalid or missing API key'
        },
        { status: 401 }
      );
    }
    console.log(`[LEADS API] Authentication successful`);
  }
  
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error loading leads:', error)
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const leadData = await request.json()

    console.log('Creating lead with data:', leadData)

    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Lead created successfully:', data)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { id, ...updates } = await request.json()

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = await request.json()

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error deleting lead:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}