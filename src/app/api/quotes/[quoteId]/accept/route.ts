import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin()
    const { quoteId } = await params

    // Update quote status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (quoteError) {
      console.error('Error accepting quote:', quoteError)
      return NextResponse.json({ error: quoteError.message }, { status: 500 })
    }

    // Generate contract number
    const contractNumber = `C-${Date.now()}`
    
    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        quote_id: quoteId,
        proposal_id: quote.proposal_id,
        lead_id: quote.lead_id,
        contract_number: contractNumber,
        status: 'draft',
        terms: `
PHOTOGRAPHY SESSION CONTRACT

This agreement is between Sean Evans Photography (the "Photographer") and the client named in the associated quote (the "Client").

SESSION DETAILS:
- Package: As specified in Quote #${quote.quote_number}
- Total Investment: As specified in the accepted quote
- Session Date: To be scheduled upon contract execution

PAYMENT TERMS:
1. 50% deposit required upon contract signing to secure session date
2. Remaining balance due 24 hours prior to session
3. All payments are non-refundable except in cases of photographer cancellation

SESSION TERMS:
1. The Photographer will provide professional photography services as outlined in the package
2. All images remain the property of Sean Evans Photography with shared usage rights granted to Client
3. Client receives personal usage rights for social media and personal use
4. Commercial usage requires separate licensing agreement

DELIVERY:
1. Sneak peek gallery: 24-48 hours after session
2. Full gallery: As specified in package timeline
3. All images professionally edited and color-corrected

RESCHEDULING & CANCELLATION:
1. Client may reschedule up to 48 hours in advance without penalty
2. Less than 48 hours notice: deposit forfeit
3. Weather contingencies: Alternative indoor locations available

SATISFACTION GUARANTEE:
The Photographer stands behind all work and will address concerns promptly. In rare cases of technical issues (not styling preferences), reshoot will be provided.

By signing below, both parties agree to the terms outlined in this contract and the associated quote.
        `.trim(),
        cancellation_policy: 'Sessions may be cancelled or rescheduled up to 48 hours in advance. Less than 48 hours notice will result in deposit forfeiture.',
        payment_terms: '50% deposit required upon signing. Balance due 24 hours before session. All payments non-refundable except in cases of photographer cancellation.',
        signature_required: true
      })
      .select()
      .single()

    if (contractError) {
      console.error('Error creating contract:', contractError)
      return NextResponse.json({ error: contractError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contract_id: contract.id,
      message: 'Quote accepted and contract generated!'
    })
  } catch (error) {
    console.error('API error accepting quote:', error)
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 })
  }
}