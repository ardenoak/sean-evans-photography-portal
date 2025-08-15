'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TableStatus {
  name: string;
  exists: boolean;
  count?: number;
  error?: string;
}

export default function DatabaseStatusPage() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    const tables = [
      'leads',
      'clients', 
      'sessions',
      'custom_packages',
      'package_categories',
      'proposals',
      'proposal_packages',
      'quotes',
      'contracts'
    ];

    const statuses: TableStatus[] = [];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          statuses.push({
            name: table,
            exists: false,
            error: error.message
          });
        } else {
          statuses.push({
            name: table,
            exists: true,
            count: count || 0
          });
        }
      } catch (e) {
        statuses.push({
          name: table,
          exists: false,
          error: 'Connection error'
        });
      }
    }

    setTableStatuses(statuses);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Checking database status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-charcoal tracking-wide mb-4">Database Status</h1>
        <div className="w-24 h-px bg-gold mx-auto mb-4"></div>
        <p className="text-charcoal/70 font-light tracking-wide max-w-2xl mx-auto">
          Check the status of all database tables and connections.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-charcoal/10 shadow-lg">
          <div className="p-8">
            <div className="grid gap-4">
              {tableStatuses.map((status) => (
                <div
                  key={status.name}
                  className={`flex items-center justify-between p-4 border rounded ${
                    status.exists 
                      ? 'border-verde/30 bg-verde/5' 
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status.exists ? 'bg-verde' : 'bg-red-500'
                    }`}></div>
                    <span className="font-mono text-sm text-charcoal">
                      {status.name}
                    </span>
                  </div>
                  <div className="text-right">
                    {status.exists ? (
                      <div className="text-sm text-charcoal/70">
                        {status.count} rows
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        {status.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-charcoal/10">
              <h3 className="text-lg font-light text-charcoal mb-4">Migration Scripts</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-charcoal/5 rounded">
                  <strong>Core System:</strong> Run <code>scripts/create-proposal-system.sql</code> in Supabase
                </div>
                <div className="p-3 bg-charcoal/5 rounded">
                  <strong>Discounts:</strong> Run <code>scripts/add-discount-fields.sql</code> in Supabase
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button 
                onClick={checkDatabaseStatus}
                className="bg-charcoal text-white py-2 px-4 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
              >
                Refresh Status
              </button>
              <a 
                href="https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-charcoal/30 text-charcoal py-2 px-4 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
              >
                Open Supabase SQL Editor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}