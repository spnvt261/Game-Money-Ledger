import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MatchDetailPage } from '@/features/matches/MatchDetailPage'
import { MatchesPage } from '@/features/matches/MatchesPage'
import { NewMatchPage } from '@/features/matches/NewMatchPage'
import { PlayersPage } from '@/features/players/PlayersPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'matches',
        element: <MatchesPage />,
      },
      {
        path: 'matches/new',
        element: <NewMatchPage />,
      },
      {
        path: 'matches/:id',
        element: <MatchDetailPage />,
      },
      {
        path: 'players',
        element: <PlayersPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
