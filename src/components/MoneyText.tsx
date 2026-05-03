import { cn } from '@/lib/utils'
import { formatVnd } from '@/lib/money'

interface MoneyTextProps {
  value: number
  className?: string
  showSign?: boolean
}

export function MoneyText({ value, className, showSign = false }: MoneyTextProps) {
  const sign = showSign && value > 0 ? '+' : ''

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
      {sign}
      {formatVnd(value)}
    </span>
  )
}
