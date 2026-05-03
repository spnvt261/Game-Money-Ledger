const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function formatVnd(value: number | null | undefined) {
  return VND_FORMATTER.format(value ?? 0)
}

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/[^\d-]/g, '')
  if (!normalized || normalized === '-') {
    return 0
  }

  return Number.parseInt(normalized, 10)
}
