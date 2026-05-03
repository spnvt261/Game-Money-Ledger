import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Banknote,
  History,
  PlusCircle,
  Trophy,
  UserCheck,
  UsersRound,
  WalletCards,
  WifiOff,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { StatCard } from '@/components/StatCard'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type DashboardSummary,
  fetchDashboardSummary,
} from '@/features/dashboard/dashboardApi'
import { fetchPlayerBalances } from '@/features/players/playersApi'
import type { PlayerBalance } from '@/features/players/playersTypes'
import { queryKeys } from '@/lib/queryKeys'
import { useNetworkStatus } from '@/lib/useNetworkStatus'

const numberFormatter = new Intl.NumberFormat('vi-VN')

const emptySummary: DashboardSummary = {
  totalPlayers: 0,
  activePlayers: 0,
  totalMatches: 0,
  totalCompletedMatches: 0,
  totalVoidedMatches: 0,
  totalMoneyMoved: 0,
}
const emptyPlayerBalances: PlayerBalance[] = []

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function getBalanceLabel(value: number) {
  if (value > 0) return 'Dương'
  if (value < 0) return 'Âm'
  return 'Cân bằng'
}

function getBalanceBadgeVariant(
  value: number,
): 'success' | 'warning' | 'secondary' {
  if (value > 0) return 'success'
  if (value < 0) return 'warning'
  return 'secondary'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BalanceAmount({ value }: { value: number }) {
  return (
    <div className="text-right">
      <MoneyText value={value} className="font-semibold" />
      <div className="mt-1 flex justify-end">
        <Badge variant={getBalanceBadgeVariant(value)}>
          {getBalanceLabel(value)}
        </Badge>
      </div>
    </div>
  )
}

function TopBalanceList({
  emptyText,
  players,
}: {
  emptyText: string
  players: PlayerBalance[]
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.playerId}
          className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar
              avatarUrl={player.avatarUrl}
              displayName={player.displayName}
              className="size-9"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{player.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {numberFormatter.format(player.matchCount)} trận
              </p>
            </div>
          </div>
          <MoneyText value={player.balanceAmount} className="shrink-0 font-semibold" />
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const network = useNetworkStatus()

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: fetchDashboardSummary,
    enabled: !network.isOffline,
    initialData: () =>
      queryClient.getQueryData<DashboardSummary>(queryKeys.dashboardSummary),
  })
  const balancesQuery = useQuery({
    queryKey: queryKeys.playerBalances,
    queryFn: fetchPlayerBalances,
    enabled: !network.isOffline,
    initialData: () =>
      queryClient.getQueryData<PlayerBalance[]>(queryKeys.playerBalances),
  })

  const hasAnyCachedData =
    summaryQuery.data !== undefined || balancesQuery.data !== undefined
  const offlineWithoutCache = network.isOffline && !hasAnyCachedData
  const isInitialLoading =
    !offlineWithoutCache &&
    !hasAnyCachedData &&
    (summaryQuery.isLoading || balancesQuery.isLoading)
  const queryError = summaryQuery.error ?? balancesQuery.error
  const isBlockingError = Boolean(queryError) && !hasAnyCachedData
  const summary = summaryQuery.data ?? emptySummary
  const balances = balancesQuery.data ?? emptyPlayerBalances
  const isEmpty = !isInitialLoading && !isBlockingError && summary.totalPlayers === 0

  const sortedBalances = useMemo(
    () =>
      [...balances].sort((left, right) => {
        if (right.balanceAmount !== left.balanceAmount) {
          return right.balanceAmount - left.balanceAmount
        }

        return left.displayName.localeCompare(right.displayName, 'vi')
      }),
    [balances],
  )
  const topWinners = useMemo(
    () => sortedBalances.filter((player) => player.balanceAmount > 0).slice(0, 3),
    [sortedBalances],
  )
  const topLosers = useMemo(
    () =>
      [...balances]
        .filter((player) => player.balanceAmount < 0)
        .sort((left, right) => left.balanceAmount - right.balanceAmount)
        .slice(0, 3),
    [balances],
  )

  const retry = () => {
    void summaryQuery.refetch()
    void balancesQuery.refetch()
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Tổng quan"
        title="Tổng quan tiền game"
        description="Theo dõi số dư ledger, người chơi đang lời/lỗ và tổng tiền đã luân chuyển."
        actions={
          <Button asChild>
            <Link to="/matches/new">
              <PlusCircle />
              Tạo trận mới
            </Link>
          </Button>
        }
      />

      {offlineWithoutCache ? (
        <EmptyState
          title="Chưa có dữ liệu offline"
          description="Màn tổng quan cần tải dữ liệu Supabase ít nhất một lần. Kiểm tra kết nối mạng rồi thử lại."
          icon={<WifiOff className="size-5" />}
          action={
            <Button variant="outline" onClick={retry}>
              Thử tải lại
            </Button>
          }
          className="min-h-72"
        />
      ) : null}

      {isInitialLoading ? <DashboardSkeleton /> : null}

      {isBlockingError ? (
        <ErrorState
          description={getErrorMessage(queryError, 'Không tải được dashboard.')}
          action={
            <Button size="sm" variant="outline" onClick={retry}>
              Thử lại
            </Button>
          }
        />
      ) : null}

      {!offlineWithoutCache && !isInitialLoading && !isBlockingError ? (
        <>
          {network.isOffline ? (
            <Alert>
              <WifiOff className="size-4" />
              <AlertTitle>Đang dùng dữ liệu đã tải</AlertTitle>
              <AlertDescription>
                Bạn đang offline nên dashboard hiển thị cache hiện có. Khi có mạng, dữ liệu sẽ được tải lại.
              </AlertDescription>
            </Alert>
          ) : null}

          {queryError ? (
            <Alert variant="destructive">
              <WifiOff className="size-4" />
              <AlertTitle>Không làm mới được dữ liệu</AlertTitle>
              <AlertDescription>
                {getErrorMessage(queryError, 'Vui lòng kiểm tra mạng rồi thử lại.')}
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng người chơi"
              value={numberFormatter.format(summary.totalPlayers)}
              helper="Bao gồm cả người chơi đã ẩn."
              icon={<UsersRound className="size-5" />}
              tone="slate"
            />
            <StatCard
              label="Người chơi đang hoạt động"
              value={numberFormatter.format(summary.activePlayers)}
              helper="Chỉ nhóm này được chọn khi tạo trận."
              icon={<UserCheck className="size-5" />}
              tone="emerald"
            />
            <StatCard
              label="Tổng trận đã ghi"
              value={numberFormatter.format(summary.totalMatches)}
              helper={`${numberFormatter.format(summary.totalVoidedMatches)} trận đã hủy.`}
              icon={<History className="size-5" />}
              tone="indigo"
            />
            <StatCard
              label="Tổng tiền đã luân chuyển"
              value={<MoneyText value={summary.totalMoneyMoved} />}
              helper="Tính theo tổng tiền dương của các trận completed."
              icon={<Banknote className="size-5" />}
              tone="amber"
            />
          </section>

          {isEmpty ? (
            <EmptyState
              title="Chưa có dữ liệu ledger"
              description="Thêm người chơi trước, sau đó tạo trận đầu tiên để dashboard bắt đầu hiển thị số dư và top lời/lỗ."
              icon={<WalletCards className="size-5" />}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to="/players">
                      <UsersRound />
                      Quản lý người chơi
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/matches/new">
                      <PlusCircle />
                      Tạo trận mới
                    </Link>
                  </Button>
                </div>
              }
              className="min-h-72"
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Số dư từng người</CardTitle>
                      <CardDescription>
                        Đọc từ view v_player_balances, số dương là đang lời.
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {numberFormatter.format(balances.length)} người chơi
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="hidden overflow-hidden rounded-lg border md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Người chơi</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Số dư</TableHead>
                          <TableHead className="text-right">Tổng trận</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedBalances.map((player) => (
                          <TableRow key={player.playerId}>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <PlayerAvatar
                                  avatarUrl={player.avatarUrl}
                                  displayName={player.displayName}
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">
                                    {player.displayName}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {player.isActive ? (
                                <Badge variant="success">Đang hoạt động</Badge>
                              ) : (
                                <Badge variant="secondary">Đã ẩn</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <BalanceAmount value={player.balanceAmount} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {numberFormatter.format(player.matchCount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {sortedBalances.map((player) => (
                      <div
                        key={player.playerId}
                        className="rounded-lg border bg-background p-4 shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <PlayerAvatar
                            avatarUrl={player.avatarUrl}
                            displayName={player.displayName}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{player.displayName}</h3>
                              {player.isActive ? (
                                <Badge variant="success">Đang hoạt động</Badge>
                              ) : (
                                <Badge variant="secondary">Đã ẩn</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {numberFormatter.format(player.matchCount)} trận đã ghi
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-lg bg-muted/35 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">Số dư</span>
                            <MoneyText
                              value={player.balanceAmount}
                              className="font-semibold"
                            />
                          </div>
                          <div className="mt-2">
                            <Badge variant={getBalanceBadgeVariant(player.balanceAmount)}>
                              {getBalanceLabel(player.balanceAmount)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Top đang lời</CardTitle>
                        <CardDescription>Số dư dương cao nhất.</CardDescription>
                      </div>
                      <Trophy className="size-5 text-amber-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TopBalanceList
                      emptyText="Chưa có người chơi nào đang dương tiền."
                      players={topWinners}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top đang lỗ</CardTitle>
                    <CardDescription>Số dư âm nhiều nhất.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TopBalanceList
                      emptyText="Chưa có người chơi nào đang âm tiền."
                      players={topLosers}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Link nhanh</CardTitle>
                    <CardDescription>Đi thẳng tới các workflow chính.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Button asChild className="justify-start">
                      <Link to="/matches/new">
                        <PlusCircle />
                        Tạo trận mới
                      </Link>
                    </Button>
                    <Button asChild className="justify-start" variant="outline">
                      <Link to="/matches">
                        <History />
                        Xem lịch sử
                      </Link>
                    </Button>
                    <Button asChild className="justify-start" variant="outline">
                      <Link to="/players">
                        <UsersRound />
                        Quản lý người chơi
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
