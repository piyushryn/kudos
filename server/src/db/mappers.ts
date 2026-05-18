import { Types } from "mongoose";

import { KudosEntryKind } from "./constants";

export const asObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

export type UserCategoryRecord = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
  createdAt: Date;
};

export type UserRecord = {
  id: string;
  slackUserId: string;
  displayName: string;
  isAdmin: boolean;
  userCategoryId: string;
  createdAt: Date;
};

export type UserWithCategoryRecord = UserRecord & {
  userCategory: UserCategoryRecord;
};

export type UserGivingBalanceRecord = {
  id: string;
  userId: string;
  month: number;
  year: number;
  remainingPoints: number;
};

export type KudosTransactionRecord = {
  id: string;
  kind: KudosEntryKind;
  countsTowardTotals: boolean;
  giverId: string;
  receiverId: string;
  points: number;
  message: string;
  createdAt: Date;
  month: number;
  year: number;
  channelId: string | null;
  channelName: string | null;
};
