import { createContext } from 'react'

import type { AdminSession } from '@/features/auth/authTypes'

export interface AuthContextValue {
  session: AdminSession | null
  isAuthenticated: boolean
  login: (adminKey: string) => Promise<AdminSession>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
