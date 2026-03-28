type KudosSuccessParams = {
  giverDisplayName: string;
  receiverDisplayName: string;
  points: number;
  message: string;
  remainingBalance: number;
};

export const formatKudosSuccessMessage = (params: KudosSuccessParams): string =>
  [
    "🎉 *Kudos Awarded!*",
    "",
    `${params.giverDisplayName} → ${params.receiverDisplayName}`,
    `Points: ${params.points}`,
    "",
    `*"${params.message}"*`,
    "",
    `Remaining balance: ${params.remainingBalance}`,
  ].join("\n");

export const formatKudosErrorMessage = (message: string): string => `⚠️ ${message}`;

export const formatBalanceMessage = (displayName: string, balance: number): string =>
  `💳 *${displayName}*, your remaining monthly kudos balance is *${balance}* points.`;

export const formatStatsMessage = (
  displayName: string,
  totalGiven: number,
  totalReceived: number,
  remainingBalance: number,
): string =>
  [
    `📊 *Kudos stats for ${displayName}*`,
    `- Total given: *${totalGiven}*`,
    `- Total received: *${totalReceived}*`,
    `- Remaining this month: *${remainingBalance}*`,
  ].join("\n");

type LeaderboardItem = {
  displayName: string;
  points: number;
};

const asRankedLines = (items: LeaderboardItem[]): string[] => {
  if (items.length === 0) {
    return ["No data yet."];
  }

  return items.map((item, index) => `${index + 1}. ${item.displayName} — *${item.points}*`);
};

export const formatLeaderboardMessage = (
  topGivers: LeaderboardItem[],
  topReceivers: LeaderboardItem[],
): string =>
  [
    "🏆 *Kudos Leaderboard*",
    "",
    "*Top Givers*",
    ...asRankedLines(topGivers),
    "",
    "*Top Receivers*",
    ...asRankedLines(topReceivers),
  ].join("\n");
