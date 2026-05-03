export type GameType = 'TFT' | 'BILLIARD'

export type MatchStatus = 'COMPLETED' | 'VOIDED'

export type LedgerEventType = 'MATCH' | 'VOID' | 'SETTLEMENT' | 'FUTURE_FUND_EVENT'

export interface Player {
  id: string
  displayName: string
  slug?: string | null
  avatarUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  gameType: GameType
  status: MatchStatus
  note?: string | null
  playedAt: string
  metadata?: Record<string, unknown> | null
  createdBySessionId?: string | null
  createdAt: string
  voidedAt?: string | null
  voidReason?: string | null
}

export interface MatchParticipant {
  id: string
  matchId: string
  playerId: string
  placement?: number | null
  netAmount: number
  metadata?: Record<string, unknown> | null
}

export interface LedgerEvent {
  id: string
  eventType: LedgerEventType
  matchId?: string | null
  note?: string | null
  occurredAt: string
  createdBySessionId?: string | null
  createdAt: string
}

export interface LedgerLine {
  id: string
  eventId: string
  playerId: string
  amount: number
  metadata?: Record<string, unknown> | null
}
