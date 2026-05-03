import type { GameType } from '@/types'
import type { Json } from '@/types/database'
import type { PlayerRecord } from '@/features/players/playersTypes'

export type MatchRecordStatus = 'COMPLETED' | 'VOIDED'
export type MatchEventType = 'MATCH' | 'VOID' | 'SETTLEMENT' | 'ADJUSTMENT'

export interface MatchHistoryFilters {
  gameType: GameType | 'ALL'
  status: MatchRecordStatus | 'ALL'
  dateFrom: string
  dateTo: string
}

export interface MatchHistoryItem {
  id: string
  gameType: GameType
  status: MatchRecordStatus
  playedAt: string
  note: string | null
  participantCount: number
  totalPositiveAmount: number
  totalNegativeAmount: number
  participantNames: string[]
}

export interface MatchParticipantDetail {
  id: string
  matchId: string
  playerId: string
  player: PlayerRecord | null
  placement: number | null
  netAmount: number
  metadata: Json
}

export interface LedgerLineDetail {
  id: string
  eventId: string
  playerId: string
  player: PlayerRecord | null
  amount: number
  metadata: Json
}

export interface LedgerEventDetail {
  id: string
  eventType: MatchEventType
  matchId: string | null
  note: string | null
  occurredAt: string
  createdAt: string
  totalAmount: number
  lines: LedgerLineDetail[]
}

export interface MatchDetail {
  id: string
  gameType: GameType
  status: MatchRecordStatus
  note: string | null
  playedAt: string
  createdAt: string
  voidedAt: string | null
  voidReason: string | null
  metadata: Json
  participants: MatchParticipantDetail[]
  ledgerEvents: LedgerEventDetail[]
  totalPositiveAmount: number
  totalNegativeAmount: number
  totalNetAmount: number
}

export interface CreateMatchParticipantPayload {
  player_id: string
  placement: number | null
  net_amount: number
  metadata: Json
}

export interface CreateMatchPayload {
  game_type: GameType
  played_at: string
  note: string | null
  metadata: Json
  participants: CreateMatchParticipantPayload[]
}

export interface CreateMatchInput {
  payload: CreateMatchPayload
  sessionToken: string
}

export interface CreateMatchResult {
  matchId: string | null
  raw: Json
}

export interface VoidMatchInput {
  matchId: string
  reason: string
  sessionToken: string
}

export interface VoidMatchResult {
  matchId: string | null
  ledgerEventId: string | null
  reversalLineCount: number
  raw: Json
}
