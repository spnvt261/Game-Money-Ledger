import { CalendarClock, RotateCcw, ShieldAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type MatchDetailState = 'loading' | 'error' | 'empty'

export function MatchDetailPage() {
  const { id } = useParams()
  const state = 'empty' as MatchDetailState

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Match detail"
        title="Chi tiết trận"
        description={`Match ID: ${id ?? 'không xác định'}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/matches">Về lịch sử</Link>
            </Button>
            <Button variant="destructive" disabled>
              <RotateCcw />
              Void match
            </Button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái</CardTitle>
            <CardDescription>matches.status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <Badge variant="secondary">Chưa tải</Badge>
            <ShieldAlert className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thời gian chơi</CardTitle>
            <CardDescription>matches.played_at</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">--/--/----</span>
            <CalendarClock className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tổng net</CardTitle>
            <CardDescription>SUM participants</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyText value={0} className="text-2xl font-semibold" />
          </CardContent>
        </Card>
      </section>

      {state === 'loading' ? <LoadingState /> : null}
      {state === 'error' ? <ErrorState /> : null}
      {state === 'empty' ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>match_participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người chơi</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead className="text-right">Net amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="Chưa có dữ liệu trận"
                        description="Participants và net_amount của trận sẽ hiển thị tại đây."
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
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Rule/input snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Chưa có metadata"
                description="Participant count, rule_code và penalty snapshot sẽ được lưu cùng match."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
