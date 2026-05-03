import {
  Banknote,
  CheckCircle2,
  Settings2,
  Trophy,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { MoneyText } from '@/components/MoneyText'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getTftBaseAmount,
  TFT_PENALTY_AMOUNT,
  TFT_RULE_CODE_3P,
  TFT_RULE_CODE_4P,
} from '@/features/matches/tftRules'
import { appConfig } from '@/lib/env'
import {
  MONEY_DISPLAY_FORMAT_OPTIONS,
  type MoneyDisplayFormat,
} from '@/lib/money'
import { useMoneyDisplayFormat } from '@/lib/moneyPreferences'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50'

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
  const { displayFormat, setDisplayFormat } = useMoneyDisplayFormat()
  const selectedMoneyOption =
    MONEY_DISPLAY_FORMAT_OPTIONS.find((option) => option.value === displayFormat) ??
    MONEY_DISPLAY_FORMAT_OPTIONS[0]

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Cài đặt"
        title="Cài đặt"
        description="Cấu hình hiển thị tiền và kiểm tra rule đang dùng."
      />

      <section className="grid gap-4 lg:grid-cols-2">
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
                <CardTitle>Hiển thị tiền</CardTitle>
                <CardDescription>Định dạng VND dùng toàn app</CardDescription>
              </div>
              <Banknote className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="moneyDisplayFormat"
              >
                Kiểu hiển thị
              </label>
              <select
                id="moneyDisplayFormat"
                className={selectClassName}
                value={displayFormat}
                onChange={(event) =>
                  setDisplayFormat(event.target.value as MoneyDisplayFormat)
                }
              >
                {MONEY_DISPLAY_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.value === 'compact-thousands' ? ' (mặc định)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm leading-6 text-muted-foreground">
                {selectedMoneyOption.description}
              </p>
            </div>
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
          </CardContent>
        </Card>
      </section>

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
              Penalty tự tính từ top 2/top 8: người dính mất{' '}
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
              Penalty tự tính giống TFT 3 người: người dính mất{' '}
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
              Ô nhập tiền hỗ trợ các dạng như 50k, -50k, 50,000 hoặc 50000.
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
