import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  PlusCircle,
  Save,
  Trash2,
  Trophy,
  UsersRound,
  WifiOff,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/useAuth'
import { createMatch } from '@/features/matches/matchesApi'
import type { CreateMatchPayload } from '@/features/matches/matchesTypes'
import {
  calculateTftResults,
  getTftRuleCode,
  sumNetAmount,
  TFT_PENALTY_AMOUNT,
  validateZeroSum,
  type TftParticipantCount,
} from '@/features/matches/tftRules'
import { fetchPlayers } from '@/features/players/playersApi'
import type { PlayerRecord } from '@/features/players/playersTypes'
import { formatVnd, parseMoneyInput } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import { useNetworkStatus } from '@/lib/useNetworkStatus'
import { cn } from '@/lib/utils'
import type { GameType } from '@/types'
import type { Json } from '@/types/database'

type PlacementValue = number | ''

interface TftDraft {
  slotId: string
  playerId: string
  placement: PlacementValue
  top2: boolean
  top8: boolean
}

interface BilliardDraft {
  slotId: string
  playerId: string
  netAmountInput: string
}

interface PreviewReason {
  label: string
  value: number
}

interface PreviewRow {
  playerId: string
  displayName: string
  avatarUrl: string | null
  placement: number | null
  netAmount: number
  reasons: PreviewReason[]
  badges: string[]
}

const emptyPlayers: PlayerRecord[] = []
const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'
const textareaClassName =
  'min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'

let billiardDraftId = 0

function createBilliardDraft(): BilliardDraft {
  billiardDraftId += 1

  return {
    slotId: `billiard-${billiardDraftId}`,
    playerId: '',
    netAmountInput: '',
  }
}

function buildTftDrafts(
  participantCount: TftParticipantCount,
  currentDrafts: TftDraft[] = [],
) {
  return Array.from({ length: participantCount }, (_, index) => {
    const currentDraft = currentDrafts[index]
    const fallbackPlacement = index + 1
    const placement =
      typeof currentDraft?.placement === 'number' &&
      currentDraft.placement >= 1 &&
      currentDraft.placement <= participantCount
        ? currentDraft.placement
        : fallbackPlacement

    return {
      slotId: currentDraft?.slotId ?? `tft-${fallbackPlacement}`,
      playerId: currentDraft?.playerId ?? '',
      placement,
      top2: currentDraft?.top2 ?? false,
      top8: currentDraft?.top8 ?? false,
    }
  })
}

