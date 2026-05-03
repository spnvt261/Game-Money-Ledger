import { Banknote, History, Trophy, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type DashboardState = 'loading' | 'error' | 'empty'

export function DashboardPage() {
  const state = 'empty' as DashboardState

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Dashboard"
        title="Tổng quan tiền game"
        description="Theo dõi số dư ledger, lịch sử trận và người chơi đang hoạt động."
        actions={
          <Button asChild>
            <Link to="/matches/new">Tạo trận mới</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng net ledger"
          value={<MoneyText value={0} />}
          helper="Tổng hệ thống luôn cân bằng về 0."
          icon={<Banknote className="size-5" />}
          tone="emerald"
        />
        <StatCard
          label="Trận đã ghi"
          value="0"
          helper="Bao gồm TFT và Billiard."
          icon={<History className="size-5" />}
          tone="indigo"
        />
        <StatCard
          label="Người chơi active"
          value="0"
          helper="Chỉ active players được chọn khi tạo trận."
          icon={<UsersRound className="size-5" />}
          tone="slate"
        />
        <StatCard
          label="Lãi cao nhất"
          value={<MoneyText value={0} />}
          helper="Chưa có dữ liệu thống kê."
          icon={<Trophy className="size-5" />}
          tone="amber"
        />
      </section>

      {state === 'loading' ? <LoadingState /> : null}
      {state === 'error' ? <ErrorState /> : null}
      {state === 'empty' ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader>
              <CardTitle>Số dư người chơi</CardTitle>
              <CardDescription>View v_player_balances</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người chơi</TableHead>
                    <TableHead className="text-right">Số dư</TableHead>
                    <TableHead className="text-right">Trận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="Chưa có số dư"
                        description="Sau khi tạo trận đầu tiên, ledger sẽ hiển thị số dư từng người tại đây."
                        className="min-h-64 rounded-none border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Ledger events mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Chưa có hoạt động"
                description="MATCH, VOID và SETTLEMENT sẽ xuất hiện theo thời gian ghi sổ."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
