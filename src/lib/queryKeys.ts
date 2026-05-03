export const queryKeys = {
  players: ['players'] as const,
  playerBalances: ['playerBalances'] as const,
  dashboardSummary: ['dashboardSummary'] as const,
  matchHistory: ['matchHistory'] as const,
  matchHistoryList: (filters: unknown) => ['matchHistory', filters] as const,
  matchDetails: ['matchDetails'] as const,
  matchDetail: (matchId: string) => ['matchDetails', matchId] as const,
}
