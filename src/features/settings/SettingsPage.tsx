import { Database, KeyRound, Settings2, Wifi } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { appConfig } from '@/lib/env'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useNetworkStatus } from '@/lib/useNetworkStatus'

type SettingsState = 'loading' | 'error' | 'empty'

export function SettingsPage() {
  const network = useNetworkStatus()
  const state = 'empty' as SettingsState

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Cài đặt"
        description="Thông tin phiên, cấu hình Supabase và trạng thái kết nối."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Ứng dụng</CardTitle>
                <CardDescription>VITE_APP_NAME</CardDescription>
              </div>
              <Settings2 className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{appConfig.appName}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Game Money Ledger
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Supabase</CardTitle>
                <CardDescription>URL và anon key</CardDescription>
              </div>
              <Database className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={isSupabaseConfigured ? 'success' : 'warning'}>
              {isSupabaseConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Kết nối</CardTitle>
                <CardDescription>navigator.onLine + ping</CardDescription>
              </div>
              <Wifi className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkStatusBadge
              status={network.status}
              latencyMs={network.latencyMs}
            />
          </CardContent>
        </Card>
      </section>

      {state === 'loading' ? <LoadingState /> : null}
      {state === 'error' ? <ErrorState /> : null}
      {state === 'empty' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Session storage</CardTitle>
              <CardDescription>Local admin session token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="size-5 text-muted-foreground" />
                  <code className="break-all text-sm">
                    {appConfig.sessionStorageKey}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tuỳ chọn tiền</CardTitle>
              <CardDescription>VND display</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Chưa có tuỳ chọn riêng"
                description="Định dạng VND mặc định đang áp dụng cho toàn bộ ledger."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
