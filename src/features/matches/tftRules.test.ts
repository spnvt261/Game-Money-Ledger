import {
  calculateTftResults,
  sumNetAmount,
  validateZeroSum,
} from './tftRules'
import { describe, expect, it } from 'vitest'

describe('calculateTftResults', () => {
  it('calculates the default 3-player TFT result as zero-sum', () => {
    const results = calculateTftResults({
      participantCount: 3,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
        },
        {
          playerId: 'player-b',
          placement: 3,
        },
        {
          playerId: 'player-c',
          placement: 4,
        },
      ],
    })

    expect(results.map((result) => result.netAmount)).toEqual([
      100_000,
      -50_000,
      -50_000,
    ])
    expect(sumNetAmount(results)).toBe(0)
    expect(validateZeroSum(results)).toBe(true)
  })

  it('automatically applies top2 and top8 penalties from actual TFT top in a 3-player result', () => {
    const results = calculateTftResults({
      participantCount: 3,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
        },
        {
          playerId: 'player-b',
          placement: 2,
        },
        {
          playerId: 'player-c',
          placement: 8,
        },
      ],
    })

    expect(results.map((result) => result.netAmount)).toEqual([
      120_000,
      -60_000,
      -60_000,
    ])
    expect(validateZeroSum(results)).toBe(true)
  })

  it('lets the group winner also lose a top2 penalty when their actual top is 2', () => {
    const results = calculateTftResults({
      participantCount: 3,
      participants: [
        {
          playerId: 'player-a',
          placement: 2,
        },
        {
          playerId: 'player-b',
          placement: 3,
        },
        {
          playerId: 'player-c',
          placement: 8,
        },
      ],
    })

    expect(results.map((result) => result.netAmount)).toEqual([
      110_000,
      -50_000,
      -60_000,
    ])
    expect(results.map((result) => result.groupPlacement)).toEqual([1, 2, 3])
    expect(validateZeroSum(results)).toBe(true)
  })

  it('calculates the default 4-player TFT result as zero-sum', () => {
    const results = calculateTftResults({
      participantCount: 4,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
        },
        {
          playerId: 'player-b',
          placement: 3,
        },
        {
          playerId: 'player-c',
          placement: 4,
        },
        {
          playerId: 'player-d',
          placement: 5,
        },
      ],
    })

    expect(results.map((result) => result.netAmount)).toEqual([
      70_000,
      30_000,
      -50_000,
      -50_000,
    ])
    expect(sumNetAmount(results)).toBe(0)
    expect(validateZeroSum(results)).toBe(true)
  })

  it('automatically applies top2 and top8 penalties in a 4-player TFT result', () => {
    const results = calculateTftResults({
      participantCount: 4,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
        },
        {
          playerId: 'player-b',
          placement: 2,
        },
        {
          playerId: 'player-c',
          placement: 3,
        },
        {
          playerId: 'player-d',
          placement: 8,
        },
      ],
    })

    expect(results.map((result) => result.netAmount)).toEqual([
      90_000,
      20_000,
      -50_000,
      -60_000,
    ])
    expect(validateZeroSum(results)).toBe(true)
  })

  it('rejects duplicate placements', () => {
    expect(() =>
      calculateTftResults({
        participantCount: 3,
        participants: [
          {
          playerId: 'player-a',
          placement: 1,
        },
        {
          playerId: 'player-b',
          placement: 1,
        },
        {
          playerId: 'player-c',
          placement: 3,
        },
      ],
    }),
    ).toThrow()
  })
})

describe('validateZeroSum', () => {
  it('validates a billiard result where A wins and B loses', () => {
    expect(
      validateZeroSum([
        {
          netAmount: 50_000,
        },
        {
          netAmount: -50_000,
        },
      ]),
    ).toBe(true)
  })

  it('rejects a non-balanced result', () => {
    expect(
      validateZeroSum([
        {
          netAmount: 50_000,
        },
        {
          netAmount: -40_000,
        },
      ]),
    ).toBe(false)
  })
})
