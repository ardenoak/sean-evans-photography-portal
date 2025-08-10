'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase connection test
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const directSupabase = createClient(supabaseUrl, supabaseKey);

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectAuth = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      log('Starting direct Supabase auth test...');
      log(`URL: ${supabaseUrl}`);
      log(`Key length: ${supabaseKey?.length}`);
      
      // Test 1: Basic connection
      log('Test 1: Basic connection test...');
      const connectionPromise = directSupabase
        .from('admin_users')
        .select('count')
        .limit(1);
        
      const connectionTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 5000);
      });
      
      try {
        const connectionResult = await Promise.race([connectionPromise, connectionTimeout]);
        log(`Connection test result: ${JSON.stringify(connectionResult)}`);
      } catch (err) {
        log(`Connection test failed: ${err}`);
      }
      
      // Test 2: Auth attempt with timeout
      log('Test 2: Direct auth attempt...');
      const authPromise = directSupabase.auth.signInWithPassword({
        email,
        password
      });
      
      const authTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout after 10 seconds')), 10000);
      });
      
      try {
        const authResult = await Promise.race([authPromise, authTimeout]);
        log(`Auth result: ${JSON.stringify({ 
          success: !authResult.error, 
          error: authResult.error?.message,
          user: authResult.data?.user?.email 
        })}`);
      } catch (err) {
        log(`Auth failed: ${err}`);
      }
      
      // Test 3: Network connectivity
      log('Test 3: Network connectivity test...');
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        log(`Network test: ${response.status} ${response.statusText}`);
      } catch (err) {
        log(`Network test failed: ${err}`);
      }
      
    } catch (error) {
      log(`Overall test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Direct Supabase Auth Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="password"
              />
            </div>
            <button
              onClick={testDirectAuth}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Direct Auth'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-50 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No test results yet...</p>
            ) : (
              results.map((result, i) => (
                <div key={i} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}