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
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-b',
          placement: 2,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-c',
          placement: 3,
          penalties: {
            top2: false,
            top8: false,
          },
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

  it('applies top2 and top8 penalties in a 3-player TFT result', () => {
    const results = calculateTftResults({
      participantCount: 3,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-b',
          placement: 2,
          penalties: {
            top2: true,
            top8: false,
          },
        },
        {
          playerId: 'player-c',
          placement: 3,
          penalties: {
            top2: false,
            top8: true,
          },
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

  it('calculates the default 4-player TFT result as zero-sum', () => {
    const results = calculateTftResults({
      participantCount: 4,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-b',
          placement: 2,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-c',
          placement: 3,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-d',
          placement: 4,
          penalties: {
            top2: false,
            top8: false,
          },
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

  it('applies top2 and top8 penalties in a 4-player TFT result', () => {
    const results = calculateTftResults({
      participantCount: 4,
      participants: [
        {
          playerId: 'player-a',
          placement: 1,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-b',
          placement: 2,
          penalties: {
            top2: true,
            top8: false,
          },
        },
        {
          playerId: 'player-c',
          placement: 3,
          penalties: {
            top2: false,
            top8: false,
          },
        },
        {
          playerId: 'player-d',
          placement: 4,
          penalties: {
            top2: false,
            top8: true,
          },
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
            penalties: {
              top2: false,
              top8: false,
            },
          },
          {
            playerId: 'player-b',
            placement: 1,
            penalties: {
              top2: false,
              top8: false,
            },
          },
          {
            playerId: 'player-c',
            placement: 3,
            penalties: {
              top2: false,
              top8: false,
            },
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
