export const TFT_PENALTY_AMOUNT = 10_000
export const TFT_RULE_CODE_3P = 'TFT_DEFAULT_3P_V1'
export const TFT_RULE_CODE_4P = 'TFT_DEFAULT_4P_V1'

export type TftParticipantCount = 3 | 4

export interface TftPenaltyFlags {
  top2: boolean
  top8: boolean
}

export interface TftParticipantInput {
  playerId: string
  placement: number
  penalties: TftPenaltyFlags
}

export interface TftCalculationInput {
  participantCount: TftParticipantCount
  participants: TftParticipantInput[]
}

export interface TftParticipantMetadata {
  top2: boolean
  top8: boolean
  penalty_count: number
  base_amount: number
  penalty_lost: number
  winner_penalty_bonus: number
}

export interface TftParticipantResult {
  playerId: string
  placement: number
  baseAmount: number
  penaltyCount: number
  penaltyLost: number
  winnerPenaltyBonus: number
  netAmount: number
  metadata: TftParticipantMetadata
}

const TFT_BASE_AMOUNTS: Record<TftParticipantCount, Record<number, number>> = {
  3: {
    1: 100_000,
    2: -50_000,
    3: -50_000,
  },
  4: {
    1: 70_000,
    2: 30_000,
    3: -50_000,
    4: -50_000,
  },
}

export function getTftBaseAmount(
  participantCount: TftParticipantCount,
  placement: number,
) {
  const baseAmount = TFT_BASE_AMOUNTS[participantCount][placement]

  if (typeof baseAmount !== 'number') {
    throw new Error('Placement TFT không hợp lệ.')
  }

  return baseAmount
}

export function getTftRuleCode(participantCount: TftParticipantCount) {
  return participantCount === 3 ? TFT_RULE_CODE_3P : TFT_RULE_CODE_4P
}

export function validateZeroSum(participants: Array<{ netAmount: number }>) {
  return participants.reduce((sum, participant) => sum + participant.netAmount, 0) === 0
}

export function sumNetAmount(participants: Array<{ netAmount: number }>) {
  return participants.reduce((sum, participant) => sum + participant.netAmount, 0)
}

function countPenalties(penalties: TftPenaltyFlags) {
  return Number(penalties.top2) + Number(penalties.top8)
}

export function calculateTftResults({
  participantCount,
  participants,
}: TftCalculationInput): TftParticipantResult[] {
  if (participants.length !== participantCount) {
    throw new Error('Số người chơi TFT không khớp rule đã chọn.')
  }

  const placements = participants.map((participant) => participant.placement)
  const uniquePlacements = new Set(placements)

  if (
    uniquePlacements.size !== participantCount ||
    placements.some(
      (placement) =>
        !Number.isInteger(placement) ||
        placement < 1 ||
        placement > participantCount,
    )
  ) {
    throw new Error('Placement TFT phải đủ hạng và không được trùng.')
  }

  const totalPenaltyCount = participants.reduce(
    (sum, participant) => sum + countPenalties(participant.penalties),
    0,
  )

  return participants.map((participant) => {
    const penaltyCount = countPenalties(participant.penalties)
    const baseAmount = getTftBaseAmount(participantCount, participant.placement)
    const penaltyLost = penaltyCount * -TFT_PENALTY_AMOUNT
    const winnerPenaltyBonus =
      participant.placement === 1 ? totalPenaltyCount * TFT_PENALTY_AMOUNT : 0
    const netAmount = baseAmount + penaltyLost + winnerPenaltyBonus

    return {
      playerId: participant.playerId,
      placement: participant.placement,
      baseAmount,
      penaltyCount,
      penaltyLost,
      winnerPenaltyBonus,
      netAmount,
      metadata: {
        top2: participant.penalties.top2,
        top8: participant.penalties.top8,
        penalty_count: penaltyCount,
        base_amount: baseAmount,
        penalty_lost: penaltyLost,
        winner_penalty_bonus: winnerPenaltyBonus,
      },
    }
  })
}
