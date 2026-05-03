import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { NetworkStatusBadge } from '@/components/NetworkStatusBadge'
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
import { appConfig } from '@/lib/env'
import { useNetworkStatus } from '@/lib/useNetworkStatus'

const loginSchema = z.object({
  adminKey: z.string().min(4, 'Access key cần tối thiểu 4 ký tự.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const network = useNetworkStatus()
  const [notice, setNotice] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      adminKey: '',
    },
  })

  const onSubmit = handleSubmit(async () => {
    setNotice('Form hợp lệ. RPC check_admin_key sẽ xử lý session Supabase.')
  })

  return (
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
              Nhập access key nội bộ để mở các thao tác ghi tiền. Dữ liệu quan
              trọng được ghi qua Supabase RPC khi đã cấu hình backend-lite.
            </p>
            <div className="flex flex-wrap gap-2">
              <NetworkStatusBadge
                status={network.status}
                latencyMs={network.latencyMs}
              />
              <Button asChild variant="outline">
                <Link to="/dashboard">Xem tổng quan</Link>
              </Button>
            </div>
          </section>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-xl">Access key</CardTitle>
              <CardDescription>
                Không dùng Supabase Auth email/password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="adminKey">Admin key</Label>
                  <Input
                    id="adminKey"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Nhập access key"
                    aria-invalid={Boolean(errors.adminKey)}
                    {...register('adminKey')}
                  />
                  {errors.adminKey ? (
                    <p className="text-sm text-destructive">
                      {errors.adminKey.message}
                    </p>
                  ) : null}
                </div>

                {notice ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {notice}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  Tiếp tục
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
