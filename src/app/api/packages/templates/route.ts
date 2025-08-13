import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('custom_packages')
      .select(`
        id,
        name,
        title,
        description,
        price,
        sessions,
        locations,
        gallery,
        looks,
        delivery,
        video,
        turnaround,
        fine_art,
        highlights,
        investment_note,
        theme_keywords,
        image_url
      `)
      .eq('is_active', true)
      .eq('is_template', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching template packages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error fetching template packages:', error)
    return NextResponse.json({ error: 'Failed to fetch template packages' }, { status: 500 })
  }
}