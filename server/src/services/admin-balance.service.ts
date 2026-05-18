import { config } from "../config";
import { asObjectId } from "../db/mappers";
import { UserCategoryModel, UserGivingBalanceModel, UserModel } from "../db/models";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";
import { AppError } from "../utils/errors";

export const upsertCurrentMonthBalanceToQuota = async (userId: string): Promise<void> => {
  const { month, year } = getMonthYear();
  const user = await UserModel.findById(asObjectId(userId)).populate("userCategoryId").lean().exec();
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  const quota = effectiveQuotaForUser({
    userCategory: {
      monthlyGivingQuota: ((user.userCategoryId as unknown as { monthlyGivingQuota?: number | null })
        .monthlyGivingQuota ??
        null),
    },
  });

  await UserGivingBalanceModel.findOneAndUpdate(
    { userId: asObjectId(userId), month, year },
    { $set: { remainingPoints: quota }, $setOnInsert: { userId: asObjectId(userId), month, year } },
    { upsert: true },
  ).exec();
};

export const setUserCategoryBySlackId = async (
  slackUserId: string,
  userCategoryId: string,
): Promise<void> => {
  const user = await UserModel.findOne({ slackUserId }, { _id: 1 }).lean().exec();
  if (!user) {
    throw new AppError(
      `No user with Slack ID ${slackUserId}. They must interact with the app first, or check the ID.`,
      404,
    );
  }
  const category = await UserCategoryModel.findById(asObjectId(userCategoryId), { _id: 1 }).lean().exec();
  if (!category) {
    throw new AppError("Unknown user category.", 404);
  }
  await UserModel.findByIdAndUpdate(user._id, { userCategoryId: category._id }).exec();
};

export const bulkSetUserCategoryBySlackIds = async (
  slackUserIds: string[],
  userCategoryId: string,
): Promise<{ updated: number }> => {
  const category = await UserCategoryModel.findById(asObjectId(userCategoryId), { _id: 1 }).lean().exec();
  if (!category) {
    throw new AppError("Unknown user category.", 404);
  }
  const normalized = [...new Set(slackUserIds.map((id) => id.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    throw new AppError("Provide at least one Slack user ID.", 400);
  }
  if (normalized.length > 500) {
    throw new AppError("At most 500 Slack user IDs per request.", 400);
  }

  const result = await UserModel.updateMany(
    { slackUserId: { $in: normalized } },
    { $set: { userCategoryId: category._id } },
  ).exec();

  return { updated: result.modifiedCount };
};

export const resetCurrentMonthBalanceBySlackId = async (slackUserId: string): Promise<void> => {
  const user = await UserModel.findOne({ slackUserId }, { _id: 1 }).lean().exec();
  if (!user) {
    throw new AppError(`No user with Slack ID ${slackUserId}. They may not have used the app yet.`, 404);
  }
  await upsertCurrentMonthBalanceToQuota(String(user._id));
};

export const resetAllUsersCurrentMonthBalances = async (): Promise<{ usersReset: number }> => {
  const { month, year } = getMonthYear();
  const allUsers = await UserModel.find({}).populate("userCategoryId").lean().exec();

  for (const user of allUsers) {
        const quota = effectiveQuotaForUser({
          userCategory: {
            monthlyGivingQuota: ((user.userCategoryId as unknown as { monthlyGivingQuota?: number | null })
              .monthlyGivingQuota ??
              null),
          },
        });
        await UserGivingBalanceModel.findOneAndUpdate(
          { userId: user._id, month, year },
          { $set: { remainingPoints: quota }, $setOnInsert: { userId: user._id, month, year } },
          { upsert: true },
        ).exec();
    }

  return { usersReset: allUsers.length };
};

export type AdminUserCategorySummary = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

export type AdminUserRow = {
  id: string;
  slackUserId: string;
  displayName: string;
  userCategory: AdminUserCategorySummary;
  effectiveMonthlyQuota: number;
  remainingBalanceThisMonth: number;
};

export const listUsersForAdmin = async (
  page = 1,
  limit = 50,
  search?: string,
): Promise<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }> => {
  const pageSize = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * pageSize;
  const { month, year } = getMonthYear();

  const where =
    search && search.trim().length > 0
      ? {
          $or: [
            { displayName: { $regex: search.trim(), $options: "i" } },
            { slackUserId: { $regex: search.trim() } },
          ],
        }
      : {};

  const [users, total] = await Promise.all([
    UserModel.find(where).sort({ displayName: 1 }).skip(skip).limit(pageSize).populate("userCategoryId").lean().exec(),
    UserModel.countDocuments(where),
  ]);

  const ids = users.map((u) => u._id);
  const balances =
    ids.length === 0
      ? []
      : await UserGivingBalanceModel.find({
          userId: { $in: ids },
          month,
          year,
        })
          .lean()
          .exec();
  const balByUser = new Map(balances.map((b) => [String(b.userId), b.remainingPoints]));

  const rows: AdminUserRow[] = users.map((u) => {
    const category = u.userCategoryId as unknown as {
      _id: unknown;
      key: string;
      name: string;
      monthlyGivingQuota?: number | null;
    };
    const effective = effectiveQuotaForUser({
      userCategory: { monthlyGivingQuota: category.monthlyGivingQuota ?? null },
    });
    const remaining = balByUser.get(String(u._id));
    return {
      id: String(u._id),
      slackUserId: u.slackUserId,
      displayName: u.displayName,
      userCategory: {
        id: String(category._id),
        key: category.key,
        name: category.name,
        monthlyGivingQuota: category.monthlyGivingQuota ?? null,
      },
      effectiveMonthlyQuota: effective,
      remainingBalanceThisMonth: remaining ?? effective,
    };
  });

  return { users: rows, total, page: Math.max(page, 1), pageSize };
};

export const getWorkspaceQuotaDefaults = (): { defaultMonthlyBalance: number } => ({
  defaultMonthlyBalance: config.DEFAULT_MONTHLY_BALANCE,
});
