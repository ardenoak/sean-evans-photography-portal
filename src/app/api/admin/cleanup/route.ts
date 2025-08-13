import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { leadId, cleanAll } = body

    if (cleanAll) {
      // Clean up everything in the system
      console.log('Starting complete system cleanup...')

      // Get all quotes first
      const { data: allQuotes } = await supabase
        .from('quotes')
        .select('id')

      // Delete all contracts
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (contractsError) {
        console.error('Error deleting all contracts:', contractsError)
      }

      // Delete all quotes
      const { error: quotesError } = await supabase
        .from('quotes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (quotesError) {
        console.error('Error deleting all quotes:', quotesError)
      }

      // Delete all proposals
      const { error: proposalsError } = await supabase
        .from('proposals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (proposalsError) {
        console.error('Error deleting all proposals:', proposalsError)
      }

      // Delete all leads
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id, first_name, last_name')

      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (leadsError) {
        console.error('Error deleting all leads:', leadsError)
        return NextResponse.json({ error: leadsError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Complete system cleanup completed',
        deletedLeads: allLeads?.length || 0,
        deletedQuotes: allQuotes?.length || 0
      })
    }

    // Original single lead cleanup logic
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required for single lead cleanup' }, { status: 400 })
    }

    // Get all quotes for this lead
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('lead_id', leadId)

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError)
      return NextResponse.json({ error: quotesError.message }, { status: 500 })
    }

    // Delete contracts for these quotes
    if (quotes && quotes.length > 0) {
      const quoteIds = quotes.map(q => q.id)
      
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .in('quote_id', quoteIds)

      if (contractsError) {
        console.error('Error deleting contracts:', contractsError)
        return NextResponse.json({ error: contractsError.message }, { status: 500 })
      }
    }

    // Delete quotes
    const { error: quotesDeleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('lead_id', leadId)

    if (quotesDeleteError) {
      console.error('Error deleting quotes:', quotesDeleteError)
      return NextResponse.json({ error: quotesDeleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up quotes and contracts for lead ${leadId}`,
      deletedQuotes: quotes?.length || 0
    })
  } catch (error) {
    console.error('API error cleaning up data:', error)
    return NextResponse.json({ error: 'Failed to cleanup data' }, { status: 500 })
  }
}