import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, CircleDollarSign, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { MoneyText } from '@/components/MoneyText'
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
import { Label } from '@/components/ui/label'
import { parseMoneyInput } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { GameType } from '@/types'

const newMatchSchema = z.object({
  gameType: z.enum(['TFT', 'BILLIARD']),
  playedAt: z.string().min(1, 'Cần chọn thời gian chơi.'),
  penaltyAmount: z.string().optional(),
  note: z.string().optional(),
})

type NewMatchFormValues = z.infer<typeof newMatchSchema>
type PreviewState = 'loading' | 'error' | 'empty'

export function NewMatchPage() {
  const [previewState] = useState<PreviewState>('empty')
  const [previewAmount, setPreviewAmount] = useState(0)
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<NewMatchFormValues>({
    resolver: zodResolver(newMatchSchema),
    defaultValues: {
      gameType: 'TFT',
      playedAt: new Date().toISOString().slice(0, 16),
      penaltyAmount: '10000',
      note: '',
    },
  })

  const gameType = useWatch({ control, name: 'gameType' })
  const gameOptions = useMemo(
    () =>
      [
        { value: 'TFT', label: 'TFT', helper: '3 hoặc 4 người' },
        { value: 'BILLIARD', label: 'Billiard', helper: 'Nhập net thủ công' },
      ] satisfies Array<{ value: GameType; label: string; helper: string }>,
    [],
  )

  const onSubmit = handleSubmit((values) => {
    setPreviewAmount(parseMoneyInput(values.penaltyAmount ?? '0'))
  })

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="New match"
        title="Tạo trận mới"
        description="Nhập thông tin trận, xem preview ledger rồi lưu qua RPC create_match."
        actions={<Button form="new-match-form">Xem preview</Button>}
      />

      <form id="new-match-form" className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" onSubmit={onSubmit}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loại game</CardTitle>
              <CardDescription>TFT chỉ là một game type trong ledger.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {gameOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'min-h-24 rounded-lg border bg-background p-4 text-left shadow-xs transition-colors hover:bg-accent',
                    gameType === option.value &&
                      'border-primary bg-accent text-accent-foreground ring-2 ring-primary/15',
                  )}
                  onClick={() => setValue('gameType', option.value)}
                >
                  <span className="text-base font-semibold">{option.label}</span>
                  <span className="mt-2 block text-sm text-muted-foreground">
                    {option.helper}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin trận</CardTitle>
              <CardDescription>Thời gian chơi, penalty và ghi chú</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="hidden" {...register('gameType')} />
              <div className="space-y-2">
                <Label htmlFor="playedAt">Thời gian chơi</Label>
                <Input id="playedAt" type="datetime-local" {...register('playedAt')} />
                {errors.playedAt ? (
                  <p className="text-sm text-destructive">
                    {errors.playedAt.message}
                  </p>
                ) : null}
              </div>
              {gameType === 'TFT' ? (
                <div className="space-y-2">
                  <Label htmlFor="penaltyAmount">Penalty top2/top8</Label>
                  <Input
                    id="penaltyAmount"
                    inputMode="numeric"
                    placeholder="10.000"
                    {...register('penaltyAmount')}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Input
                  id="note"
                  placeholder="Ví dụ: kèo tối Chủ nhật"
                  {...register('note')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Người chơi</CardTitle>
                  <CardDescription>Danh sách active players</CardDescription>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                  <UsersRound className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Chưa chọn người chơi"
                description="Thêm active players rồi chọn participants cho trận."
                className="min-h-56"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Preview ledger</CardTitle>
                  <CardDescription>Tổng net phải bằng 0 trước khi lưu.</CardDescription>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Calculator className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {previewState === 'loading' ? <LoadingState /> : null}
              {previewState === 'error' ? <ErrorState /> : null}
              {previewState === 'empty' ? (
                <EmptyState
                  title="Chưa có preview"
                  description="Bảng net_amount sẽ hiện khi đủ participants."
                  icon={<CircleDollarSign className="size-5" />}
                  action={
                    previewAmount > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Penalty hiện tại:{' '}
                        <MoneyText value={previewAmount} className="font-medium" />
                      </p>
                    ) : null
                  }
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
