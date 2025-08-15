import { NextResponse } from 'next/server';

/**
 * 🏥 HEALTH CHECK ENDPOINT
 * 
 * Public health check endpoint for monitoring and load balancers.
 * This endpoint is excluded from authentication requirements.
 */

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      security: {
        headers: 'enabled',
        authentication: process.env.NODE_ENV === 'production' ? 'enabled' : 'development',
        rateLimit: 'enabled'
      }
    };
    
    return NextResponse.json(healthStatus, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}