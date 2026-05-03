import { appConfig } from '@/lib/env'

import type { AdminSession } from '@/features/auth/authTypes'

export const authStorageKey = appConfig.sessionStorageKey

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseSession(value: unknown): AdminSession | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.sessionToken !== 'string' ||
    value.role !== 'admin' ||
    typeof value.expiresAt !== 'string'
  ) {
    return null
  }

  return {
    sessionToken: value.sessionToken,
    role: value.role,
    expiresAt: value.expiresAt,
  }
}

export function isSessionExpired(session: AdminSession, now = new Date()) {
  const expiresAt = new Date(session.expiresAt).getTime()

  if (Number.isNaN(expiresAt)) {
    return true
  }

  return expiresAt <= now.getTime()
}

export function loadStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawSession = window.localStorage.getItem(authStorageKey)

    if (!rawSession) {
      return null
    }

    const session = parseSession(JSON.parse(rawSession))

    if (!session || isSessionExpired(session)) {
      clearStoredSession()
      return null
    }

    return session
  } catch {
    clearStoredSession()
    return null
  }
}

export function saveStoredSession(session: AdminSession) {
  window.localStorage.setItem(authStorageKey, JSON.stringify(session))
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(authStorageKey)
}
