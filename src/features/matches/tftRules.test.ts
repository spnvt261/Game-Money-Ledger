import {
  calculateTftResults,
  sumNetAmount,
  validateZeroSum,
} from './tftRules'

function assertEqual(actual: number | boolean, expected: number | boolean, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${expected}, received ${actual}.`)
  }
}

const threePlayerResults = calculateTftResults({
  participantCount: 3,
  participants: [
    {
      playerId: 'player-1',
      placement: 1,
      penalties: {
        top2: false,
        top8: false,
      },
    },
    {
      playerId: 'player-2',
      placement: 2,
      penalties: {
        top2: true,
        top8: false,
      },
    },
    {
      playerId: 'player-3',
      placement: 3,
      penalties: {
        top2: false,
        top8: true,
      },
    },
  ],
})

assertEqual(sumNetAmount(threePlayerResults), 0, 'TFT 3P must be zero-sum')
assertEqual(threePlayerResults[0].netAmount, 120_000, 'TFT 3P winner net')
assertEqual(threePlayerResults[1].netAmount, -60_000, 'TFT 3P top2 penalty')
assertEqual(threePlayerResults[2].netAmount, -60_000, 'TFT 3P top8 penalty')

const fourPlayerResults = calculateTftResults({
  participantCount: 4,
  participants: [
    {
      playerId: 'player-1',
      placement: 1,
      penalties: {
        top2: true,
        top8: false,
      },
    },
    {
      playerId: 'player-2',
      placement: 2,
      penalties: {
        top2: false,
        top8: false,
      },
    },
    {
      playerId: 'player-3',
      placement: 3,
      penalties: {
        top2: false,
        top8: false,
      },
    },
    {
      playerId: 'player-4',
      placement: 4,
      penalties: {
        top2: false,
        top8: true,
      },
    },
  ],
})

assertEqual(validateZeroSum(fourPlayerResults), true, 'TFT 4P must be zero-sum')
assertEqual(fourPlayerResults[0].netAmount, 80_000, 'TFT 4P winner with own penalty')
assertEqual(fourPlayerResults[1].netAmount, 30_000, 'TFT 4P second place')
assertEqual(fourPlayerResults[2].netAmount, -50_000, 'TFT 4P third place')
assertEqual(fourPlayerResults[3].netAmount, -60_000, 'TFT 4P top8 penalty')
