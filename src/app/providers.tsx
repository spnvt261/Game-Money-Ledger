import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'

import { AuthProvider } from '@/features/auth/AuthProvider'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const status =
                typeof error === 'object' && error !== null && 'status' in error
                  ? Number(error.status)
                  : null

              if (status && status >= 400 && status < 500) {
                return false
              }

              return failureCount < 1
            },
            networkMode: 'online',
          },
          mutations: {
            networkMode: 'online',
            retry: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
