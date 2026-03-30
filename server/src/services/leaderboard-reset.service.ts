import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";

/** Removes all kudos transactions (leaderboard + audit log entries). */
export const deleteAllKudosTransactions = async (): Promise<{ deleted: number }> => {
  const result = await prisma.kudosTransaction.deleteMany({});
  return { deleted: result.count };
};

/** Removes every transaction where the user gave or received kudos. */
export const deleteKudosTransactionsForUserId = async (userId: string): Promise<{ deleted: number }> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const result = await prisma.kudosTransaction.deleteMany({
    where: {
      OR: [{ giverId: userId }, { receiverId: userId }],
    },
  });
  return { deleted: result.count };
};

export const deleteKudosTransactionsForSlackUserId = async (
  slackUserId: string,
): Promise<{ deleted: number }> => {
  const user = await prisma.user.findUnique({
    where: { slackUserId },
    select: { id: true },
  });
  if (!user) {
    throw new AppError("No user with that Slack ID.", 404);
  }
  const result = await prisma.kudosTransaction.deleteMany({
    where: {
      OR: [{ giverId: user.id }, { receiverId: user.id }],
    },
  });
  return { deleted: result.count };
};