function getDefaultPlayedAt() {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function toPlayedAtIso(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function normalizeNote(note: string) {
  const trimmedNote = note.trim()
  return trimmedNote ? trimmedNote : null
}

function getPlayerLabel(player: PlayerRecord | undefined) {
  return player?.displayName ?? 'Chưa chọn người chơi'
}

function SectionTitle({
  description,
  icon,
  step,
  title,
}: {
  description: string
  icon: ReactNode
  step: number
  title: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-normal text-primary">
          Bước {step}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-normal">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function PreviewGroup({
  emptyLabel,
  icon,
  rows,
  title,
}: {
  emptyLabel: string
  icon: ReactNode
  rows: PreviewRow[]
  title: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={`${row.playerId}-${row.placement ?? 'manual'}`}
              className="rounded-lg border bg-background p-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <PlayerAvatar
                  avatarUrl={row.avatarUrl}
                  displayName={row.displayName}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{row.displayName}</h3>
                    {row.placement ? (
                      <Badge variant="secondary">Hạng {row.placement}</Badge>
                    ) : null}
                    {row.badges.map((badge) => (
                      <Badge key={badge} variant="outline">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    {row.reasons.map((reason) => (
                      <div key={reason.label} className="rounded-md bg-muted/40 p-2">
                        <span className="block">{reason.label}</span>
                        <MoneyText
                          value={reason.value}
                          className="mt-1 block font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <MoneyText value={row.netAmount} className="text-lg font-semibold" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </div>
  )
}

function getSelectedPlayerIds(drafts: Array<{ playerId: string }>) {
  return drafts.map((draft) => draft.playerId).filter(Boolean)
}

function renderPlayerOptions(
  players: PlayerRecord[],
  selectedPlayerIds: string[],
  currentPlayerId: string,
) {
  return players.map((player) => (
    <option
      key={player.id}
      disabled={selectedPlayerIds.includes(player.id) && player.id !== currentPlayerId}
      value={player.id}
    >
      {player.displayName}
    </option>
  ))
}

function renderPlacementOptions(
  participantCount: TftParticipantCount,
  selectedPlacements: number[],
  currentPlacement: PlacementValue,
) {
  return Array.from({ length: participantCount }, (_, index) => {
    const placement = index + 1

    return (
      <option
        key={placement}
        disabled={
          selectedPlacements.includes(placement) && placement !== currentPlacement
        }
        value={placement}
      >
        Hạng {placement}
      </option>
    )
  })
}

export function NewMatchPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const network = useNetworkStatus()
  const { session } = useAuth()
  const [gameType, setGameType] = useState<GameType>('TFT')
  const [playedAt, setPlayedAt] = useState(getDefaultPlayedAt)
  const [note, setNote] = useState('')
  const [tftParticipantCount, setTftParticipantCount] =
    useState<TftParticipantCount>(4)
  const [tftDrafts, setTftDrafts] = useState<TftDraft[]>(() => buildTftDrafts(4))
  const [billiardDrafts, setBilliardDrafts] = useState<BilliardDraft[]>(() => [
    createBilliardDraft(),
    createBilliardDraft(),
  ])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const sessionToken = session?.sessionToken

  const playersQuery = useQuery({
    queryKey: queryKeys.players,
    queryFn: fetchPlayers,
  })

  const players = playersQuery.data ?? emptyPlayers
  const activePlayers = useMemo(
    () => players.filter((player) => player.isActive),
    [players],
  )
  const playerById = useMemo(
    () => new Map(activePlayers.map((player) => [player.id, player])),
    [activePlayers],
  )

  const tftSelectedPlayerIds = getSelectedPlayerIds(tftDrafts)
  const tftSelectedPlacements = tftDrafts
    .map((draft) => draft.placement)
    .filter((placement): placement is number => typeof placement === 'number')
  const tftHasMissingPlayers = tftDrafts.some((draft) => !draft.playerId)
  const tftHasDuplicatePlayers = hasDuplicates(tftSelectedPlayerIds)
  const tftHasMissingPlacements = tftDrafts.some((draft) => !draft.placement)
  const tftHasDuplicatePlacements = hasDuplicates(
    tftSelectedPlacements.map(String),
  )
  const tftCanCalculate =
    !tftHasMissingPlayers &&
    !tftHasDuplicatePlayers &&
    !tftHasMissingPlacements &&
    !tftHasDuplicatePlacements

  const tftResults = useMemo(() => {
    if (!tftCanCalculate) {
      return []
    }

    return calculateTftResults({
      participantCount: tftParticipantCount,
      participants: tftDrafts.map((draft) => ({
        playerId: draft.playerId,
        placement: Number(draft.placement),
        penalties: {
          top2: draft.top2,
          top8: draft.top8,
        },
      })),
    })
  }, [tftCanCalculate, tftDrafts, tftParticipantCount])

  const tftPreviewRows = useMemo<PreviewRow[]>(
    () =>
      tftResults.map((result) => {
        const player = playerById.get(result.playerId)
        const badges = [
          result.metadata.top2 ? 'Dính top 2' : null,
          result.metadata.top8 ? 'Dính top 8' : null,
        ].filter((badge): badge is string => Boolean(badge))
        const reasons: PreviewReason[] = [
          {
            label: `Base hạng ${result.placement}`,
            value: result.baseAmount,
          },
        ]

        if (result.penaltyLost !== 0) {
          reasons.push({
            label: 'Penalty',
            value: result.penaltyLost,
          })
        }

        if (result.winnerPenaltyBonus !== 0) {
          reasons.push({
            label: 'Bonus hạng 1',
            value: result.winnerPenaltyBonus,
          })
        }

        return {
          playerId: result.playerId,
          displayName: getPlayerLabel(player),
          avatarUrl: player?.avatarUrl ?? null,
          placement: result.placement,
          netAmount: result.netAmount,
          reasons,
          badges,
        }
      }),
    [playerById, tftResults],
  )

  const billiardSelectedPlayerIds = getSelectedPlayerIds(billiardDrafts)
  const billiardHasMissingPlayers = billiardDrafts.some((draft) => !draft.playerId)
  const billiardHasDuplicatePlayers = hasDuplicates(billiardSelectedPlayerIds)
  const billiardHasTooFewPlayers = billiardSelectedPlayerIds.length < 2

  const billiardPreviewRows = useMemo<PreviewRow[]>(
    () =>
      billiardDrafts
        .filter((draft) => draft.playerId)
        .map((draft) => {
          const player = playerById.get(draft.playerId)
          const netAmount = parseMoneyInput(draft.netAmountInput)

          return {
            playerId: draft.playerId,
            displayName: getPlayerLabel(player),
            avatarUrl: player?.avatarUrl ?? null,
            placement: null,
            netAmount,
            reasons: [
              {
                label: 'Nhập thủ công',
                value: netAmount,
              },
            ],
            badges: [],
          }
        }),
    [billiardDrafts, playerById],
  )

  const previewRows = gameType === 'TFT' ? tftPreviewRows : billiardPreviewRows
  const totalNetAmount = sumNetAmount(previewRows)
  const positiveRows = previewRows
    .filter((row) => row.netAmount > 0)
    .sort((a, b) => b.netAmount - a.netAmount)
  const negativeRows = previewRows
    .filter((row) => row.netAmount < 0)
    .sort((a, b) => a.netAmount - b.netAmount)
  const neutralRows = previewRows.filter((row) => row.netAmount === 0)
  const playedAtIso = toPlayedAtIso(playedAt)

  const matchPayload: CreateMatchPayload | null = (() => {
    if (!playedAtIso) {
      return null
    }

    if (gameType === 'TFT') {
      if (!tftCanCalculate || !validateZeroSum(tftResults)) {
        return null
      }

      return {
        game_type: 'TFT',
        played_at: playedAtIso,
        note: normalizeNote(note),
        metadata: {
          participant_count: tftParticipantCount,
          rule_code: getTftRuleCode(tftParticipantCount),
          penalty_amount: TFT_PENALTY_AMOUNT,
        } as Json,
        participants: tftResults.map((result) => ({
          player_id: result.playerId,
          placement: result.placement,
          net_amount: result.netAmount,
          metadata: result.metadata as unknown as Json,
        })),
      }
    }

    if (
      billiardHasMissingPlayers ||
      billiardHasDuplicatePlayers ||
      billiardHasTooFewPlayers ||
      totalNetAmount !== 0
    ) {
      return null
    }

    return {
      game_type: 'BILLIARD',
      played_at: playedAtIso,
      note: normalizeNote(note),
      metadata: {
        input_mode: 'manual_net_amount',
      } as Json,
      participants: billiardDrafts.map((draft) => ({
        player_id: draft.playerId,
        placement: null,
        net_amount: parseMoneyInput(draft.netAmountInput),
        metadata: {} as Json,
      })),
    }
  })()

  const saveDisabledReason = (() => {
    if (!sessionToken) {
      return 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.'
    }

    if (network.status === 'offline') {
      return 'Đang mất kết nối. Không thể lưu trận.'
    }

    if (network.status === 'checking') {
      return 'Đang kiểm tra kết nối. Chờ mạng ổn định trước khi lưu.'
    }

    if (network.status === 'slow') {
      return 'Mạng đang yếu. Kiểm tra lại kết nối trước khi lưu trận.'
    }

    if (playersQuery.isLoading) {
      return 'Đang tải danh sách người chơi.'
    }

    if (playersQuery.error) {
      return 'Không tải được danh sách người chơi.'
    }

    if (!playedAtIso) {
      return 'Cần chọn thời gian chơi hợp lệ.'
    }

    if (gameType === 'TFT') {
      if (activePlayers.length < tftParticipantCount) {
        return `Cần ít nhất ${tftParticipantCount} người chơi đang hoạt động cho TFT.`
      }

      if (tftHasMissingPlayers) {
        return 'Cần chọn đủ người chơi TFT.'
      }

      if (tftHasDuplicatePlayers) {
        return 'Người chơi TFT không được trùng.'
      }

      if (tftHasMissingPlacements) {
        return 'Cần chọn đủ thứ hạng TFT.'
      }

      if (tftHasDuplicatePlacements) {
        return 'Thứ hạng TFT không được trùng.'
      }
    } else {
      if (activePlayers.length < 2) {
        return 'Cần ít nhất 2 người chơi đang hoạt động cho Billiard.'
      }

      if (billiardHasTooFewPlayers || billiardHasMissingPlayers) {
        return 'Cần chọn ít nhất 2 người chơi Billiard.'
      }

      if (billiardHasDuplicatePlayers) {
        return 'Người chơi Billiard không được trùng.'
      }
    }

    if (totalNetAmount !== 0) {
      return `Tổng tiền hiện tại là ${formatVnd(totalNetAmount)}. Tổng phải bằng 0.`
    }

    if (!matchPayload) {
      return 'Chưa đủ dữ liệu để tạo payload lưu trận.'
    }

    return null
  })()

  const createMatchMutation = useMutation({
    mutationFn: (payload: CreateMatchPayload) => {
      if (!sessionToken) {
        throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.')
      }

      return createMatch({
        payload,
        sessionToken,
      })
    },
    onMutate: () => {
      setSaveError(null)
      setSuccessMessage(null)
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playerBalances }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary }),
      ])

      setSuccessMessage('Đã lưu trận thành công.')
      window.setTimeout(() => {
        navigate(result.matchId ? `/matches/${result.matchId}` : '/matches')
      }, 700)
    },
    onError: (error) => {
      setSaveError(getErrorMessage(error, 'Không thể lưu trận.'))
    },
  })

  const updateTftDraft = (slotId: string, patch: Partial<TftDraft>) => {
    setTftDrafts((drafts) =>
      drafts.map((draft) =>
        draft.slotId === slotId ? { ...draft, ...patch } : draft,
      ),
    )
  }

  const updateBilliardDraft = (
    slotId: string,
    patch: Partial<BilliardDraft>,
  ) => {
    setBilliardDrafts((drafts) =>
      drafts.map((draft) =>
        draft.slotId === slotId ? { ...draft, ...patch } : draft,
      ),
    )
  }

  const handleParticipantCountChange = (count: TftParticipantCount) => {
    setTftParticipantCount(count)
    setTftDrafts((drafts) => buildTftDrafts(count, drafts))
  }

  const handleQuickAmount = (slotId: string, amount: number) => {
    updateBilliardDraft(slotId, {
      netAmountInput: String(amount),
    })
  }

  const handleAddBilliardParticipant = () => {
    setBilliardDrafts((drafts) => [...drafts, createBilliardDraft()])
  }

  const handleRemoveBilliardParticipant = (slotId: string) => {
    setBilliardDrafts((drafts) => drafts.filter((draft) => draft.slotId !== slotId))
  }

  const handleRetryPlayers = () => {
    void playersQuery.refetch()
  }

  const handleSave = () => {
    if (saveDisabledReason || !matchPayload || createMatchMutation.isPending) {
      return
    }

    const confirmed = window.confirm(
      `Lưu trận ${gameType} với tổng tiền ${formatVnd(totalNetAmount, {
        showSign: false,
      })}?`,
    )

    if (!confirmed) {
      return
    }

    createMatchMutation.mutate(matchPayload)
  }

  const saveDisabled =
    createMatchMutation.isPending || Boolean(saveDisabledReason) || !matchPayload
  const canAddBilliardParticipant = billiardDrafts.length < activePlayers.length

  return (
    <div className="space-y-7">
      {successMessage ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          <CheckCircle2 className="mr-2 inline size-4" />
          {successMessage}
        </div>
      ) : null}

      <PageHeader
        eyebrow="New match"
        title="Tạo trận mới"
        description="Ghi kết quả TFT hoặc Billiard, kiểm tra tổng tiền bằng 0 rồi lưu qua RPC create_match."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/matches">Về lịch sử</Link>
            </Button>
            <Button disabled={saveDisabled} onClick={handleSave}>
              <Save />
              {createMatchMutation.isPending ? 'Đang lưu' : 'Lưu trận'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <SectionTitle
                description="TFT tự tính theo thứ hạng và penalty; Billiard nhập net_amount thủ công."
                icon={<CircleDollarSign className="size-5" />}
                step={1}
                title="Chọn game"
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'TFT' as const,
                    label: 'TFT',
                    helper: 'Tự tính tiền theo thứ hạng',
                  },
                  {
                    value: 'BILLIARD' as const,
                    label: 'Billiard',
                    helper: 'Nhập tiền được/mất thủ công',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    aria-pressed={gameType === option.value}
                    className={cn(
                      'min-h-24 rounded-lg border bg-background p-4 text-left shadow-xs transition-colors hover:bg-accent',
                      gameType === option.value &&
                        'border-primary bg-accent text-accent-foreground ring-2 ring-primary/15',
                    )}
                    type="button"
                    onClick={() => setGameType(option.value)}
                  >
                    <span className="text-base font-semibold">{option.label}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {option.helper}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="playedAt">Thời gian chơi</Label>
                  <Input
                    id="playedAt"
                    type="datetime-local"
                    value={playedAt}
                    onChange={(event) => setPlayedAt(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <textarea
                    id="note"
                    className={textareaClassName}
                    placeholder="Ví dụ: kèo tối Chủ nhật"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle
                description="Danh sách chọn chỉ dùng người chơi đang hoạt động và không cho trùng slot."
                icon={<UsersRound className="size-5" />}
                step={2}
                title="Chọn người chơi"
              />
            </CardHeader>
            <CardContent className="space-y-5">
              {playersQuery.isLoading ? <LoadingState className="border-0 shadow-none" /> : null}

              {playersQuery.error ? (
                <ErrorState
                  description={getErrorMessage(
                    playersQuery.error,
                    'Không tải được danh sách người chơi.',
                  )}
                  action={
                    <Button size="sm" variant="outline" onClick={handleRetryPlayers}>
                      Thử lại
                    </Button>
                  }
                />
              ) : null}

              {!playersQuery.isLoading &&
              !playersQuery.error &&
              activePlayers.length === 0 ? (
                <EmptyState
                  title="Chưa có người chơi đang hoạt động"
                  description="Thêm hoặc khôi phục người chơi trước khi tạo trận."
                  icon={<UsersRound className="size-5" />}
                  action={
                    <Button asChild variant="outline">
                      <Link to="/players">Quản lý người chơi</Link>
                    </Button>
                  }
                />
              ) : null}

              {!playersQuery.isLoading &&
              !playersQuery.error &&
              activePlayers.length > 0 ? (
                gameType === 'TFT' ? (
                  <div className="space-y-4">
                    <div className="inline-grid grid-cols-2 gap-1 rounded-lg border bg-muted/30 p-1">
                      {([3, 4] as const).map((count) => (
                        <button
                          key={count}
                          aria-pressed={tftParticipantCount === count}
                          className={cn(
                            'h-9 rounded-md px-4 text-sm font-medium transition-colors',
                            tftParticipantCount === count
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          type="button"
                          onClick={() => handleParticipantCountChange(count)}
                        >
                          {count} người
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {tftDrafts.map((draft, index) => (
                        <div
                          key={draft.slotId}
                          className="rounded-lg border bg-background p-4 shadow-xs"
                        >
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
                            <div className="space-y-2">
                              <Label htmlFor={`${draft.slotId}-player`}>
                                Player {index + 1}
                              </Label>
                              <select
                                id={`${draft.slotId}-player`}
                                className={selectClassName}
                                value={draft.playerId}
                                onChange={(event) =>
                                  updateTftDraft(draft.slotId, {
                                    playerId: event.target.value,
                                  })
                                }
                              >
                                <option value="">Chọn người chơi</option>
                                {renderPlayerOptions(
                                  activePlayers,
                                  tftSelectedPlayerIds,
                                  draft.playerId,
                                )}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${draft.slotId}-placement`}>
                                Thứ hạng
                              </Label>
                              <select
                                id={`${draft.slotId}-placement`}
                                className={selectClassName}
                                value={draft.placement}
                                onChange={(event) =>
                                  updateTftDraft(draft.slotId, {
                                    placement: Number(event.target.value),
                                  })
                                }
                              >
                                {renderPlacementOptions(
                                  tftParticipantCount,
                                  tftSelectedPlacements,
                                  draft.placement,
                                )}
                              </select>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-md border bg-muted/25 px-3 py-2 text-sm">
                              <input
                                checked={draft.top2}
                                className="size-4 accent-primary"
                                type="checkbox"
                                onChange={(event) =>
                                  updateTftDraft(draft.slotId, {
                                    top2: event.target.checked,
                                  })
                                }
                              />
                              <span>Dính top 2</span>
                            </label>
                            <label className="flex items-center gap-3 rounded-md border bg-muted/25 px-3 py-2 text-sm">
                              <input
                                checked={draft.top8}
                                className="size-4 accent-primary"
                                type="checkbox"
                                onChange={(event) =>
                                  updateTftDraft(draft.slotId, {
                                    top8: event.target.checked,
                                  })
                                }
                              />
                              <span>Dính top 8</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billiardDrafts.map((draft, index) => (
                      <div
                        key={draft.slotId}
                        className="rounded-lg border bg-background p-4 shadow-xs"
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
                          <div className="space-y-2">
                            <Label htmlFor={`${draft.slotId}-player`}>
                              Player {index + 1}
                            </Label>
                            <select
                              id={`${draft.slotId}-player`}
                              className={selectClassName}
                              value={draft.playerId}
                              onChange={(event) =>
                                updateBilliardDraft(draft.slotId, {
                                  playerId: event.target.value,
                                })
                              }
                            >
                              <option value="">Chọn người chơi</option>
                              {renderPlayerOptions(
                                activePlayers,
                                billiardSelectedPlayerIds,
                                draft.playerId,
                              )}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${draft.slotId}-amount`}>
                              Net amount
                            </Label>
                            <Input
                              id={`${draft.slotId}-amount`}
                              inputMode="text"
                              placeholder="50k, -50k, 50.000"
                              value={draft.netAmountInput}
                              onChange={(event) =>
                                updateBilliardDraft(draft.slotId, {
                                  netAmountInput: event.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            aria-label="Xóa slot"
                            disabled={billiardDrafts.length <= 2}
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={() => handleRemoveBilliardParticipant(draft.slotId)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { label: '+50k', amount: 50_000 },
                            { label: '-50k', amount: -50_000 },
                            { label: '+100k', amount: 100_000 },
                            { label: '-100k', amount: -100_000 },
                          ].map((quickAmount) => (
                            <Button
                              key={quickAmount.label}
                              size="sm"
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                handleQuickAmount(draft.slotId, quickAmount.amount)
                              }
                            >
                              {quickAmount.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <Button
                      disabled={!canAddBilliardParticipant}
                      type="button"
                      variant="outline"
                      onClick={handleAddBilliardParticipant}
                    >
                      <PlusCircle />
                      Thêm người chơi
                    </Button>
                  </div>
                )
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <SectionTitle
                description="Kiểm tra kết quả đã nhập và tổng net_amount trước khi lưu."
                icon={<Calculator className="size-5" />}
                step={3}
                title="Nhập kết quả"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Rule/input</p>
                  {gameType === 'TFT' ? (
                    <div className="mt-2 space-y-2">
                      <Badge variant="secondary">
                        {getTftRuleCode(tftParticipantCount)}
                      </Badge>
                      <p className="text-sm">
                        Penalty top2/top8:{' '}
                        <MoneyText value={TFT_PENALTY_AMOUNT} showSign={false} />
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <Badge variant="secondary">manual_net_amount</Badge>
                      <p className="text-sm text-muted-foreground">
                        Hỗ trợ nhập 50k, -50k, 50.000 hoặc 50000.
                      </p>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Tổng cộng</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <MoneyText value={totalNetAmount} className="text-2xl font-semibold" />
                    {totalNetAmount === 0 ? (
                      <Badge variant="success">Bằng 0</Badge>
                    ) : (
                      <Badge variant="destructive">Lệch tổng</Badge>
                    )}
                  </div>
                </div>
              </div>

              {saveDisabledReason && !createMatchMutation.isPending ? (
                <Alert>
                  <WifiOff className="size-4" />
                  <AlertTitle>Chưa thể lưu</AlertTitle>
                  <AlertDescription>{saveDisabledReason}</AlertDescription>
                </Alert>
              ) : null}

              {saveError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Lưu trận thất bại</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle
                description="Người nhận tiền nằm trên, người mất tiền nằm dưới."
                icon={<Trophy className="size-5" />}
                step={4}
                title="Preview & lưu"
              />
            </CardHeader>
            <CardContent className="space-y-5">
              {previewRows.length > 0 ? (
                <>
                  <PreviewGroup
                    emptyLabel="Chưa có người nhận tiền."
                    icon={<ArrowUpCircle className="size-4 text-emerald-700" />}
                    rows={positiveRows}
                    title="Người nhận tiền"
                  />
                  <PreviewGroup
                    emptyLabel="Chưa có người mất tiền."
                    icon={<ArrowDownCircle className="size-4 text-rose-700" />}
                    rows={negativeRows}
                    title="Người mất tiền"
                  />
                  {neutralRows.length > 0 ? (
                    <PreviewGroup
                      emptyLabel=""
                      icon={<CircleDollarSign className="size-4 text-muted-foreground" />}
                      rows={neutralRows}
                      title="Không đổi"
                    />
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="Chưa có preview"
                  description="Preview sẽ tự hiện khi đủ người chơi, thứ hạng hoặc net_amount hợp lệ."
                  icon={<Calculator className="size-5" />}
                />
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link to="/matches">Hủy</Link>
                </Button>
                <Button disabled={saveDisabled} onClick={handleSave}>
                  <Save />
                  {createMatchMutation.isPending ? 'Đang lưu' : 'Lưu trận'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
