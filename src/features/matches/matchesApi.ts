import type {
  CreateMatchInput,
  CreateMatchResult,
  LedgerEventDetail,
  LedgerLineDetail,
  MatchDetail,
  MatchHistoryFilters,
  MatchHistoryItem,
  MatchParticipantDetail,
  VoidMatchInput,
  VoidMatchResult,
} from '@/features/matches/matchesTypes'
import type { PlayerRecord } from '@/features/players/playersTypes'
import { handleSupabaseError } from '@/lib/supabaseErrors'
import {
  isSupabaseConfigured,
  supabase,
  type AppSupabaseClient,
} from '@/lib/supabaseClient'
import type { Database, Json } from '@/types/database'

type MatchHistoryRow = Database['public']['Views']['v_match_history']['Row']
type MatchParticipantRow =
  Database['public']['Tables']['match_participants']['Row']
type LedgerEventRow = Database['public']['Tables']['ledger_events']['Row']
type LedgerLineRow = Database['public']['Tables']['ledger_lines']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Thiếu cấu hình Supabase URL hoặc anon key.')
  }

  return supabase
}

function getJsonObject(data: Json) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return null
  }

  return data
}

function getStringValue(data: Json, key: string) {
  const object = getJsonObject(data)
  const value = object?.[key]
  return typeof value === 'string' ? value : null
}

function getNumberValue(data: Json, key: string) {
  const object = getJsonObject(data)
  const value = object?.[key]
  return typeof value === 'number' ? value : 0
}

