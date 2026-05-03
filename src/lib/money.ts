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
  const compactValue = value.trim().toLowerCase().replace(/\s+/g, '')

  if (!compactValue || compactValue === '-' || compactValue === '+') {
    return 0
  }

  const sign = compactValue.startsWith('-') ? -1 : 1
  const unsignedValue = compactValue.replace(/^[+-]/, '')
  const usesThousandsSuffix = unsignedValue.endsWith('k')
  const numberText = unsignedValue
    .replace(/k$/, '')
    .replace(/vnd|₫|đ/g, '')
    .replace(/[.,]/g, '')
    .replace(/[^\d]/g, '')

  if (!numberText) {
    return 0
  }

  const amount = Number.parseInt(numberText, 10)
  return sign * (usesThousandsSuffix ? amount * 1_000 : amount)
}
