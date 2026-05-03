export interface PlayerRecord {
  id: string
  displayName: string
  slug: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PlayerBalance {
  playerId: string
  displayName: string
  avatarUrl: string | null
  isActive: boolean
  balanceAmount: number
  matchCount: number
}

export interface PlayerWithBalance extends PlayerRecord {
  balanceAmount: number
  matchCount: number
}

export interface PlayerFormValues {
  displayName: string
  slug: string
  avatarUrl: string
  isActive: boolean
}

export interface CreatePlayerInput extends PlayerFormValues {
  sessionToken: string
}

export interface UpdatePlayerInput extends PlayerFormValues {
  id: string
  sessionToken: string
}
