import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/admin/clients - Get all clients with session counts
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    console.log('Loading clients via API...');
    
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select(`
        *,
        sessions(count)
      `)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      return NextResponse.json(
        { error: 'Failed to load clients', details: clientsError.message },
        { status: 500 }
      );
    }

    // Transform the data to include session count (same as clients page)
    const clientsWithCounts = clientsData?.map(client => ({
      ...client,
      session_count: client.sessions?.[0]?.count || 0
    })) || [];

    console.log(`Loaded ${clientsWithCounts.length} clients`);
    return NextResponse.json({ data: clientsWithCounts });
    
  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const clientData = await request.json();
    console.log('Creating client via API:', clientData);

    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...clientData,
        admin_created: true, // Mark as admin-created
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: 'Failed to create client', details: error.message },
        { status: 500 }
      );
    }

    console.log('Client created:', data);
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
    
  } catch (error) {
    console.error('Clients POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/clients - Update client
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { id, ...updateData } = await request.json();
    console.log('Updating client via API:', { id, updateData });

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { error: 'Failed to update client', details: error.message },
        { status: 500 }
      );
    }

    console.log('Client updated:', data);
    return NextResponse.json({ data: data?.[0] });
    
  } catch (error) {
    console.error('Clients PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clients - Delete client
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await request.json();
    console.log('Deleting client via API:', id);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { error: 'Failed to delete client', details: error.message },
        { status: 500 }
      );
    }

    console.log('Client deleted:', id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Clients DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}