import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    const {
      lead_id,
      proposal_id,
      selected_package,
      selected_addons = [],
      selected_video_addons = [],
      total_amount,
      client_name,
      client_email
    } = body

    // Generate quote number
    const quoteNumber = `Q-${Date.now()}`
    
    // Calculate valid until (30 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        proposal_id,
        lead_id,
        quote_number: quoteNumber,
        status: 'draft',
        valid_until: validUntil.toISOString().split('T')[0],
        subtotal: total_amount,
        total_amount: total_amount,
        terms_and_conditions: `
Terms & Conditions:

1. SESSION BOOKING
- A 50% deposit is required to secure your session date
- Balance is due 24 hours before your session
- Rescheduling is allowed up to 48 hours in advance

2. DELIVERY & TIMELINE
- Sneak peek gallery delivered within 24-48 hours
- Full curated gallery delivered within the timeframe specified in your package
- All images are professionally edited and color-corrected

3. USAGE RIGHTS
- Personal use and social media sharing included
- Commercial usage requires separate licensing agreement
- All images remain property of Sean Evans Photography with shared usage rights

4. WEATHER & LOCATION
- Backup indoor locations available for weather contingencies
- Client is responsible for any location fees or permits if required

5. SATISFACTION GUARANTEE
- We stand behind our work and will address any concerns promptly
- Reshoots available in rare cases of technical issues (not styling preferences)

This quote is valid for 30 days from issue date.
        `.trim(),
        special_notes: `
Selected Package: ${selected_package}
${selected_addons.length > 0 ? `Add-ons: ${selected_addons.join(', ')}` : ''}
${selected_video_addons.length > 0 ? `Video Add-ons: ${selected_video_addons.join(', ')}` : ''}

Thank you for choosing Sean Evans Photography. We're excited to create something beautiful together.
        `.trim()
      })
      .select()
      .single()

    if (quoteError) {
      console.error('Error creating quote:', quoteError)
      return NextResponse.json({ error: quoteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      quote,
      message: 'Quote generated successfully!' 
    })
  } catch (error) {
    console.error('API error creating quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const quoteId = searchParams.get('quote_id')

    if (quoteId) {
      // Get specific quote
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (error) {
        console.error('Error fetching quote:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else if (leadId) {
      // Get quotes for lead
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching quotes:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'lead_id or quote_id required' }, { status: 400 })
  } catch (error) {
    console.error('API error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}