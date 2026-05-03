import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Vui lòng kiểm tra kết nối hoặc thử lại sau.',
  action,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {action ? <div className="mt-4 pl-7">{action}</div> : null}
    </Alert>
  )
}
