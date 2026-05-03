import { useEffect, type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { isSessionExpired } from '@/features/auth/authStorage'
import { useAuth } from '@/features/auth/useAuth'

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isAuthenticated, logout, session } = useAuth()
  const isExpired = session ? isSessionExpired(session) : false

  useEffect(() => {
    if (isExpired) {
      logout()
    }
  }, [isExpired, logout])

  if (!isAuthenticated || isExpired) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return children
}
