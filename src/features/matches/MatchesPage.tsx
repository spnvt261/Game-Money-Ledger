import { CalendarDays, PlusCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
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

type MatchesState = 'loading' | 'error' | 'empty'

export function MatchesPage() {
  const state = 'empty' as MatchesState

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Matches"
        title="Lịch sử trận"
        description="Danh sách trận đã ghi, trạng thái void và tổng net từng trận."
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
          <CardDescription>TFT, Billiard, ngày chơi và người chơi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Tìm theo ghi chú hoặc người chơi" />
            </div>
            <Button variant="outline" className="justify-start">
              <CalendarDays />
              Hôm nay
            </Button>
            <Button variant="outline" className="justify-start">
              Tất cả game
            </Button>
            <Button variant="secondary">Lọc</Button>
          </div>
        </CardContent>
      </Card>

      {state === 'loading' ? <LoadingState /> : null}
      {state === 'error' ? <ErrorState /> : null}
      {state === 'empty' ? (
        <Card>
          <CardHeader>
            <CardTitle>Match history</CardTitle>
            <CardDescription>View v_match_history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Người chơi</TableHead>
                  <TableHead className="text-right">Tổng net</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="Chưa có trận nào"
                      description="Tạo trận TFT hoặc Billiard đầu tiên để bắt đầu lịch sử ghi sổ."
                      className="min-h-72 rounded-none border-0 bg-transparent"
                      action={
                        <Button asChild>
                          <Link to="/matches/new">Tạo trận đầu tiên</Link>
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
