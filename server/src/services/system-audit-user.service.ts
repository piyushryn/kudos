import { UserCategoryModel, UserModel } from "../db/models";

/** Slack ID for synthetic user used as giver/receiver on admin audit rows (not a real Slack member). */
export const SYSTEM_AUDIT_SLACK_USER_ID = "USLACK_SYSTEM_KUDOS_AUDIT";

export const getSystemAuditUserId = async (): Promise<string> => {
  const existing = await UserModel.findOne({ slackUserId: SYSTEM_AUDIT_SLACK_USER_ID }, { _id: 1 })
    .lean()
    .exec();
  if (existing) {
    return String(existing._id);
  }

  const category = await UserCategoryModel.findOne({ key: "employee" }, { _id: 1 }).lean().exec();
  if (!category) {
    throw new Error("Missing employee user category; cannot create system audit user.");
  }

  const created = await UserModel.create({
    slackUserId: SYSTEM_AUDIT_SLACK_USER_ID,
    displayName: "System (admin audit)",
    userCategoryId: category._id,
  });
  return String(created._id);
};
