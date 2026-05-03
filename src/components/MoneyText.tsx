import { cn } from '@/lib/utils'
import { formatVnd } from '@/lib/money'

interface MoneyTextProps {
  value: number
  className?: string
  showSign?: boolean
}

export function MoneyText({ value, className, showSign = true }: MoneyTextProps) {
  return (
    <span
      className={cn(
        'tabular-nums',
        value > 0 && 'text-emerald-700',
        value < 0 && 'text-rose-700',
        value === 0 && 'text-muted-foreground',
        className,
      )}
    >
      {formatVnd(value, { showSign })}
    </span>
  )
}
