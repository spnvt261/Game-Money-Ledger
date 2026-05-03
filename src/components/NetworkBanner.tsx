import { Activity, WifiOff } from 'lucide-react'

import type { NetworkStatus } from '@/lib/useNetworkStatus'
import { cn } from '@/lib/utils'

interface NetworkBannerProps {
  status: NetworkStatus
  className?: string
}

export function NetworkBanner({ status, className }: NetworkBannerProps) {
  if (status === 'offline') {
    return (
      <div
        className={cn(
          'border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive',
          className,
        )}
      >
        <div className="mx-auto flex max-w-7xl items-start gap-3">
          <WifiOff className="mt-0.5 size-4 shrink-0" />
          <p>
            Đang mất kết nối. Bạn vẫn có thể xem dữ liệu đã tải, nhưng chưa thể
            lưu thay đổi.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'slow') {
    return (
      <div
        className={cn(
          'border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800',
          className,
        )}
      >
        <div className="mx-auto flex max-w-7xl items-start gap-3">
          <Activity className="mt-0.5 size-4 shrink-0" />
          <p>Mạng đang yếu, thao tác lưu có thể chậm.</p>
        </div>
      </div>
    )
  }

  return null
}
