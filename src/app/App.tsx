import { RouterProvider } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { AppProviders } from '@/app/providers'
import { isSupabaseConfigured, supabaseConfig } from '@/lib/supabaseClient'
import { router } from '@/routes/router'

export function App() {
  return (
    <AppProviders>
      {!isSupabaseConfigured ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Thieu cau hinh Supabase.</p>
              <p className="mt-1 text-amber-900">
                Hay them {supabaseConfig.missingKeys.join(', ')} vao file env de
                bat cac thao tac doc/ghi du lieu.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <RouterProvider router={router} />
    </AppProviders>
  )
}
