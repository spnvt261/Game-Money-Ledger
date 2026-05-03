import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { checkAdminKey } from '@/features/auth/authApi'
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext'
import {
  authStorageKey,
  clearStoredSession,
  isSessionExpired,
  loadStoredSession,
  saveStoredSession,
} from '@/features/auth/authStorage'
import type { AdminSession } from '@/features/auth/authTypes'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(() =>
    loadStoredSession(),
  )

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  const login = useCallback(async (adminKey: string) => {
    const nextSession = await checkAdminKey(adminKey)
    saveStoredSession(nextSession)
    setSession(nextSession)

    return nextSession
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === authStorageKey) {
        setSession(loadStoredSession())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSession((currentSession) => {
        if (!currentSession || !isSessionExpired(currentSession)) {
          return currentSession
        }

        clearStoredSession()
        return null
      })
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session && !isSessionExpired(session)),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
