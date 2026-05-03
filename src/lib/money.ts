const VND_NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

interface FormatVndOptions {
  showSign?: boolean
}

export function formatVnd(
  value: number | null | undefined,
  options: FormatVndOptions = {},
) {
  const amount = value ?? 0
  const showSign = options.showSign ?? true
  const formattedAmount = `${VND_NUMBER_FORMATTER.format(Math.abs(amount))} ₫`

  if (amount > 0 && showSign) {
    return `+${formattedAmount}`
  }

  if (amount < 0) {
    return `-${formattedAmount}`
  }

  return formattedAmount
}

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/[^\d-]/g, '')
  if (!normalized || normalized === '-') {
    return 0
  }

  return Number.parseInt(normalized, 10)
}
