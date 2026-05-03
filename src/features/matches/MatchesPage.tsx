import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Eye,
  PlusCircle,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchMatchHistory } from '@/features/matches/matchesApi'
import type {
  MatchHistoryFilters,
  MatchHistoryItem,
  MatchRecordStatus,
} from '@/features/matches/matchesTypes'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import type { GameType } from '@/types'

type GameTypeFilter = GameType | 'ALL'
type StatusFilter = MatchRecordStatus | 'ALL'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'
const emptyMatchHistory: MatchHistoryItem[] = []

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--/--/----' : dateTimeFormatter.format(date)
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

function formatParticipantNames(names: string[]) {
  if (names.length === 0) {
    return 'Chưa có người chơi'
  }

  const visibleNames = names.slice(0, 3).join(', ')
  const hiddenCount = names.length - 3
  return hiddenCount > 0 ? `${visibleNames} +${hiddenCount}` : visibleNames
}

function truncateNote(note: string | null) {
  if (!note) {
    return 'Không có ghi chú'
  }

  return note.length > 56 ? `${note.slice(0, 56)}...` : note
}

function matchesSearch(row: MatchHistoryItem, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  return (
    row.note?.toLowerCase().includes(normalizedSearch) ||
    row.participantNames.some((name) =>
      name.toLowerCase().includes(normalizedSearch),
    )
  )
}

function MatchMobileCard({ match }: { match: MatchHistoryItem }) {
  return (
    <Link
      className="block rounded-lg border bg-background p-4 shadow-xs transition-colors hover:bg-muted/40"
      to={`/matches/${match.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <GameBadge gameType={match.gameType} />
            <StatusBadge status={match.status} />
          </div>
          <p className="mt-2 text-sm font-medium">{formatDateTime(match.playedAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatParticipantNames(match.participantNames)}
          </p>
        </div>
        <MoneyText value={match.totalPositiveAmount} className="font-semibold" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/35 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">Người</p>
          <p className="mt-1 font-semibold">{match.participantCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nhận</p>
          <MoneyText value={match.totalPositiveAmount} className="mt-1 block font-semibold" />
        </div>
        <div>
          <p className="text-muted-foreground">Mất</p>
          <MoneyText value={match.totalNegativeAmount} className="mt-1 block font-semibold" />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {truncateNote(match.note)}
      </p>
    </Link>
  )
}

export function MatchesPage() {
  const [gameType, setGameType] = useState<GameTypeFilter>('ALL')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filters = useMemo<MatchHistoryFilters>(
    () => ({
      gameType,
      status,
      dateFrom,
      dateTo,
    }),
    [dateFrom, dateTo, gameType, status],
  )
  const historyQuery = useQuery({
    queryKey: queryKeys.matchHistoryList(filters),
    queryFn: () => fetchMatchHistory(filters),
  })
  const matches = historyQuery.data ?? emptyMatchHistory
  const filteredMatches = useMemo(
    () => matches.filter((match) => matchesSearch(match, searchTerm)),
    [matches, searchTerm],
  )
  const isInitialLoading = historyQuery.isLoading && matches.length === 0
  const isQueryError = Boolean(historyQuery.error)
  const hasNoMatches = !isInitialLoading && !isQueryError && matches.length === 0
  const hasNoFilteredMatches =
    !isInitialLoading &&
    !isQueryError &&
    matches.length > 0 &&
    filteredMatches.length === 0

  const resetFilters = () => {
    setGameType('ALL')
    setStatus('ALL')
    setDateFrom('')
    setDateTo('')
    setSearchTerm('')
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Lịch sử"
        title="Lịch sử trận"
        description="Danh sách trận đã ghi, trạng thái hủy và tổng tiền luân chuyển từng trận."
        actions={
          <Button asChild>
            <Link to="/matches/new">
              <PlusCircle />
              Tạo trận
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>TFT, Billiard, trạng thái, ngày chơi và người chơi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_160px_150px_150px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo ghi chú hoặc người chơi"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className={selectClassName}
              value={gameType}
              onChange={(event) => setGameType(event.target.value as GameTypeFilter)}
            >
              <option value="ALL">Tất cả game</option>
              <option value="TFT">TFT</option>
              <option value="BILLIARD">Billiard</option>
            </select>
            <select
              className={selectClassName}
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="COMPLETED">Đã ghi</option>
              <option value="VOIDED">Đã hủy</option>
            </select>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={resetFilters}>
              Xóa lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {isInitialLoading ? <LoadingState /> : null}

      {isQueryError ? (
        <ErrorState
          description={getErrorMessage(
            historyQuery.error,
            'Không tải được lịch sử trận.',
          )}
          action={
            <Button size="sm" variant="outline" onClick={() => historyQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : null}

      {hasNoMatches ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Chưa có trận nào"
              description="Tạo trận TFT hoặc Billiard đầu tiên để bắt đầu lịch sử ghi sổ."
              icon={<Trophy className="size-5" />}
              className="min-h-72"
              action={
                <Button asChild>
                  <Link to="/matches/new">Tạo trận đầu tiên</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {hasNoFilteredMatches ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Không có trận phù hợp"
              description="Đổi từ khóa, game type, trạng thái hoặc khoảng thời gian để xem thêm kết quả."
              icon={<Search className="size-5" />}
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Xóa lọc
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {!isInitialLoading && !isQueryError && filteredMatches.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Danh sách trận</CardTitle>
                <CardDescription>
                  Đang hiển thị {filteredMatches.length} trận, sort theo ngày chơi mới nhất.
                </CardDescription>
              </div>
              <Badge variant="secondary">{matches.length} tổng kết quả</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-hidden rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Người chơi</TableHead>
                    <TableHead className="text-right">Tổng dương</TableHead>
                    <TableHead className="text-right">Tổng âm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow
                      key={match.id}
                      className={cn(match.status === 'VOIDED' && 'bg-muted/35')}
                    >
                      <TableCell>
                        <div className="font-medium">{formatDateTime(match.playedAt)}</div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {match.participantCount} người
                        </p>
                      </TableCell>
                      <TableCell>
                        <GameBadge gameType={match.gameType} />
                      </TableCell>
                      <TableCell className="max-w-64">
                        <span className="line-clamp-2">
                          {formatParticipantNames(match.participantNames)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={match.totalPositiveAmount} className="font-semibold" />
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={match.totalNegativeAmount} className="font-semibold" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={match.status} />
                      </TableCell>
                      <TableCell className="max-w-64 text-muted-foreground">
                        <span className="line-clamp-2">{truncateNote(match.note)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/matches/${match.id}`}>
                            <Eye />
                            Xem
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredMatches.map((match) => (
                <MatchMobileCard key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
