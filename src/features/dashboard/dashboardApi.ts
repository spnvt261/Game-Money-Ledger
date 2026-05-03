import { handleSupabaseError } from '@/lib/supabaseErrors'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'

type DashboardSummaryRow =
  Database['public']['Views']['v_dashboard_summary']['Row']

export interface DashboardSummary {
  totalPlayers: number
  activePlayers: number
  totalMatches: number
  totalCompletedMatches: number
  totalVoidedMatches: number
  totalMoneyMoved: number
}

const emptyDashboardSummary: DashboardSummary = {
  totalPlayers: 0,
  activePlayers: 0,
  totalMatches: 0,
  totalCompletedMatches: 0,
  totalVoidedMatches: 0,
  totalMoneyMoved: 0,
}

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Thiếu cấu hình Supabase URL hoặc anon key.')
  }

  return supabase
}

function mapDashboardSummary(
  row: DashboardSummaryRow | null,
): DashboardSummary {
  if (!row) {
    return emptyDashboardSummary
  }

  return {
    totalPlayers: Number(row.total_players ?? 0),
    activePlayers: Number(row.active_players ?? 0),
    totalMatches: Number(row.total_matches ?? 0),
    totalCompletedMatches: Number(row.total_completed_matches ?? 0),
    totalVoidedMatches: Number(row.total_voided_matches ?? 0),
    totalMoneyMoved: Number(row.total_money_moved ?? 0),
  }
}

export async function fetchDashboardSummary() {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('v_dashboard_summary')
    .select(
      'total_players, active_players, total_matches, total_completed_matches, total_voided_matches, total_money_moved',
    )
    .maybeSingle()

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không tải được tổng quan dashboard.'))
  }

  return mapDashboardSummary(data)
}
