import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/payments - Get all payments
export async function GET() {
  try {
    console.log('Loading payments via API...');
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading payments:', error);
      return NextResponse.json(
        { error: 'Failed to load payments', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Loaded ${data?.length || 0} payments`);
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('Payments API error:', error);
    // If payments table doesn't exist yet, return empty array
    if (error.message?.includes('relation "payments" does not exist')) {
      console.log('Payments table not yet created, returning empty array');
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    console.log('Creating payment via API:', paymentData);

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        ...paymentData,
        created_at: new Date().toISOString(),
        status: paymentData.status || 'pending'
      }])
      .select();

    if (error) {
      console.error('Error creating payment:', error);
      return NextResponse.json(
        { error: 'Failed to create payment', details: error.message },
        { status: 500 }
      );
    }

    console.log('Payment created:', data);
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
    
  } catch (error) {
    console.error('Payments POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payments - Update payment
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    console.log('Updating payment via API:', { id, updateData });

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json(
        { error: 'Failed to update payment', details: error.message },
        { status: 500 }
      );
    }

    console.log('Payment updated:', data);
    return NextResponse.json({ data: data?.[0] });
    
  } catch (error) {
    console.error('Payments PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payments - Delete payment
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    console.log('Deleting payment via API:', id);

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      return NextResponse.json(
        { error: 'Failed to delete payment', details: error.message },
        { status: 500 }
      );
    }

    console.log('Payment deleted:', id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Payments DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}