import { describe, expect, it } from 'vitest'

import { formatMoneyInputValue, formatVnd, parseMoneyInput } from './money'

describe('formatVnd', () => {
  it('formats positive money with a plus sign by default', () => {
    expect(formatVnd(100_000)).toBe('+100')
  })

  it('formats negative and zero money', () => {
    expect(formatVnd(-50_000)).toBe('-50')
    expect(formatVnd(0)).toBe('0')
    expect(formatVnd(null)).toBe('0')
  })

  it('can hide the plus sign for positive money', () => {
    expect(formatVnd(70_000, { showSign: false })).toBe('70')
  })

  it('can use full VND display formats', () => {
    expect(formatVnd(10_000, { displayFormat: 'vnd-suffix' })).toBe(
      '+10,000VNĐ',
    )
    expect(formatVnd(10_000, { displayFormat: 'dong-suffix' })).toBe(
      '+10,000đ',
    )
  })
})

describe('parseMoneyInput', () => {
  it('parses shorthand and formatted VND amounts', () => {
    expect(parseMoneyInput('50k')).toBe(50_000)
    expect(parseMoneyInput('-50k')).toBe(-50_000)
    expect(parseMoneyInput('+100k')).toBe(100_000)
    expect(parseMoneyInput('50.000')).toBe(50_000)
    expect(parseMoneyInput('-100,000')).toBe(-100_000)
    expect(parseMoneyInput('50.000 \u20ab')).toBe(50_000)
    expect(parseMoneyInput('50.000\u0111')).toBe(50_000)
    expect(parseMoneyInput('10,000VN\u0110')).toBe(10_000)
  })

  it('treats empty or unfinished input as zero', () => {
    expect(parseMoneyInput('')).toBe(0)
    expect(parseMoneyInput('   ')).toBe(0)
    expect(parseMoneyInput('-')).toBe(0)
    expect(parseMoneyInput('+')).toBe(0)
  })

  it('strips unrelated characters instead of throwing', () => {
    expect(parseMoneyInput('abc 50k')).toBe(50_000)
    expect(parseMoneyInput('abc')).toBe(0)
  })
})

describe('formatMoneyInputValue', () => {
  it('formats raw money input with comma grouping', () => {
    expect(formatMoneyInputValue('10000')).toBe('10,000')
    expect(formatMoneyInputValue('-10000')).toBe('-10,000')
    expect(formatMoneyInputValue('+10000')).toBe('+10,000')
    expect(formatMoneyInputValue('50k')).toBe('50,000')
  })

  it('preserves empty and sign-only input', () => {
    expect(formatMoneyInputValue('')).toBe('')
    expect(formatMoneyInputValue('-')).toBe('-')
    expect(formatMoneyInputValue('+')).toBe('+')
  })
})
