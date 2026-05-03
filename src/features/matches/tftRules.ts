export const TFT_PENALTY_AMOUNT = 10_000
export const TFT_RULE_CODE_3P = 'TFT_ACTUAL_TOP_3P_V2'
export const TFT_RULE_CODE_4P = 'TFT_ACTUAL_TOP_4P_V2'

export type TftParticipantCount = 3 | 4

export interface TftPenaltyFlags {
  top2: boolean
  top8: boolean
}

export interface TftParticipantInput {
  playerId: string
  placement: number
}

export interface TftCalculationInput {
  participantCount: TftParticipantCount
  participants: TftParticipantInput[]
}

export interface TftParticipantMetadata {
  top2: boolean
  top8: boolean
  actual_placement: number
  group_placement: number
  penalty_count: number
  base_amount: number
  penalty_lost: number
  winner_penalty_bonus: number
}

export interface TftParticipantResult {
  playerId: string
  placement: number
  groupPlacement: number
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

function getPenaltyFlags(placement: number): TftPenaltyFlags {
  return {
    top2: placement === 2,
    top8: placement === 8,
  }
}

function countPenalties(penalties: TftPenaltyFlags) {
  return Number(penalties.top2) + Number(penalties.top8)
}

function getGroupPlacements(participants: TftParticipantInput[]) {
  const sortedPlacements = [...participants]
    .map((participant) => participant.placement)
    .sort((a, b) => a - b)

  return new Map(
    sortedPlacements.map((placement, index) => [placement, index + 1]),
  )
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
        placement > 8,
    )
  ) {
    throw new Error('Top TFT phải nằm trong 1-8 và không được trùng.')
  }

  const groupPlacementsByPlacement = getGroupPlacements(participants)
  const totalPenaltyCount = participants.reduce(
    (sum, participant) => sum + countPenalties(getPenaltyFlags(participant.placement)),
    0,
  )

  return participants.map((participant) => {
    const groupPlacement = groupPlacementsByPlacement.get(participant.placement)

    if (!groupPlacement) {
      throw new Error('Không tính được hạng nội bộ TFT.')
    }

    const penalties = getPenaltyFlags(participant.placement)
    const penaltyCount = countPenalties(penalties)
    const baseAmount = getTftBaseAmount(participantCount, groupPlacement)
    const penaltyLost = penaltyCount * -TFT_PENALTY_AMOUNT
    const winnerPenaltyBonus =
      groupPlacement === 1 ? totalPenaltyCount * TFT_PENALTY_AMOUNT : 0
    const netAmount = baseAmount + penaltyLost + winnerPenaltyBonus

    return {
      playerId: participant.playerId,
      placement: participant.placement,
      groupPlacement,
      baseAmount,
      penaltyCount,
      penaltyLost,
      winnerPenaltyBonus,
      netAmount,
      metadata: {
        top2: penalties.top2,
        top8: penalties.top8,
        actual_placement: participant.placement,
        group_placement: groupPlacement,
        penalty_count: penaltyCount,
        base_amount: baseAmount,
        penalty_lost: penaltyLost,
        winner_penalty_bonus: winnerPenaltyBonus,
      },
    }
  })
}
