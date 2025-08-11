import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const supabase = getSupabaseAdmin()
    const { quoteId } = await params

    const { error } = await supabase
      .from('quotes')
      .update({ 
        viewed_at: new Date().toISOString(),
        status: 'viewed'
      })
      .eq('id', quoteId)

    if (error) {
      console.error('Error updating quote view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error updating quote view:', error)
    return NextResponse.json({ error: 'Failed to update quote view' }, { status: 500 })
  }
}