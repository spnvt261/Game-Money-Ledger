import type { GameType } from '@/types'
import type { Json } from '@/types/database'

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
