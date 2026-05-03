export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Game Money Ledger',
  sessionStorageKey:
    import.meta.env.VITE_SESSION_STORAGE_KEY || 'game_money_ledger_session',
  networkPingIntervalMs: Number(
    import.meta.env.VITE_NETWORK_PING_INTERVAL_MS || 15000,
  ),
  networkSlowTimeoutMs: Number(
    import.meta.env.VITE_NETWORK_SLOW_TIMEOUT_MS || 5000,
  ),
}
