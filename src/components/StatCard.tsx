import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  helper?: string
  icon?: ReactNode
  tone?: 'emerald' | 'indigo' | 'amber' | 'slate'
}

const toneClassNames: Record<NonNullable<StatCardProps['tone']>, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-50 text-slate-700 ring-slate-100',
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = 'slate',
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex min-h-32 items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-3 text-2xl font-semibold tracking-normal">{value}</div>
          {helper ? (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{helper}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg ring-1',
              toneClassNames[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
