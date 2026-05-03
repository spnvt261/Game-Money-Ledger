import { zodResolver } from '@hookform/resolvers/zod'
import {
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { NetworkBanner } from '@/components/NetworkBanner'
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { useAuth } from '@/features/auth/useAuth'
import { appConfig } from '@/lib/env'
import { handleSupabaseError } from '@/lib/supabaseErrors'
import { isSupabaseConfigured, supabaseConfig } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/lib/useNetworkStatus'

const loginSchema = z.object({
  adminKey: z.string().min(4, 'Admin key cần tối thiểu 4 ký tự.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function getRedirectPath(state: unknown) {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from !== '/login'
  ) {
    return state.from
  }

  return '/dashboard'
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const network = useNetworkStatus()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const redirectPath = useMemo(
    () => getRedirectPath(location.state),
    [location.state],
  )
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      adminKey: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectPath])

  const onSubmit = handleSubmit(async (values) => {
    if (!network.canWrite) {
      setError('root', {
        message:
          'Đang mất kết nối. Vui lòng kết nối mạng trước khi đăng nhập.',
      })
      return
    }

    try {
      await login(values.adminKey)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : handleSupabaseError(error, 'Không thể đăng nhập. Vui lòng thử lại.'),
      })
    }
  })

  const submitDisabled =
    isSubmitting || !isSupabaseConfigured || network.isOffline

  return (
    <>
      <NetworkBanner status={network.status} />
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
          <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <KeyRound className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {appConfig.appName}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                    Đăng nhập quản trị
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Quản lý tiền thắng/thua cho TFT và Billiard. Mọi thao tác ghi
                tiền đi qua Supabase RPC để giữ ledger cân bằng và có audit.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <NetworkStatusBadge
                  status={network.status}
                  latencyMs={network.latencyMs}
                />
                <span className="rounded-md border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
                  Không dùng email/password
                </span>
              </div>
            </section>

            {!isSupabaseConfigured ? (
              <Card className="border-amber-200 shadow-md">
                <CardHeader>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <AlertTriangle className="size-5" />
                  </div>
                  <CardTitle className="text-xl">
                    Thiếu cấu hình Supabase
                  </CardTitle>
                  <CardDescription>
                    Thêm biến môi trường trước khi đăng nhập admin key.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Đang thiếu:</p>
                    <code className="mt-2 block break-all text-sm text-muted-foreground">
                      {supabaseConfig.missingKeys.join(', ')}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <ShieldCheck className="size-5" />
                  </div>
                  <CardTitle className="text-xl">Admin key</CardTitle>
                  <CardDescription>
                    Key được kiểm tra qua RPC check_admin_key.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={onSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="adminKey">Admin key</Label>
                      <div className="relative">
                        <Input
                          id="adminKey"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Nhập admin key"
                          aria-invalid={Boolean(errors.adminKey)}
                          className="pr-11"
                          disabled={isSubmitting}
                          {...register('adminKey')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10"
                          aria-label={
                            showPassword ? 'Ẩn admin key' : 'Hiện admin key'
                          }
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {errors.adminKey ? (
                        <p className="text-sm text-destructive">
                          {errors.adminKey.message}
                        </p>
                      ) : null}
                    </div>

                    {network.isOffline ? (
                      <Alert variant="destructive">
                        <WifiOff />
                        <AlertTitle>Đang mất kết nối</AlertTitle>
                        <AlertDescription>
                          Chưa thể kiểm tra admin key cho đến khi có mạng.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {network.isSlow ? (
                      <Alert>
                        <Activity />
                        <AlertTitle>Mạng đang yếu</AlertTitle>
                        <AlertDescription>
                          Đăng nhập vẫn hoạt động, nhưng phản hồi có thể chậm.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {errors.root ? (
                      <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>Không đăng nhập được</AlertTitle>
                        <AlertDescription>
                          {errors.root.message}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitDisabled}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Đang kiểm tra
                        </>
                      ) : (
                        'Đăng nhập'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
