import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin()
    const { contractId } = await params
    const body = await request.json()
    const { client_name } = body

    if (!client_name || !client_name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        client_signature: client_name.trim(),
        client_signed_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error signing contract:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contract,
      message: 'Contract signed successfully!' 
    })
  } catch (error) {
    console.error('API error signing contract:', error)
    return NextResponse.json({ error: 'Failed to sign contract' }, { status: 500 })
  }
}