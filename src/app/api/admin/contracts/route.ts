import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/contracts - Get all contracts
export async function GET() {
  try {
    console.log('Loading contracts via API...');
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading contracts:', error);
      return NextResponse.json(
        { error: 'Failed to load contracts', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Loaded ${data?.length || 0} contracts`);
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('Contracts API error:', error);
    // If contracts table doesn't exist yet, return empty array
    if ((error as any).message?.includes('relation "contracts" does not exist')) {
      console.log('Contracts table not yet created, returning empty array');
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const contractData = await request.json();
    console.log('Creating contract via API:', contractData);

    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        ...contractData,
        created_at: new Date().toISOString(),
        status: contractData.status || 'draft'
      }])
      .select();

    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json(
        { error: 'Failed to create contract', details: error.message },
        { status: 500 }
      );
    }

    console.log('Contract created:', data);
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
    
  } catch (error) {
    console.error('Contracts POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/contracts - Update contract
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    console.log('Updating contract via API:', { id, updateData });

    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating contract:', error);
      return NextResponse.json(
        { error: 'Failed to update contract', details: error.message },
        { status: 500 }
      );
    }

    console.log('Contract updated:', data);
    return NextResponse.json({ data: data?.[0] });
    
  } catch (error) {
    console.error('Contracts PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/contracts - Delete contract
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    console.log('Deleting contract via API:', id);

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contract:', error);
      return NextResponse.json(
        { error: 'Failed to delete contract', details: error.message },
        { status: 500 }
      );
    }

    console.log('Contract deleted:', id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Contracts DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}