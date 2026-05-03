import { handleSupabaseError } from '@/lib/supabaseErrors'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'

import type {
  CreatePlayerInput,
  PlayerBalance,
  PlayerRecord,
  UpdatePlayerInput,
} from '@/features/players/playersTypes'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PlayerBalanceRow = Database['public']['Views']['v_player_balances']['Row']

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Thiếu cấu hình Supabase URL hoặc anon key.')
  }

  return supabase
}

function mapPlayer(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    slug: row.slug,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPlayerBalance(row: PlayerBalanceRow): PlayerBalance {
  return {
    playerId: row.player_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    balanceAmount: Number(row.balance_amount ?? 0),
    matchCount: Number(row.match_count ?? 0),
  }
}

function normalizeAvatarUrl(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export async function fetchPlayers() {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('players')
    .select('id, display_name, slug, avatar_url, is_active, created_at, updated_at')
    .order('display_name', { ascending: true })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không tải được danh sách người chơi.'))
  }

  return (data ?? []).map(mapPlayer)
}

export async function fetchPlayerBalances() {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('v_player_balances')
    .select('player_id, display_name, avatar_url, is_active, balance_amount, match_count')
    .order('display_name', { ascending: true })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không tải được số dư người chơi.'))
  }

  return (data ?? []).map(mapPlayerBalance)
}

export async function createPlayer(input: CreatePlayerInput) {
  const client = ensureSupabase()
  const { data, error } = await client.rpc('create_player', {
    display_name: input.displayName,
    slug: input.slug,
    avatar_url: normalizeAvatarUrl(input.avatarUrl),
    is_active: input.isActive,
    session_token: input.sessionToken,
  })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không thể tạo người chơi.'))
  }

  return data
}

export async function updatePlayer(input: UpdatePlayerInput) {
  const client = ensureSupabase()
  const { data, error } = await client.rpc('update_player', {
    player_id: input.id,
    display_name: input.displayName,
    slug: input.slug,
    avatar_url: normalizeAvatarUrl(input.avatarUrl),
    is_active: input.isActive,
    session_token: input.sessionToken,
  })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không thể cập nhật người chơi.'))
  }

  return data
}
