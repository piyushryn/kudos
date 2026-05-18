import { config } from "../config";
import { userRepository } from "../db/user.repository";
import { UserModel } from "../db/models";
import { AppError } from "../utils/errors";
import { getOrCreateUser } from "./user.service";

export type AppRole = "user" | "admin" | "super_admin";

export const isSuperAdminSlackUserId = (slackUserId: string): boolean =>
  config.SUPER_ADMIN_SLACK_USER_IDS.includes(slackUserId);

export const resolveRole = (slackUserId: string, isAdmin: boolean): AppRole => {
  if (isSuperAdminSlackUserId(slackUserId)) {
    return "super_admin";
  }
  return isAdmin ? "admin" : "user";
};

export const getOrCreateUserWithRole = async (
  slackUserId: string,
  displayName?: string,
): Promise<{ slackUserId: string; displayName: string; role: AppRole }> => {
  const user = await getOrCreateUser(slackUserId, displayName);
  return {
    slackUserId: user.slackUserId,
    displayName: user.displayName,
    role: resolveRole(user.slackUserId, user.isAdmin),
  };
};

export const getExistingUserWithRole = async (
  slackUserId: string,
): Promise<{ slackUserId: string; displayName: string; role: AppRole } | null> => {
  const user = await userRepository.findBySlackUserId(slackUserId);
  if (!user) {
    return null;
  }
  return {
    slackUserId: user.slackUserId,
    displayName: user.displayName,
    role: resolveRole(user.slackUserId, user.isAdmin),
  };
};

export const setUserAdminRoleBySlackId = async (
  slackUserId: string,
  makeAdmin: boolean,
): Promise<void> => {
  if (isSuperAdminSlackUserId(slackUserId) && !makeAdmin) {
    throw new AppError("Super admin role is env-controlled and cannot be revoked here.", 400);
  }
  const updated = await userRepository.updateAdminFlagBySlackUserId(slackUserId, makeAdmin);
  if (!updated) {
    throw new AppError("User not found.", 404);
  }
};

export type RoleManagedUserRow = {
  slackUserId: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AppRole;
};

export const listRoleManagedUsers = async (
  page = 1,
  limit = 50,
  search?: string,
): Promise<{ users: RoleManagedUserRow[]; total: number; page: number; pageSize: number }> => {
  const pageSize = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * pageSize;
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
    UserModel.find(where, { slackUserId: 1, displayName: 1, isAdmin: 1 })
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec(),
    UserModel.countDocuments(where),
  ]);

  return {
    users: users.map((user) => ({
      slackUserId: user.slackUserId,
      displayName: user.displayName,
      isAdmin: Boolean(user.isAdmin),
      isSuperAdmin: isSuperAdminSlackUserId(user.slackUserId),
      role: resolveRole(user.slackUserId, Boolean(user.isAdmin)),
    })),
    total,
    page: Math.max(page, 1),
    pageSize,
  };
};
