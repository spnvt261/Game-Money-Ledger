import { useCallback, useEffect, useMemo, useState } from 'react'

import { appConfig } from '@/lib/env'

export type NetworkStatus = 'online' | 'offline' | 'slow' | 'checking'

interface NetworkSnapshot {
  status: NetworkStatus
  lastCheckedAt: Date | null
  latencyMs: number | null
}

const initialStatus: NetworkSnapshot = {
  status:
    typeof navigator === 'undefined'
      ? 'checking'
      : navigator.onLine
        ? 'checking'
        : 'offline',
  lastCheckedAt: null,
  latencyMs: null,
}

export function useNetworkStatus() {
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(initialStatus)

  const checkNow = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSnapshot({
        status: 'offline',
        lastCheckedAt: new Date(),
        latencyMs: null,
      })
      return
    }

    const startedAt = performance.now()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      appConfig.networkSlowTimeoutMs,
    )

    setSnapshot((current) => ({
      ...current,
      status: 'checking',
    }))

    try {
      await fetch(`${window.location.origin}/?network-check=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })

      const latencyMs = Math.round(performance.now() - startedAt)
      setSnapshot({
        status:
          latencyMs > appConfig.networkSlowTimeoutMs ? 'slow' : 'online',
        lastCheckedAt: new Date(),
        latencyMs,
      })
    } catch {
      const latencyMs = Math.round(performance.now() - startedAt)
      setSnapshot({
        status: latencyMs >= appConfig.networkSlowTimeoutMs ? 'slow' : 'offline',
        lastCheckedAt: new Date(),
        latencyMs,
      })
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      void checkNow()
    }
    const handleOffline = () => {
      setSnapshot({
        status: 'offline',
        lastCheckedAt: new Date(),
        latencyMs: null,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const startupCheckId = window.setTimeout(() => void checkNow(), 0)
    const intervalId = window.setInterval(
      () => void checkNow(),
      appConfig.networkPingIntervalMs,
    )

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.clearTimeout(startupCheckId)
      window.clearInterval(intervalId)
    }
  }, [checkNow])

  return useMemo(
    () => ({
      ...snapshot,
      isOnline: snapshot.status !== 'offline',
      checkNow,
    }),
    [checkNow, snapshot],
  )
}
