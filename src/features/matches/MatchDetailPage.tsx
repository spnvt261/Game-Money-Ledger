import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  History,
  RotateCcw,
  ShieldAlert,
  WifiOff,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/useAuth'
import { fetchMatchDetail, voidMatch } from '@/features/matches/matchesApi'
import type {
  LedgerEventDetail,
  MatchDetail,
  MatchParticipantDetail,
  MatchRecordStatus,
} from '@/features/matches/matchesTypes'
import { queryKeys } from '@/lib/queryKeys'
import { useNetworkStatus } from '@/lib/useNetworkStatus'
import type { GameType } from '@/types'
import type { Json } from '@/types/database'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})
const textareaClassName =
  'min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatDateTime(value: string | null) {
  if (!value) return '--/--/----'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--/--/----' : dateTimeFormatter.format(date)
}

function getJsonObject(value: Json) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value
}

function getMetadataString(metadata: Json, key: string) {
  const value = getJsonObject(metadata)?.[key]
  return typeof value === 'string' ? value : null
}

function getMetadataNumber(metadata: Json, key: string) {
  const value = getJsonObject(metadata)?.[key]
  return typeof value === 'number' ? value : null
}

function getMetadataBoolean(metadata: Json, key: string) {
  const value = getJsonObject(metadata)?.[key]
  return typeof value === 'boolean' ? value : false
}

function getGameLabel(gameType: GameType) {
  return gameType === 'TFT' ? 'TFT' : 'Billiard'
}

function GameBadge({ gameType }: { gameType: GameType }) {
  return (
    <Badge variant={gameType === 'TFT' ? 'success' : 'secondary'}>
      {getGameLabel(gameType)}
    </Badge>
  )
}

function StatusBadge({ status }: { status: MatchRecordStatus }) {
  return status === 'COMPLETED' ? (
    <Badge variant="success">Đã ghi</Badge>
  ) : (
    <Badge variant="warning">
      <RotateCcw />
      Đã hủy
    </Badge>
  )
}

function EventBadge({ eventType }: { eventType: LedgerEventDetail['eventType'] }) {
  if (eventType === 'MATCH') {
    return <Badge variant="success">MATCH</Badge>
  }

  if (eventType === 'VOID') {
    return (
      <Badge variant="warning">
        <RotateCcw />
        VOID
      </Badge>
    )
  }

  return <Badge variant="secondary">{eventType}</Badge>
}

function getPlayerName(participant: MatchParticipantDetail) {
  return participant.player?.displayName ?? 'Người chơi không còn tồn tại'
}

function Breakdown({
  metadata,
  mode,
}: {
  metadata: Json
  mode: GameType
}) {
  if (mode === 'BILLIARD') {
    return <span className="text-sm text-muted-foreground">Nhập thủ công</span>
  }

  const baseAmount = getMetadataNumber(metadata, 'base_amount')
  const penaltyLost = getMetadataNumber(metadata, 'penalty_lost')
  const winnerPenaltyBonus = getMetadataNumber(metadata, 'winner_penalty_bonus')

  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
      <div className="rounded-md bg-muted/40 p-2">
        <span className="block">Base</span>
        <MoneyText value={baseAmount ?? 0} className="mt-1 block font-semibold" />
      </div>
      <div className="rounded-md bg-muted/40 p-2">
        <span className="block">Penalty</span>
        <MoneyText value={penaltyLost ?? 0} className="mt-1 block font-semibold" />
      </div>
      <div className="rounded-md bg-muted/40 p-2">
        <span className="block">Bonus hạng 1</span>
        <MoneyText
          value={winnerPenaltyBonus ?? 0}
          className="mt-1 block font-semibold"
        />
      </div>
    </div>
  )
}

function PenaltyBadges({ metadata }: { metadata: Json }) {
  const top2 = getMetadataBoolean(metadata, 'top2')
  const top8 = getMetadataBoolean(metadata, 'top8')
  const penaltyCount = getMetadataNumber(metadata, 'penalty_count') ?? 0

  if (!top2 && !top8) {
    return <span className="text-sm text-muted-foreground">Không dính</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {top2 ? <Badge variant="outline">Dính top 2</Badge> : null}
      {top8 ? <Badge variant="outline">Dính top 8</Badge> : null}
      <Badge variant="secondary">{penaltyCount} penalty</Badge>
    </div>
  )
}

