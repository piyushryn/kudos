type KudosSuccessParams = {
  giverDisplayName: string;
  receiverDisplayName: string;
  points: number;
  message: string;
  remainingBalance: number;
};


const getKudosImageUrl = (params: KudosSuccessParams): string =>{
  const baseImageUrl = 'https://stage-ik.imagekit.io/rtsmrscto/DO%20NOT%20DELETE/brand.png'
  const transformation = `l-text,ff-Amaranth,w-600,i-${params.receiverDisplayName}%20just%20scored%2050%20kudos%20points%20from%20${params.giverDisplayName}.%20Good%20job.,lfo-centre,fs-bh_div_15,co-white,ia-center,pa-bh_div_40,l-end`
  return `${baseImageUrl}?tr=${transformation}`
}

export const formatKudosSuccessMessage = (params: KudosSuccessParams): string =>
  [
    "🎉 *Kudos Awarded!*",
    "",
    `${params.giverDisplayName} → ${params.receiverDisplayName}`,
    `Points: ${params.points}`,
    "",
    `*"${params.message}"*`,
    "",
    `${getKudosImageUrl(params)}`,
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
