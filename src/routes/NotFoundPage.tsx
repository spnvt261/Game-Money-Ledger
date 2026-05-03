import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="404"
        title="Không tìm thấy màn hình"
        description="Đường dẫn này không nằm trong route hiện tại của Game Money Ledger."
      />
      <EmptyState
        title="Màn hình không tồn tại"
        description="Quay lại tổng quan để tiếp tục theo dõi số dư và lịch sử trận."
        icon={<Home className="size-5" />}
        action={
          <Button asChild>
            <Link to="/dashboard">Về tổng quan</Link>
          </Button>
        }
      />
    </div>
  )
}
