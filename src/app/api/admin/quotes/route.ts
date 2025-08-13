import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/quotes - Get all quotes
export async function GET() {
  try {
    console.log('Loading quotes via API...');
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading quotes:', error);
      return NextResponse.json(
        { error: 'Failed to load quotes', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Loaded ${data?.length || 0} quotes`);
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('Quotes API error:', error);
    // If quotes table doesn't exist yet, return empty array
    if (error.message?.includes('relation "quotes" does not exist')) {
      console.log('Quotes table not yet created, returning empty array');
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quotes - Create new quote
export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    console.log('Creating quote via API:', quoteData);

    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        ...quoteData,
        created_at: new Date().toISOString(),
        status: quoteData.status || 'draft'
      }])
      .select();

    if (error) {
      console.error('Error creating quote:', error);
      return NextResponse.json(
        { error: 'Failed to create quote', details: error.message },
        { status: 500 }
      );
    }

    console.log('Quote created:', data);
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
    
  } catch (error) {
    console.error('Quotes POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/quotes - Update quote
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    console.log('Updating quote via API:', { id, updateData });

    const { data, error } = await supabase
      .from('quotes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating quote:', error);
      return NextResponse.json(
        { error: 'Failed to update quote', details: error.message },
        { status: 500 }
      );
    }

    console.log('Quote updated:', data);
    return NextResponse.json({ data: data?.[0] });
    
  } catch (error) {
    console.error('Quotes PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quotes - Delete quote
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    console.log('Deleting quote via API:', id);

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quote:', error);
      return NextResponse.json(
        { error: 'Failed to delete quote', details: error.message },
        { status: 500 }
      );
    }

    console.log('Quote deleted:', id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Quotes DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}