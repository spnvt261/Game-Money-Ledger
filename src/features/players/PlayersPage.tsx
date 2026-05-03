import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  EyeOff,
  Pencil,
  PlusCircle,
  RotateCcw,
  Save,
  Search,
  UsersRound,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/useAuth'
import {
  createPlayer,
  fetchPlayerBalances,
  fetchPlayers,
  updatePlayer,
} from '@/features/players/playersApi'
import type {
  PlayerBalance,
  PlayerFormValues,
  PlayerRecord,
  PlayerWithBalance,
} from '@/features/players/playersTypes'
import { queryKeys } from '@/lib/queryKeys'
import { useNetworkStatus } from '@/lib/useNetworkStatus'
import { cn } from '@/lib/utils'

type PlayerStatusFilter = 'active' | 'inactive' | 'all'
type PlayerDialogMode = 'create' | 'edit'

const numberFormatter = new Intl.NumberFormat('vi-VN')
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const emptyPlayers: PlayerRecord[] = []
const emptyPlayerBalances: PlayerBalance[] = []

function slugify(value: string) {
  return value
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const playerFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Cần nhập tên người chơi.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug là bắt buộc.')
    .regex(slugPattern, 'Slug chỉ dùng chữ thường, số và dấu gạch ngang.'),
  avatarUrl: z
    .string()
    .trim()
    .refine(isValidOptionalUrl, 'Avatar phải là URL http hoặc https.'),
  isActive: z.boolean(),
})

type PlayerFormData = z.infer<typeof playerFormSchema>

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function getBalanceLabel(value: number) {
  if (value > 0) return 'Đang dương'
  if (value < 0) return 'Đang âm'
  return 'Cân bằng'
}

function getDefaultValues(player: PlayerWithBalance | null): PlayerFormValues {
  return {
    displayName: player?.displayName ?? '',
    slug: player?.slug ?? '',
    avatarUrl: player?.avatarUrl ?? '',
    isActive: player?.isActive ?? true,
  }
}

function PlayerStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="success">Đang hoạt động</Badge>
  ) : (
    <Badge variant="secondary">Đã ẩn</Badge>
  )
}

function PlayerBalanceValue({ value }: { value: number }) {
  return (
    <div className="text-right">
      <MoneyText value={value} className="font-semibold" />
      <p className="mt-1 text-xs text-muted-foreground">{getBalanceLabel(value)}</p>
    </div>
  )
}

interface PlayerFormDialogProps {
  error: string | null
  isSubmitting: boolean
  mode: PlayerDialogMode
  onClose: () => void
  onSubmit: (values: PlayerFormData) => void
  open: boolean
  player: PlayerWithBalance | null
  submitDisabledReason: string | null
}

