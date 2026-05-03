import { handleSupabaseError } from '@/lib/supabaseErrors'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

import type {
  AdminSession,
  CheckAdminKeyRow,
} from '@/features/auth/authTypes'

function normalizeSession(row: CheckAdminKeyRow): AdminSession {
  if (
    !row.session_token ||
    row.role !== 'admin' ||
    !row.expires_at ||
    Number.isNaN(new Date(row.expires_at).getTime())
  ) {
    throw new Error('Supabase trả về phiên đăng nhập không hợp lệ.')
  }

  return {
    sessionToken: row.session_token,
    role: 'admin',
    expiresAt: row.expires_at,
  }
}

export async function checkAdminKey(inputKey: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Thiếu cấu hình Supabase URL hoặc anon key.')
  }

  const { data, error } = await supabase.rpc('check_admin_key', {
    input_key: inputKey,
  })

  if (error) {
    throw new Error(handleSupabaseError(error))
  }

  const row = Array.isArray(data) ? data[0] : null

  if (!row) {
    throw new Error('Supabase không trả về phiên đăng nhập.')
  }

  return normalizeSession(row)
}
