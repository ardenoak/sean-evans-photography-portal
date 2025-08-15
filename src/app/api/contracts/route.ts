import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quote_id')
    const contractId = searchParams.get('contract_id')

    if (contractId) {
      // Get specific contract
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (error) {
        console.error('Error fetching contract:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else if (quoteId) {
      // Get contract for specific quote
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('quote_id', quoteId)
        .single()

      if (error) {
        console.error('Error fetching contract for quote:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Get all contracts (dashboard usage)
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all contracts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('API error fetching contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}