function getMatchId(data: Json) {
  return getStringValue(data, 'match_id')
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

async function fetchPlayersById(
  client: AppSupabaseClient,
  playerIds: string[],
) {
  const uniquePlayerIds = Array.from(new Set(playerIds)).filter(Boolean)

  if (uniquePlayerIds.length === 0) {
    return new Map<string, PlayerRecord>()
  }

  const { data, error } = await client
    .from('players')
    .select('id, display_name, slug, avatar_url, is_active, created_at, updated_at')
    .in('id', uniquePlayerIds)

  if (error) {
    throw new Error(
      handleSupabaseError(error, 'Không tải được thông tin người chơi.'),
    )
  }

  return new Map((data ?? []).map((row) => [row.id, mapPlayer(row)]))
}

function toStartOfDayIso(value: string) {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toEndOfDayIso(value: string) {
  if (!value) return null

  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function mapHistoryRow(row: MatchHistoryRow): MatchHistoryItem {
  return {
    id: row.match_id,
    gameType: row.game_type,
    status: row.status,
    playedAt: row.played_at,
    note: row.note,
    participantCount: Number(row.participant_count ?? 0),
    totalPositiveAmount: Number(row.total_positive_amount ?? 0),
    totalNegativeAmount: Number(row.total_negative_amount ?? 0),
    participantNames: [],
  }
}

function mapParticipantRow(
  row: MatchParticipantRow,
  playersById: Map<string, PlayerRecord>,
): MatchParticipantDetail {
  return {
    id: row.id,
    matchId: row.match_id,
    playerId: row.player_id,
    player: playersById.get(row.player_id) ?? null,
    placement: row.placement,
    netAmount: Number(row.net_amount),
    metadata: row.metadata,
  }
}

function mapLedgerLineRow(
  row: LedgerLineRow,
  playersById: Map<string, PlayerRecord>,
): LedgerLineDetail {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    player: playersById.get(row.player_id) ?? null,
    amount: Number(row.amount),
    metadata: row.metadata,
  }
}

function mapLedgerEventRow(
  row: LedgerEventRow,
  lines: LedgerLineDetail[],
): LedgerEventDetail {
  return {
    id: row.id,
    eventType: row.event_type,
    matchId: row.match_id,
    note: row.note,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    totalAmount: lines.reduce((sum, line) => sum + line.amount, 0),
    lines,
  }
}

export async function fetchMatchHistory(filters: MatchHistoryFilters) {
  const client = ensureSupabase()
  let query = client
    .from('v_match_history')
    .select(
      'match_id, game_type, status, played_at, note, participant_count, total_positive_amount, total_negative_amount',
    )
    .order('played_at', { ascending: false })

  if (filters.gameType !== 'ALL') {
    query = query.eq('game_type', filters.gameType)
  }

  if (filters.status !== 'ALL') {
    query = query.eq('status', filters.status)
  }

  const dateFrom = toStartOfDayIso(filters.dateFrom)
  const dateTo = toEndOfDayIso(filters.dateTo)

  if (dateFrom) {
    query = query.gte('played_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('played_at', dateTo)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không tải được lịch sử trận.'))
  }

  const historyRows = (data ?? []).map(mapHistoryRow)
  const matchIds = historyRows.map((row) => row.id)

  if (matchIds.length === 0) {
    return historyRows
  }

  const { data: participantRows, error: participantError } = await client
    .from('match_participants')
    .select('match_id, player_id')
    .in('match_id', matchIds)

  if (participantError) {
    throw new Error(
      handleSupabaseError(
        participantError,
        'Không tải được người chơi trong lịch sử trận.',
      ),
    )
  }

  const playersById = await fetchPlayersById(
    client,
    (participantRows ?? []).map((row) => row.player_id),
  )
  const namesByMatchId = new Map<string, string[]>()

  for (const row of participantRows ?? []) {
    const player = playersById.get(row.player_id)
    const names = namesByMatchId.get(row.match_id) ?? []
    names.push(player?.displayName ?? 'Người chơi không còn tồn tại')
    namesByMatchId.set(row.match_id, names)
  }

  return historyRows.map((row) => ({
    ...row,
    participantNames: namesByMatchId.get(row.id) ?? [],
  }))
}

export async function fetchMatchDetail(matchId: string): Promise<MatchDetail> {
  const client = ensureSupabase()
  const { data: matchRow, error: matchError } = await client
    .from('matches')
    .select(
      'id, game_type, status, note, played_at, metadata, created_at, voided_at, void_reason',
    )
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) {
    throw new Error(handleSupabaseError(matchError, 'Không tải được chi tiết trận.'))
  }

  if (!matchRow) {
    throw new Error('Không tìm thấy trận.')
  }

  const [participantsResponse, eventsResponse] = await Promise.all([
    client
      .from('match_participants')
      .select('id, match_id, player_id, placement, net_amount, metadata')
      .eq('match_id', matchId)
      .order('placement', { ascending: true }),
    client
      .from('ledger_events')
      .select(
        'id, event_type, match_id, note, occurred_at, created_by_session_id, created_at',
      )
      .eq('match_id', matchId)
      .order('occurred_at', { ascending: true }),
  ])

  if (participantsResponse.error) {
    throw new Error(
      handleSupabaseError(
        participantsResponse.error,
        'Không tải được participants của trận.',
      ),
    )
  }

  if (eventsResponse.error) {
    throw new Error(
      handleSupabaseError(
        eventsResponse.error,
        'Không tải được ledger events của trận.',
      ),
    )
  }

  const eventRows = eventsResponse.data ?? []
  const eventIds = eventRows.map((event) => event.id)
  const lineRows = eventIds.length
    ? await fetchLedgerLinesForEvents(client, eventIds)
    : []
  const participantRows = participantsResponse.data ?? []
  const playersById = await fetchPlayersById(client, [
    ...participantRows.map((row) => row.player_id),
    ...lineRows.map((row) => row.player_id),
  ])
  const participants = participantRows
    .map((row) => mapParticipantRow(row, playersById))
    .sort((a, b) => {
      if (a.placement === null && b.placement === null) {
        return (a.player?.displayName ?? '').localeCompare(b.player?.displayName ?? '')
      }

      if (a.placement === null) return 1
      if (b.placement === null) return -1
      return a.placement - b.placement
    })
  const linesByEventId = new Map<string, LedgerLineDetail[]>()

  for (const row of lineRows) {
    const line = mapLedgerLineRow(row, playersById)
    const lines = linesByEventId.get(row.event_id) ?? []
    lines.push(line)
    linesByEventId.set(row.event_id, lines)
  }

  const ledgerEvents = eventRows.map((event) =>
    mapLedgerEventRow(
      event,
      (linesByEventId.get(event.id) ?? []).sort((a, b) => b.amount - a.amount),
    ),
  )
  const totalPositiveAmount = participants.reduce(
    (sum, participant) =>
      participant.netAmount > 0 ? sum + participant.netAmount : sum,
    0,
  )
  const totalNegativeAmount = participants.reduce(
    (sum, participant) =>
      participant.netAmount < 0 ? sum + participant.netAmount : sum,
    0,
  )

  return {
    id: matchRow.id,
    gameType: matchRow.game_type,
    status: matchRow.status,
    note: matchRow.note,
    playedAt: matchRow.played_at,
    createdAt: matchRow.created_at,
    voidedAt: matchRow.voided_at,
    voidReason: matchRow.void_reason,
    metadata: matchRow.metadata,
    participants,
    ledgerEvents,
    totalPositiveAmount,
    totalNegativeAmount,
    totalNetAmount: totalPositiveAmount + totalNegativeAmount,
  }
}

async function fetchLedgerLinesForEvents(
  client: AppSupabaseClient,
  eventIds: string[],
) {
  const { data, error } = await client
    .from('ledger_lines')
    .select('id, event_id, player_id, amount, metadata')
    .in('event_id', eventIds)

  if (error) {
    throw new Error(
      handleSupabaseError(error, 'Không tải được ledger lines của trận.'),
    )
  }

  return data ?? []
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

export async function voidMatch({
  matchId,
  reason,
  sessionToken,
}: VoidMatchInput): Promise<VoidMatchResult> {
  const client = ensureSupabase()
  const { data, error } = await client.rpc('void_match', {
    match_id: matchId,
    reason,
    session_token: sessionToken,
  })

  if (error) {
    throw new Error(handleSupabaseError(error, 'Không thể hủy trận.'))
  }

  const raw = data ?? null

  return {
    matchId: getMatchId(raw),
    ledgerEventId: getStringValue(raw, 'ledger_event_id'),
    reversalLineCount: getNumberValue(raw, 'reversal_line_count'),
    raw,
  }
}
