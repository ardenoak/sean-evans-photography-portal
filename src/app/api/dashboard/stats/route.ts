import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PerformanceMonitor, RequestDeduplicator, ResponseCache, QueryOptimizer } from '@/lib/performance';

export async function GET(request: NextRequest) {
  const requestId = `dashboard-${Date.now()}`;
  const metrics = PerformanceMonitor.startTimer(requestId, '/api/dashboard/stats', 'GET');
  
  // Authentication is now handled by middleware
  
  try {
    // Check cache first
    const cacheKey = 'dashboard-stats';
    const cachedData = ResponseCache.get(cacheKey);
    if (cachedData) {
      PerformanceMonitor.endTimer(requestId, 200);
      return NextResponse.json(cachedData);
    }
    
    // Use request deduplication for concurrent requests
    return await RequestDeduplicator.deduplicate(cacheKey, async () => {
      const supabase = getSupabaseAdmin();
      console.log('🔵 [DASHBOARD API] Loading consolidated dashboard stats...');
    
      // Execute all queries in parallel with performance monitoring
      const [
        leadsResult,
        clientsResult,
        sessionsResult,
        quotesResult,
        contractsResult,
        paymentsResult
      ] = await Promise.all([
        // Get leads data
        QueryOptimizer.withTiming('dashboard-leads', async () => {
          const result = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance
          return result;
        }),
        
        // Get clients with session counts
        QueryOptimizer.withTiming('dashboard-clients', async () => {
          const result = await supabase
            .from('clients')
            .select(`
              *,
              sessions(count)
            `)
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance
          return result;
        }),
        
        // Get sessions with client data
        QueryOptimizer.withTiming('dashboard-sessions', async () => {
          const result = await supabase
            .from('sessions')
            .select(`
              *,
              clients!inner(first_name, last_name, email)
            `)
            .order('session_date', { ascending: false })
            .limit(100); // Limit for performance
          return result;
        }),
        
        // Get all quotes (optimized with limit)
        QueryOptimizer.withTiming('dashboard-quotes', async () => {
          const result = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance
          return result;
        }),
        
        // Get all contracts (optimized with limit)
        QueryOptimizer.withTiming('dashboard-contracts', async () => {
          const result = await supabase
            .from('contracts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance
          return result;
        }),
        
        // Get all payments with error handling for missing table
        QueryOptimizer.withTiming('dashboard-payments', async () => {
          try {
            const result = await supabase
              .from('payments')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100); // Limit for performance
            return result;
          } catch (error: any) {
            if (error.message?.includes('relation "payments" does not exist')) {
              console.log('⚠️ [DASHBOARD API] Payments table not yet created, using empty array');
              return { data: [], error: null };
            }
            throw error;
          }
        })
      ]);

    // Process and aggregate the data
    const leads = (leadsResult as any)?.data || [];
    const clients = (clientsResult as any)?.data || [];
    const sessions = (sessionsResult as any)?.data || [];
    const quotes = (quotesResult as any)?.data || [];
    const contracts = (contractsResult as any)?.data || [];
    const payments = (paymentsResult as any)?.data || [];

    // Calculate upcoming sessions (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= today && sessionDate <= nextWeek;
    });

    // Count pending payments
    const pendingPayments = payments.filter((payment: any) => payment.status === 'pending');

    // Transform clients data to include session counts
    const clientsWithCounts = clients.map((client: any) => ({
      ...client,
      session_count: client.sessions?.[0]?.count || 0
    }));

    // Enhance sessions data with client names
    const sessionsWithClientNames = sessions.map((session: any) => ({
      ...session,
      client_name: session.clients 
        ? `${session.clients.first_name} ${session.clients.last_name}`
        : 'Unknown Client'
    }));

    // Prepare consolidated dashboard stats
    const dashboardStats = {
      // Core metrics
      totalLeads: leads.length,
      totalClients: clientsWithCounts.length,
      totalSessions: sessionsWithClientNames.length,
      totalQuotes: quotes.length,
      totalContracts: contracts.length,
      upcomingSessions: upcomingSessions.length,
      pendingPayments: pendingPayments.length,
      
      // Recent data for activity feeds (first 5 of each)
      recentLeads: leads.slice(0, 5),
      recentSessions: sessionsWithClientNames.slice(0, 5),
      recentQuotes: quotes.slice(0, 5),
      
      // Performance metrics
      conversionRate: quotes.length > 0 ? Math.round((contracts.length / quotes.length) * 100) : 0,
      
      // Raw data for detailed views (if needed)
      allData: {
        leads,
        clients: clientsWithCounts,
        sessions: sessionsWithClientNames,
        quotes,
        contracts,
        payments
      }
    };

      const endTime = Date.now();
      const duration = endTime - metrics.startTime;

      console.log(`✅ [DASHBOARD API] Stats loaded successfully in ${duration}ms:`, {
        totalLeads: dashboardStats.totalLeads,
        totalClients: dashboardStats.totalClients,
        totalSessions: dashboardStats.totalSessions,
        totalQuotes: dashboardStats.totalQuotes,
        totalContracts: dashboardStats.totalContracts,
        upcomingSessions: dashboardStats.upcomingSessions,
        pendingPayments: dashboardStats.pendingPayments,
        duration: `${duration}ms`
      });

      // Prepare response data
      const responseData = {
        data: dashboardStats,
        meta: {
          requestTime: duration,
          timestamp: new Date().toISOString(),
          cached: false
        }
      };

      // Cache the response for 30 seconds
      ResponseCache.set(cacheKey, responseData, 30);

      // Add performance headers
      const response = NextResponse.json(responseData);
      response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      response.headers.set('X-Response-Time', `${duration}ms`);
      
      PerformanceMonitor.endTimer(requestId, 200, JSON.stringify(responseData).length);
      
      return response;
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    
    console.error('❌ [DASHBOARD API] Error loading dashboard stats:', error);
    
    PerformanceMonitor.endTimer(requestId, 500);
    
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard stats', 
        details: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          requestTime: duration,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}