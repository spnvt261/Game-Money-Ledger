import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  className?: string
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border bg-card p-5 shadow-sm',
        className,
      )}
    >
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-36" />
    </div>
  )
}
