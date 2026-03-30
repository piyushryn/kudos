import { prisma } from "../db/prisma";

/** Slack ID for synthetic user used as giver/receiver on admin audit rows (not a real Slack member). */
export const SYSTEM_AUDIT_SLACK_USER_ID = "USLACK_SYSTEM_KUDOS_AUDIT";

export const getSystemAuditUserId = async (): Promise<string> => {
  const existing = await prisma.user.findUnique({
    where: { slackUserId: SYSTEM_AUDIT_SLACK_USER_ID },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const category = await prisma.userCategory.findUnique({
    where: { key: "employee" },
    select: { id: true },
  });
  if (!category) {
    throw new Error("Missing employee user category; cannot create system audit user.");
  }

  const created = await prisma.user.create({
    data: {
      slackUserId: SYSTEM_AUDIT_SLACK_USER_ID,
      displayName: "System (admin audit)",
      userCategoryId: category.id,
    },
    select: { id: true },
  });
  return created.id;
};