function PlayerFormDialog({
  error,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
  open,
  player,
  submitDisabledReason,
}: PlayerFormDialogProps) {
  const [slugEdited, setSlugEdited] = useState(Boolean(player))
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: getDefaultValues(player),
  })
  const displayName = useWatch({ control, name: 'displayName' })
  const slugField = register('slug')
  const title = mode === 'create' ? 'Thêm người chơi' : 'Sửa người chơi'
  const description =
    mode === 'create'
      ? 'Tạo người chơi mới để chọn khi ghi trận.'
      : 'Cập nhật tên, avatar hoặc trạng thái hiển thị.'
  const submitDisabled = Boolean(submitDisabledReason) || isSubmitting

  useEffect(() => {
    if (!open || slugEdited) return

    setValue('slug', slugify(displayName ?? ''), {
      shouldDirty: true,
      shouldValidate: false,
    })
  }, [displayName, open, setValue, slugEdited])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-foreground/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-xl sm:max-w-lg"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <Button
            aria-label="Đóng"
            size="icon"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <form className="space-y-5 p-5" onSubmit={handleSubmit(onSubmit)}>
          {submitDisabledReason ? (
            <Alert>
              <WifiOff className="size-4" />
              <AlertTitle>Chưa thể lưu</AlertTitle>
              <AlertDescription>{submitDisabledReason}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Lưu thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              id="displayName"
              aria-invalid={Boolean(errors.displayName)}
              placeholder="Ví dụ: Minh"
              {...register('displayName')}
            />
            {errors.displayName ? (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              aria-invalid={Boolean(errors.slug)}
              placeholder="minh"
              {...slugField}
              onChange={(event) => {
                setSlugEdited(true)
                void slugField.onChange(event)
              }}
            />
            {errors.slug ? (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                Slug tự sinh từ tên và có thể chỉnh thủ công.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              aria-invalid={Boolean(errors.avatarUrl)}
              placeholder="https://..."
              {...register('avatarUrl')}
            />
            {errors.avatarUrl ? (
              <p className="text-sm text-destructive">
                {errors.avatarUrl.message}
              </p>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-lg border bg-muted/25 p-4 text-sm">
            <input
              className="mt-1 size-4 accent-primary"
              type="checkbox"
              {...register('isActive')}
            />
            <span>
              <span className="block font-medium">Đang hoạt động</span>
              <span className="mt-1 block leading-5 text-muted-foreground">
                Người chơi đang hoạt động sẽ xuất hiện trong màn hình tạo trận.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              <Save />
              {isSubmitting ? 'Đang lưu' : 'Lưu người chơi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function requireWritableSession(sessionToken: string | undefined, canWrite: boolean) {
  if (!sessionToken) {
    throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.')
  }

  if (!canWrite) {
    throw new Error('Đang mất kết nối. Vui lòng kiểm tra mạng trước khi lưu.')
  }
}

export function PlayersPage() {
  const queryClient = useQueryClient()
  const network = useNetworkStatus()
  const { session } = useAuth()
  const [dialogMode, setDialogMode] = useState<PlayerDialogMode>('create')
  const [dialogKey, setDialogKey] = useState(0)
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithBalance | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlayerStatusFilter>('active')
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const sessionToken = session?.sessionToken

  const playersQuery = useQuery({
    queryKey: queryKeys.players,
    queryFn: fetchPlayers,
  })
  const balancesQuery = useQuery({
    queryKey: queryKeys.playerBalances,
    queryFn: fetchPlayerBalances,
  })

  const players = playersQuery.data ?? emptyPlayers
  const balances = balancesQuery.data ?? emptyPlayerBalances
  const rows = useMemo<PlayerWithBalance[]>(() => {
    const balanceByPlayerId = new Map(
      balances.map((balance) => [balance.playerId, balance]),
    )

    return players.map((player) => {
      const balance = balanceByPlayerId.get(player.id)

      return {
        ...player,
        balanceAmount: balance?.balanceAmount ?? 0,
        matchCount: balance?.matchCount ?? 0,
      }
    })
  }, [balances, players])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return rows.filter((player) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'active' && player.isActive) ||
        (statusFilter === 'inactive' && !player.isActive)
      const searchMatches =
        !normalizedSearch ||
        player.displayName.toLowerCase().includes(normalizedSearch) ||
        player.slug.toLowerCase().includes(normalizedSearch)

      return statusMatches && searchMatches
    })
  }, [rows, searchTerm, statusFilter])

  const activeCount = rows.filter((player) => player.isActive).length
  const hiddenCount = rows.length - activeCount
  const isInitialLoading =
    (playersQuery.isLoading || balancesQuery.isLoading) && rows.length === 0
  const queryError = playersQuery.error ?? balancesQuery.error
  const isQueryError = Boolean(queryError)
  const hasNoPlayers = !isInitialLoading && !isQueryError && rows.length === 0
  const hasNoFilteredPlayers =
    !isInitialLoading && !isQueryError && rows.length > 0 && filteredRows.length === 0
  const submitDisabledReason = !network.canWrite
    ? 'Bạn đang offline nên thao tác tạo/sửa người chơi đang bị tắt.'
    : null

  const invalidatePlayerData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.players }),
      queryClient.invalidateQueries({ queryKey: queryKeys.playerBalances }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary }),
    ])
  }

  const createPlayerMutation = useMutation({
    mutationFn: (values: PlayerFormData) => {
      requireWritableSession(sessionToken, network.canWrite)
      return createPlayer({ ...values, sessionToken: sessionToken ?? '' })
    },
    onMutate: () => {
      setFormError(null)
      setActionError(null)
    },
    onSuccess: async () => {
      await invalidatePlayerData()
      setIsDialogOpen(false)
      setEditingPlayer(null)
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Không thể tạo người chơi.'))
    },
  })

  const updatePlayerMutation = useMutation({
    mutationFn: (values: PlayerFormData) => {
      requireWritableSession(sessionToken, network.canWrite)

      if (!editingPlayer) {
        throw new Error('Không tìm thấy người chơi cần cập nhật.')
      }

      return updatePlayer({
        ...values,
        id: editingPlayer.id,
        sessionToken: sessionToken ?? '',
      })
    },
    onMutate: () => {
      setFormError(null)
      setActionError(null)
    },
    onSuccess: async () => {
      await invalidatePlayerData()
      setIsDialogOpen(false)
      setEditingPlayer(null)
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Không thể cập nhật người chơi.'))
    },
  })

  const statusMutation = useMutation({
    mutationFn: (player: PlayerWithBalance) => {
      requireWritableSession(sessionToken, network.canWrite)
      return updatePlayer({
        id: player.id,
        displayName: player.displayName,
        slug: player.slug,
        avatarUrl: player.avatarUrl ?? '',
        isActive: !player.isActive,
        sessionToken: sessionToken ?? '',
      })
    },
    onMutate: () => {
      setActionError(null)
    },
    onSuccess: invalidatePlayerData,
    onError: (error) => {
      setActionError(getErrorMessage(error, 'Không thể đổi trạng thái người chơi.'))
    },
  })

  const openCreateDialog = () => {
    setDialogMode('create')
    setDialogKey((current) => current + 1)
    setEditingPlayer(null)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (player: PlayerWithBalance) => {
    setDialogMode('edit')
    setDialogKey((current) => current + 1)
    setEditingPlayer(player)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    if (createPlayerMutation.isPending || updatePlayerMutation.isPending) {
      return
    }

    setIsDialogOpen(false)
    setEditingPlayer(null)
    setFormError(null)
  }

  const handleSubmitPlayer = (values: PlayerFormData) => {
    const normalizedValues = {
      ...values,
      displayName: values.displayName.trim(),
      slug: slugify(values.slug),
      avatarUrl: values.avatarUrl.trim(),
    }

    if (dialogMode === 'create') {
      createPlayerMutation.mutate(normalizedValues)
      return
    }

    updatePlayerMutation.mutate(normalizedValues)
  }

  const handleRetry = () => {
    void playersQuery.refetch()
    void balancesQuery.refetch()
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Players"
        title="Người chơi"
        description="Quản lý hồ sơ người chơi, trạng thái hoạt động và số dư hiện tại trong ledger."
        actions={
          <Button disabled={!network.canWrite} onClick={openCreateDialog}>
            <PlusCircle />
            Thêm người chơi
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Danh sách người chơi</CardTitle>
              <CardDescription>
                Ẩn người chơi thay vì xóa để giữ lịch sử ledger.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{numberFormatter.format(activeCount)} hoạt động</Badge>
              <Badge variant="secondary">{numberFormatter.format(hiddenCount)} đã ẩn</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!network.canWrite ? (
            <Alert>
              <WifiOff className="size-4" />
              <AlertTitle>Đang offline</AlertTitle>
              <AlertDescription>
                Bạn vẫn có thể xem dữ liệu đã tải, nhưng chưa thể tạo hoặc sửa người chơi.
              </AlertDescription>
            </Alert>
          ) : null}

          {actionError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Thao tác thất bại</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên hoặc slug"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 p-1">
              {[
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Đã ẩn' },
                { value: 'all', label: 'Tất cả' },
              ].map((option) => (
                <button
                  key={option.value}
                  aria-pressed={statusFilter === option.value}
                  className={cn(
                    'h-9 rounded-md px-3 text-xs font-medium transition-colors sm:text-sm',
                    statusFilter === option.value
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  type="button"
                  onClick={() => setStatusFilter(option.value as PlayerStatusFilter)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {isInitialLoading ? <LoadingState className="border-0 shadow-none" /> : null}

          {isQueryError ? (
            <ErrorState
              description={getErrorMessage(
                queryError,
                'Không tải được danh sách người chơi.',
              )}
              action={
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  Thử lại
                </Button>
              }
            />
          ) : null}

          {hasNoPlayers ? (
            <EmptyState
              title="Chưa có người chơi"
              description="Thêm người chơi trước, sau đó bạn có thể tạo trận và ledger sẽ tự tính số dư."
              icon={<UsersRound className="size-5" />}
              action={
                <Button disabled={!network.canWrite} onClick={openCreateDialog}>
                  <PlusCircle />
                  Thêm người chơi
                </Button>
              }
              className="min-h-72"
            />
          ) : null}

          {hasNoFilteredPlayers ? (
            <EmptyState
              title="Không có kết quả phù hợp"
              description="Đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái để xem thêm người chơi."
              icon={<Search className="size-5" />}
              className="min-h-64"
            />
          ) : null}

          {!isInitialLoading && !isQueryError && filteredRows.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Số dư hiện tại</TableHead>
                      <TableHead className="text-right">Tổng trận</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((player) => {
                      const isStatusPending =
                        statusMutation.isPending &&
                        statusMutation.variables?.id === player.id

                      return (
                        <TableRow key={player.id}>
                          <TableCell>
                            <PlayerAvatar
                              avatarUrl={player.avatarUrl}
                              displayName={player.displayName}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{player.displayName}</div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {player.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <PlayerStatusBadge isActive={player.isActive} />
                          </TableCell>
                          <TableCell className="text-right">
                            <PlayerBalanceValue value={player.balanceAmount} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {numberFormatter.format(player.matchCount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => openEditDialog(player)}
                              >
                                <Pencil />
                                Sửa
                              </Button>
                              <Button
                                disabled={!network.canWrite || isStatusPending}
                                size="sm"
                                type="button"
                                variant={player.isActive ? 'secondary' : 'outline'}
                                onClick={() => statusMutation.mutate(player)}
                              >
                                {player.isActive ? <EyeOff /> : <RotateCcw />}
                                {player.isActive ? 'Ẩn' : 'Khôi phục'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredRows.map((player) => {
                  const isStatusPending =
                    statusMutation.isPending && statusMutation.variables?.id === player.id

                  return (
                    <div
                      key={player.id}
                      className="rounded-lg border bg-background p-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <PlayerAvatar
                          avatarUrl={player.avatarUrl}
                          displayName={player.displayName}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{player.displayName}</h3>
                            <PlayerStatusBadge isActive={player.isActive} />
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {player.slug}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/35 p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Số dư</p>
                          <div className="mt-1 text-left">
                            <MoneyText
                              value={player.balanceAmount}
                              className="font-semibold"
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getBalanceLabel(player.balanceAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tổng trận</p>
                          <p className="mt-1 text-base font-semibold tabular-nums">
                            {numberFormatter.format(player.matchCount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openEditDialog(player)}
                        >
                          <Pencil />
                          Sửa
                        </Button>
                        <Button
                          disabled={!network.canWrite || isStatusPending}
                          type="button"
                          variant={player.isActive ? 'secondary' : 'outline'}
                          onClick={() => statusMutation.mutate(player)}
                        >
                          {player.isActive ? <EyeOff /> : <RotateCcw />}
                          {player.isActive ? 'Ẩn' : 'Khôi phục'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <PlayerFormDialog
        key={dialogKey}
        error={formError}
        isSubmitting={createPlayerMutation.isPending || updatePlayerMutation.isPending}
        mode={dialogMode}
        open={isDialogOpen}
        player={editingPlayer}
        submitDisabledReason={submitDisabledReason}
        onClose={closeDialog}
        onSubmit={handleSubmitPlayer}
      />
    </div>
  )
}
