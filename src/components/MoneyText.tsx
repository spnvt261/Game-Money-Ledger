import { cn } from '@/lib/utils'
import { formatVnd } from '@/lib/money'

type MoneyTextVariant = 'auto' | 'positive' | 'negative' | 'neutral'

interface MoneyTextProps {
  value: number
  className?: string
  showSign?: boolean
  variant?: MoneyTextVariant
}

function resolveVariant(value: number, variant: MoneyTextVariant) {
  if (variant !== 'auto') {
    return variant
  }

  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

export function MoneyText({
  value,
  className,
  showSign = true,
  variant = 'auto',
}: MoneyTextProps) {
  const resolvedVariant = resolveVariant(value, variant)

  return (
    <span
      className={cn(
        'tabular-nums',
        resolvedVariant === 'positive' && 'text-emerald-700',
        resolvedVariant === 'negative' && 'text-rose-700',
        resolvedVariant === 'neutral' && 'text-muted-foreground',
        className,
      )}
    >
      {formatVnd(value, { showSign })}
    </span>
  )
}
