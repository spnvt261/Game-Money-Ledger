import { Activity, Loader2, Wifi, WifiOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { NetworkStatus } from '@/lib/useNetworkStatus'

interface NetworkStatusBadgeProps {
  status: NetworkStatus
  latencyMs?: number | null
}

const labels: Record<NetworkStatus, string> = {
  online: 'Có mạng',
  offline: 'Mất mạng',
  slow: 'Mạng yếu',
  checking: 'Đang kiểm tra',
}

export function NetworkStatusBadge({
  status,
  latencyMs,
}: NetworkStatusBadgeProps) {
  const icon =
    status === 'online' ? (
      <Wifi />
    ) : status === 'offline' ? (
      <WifiOff />
    ) : status === 'slow' ? (
      <Activity />
    ) : (
      <Loader2 className="animate-spin" />
    )

  const variant =
    status === 'online'
      ? 'success'
      : status === 'slow'
        ? 'warning'
        : status === 'offline'
          ? 'destructive'
          : 'secondary'

  return (
    <Badge variant={variant}>
      {icon}
      <span>{labels[status]}</span>
      {latencyMs ? (
        <span className="text-[11px] opacity-70">{latencyMs}ms</span>
      ) : null}
    </Badge>
  )
}
