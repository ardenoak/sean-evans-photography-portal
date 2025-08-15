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
      client_email,
      package_details
    } = body

    // Generate quote number using database function or fallback
    let quoteNumber;
    try {
      const { data: quoteNumberData, error: quoteNumberError } = await supabase
        .rpc('generate_quote_number')
      
      if (quoteNumberError) {
        console.warn('Quote number function not available, using fallback:', quoteNumberError.message)
        quoteNumber = `SEP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
      } else {
        quoteNumber = quoteNumberData || `SEP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
      }
    } catch (error) {
      console.warn('Error calling quote number function, using fallback:', error)
      quoteNumber = `SEP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    }
    
    // Calculate valid until (7 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    // Create quote with all required fields
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        proposal_id,
        lead_id,
        quote_number: quoteNumber,
        client_name,
        client_email,
        selected_package,
        selected_addons,
        selected_video_addons,
        status: 'draft',
        valid_until: validUntil.toISOString().split('T')[0],
        subtotal: total_amount,
        total_amount: total_amount,
        terms_and_conditions: `
QUOTE SUMMARY

Your personalized quote includes everything needed for an exceptional portrait experience. A 50% deposit secures your session date, with the balance due 24 hours prior to your session.

This quote expires in 7 days. Questions? We're here to help make this process seamless.

Looking forward to creating something beautiful together.
        `.trim(),
        special_notes: `
PACKAGE DETAILS

${package_details ? `
${package_details.title}
${package_details.description}

SESSION SPECIFICATIONS
• Duration: ${package_details.sessions}
• Locations: ${package_details.locations} unique settings
• Gallery: ${package_details.gallery}
• Styling: ${package_details.looks} looks
• Delivery: ${package_details.delivery}
${package_details.video ? `• Video: ${package_details.video}` : ''}
${package_details.turnaround && package_details.turnaround !== 'No sneak peek' ? `• Preview: ${package_details.turnaround}` : ''}
${package_details.fineArt ? `• Fine Art Credit: ${package_details.fineArt}` : ''}

CREATIVE APPROACH
Theme: ${package_details.theme_keywords}
${package_details.investment_note}
` : `
Selected Experience: ${selected_package}

SESSION SPECIFICATIONS
• Professional photography session with editorial direction
• Complete post-production and color correction
• Curated gallery of professionally edited images
• Personal usage rights for social media and personal use
`}

${selected_addons.length > 0 ? `ENHANCEMENTS
${selected_addons.map((addon: any) => `• ${addon}`).join('\n')}

` : ''}${selected_video_addons.length > 0 ? `MOTION ELEMENTS
${selected_video_addons.map((video: any) => `• ${video}`).join('\n')}

` : ''}NEXT STEPS
Once you accept this quote, we'll generate your contract with full session details and begin planning your personalized experience.

⏰ Valid until: ${validUntil.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
      // Get quotes for specific lead
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching quotes for lead:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Get all quotes (dashboard usage)
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all quotes:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('API error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}