import { ArchivedLeaderboardModel } from "../db/models";

export type ArchivedLeaderboardEntry = {
  userId: string;
  slackUserId: string;
  displayName: string;
  points: number;
};

export type ArchivedLeaderboard = {
  month: number;
  year: number;
  archivedAt: Date;
  topGivers: ArchivedLeaderboardEntry[];
  topReceivers: ArchivedLeaderboardEntry[];
};

export const getArchivedLeaderboard = async (
  month: number,
  year: number,
): Promise<ArchivedLeaderboard | null> => {
  const archived = await ArchivedLeaderboardModel.findOne({ month, year }).lean().exec();
  if (!archived) {
    return null;
  }

  return {
    month: archived.month,
    year: archived.year,
    archivedAt: archived.archivedAt as Date,
    topGivers: archived.topGivers.map((g) => ({
      userId: String(g.userId),
      slackUserId: g.slackUserId,
      displayName: g.displayName,
      points: g.points,
    })),
    topReceivers: archived.topReceivers.map((r) => ({
      userId: String(r.userId),
      slackUserId: r.slackUserId,
      displayName: r.displayName,
      points: r.points,
    })),
  };
};

export const listArchivedLeaderboards = async (): Promise<
  Array<{
    month: number;
    year: number;
    archivedAt: Date;
  }>
> => {
  const archives = await ArchivedLeaderboardModel.find({}, { month: 1, year: 1, archivedAt: 1 })
    .sort({ year: -1, month: -1 })
    .lean()
    .exec();

  return archives.map((a) => ({
    month: a.month,
    year: a.year,
    archivedAt: a.archivedAt as Date,
  }));
};
