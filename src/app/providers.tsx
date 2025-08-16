/**
 * Application Providers
 * Centralized provider setup for Tally Photography Management
 */

'use client';

import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
  userId?: string;
  isAdmin?: boolean;
}

export default function Providers({ children, userId, isAdmin = false }: ProvidersProps) {
  // Simple providers wrapper for now
  // Feature flag providers and other complex state can be added incrementally
  
  return (
    <>
      {children}
    </>
  );
}