function ParticipantMobileCard({
  gameType,
  participant,
}: {
  gameType: GameType
  participant: MatchParticipantDetail
}) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <PlayerAvatar
          avatarUrl={participant.player?.avatarUrl ?? null}
          displayName={getPlayerName(participant)}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{getPlayerName(participant)}</h3>
            {participant.placement ? (
              <Badge variant="secondary">Hạng {participant.placement}</Badge>
            ) : null}
          </div>
          {gameType === 'TFT' ? (
            <div className="mt-2">
              <PenaltyBadges metadata={participant.metadata} />
            </div>
          ) : null}
        </div>
        <MoneyText value={participant.netAmount} className="font-semibold" />
      </div>
      <div className="mt-3">
        <Breakdown metadata={participant.metadata} mode={gameType} />
      </div>
    </div>
  )
}

function GeneralInfo({ detail }: { detail: MatchDetail }) {
  const ruleCode = getMetadataString(detail.metadata, 'rule_code')
  const inputMode = getMetadataString(detail.metadata, 'input_mode')
  const penaltyAmount = getMetadataNumber(detail.metadata, 'penalty_amount')

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>matches</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Game</p>
            <div className="mt-2">
              <GameBadge gameType={detail.gameType} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2">
              <StatusBadge status={detail.status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Played at</p>
            <p className="mt-1 font-medium">{formatDateTime(detail.playedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created at</p>
            <p className="mt-1 font-medium">{formatDateTime(detail.createdAt)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Note</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
              {detail.note || 'Không có ghi chú'}
            </p>
          </div>
          {detail.status === 'VOIDED' ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Thời gian hủy</p>
                <p className="mt-1 font-medium">{formatDateTime(detail.voidedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lý do hủy</p>
                <p className="mt-1 text-sm leading-6">
                  {detail.voidReason || 'Không có lý do hủy'}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rule/input snapshot</CardTitle>
          <CardDescription>metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.gameType === 'TFT' ? (
            <>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Rule code</p>
                <p className="mt-1 font-semibold">{ruleCode ?? 'Không có rule_code'}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Penalty top2/top8</p>
                <MoneyText
                  value={penaltyAmount ?? 0}
                  showSign={false}
                  className="mt-1 block font-semibold"
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Input mode</p>
              <p className="mt-1 font-semibold">
                {inputMode === 'manual_net_amount' || !inputMode
                  ? 'Nhập tiền thủ công'
                  : inputMode}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ParticipantsSection({ detail }: { detail: MatchDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
        <CardDescription>
          Ai được, ai mất và breakdown theo metadata đã lưu cùng trận.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-hidden rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người chơi</TableHead>
                {detail.gameType === 'TFT' ? <TableHead>Placement</TableHead> : null}
                {detail.gameType === 'TFT' ? <TableHead>Penalty</TableHead> : null}
                <TableHead>Breakdown</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        avatarUrl={participant.player?.avatarUrl ?? null}
                        displayName={getPlayerName(participant)}
                        className="size-10"
                      />
                      <span className="font-medium">{getPlayerName(participant)}</span>
                    </div>
                  </TableCell>
                  {detail.gameType === 'TFT' ? (
                    <TableCell>
                      {participant.placement ? (
                        <Badge variant="secondary">Hạng {participant.placement}</Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  ) : null}
                  {detail.gameType === 'TFT' ? (
                    <TableCell>
                      <PenaltyBadges metadata={participant.metadata} />
                    </TableCell>
                  ) : null}
                  <TableCell className="min-w-72">
                    <Breakdown metadata={participant.metadata} mode={detail.gameType} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText value={participant.netAmount} className="font-semibold" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {detail.participants.map((participant) => (
            <ParticipantMobileCard
              key={participant.id}
              gameType={detail.gameType}
              participant={participant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LedgerEventCard({ event }: { event: LedgerEventDetail }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <EventBadge eventType={event.eventType} />
            <span className="text-sm font-medium">{formatDateTime(event.occurredAt)}</span>
          </div>
          {event.note ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {event.note}
            </p>
          ) : null}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Tổng event</p>
          <MoneyText value={event.totalAmount} className="font-semibold" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người chơi</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden md:table-cell">Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {event.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      avatarUrl={line.player?.avatarUrl ?? null}
                      displayName={line.player?.displayName ?? 'Người chơi không còn tồn tại'}
                      className="size-9"
                    />
                    <span className="font-medium">
                      {line.player?.displayName ?? 'Người chơi không còn tồn tại'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <MoneyText value={line.amount} className="font-semibold" />
                </TableCell>
                <TableCell className="hidden max-w-80 md:table-cell">
                  <code className="line-clamp-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {JSON.stringify(line.metadata)}
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function LedgerSection({ detail }: { detail: MatchDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger timeline</CardTitle>
        <CardDescription>
          MATCH event là bút toán gốc; VOID event là các dòng đảo dấu nếu trận đã hủy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.ledgerEvents.length > 0 ? (
          detail.ledgerEvents.map((event) => (
            <LedgerEventCard key={event.id} event={event} />
          ))
        ) : (
          <EmptyState
            title="Chưa có ledger event"
            description="Trận này chưa có bút toán ledger để hiển thị."
            icon={<History className="size-5" />}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface VoidDialogProps {
  disabledReason: string | null
  error: string | null
  isSubmitting: boolean
  onClose: () => void
  onReasonChange: (reason: string) => void
  onSubmit: () => void
  open: boolean
  reason: string
}

function VoidDialog({
  disabledReason,
  error,
  isSubmitting,
  onClose,
  onReasonChange,
  onSubmit,
  open,
  reason,
}: VoidDialogProps) {
  if (!open) {
    return null
  }

  const submitDisabled = isSubmitting || Boolean(disabledReason) || !reason.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-foreground/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-xl sm:max-w-lg"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Hủy trận / đảo bút toán
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Thao tác này không xóa trận và không xóa participants. Hệ thống sẽ tạo
              ledger event VOID với các dòng tiền đảo dấu để số dư quay lại như trước trận.
            </p>
          </div>
          <Button
            aria-label="Đóng"
            size="icon"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {disabledReason ? (
            <Alert>
              <WifiOff className="size-4" />
              <AlertTitle>Chưa thể hủy trận</AlertTitle>
              <AlertDescription>{disabledReason}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Hủy trận thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="voidReason">Lý do hủy</Label>
            <textarea
              id="voidReason"
              autoFocus
              className={textareaClassName}
              placeholder="Ví dụ: nhập nhầm thứ hạng, ghi sai số tiền..."
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
            />
            {!reason.trim() ? (
              <p className="text-sm text-destructive">Cần nhập lý do hủy trận.</p>
            ) : null}
          </div>

          <Alert>
            <ShieldAlert className="size-4" />
            <AlertTitle>Xác nhận nghiệp vụ</AlertTitle>
            <AlertDescription>
              Trận sẽ chuyển sang trạng thái đã hủy. Một trận đã hủy không thể hủy lần thứ hai.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Không hủy
            </Button>
            <Button
              disabled={submitDisabled}
              type="button"
              variant="destructive"
              onClick={onSubmit}
            >
              <RotateCcw />
              {isSubmitting ? 'Đang hủy' : 'Tạo bút toán đảo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchDetailPage() {
  const { id } = useParams()
  const matchId = id ?? ''
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const network = useNetworkStatus()
  const { logout, session } = useAuth()
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [voidError, setVoidError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const sessionToken = session?.sessionToken

  const detailQuery = useQuery({
    queryKey: queryKeys.matchDetail(matchId),
    queryFn: () => fetchMatchDetail(matchId),
    enabled: Boolean(matchId),
  })
  const detail = detailQuery.data
  const voidDisabledReason = (() => {
    if (!sessionToken) {
      return 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.'
    }

    if (network.isOffline) {
      return 'Đang mất kết nối. Không thể hủy trận.'
    }

    if (!detail) {
      return 'Chưa tải được dữ liệu trận.'
    }

    if (detail.status !== 'COMPLETED') {
      return 'Chỉ trận đã ghi mới có thể hủy. Trận đã hủy không thể hủy lần nữa.'
    }

    return null
  })()

  const handleSessionExpired = () => {
    logout()
    navigate('/login', {
      replace: true,
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const voidMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!sessionToken) {
        throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.')
      }

      return voidMatch({
        matchId,
        reason,
        sessionToken,
      })
    },
    onMutate: () => {
      setVoidError(null)
      setSuccessMessage(null)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.playerBalances }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matchDetail(matchId) }),
      ])
      await detailQuery.refetch()
      setVoidDialogOpen(false)
      setVoidReason('')
      setSuccessMessage('Đã hủy trận và tạo bút toán đảo thành công.')
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Không thể hủy trận.')
      setVoidError(message)

      if (message.toLowerCase().includes('phiên')) {
        handleSessionExpired()
      }
    },
  })

  const handleOpenVoidDialog = () => {
    setVoidError(null)
    setVoidDialogOpen(true)
  }

  const handleCloseVoidDialog = () => {
    if (voidMutation.isPending) {
      return
    }

    setVoidDialogOpen(false)
    setVoidError(null)
  }

  const handleSubmitVoid = () => {
    if (voidDisabledReason || !voidReason.trim() || voidMutation.isPending) {
      return
    }

    voidMutation.mutate(voidReason.trim())
  }

  const positiveParticipants = useMemo(
    () => detail?.participants.filter((participant) => participant.netAmount > 0) ?? [],
    [detail],
  )
  const negativeParticipants = useMemo(
    () => detail?.participants.filter((participant) => participant.netAmount < 0) ?? [],
    [detail],
  )

  return (
    <div className="space-y-7">
      {successMessage ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          <CheckCircle2 className="mr-2 inline size-4" />
          {successMessage}
        </div>
      ) : null}

      <PageHeader
        eyebrow="Chi tiết"
        title="Chi tiết trận"
        description={`Match ID: ${matchId || 'không xác định'}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/matches">Về lịch sử</Link>
            </Button>
            {detail?.status === 'COMPLETED' ? (
              <Button
                disabled={Boolean(voidDisabledReason) || voidMutation.isPending}
                variant="destructive"
                onClick={handleOpenVoidDialog}
              >
                <RotateCcw />
                Hủy trận / đảo bút toán
              </Button>
            ) : null}
          </>
        }
      />

      {!matchId ? (
        <ErrorState
          title="Thiếu match ID"
          description="Không thể tải chi tiết vì URL không có match ID hợp lệ."
        />
      ) : null}

      {detailQuery.isLoading ? <LoadingState /> : null}

      {detailQuery.error ? (
        <ErrorState
          description={getErrorMessage(
            detailQuery.error,
            'Không tải được chi tiết trận.',
          )}
          action={
            <Button size="sm" variant="outline" onClick={() => detailQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : null}

      {detail ? (
        <>
          {detail.status === 'VOIDED' ? (
            <Alert>
              <RotateCcw className="size-4" />
              <AlertTitle>Trận đã được hủy</AlertTitle>
              <AlertDescription>
                Trận vẫn được giữ trong lịch sử. Ledger VOID đã đảo dấu các dòng MATCH
                để số dư người chơi quay lại như trước trận.
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái</CardTitle>
                <CardDescription>matches.status</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <StatusBadge status={detail.status} />
                <ShieldAlert className="size-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Thời gian chơi</CardTitle>
                <CardDescription>matches.played_at</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatDateTime(detail.playedAt)}</span>
                <CalendarClock className="size-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tổng tiền</CardTitle>
                <CardDescription>Tiền nhận / tiền mất</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Nhận</span>
                  <MoneyText value={detail.totalPositiveAmount} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Mất</span>
                  <MoneyText value={detail.totalNegativeAmount} className="font-semibold" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net</CardTitle>
                <CardDescription>SUM participants</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <MoneyText value={detail.totalNetAmount} className="text-2xl font-semibold" />
                <Badge variant={detail.totalNetAmount === 0 ? 'success' : 'destructive'}>
                  {detail.totalNetAmount === 0 ? 'Bằng 0' : 'Lệch'}
                </Badge>
              </CardContent>
            </Card>
          </section>

          <GeneralInfo detail={detail} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Người nhận tiền</CardTitle>
                <CardDescription>Dương là lời/nhận.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {positiveParticipants.length > 0 ? (
                  positiveParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          avatarUrl={participant.player?.avatarUrl ?? null}
                          displayName={getPlayerName(participant)}
                          className="size-9"
                        />
                        <span className="font-medium">{getPlayerName(participant)}</span>
                      </div>
                      <MoneyText value={participant.netAmount} className="font-semibold" />
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Không có người nhận tiền.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Người mất tiền</CardTitle>
                <CardDescription>Âm là lỗ/mất.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {negativeParticipants.length > 0 ? (
                  negativeParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          avatarUrl={participant.player?.avatarUrl ?? null}
                          displayName={getPlayerName(participant)}
                          className="size-9"
                        />
                        <span className="font-medium">{getPlayerName(participant)}</span>
                      </div>
                      <MoneyText value={participant.netAmount} className="font-semibold" />
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Không có người mất tiền.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <ParticipantsSection detail={detail} />
          <LedgerSection detail={detail} />
        </>
      ) : null}

      <VoidDialog
        disabledReason={voidDisabledReason}
        error={voidError}
        isSubmitting={voidMutation.isPending}
        open={voidDialogOpen}
        reason={voidReason}
        onClose={handleCloseVoidDialog}
        onReasonChange={setVoidReason}
        onSubmit={handleSubmitVoid}
      />
    </div>
  )
}
