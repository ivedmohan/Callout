'use client';

/**
 * Privy + React Query Providers
 *
 * Uses Privy for social login (email, Google).
 * All wallet operations happen via the Starkzap SDK + Express backend.
 */

import { ReactNode, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PRIVY_APP_ID } from '@/lib/constants';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
          },
        },
      })
  );

  if (!PRIVY_APP_ID || PRIVY_APP_ID === 'your-privy-app-id') {
    // Render without Privy when no app ID is configured
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          theme="dark"
          toastClassName="!bg-zinc-900 !text-white !border !border-zinc-800"
        />
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          logo: '/logo.svg',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          theme="dark"
          toastClassName="!bg-zinc-900 !text-white !border !border-zinc-800"
        />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
