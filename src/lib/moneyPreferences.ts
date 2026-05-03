import { useSyncExternalStore } from 'react'

import {
  DEFAULT_MONEY_DISPLAY_FORMAT,
  type MoneyDisplayFormat,
} from '@/lib/money'

const MONEY_DISPLAY_FORMAT_STORAGE_KEY =
  'game_money_ledger_money_display_format'

const listeners = new Set<() => void>()

function isMoneyDisplayFormat(value: string | null): value is MoneyDisplayFormat {
  return (
    value === 'compact-thousands' ||
    value === 'vnd-suffix' ||
    value === 'dong-suffix'
  )
}

function notifyMoneyDisplayFormatListeners() {
  for (const listener of listeners) {
    listener()
  }
}

export function getStoredMoneyDisplayFormat(): MoneyDisplayFormat {
  if (typeof window === 'undefined') {
    return DEFAULT_MONEY_DISPLAY_FORMAT
  }

  const value = window.localStorage.getItem(MONEY_DISPLAY_FORMAT_STORAGE_KEY)
  return isMoneyDisplayFormat(value) ? value : DEFAULT_MONEY_DISPLAY_FORMAT
}

export function setStoredMoneyDisplayFormat(format: MoneyDisplayFormat) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MONEY_DISPLAY_FORMAT_STORAGE_KEY, format)
  }

  notifyMoneyDisplayFormatListeners()
}

export function subscribeMoneyDisplayFormat(listener: () => void) {
  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key === MONEY_DISPLAY_FORMAT_STORAGE_KEY) {
      listener()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    listeners.delete(listener)

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}

export function useMoneyDisplayFormat() {
  const displayFormat = useSyncExternalStore(
    subscribeMoneyDisplayFormat,
    getStoredMoneyDisplayFormat,
    () => DEFAULT_MONEY_DISPLAY_FORMAT,
  )

  return {
    displayFormat,
    setDisplayFormat: setStoredMoneyDisplayFormat,
  }
}
