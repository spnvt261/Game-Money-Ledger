import { PlusCircle, Search, UsersRound } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
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

type PlayersState = 'loading' | 'error' | 'empty'

export function PlayersPage() {
  const state = 'empty' as PlayersState

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Players"
        title="Người chơi"
        description="Quản lý danh sách người chơi active/inactive cho các trận TFT và Billiard."
        actions={
          <Button>
            <PlusCircle />
            Thêm người chơi
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Danh sách players</CardTitle>
              <CardDescription>Table players</CardDescription>
            </div>
            <Badge variant="secondary">0 active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm người chơi" />
          </div>

          {state === 'loading' ? <LoadingState /> : null}
          {state === 'error' ? <ErrorState /> : null}
          {state === 'empty' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số trận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      title="Chưa có người chơi"
                      description="Thêm players trước khi tạo trận để chọn participants nhanh hơn."
                      icon={<UsersRound className="size-5" />}
                      className="min-h-72 rounded-none border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
