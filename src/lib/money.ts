export type MoneyDisplayFormat =
  | 'compact-thousands'
  | 'vnd-suffix'
  | 'dong-suffix'

export const DEFAULT_MONEY_DISPLAY_FORMAT: MoneyDisplayFormat = 'compact-thousands'

export const MONEY_DISPLAY_FORMAT_OPTIONS: Array<{
  value: MoneyDisplayFormat
  label: string
  description: string
}> = [
  {
    value: 'compact-thousands',
    label: '10',
    description: 'Mặc định: 10000 hiện thành 10.',
  },
  {
    value: 'vnd-suffix',
    label: '10,000VNĐ',
    description: 'Hiện đủ số tiền và hậu tố VNĐ.',
  },
  {
    value: 'dong-suffix',
    label: '10,000đ',
    description: 'Hiện đủ số tiền và hậu tố đ.',
  },
]

const MONEY_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

interface FormatVndOptions {
  showSign?: boolean
  displayFormat?: MoneyDisplayFormat
}

function formatCompactThousands(value: number) {
  const thousands = value / 1_000

  if (Number.isInteger(thousands)) {
    return MONEY_NUMBER_FORMATTER.format(thousands)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(thousands)
}

function formatAbsoluteAmount(
  amount: number,
  displayFormat: MoneyDisplayFormat,
) {
  if (displayFormat === 'compact-thousands') {
    return formatCompactThousands(amount)
  }

  const formattedAmount = MONEY_NUMBER_FORMATTER.format(amount)
  return displayFormat === 'vnd-suffix'
    ? `${formattedAmount}VNĐ`
    : `${formattedAmount}đ`
}

export function formatVnd(
  value: number | null | undefined,
  options: FormatVndOptions = {},
) {
  const amount = value ?? 0
  const showSign = options.showSign ?? true
  const displayFormat = options.displayFormat ?? DEFAULT_MONEY_DISPLAY_FORMAT
  const formattedAmount = formatAbsoluteAmount(Math.abs(amount), displayFormat)

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
    .replace(/vnđ|vnd|₫|đ/g, '')
    .replace(/[.,]/g, '')
    .replace(/[^\d]/g, '')

  if (!numberText) {
    return 0
  }

  const amount = Number.parseInt(numberText, 10)
  return sign * (usesThousandsSuffix ? amount * 1_000 : amount)
}

export function formatMoneyInputValue(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue === '-' || trimmedValue === '+') {
    return trimmedValue
  }

  const amount = parseMoneyInput(trimmedValue)
  const hasExplicitPlus = trimmedValue.startsWith('+')
  const sign = amount < 0 ? '-' : hasExplicitPlus && amount > 0 ? '+' : ''

  return `${sign}${MONEY_NUMBER_FORMATTER.format(Math.abs(amount))}`
}
