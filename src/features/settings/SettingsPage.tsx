import {
  Banknote,
  CheckCircle2,
  Database,
  KeyRound,
  LogOut,
  Settings2,
  ShieldCheck,
  Trophy,
  Wifi,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { MoneyText } from '@/components/MoneyText'
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge'
import { PageHeader } from '@/components/PageHeader'
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
import { useAuth } from '@/features/auth/useAuth'
import {
  getTftBaseAmount,
  TFT_PENALTY_AMOUNT,
  TFT_RULE_CODE_3P,
  TFT_RULE_CODE_4P,
} from '@/features/matches/tftRules'
import { appConfig } from '@/lib/env'
import { supabaseConfig, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/lib/useNetworkStatus'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Không xác định'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Không xác định' : dateTimeFormatter.format(date)
}

function SettingRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right text-sm font-medium">{value}</div>
    </div>
  )
}

function RuleLine({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <MoneyText value={value} className="font-semibold" />
    </div>
  )
}

function RuleCard({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const network = useNetworkStatus()
  const { logout, session } = useAuth()

  const handleLogout = () => {
    const confirmed = window.confirm('Đăng xuất khỏi phiên quản trị hiện tại?')

    if (!confirmed) {
      return
    }

    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Cài đặt"
        title="Cài đặt"
        description="Kiểm tra cấu hình ứng dụng, phiên quản trị, kết nối Supabase và rule đang dùng."
      />

      {!isSupabaseConfigured ? (
        <Alert>
          <Database className="size-4" />
          <AlertTitle>Thiếu cấu hình Supabase</AlertTitle>
          <AlertDescription>
            App vẫn mở được nhưng các thao tác đọc/ghi dữ liệu sẽ không hoạt động cho
            đến khi bổ sung biến môi trường còn thiếu.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Ứng dụng</CardTitle>
                <CardDescription>Tên và phiên bản</CardDescription>
              </div>
              <Settings2 className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Tên app" value={appConfig.appName} />
            <SettingRow label="Version" value={appConfig.appVersion} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Supabase</CardTitle>
                <CardDescription>URL và anon key</CardDescription>
              </div>
              <Database className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={isSupabaseConfigured ? 'success' : 'warning'}>
              {isSupabaseConfigured ? 'Đã cấu hình' : 'Thiếu env'}
            </Badge>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {isSupabaseConfigured
                ? 'VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY đã có.'
                : `Thiếu: ${supabaseConfig.missingKeys.join(', ')}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Kết nối</CardTitle>
                <CardDescription>Trạng thái mạng hiện tại</CardDescription>
              </div>
              <Wifi className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <NetworkStatusBadge
              status={network.status}
              latencyMs={network.latencyMs}
            />
            <Button size="sm" variant="outline" onClick={() => void network.checkNow()}>
              Kiểm tra lại
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Phiên quản trị</CardTitle>
                <CardDescription>Session đang dùng</CardDescription>
              </div>
              <ShieldCheck className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={session ? 'success' : 'warning'}>
              <ShieldCheck />
              {session ? 'Đang đăng nhập admin' : 'Chưa đăng nhập'}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">
              Hết hạn: {formatDateTime(session?.expiresAt)}
            </p>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Hiển thị tiền</CardTitle>
                <CardDescription>Định dạng VND dùng toàn app</CardDescription>
              </div>
              <Banknote className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Đơn vị" value="VND" />
            <SettingRow
              label="Số dương"
              value={<MoneyText value={70_000} variant="positive" />}
            />
            <SettingRow
              label="Số âm"
              value={<MoneyText value={-50_000} variant="negative" />}
            />
            <SettingRow
              label="Số cân bằng"
              value={<MoneyText value={0} variant="neutral" />}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Màu sắc chỉ là tín hiệu phụ; các màn chính đều có nhãn dương, âm hoặc
              cân bằng để tránh nhầm lẫn.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Session storage</CardTitle>
                <CardDescription>Khóa localStorage của admin session</CardDescription>
              </div>
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4">
              <code className="break-all text-sm text-muted-foreground">
                {appConfig.sessionStorageKey}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Trophy className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Rule game đang dùng</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Chỉ hiển thị để kiểm tra. App không có màn quản lý hoặc chỉnh sửa rule.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RuleCard title="TFT 3 người" description={TFT_RULE_CODE_3P}>
            <RuleLine label="Nhất" value={getTftBaseAmount(3, 1)} />
            <RuleLine label="Hai" value={getTftBaseAmount(3, 2)} />
            <RuleLine label="Ba" value={getTftBaseAmount(3, 3)} />
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Penalty top2/top8: người dính mất{' '}
              <MoneyText value={-TFT_PENALTY_AMOUNT} className="font-semibold" />,
              người nhất nhận{' '}
              <MoneyText value={TFT_PENALTY_AMOUNT} className="font-semibold" /> cho
              mỗi penalty.
            </div>
          </RuleCard>

          <RuleCard title="TFT 4 người" description={TFT_RULE_CODE_4P}>
            <RuleLine label="Nhất" value={getTftBaseAmount(4, 1)} />
            <RuleLine label="Nhì" value={getTftBaseAmount(4, 2)} />
            <RuleLine label="Ba" value={getTftBaseAmount(4, 3)} />
            <RuleLine label="Bốn" value={getTftBaseAmount(4, 4)} />
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Penalty giống TFT 3 người: người dính mất{' '}
              <MoneyText value={-TFT_PENALTY_AMOUNT} className="font-semibold" />,
              người nhất nhận lại tổng penalty.
            </div>
          </RuleCard>

          <RuleCard title="Billiard" description="Nhập tiền thủ công">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Người dùng nhập tiền thủ công cho từng người chơi. Trước khi lưu,
              tổng số tiền bắt buộc bằng 0.
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Ô nhập tiền hỗ trợ các dạng như 50k, -50k, 50.000 hoặc 50000.
            </div>
            <Badge variant="success">
              <CheckCircle2 />
              Tổng phải bằng 0
            </Badge>
          </RuleCard>
        </div>
      </section>
    </div>
  )
}
