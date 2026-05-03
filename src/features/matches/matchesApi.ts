import type {
  CreateMatchInput,
  CreateMatchResult,
} from '@/features/matches/matchesTypes'
import { handleSupabaseError } from '@/lib/supabaseErrors'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Json } from '@/types/database'

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Thiếu cấu hình Supabase URL hoặc anon key.')
  }

  return supabase
}

function getMatchId(data: Json) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return null
  }

  const matchId = data.match_id
  return typeof matchId === 'string' ? matchId : null
}

export async function createMatch({
  payload,
  sessionToken,
}: CreateMatchInput): Promise<CreateMatchResult> {
  const client = ensureSupabase()
  const { data, error } = await client.rpc('create_match', {
    payload: payload as unknown as Json,
    session_token: sessionToken,
  })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không thể lưu trận.'))
  }

  const raw = data ?? null

  return {
    matchId: getMatchId(raw),
    raw,
  }
}
