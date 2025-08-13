import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 })
    }

    // Validate type
    if (!['proposal', 'quote', 'contract'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be proposal, quote, or contract' }, { status: 400 })
    }

    // Check for payments before allowing deletion
    if (type === 'quote' || type === 'contract') {
      // Check if there are any payments associated with this quote/contract
      let paymentCheckQuery
      
      if (type === 'quote') {
        // Check payments table for this quote_id
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount, status')
          .eq('quote_id', id)
          .neq('status', 'failed') // Don't count failed payments
          .neq('status', 'cancelled') // Don't count cancelled payments

        if (paymentsError) {
          console.warn('Error checking payments (table might not exist):', paymentsError)
        } else if (payments && payments.length > 0) {
          return NextResponse.json({ 
            error: 'Cannot delete quote with existing payments', 
            hasPayments: true,
            payments: payments.length 
          }, { status: 400 })
        }
      } else if (type === 'contract') {
        // For contracts, check payments on the associated quote
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('quote_id')
          .eq('id', id)
          .single()

        if (contractError) {
          return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
        }

        if (contract?.quote_id) {
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, amount, status')
            .eq('quote_id', contract.quote_id)
            .neq('status', 'failed')
            .neq('status', 'cancelled')

          if (paymentsError) {
            console.warn('Error checking payments for contract (table might not exist):', paymentsError)
          } else if (payments && payments.length > 0) {
            return NextResponse.json({ 
              error: 'Cannot delete contract with existing payments', 
              hasPayments: true,
              payments: payments.length 
            }, { status: 400 })
          }
        }
      }
    }

    let deleteResult
    let deletedItem

    // Perform deletion based on type
    switch (type) {
      case 'proposal':
        // Delete proposal packages first (if they exist)
        try {
          await supabase
            .from('proposal_packages')
            .delete()
            .eq('proposal_id', id)
        } catch (error) {
          console.warn('proposal_packages table might not exist:', error)
        }

        // Delete the proposal
        deleteResult = await supabase
          .from('proposals')
          .delete()
          .eq('id', id)
          .select()
          .single()

        deletedItem = deleteResult.data
        break

      case 'quote':
        // Delete associated contracts first
        const { error: contractsDeleteError } = await supabase
          .from('contracts')
          .delete()
          .eq('quote_id', id)

        if (contractsDeleteError) {
          console.warn('Error deleting associated contracts:', contractsDeleteError)
        }

        // Delete the quote
        deleteResult = await supabase
          .from('quotes')
          .delete()
          .eq('id', id)
          .select()
          .single()

        deletedItem = deleteResult.data
        break

      case 'contract':
        // Delete the contract
        deleteResult = await supabase
          .from('contracts')
          .delete()
          .eq('id', id)
          .select()
          .single()

        deletedItem = deleteResult.data
        break
    }

    if (deleteResult?.error) {
      if (deleteResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` }, { status: 404 })
      }
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
      deletedItem 
    })

  } catch (error) {
    console.error('API error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}