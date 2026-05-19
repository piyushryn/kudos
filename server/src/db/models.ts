import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

import { onKudosInsertMany, onKudosSaved } from "./kudos-cache-hooks";
import { KudosEntryKind } from "./constants";

const userCategorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    monthlyGivingQuota: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false },
);

const userSchema = new Schema(
  {
    slackUserId: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    isAdmin: { type: Boolean, required: true, default: false, index: true },
    userCategoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "UserCategory",
      index: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false },
);

const userGivingBalanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    remainingPoints: { type: Number, required: true },
  },
  { versionKey: false },
);
userGivingBalanceSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
userGivingBalanceSchema.index({ month: 1, year: 1 });

const receiverDailyCapSchema = new Schema(
  {
    receiverId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    dayStart: { type: Date, required: true },
    points: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);
receiverDailyCapSchema.index({ receiverId: 1, dayStart: 1 }, { unique: true });

const kudosTransactionSchema = new Schema(
  {
    kind: {
      type: String,
      enum: Object.values(KudosEntryKind),
      default: KudosEntryKind.KUDO,
      required: true,
      index: true,
    },
    countsTowardTotals: { type: Boolean, default: true, required: true, index: true },
    isArchived: { type: Boolean, default: false, required: true, index: true },
    giverId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    receiverId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    points: { type: Number, required: true },
    message: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    channelId: { type: String, default: null },
    channelName: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false },
);
kudosTransactionSchema.index({ receiverId: 1, month: 1, year: 1 });
kudosTransactionSchema.index({ giverId: 1, month: 1, year: 1 });
kudosTransactionSchema.index({ createdAt: 1 });
kudosTransactionSchema.index({ channelId: 1 });
kudosTransactionSchema.index({ kind: 1, countsTowardTotals: 1 });
kudosTransactionSchema.index({ isArchived: 1, month: 1, year: 1 });
kudosTransactionSchema.index({ isArchived: 1, createdAt: -1 });

// Bust the current-month leaderboard cache whenever a KUDO row is written.
// ADMIN_RESET_* marker rows don't change totals so we skip them.
// Hooks intentionally `void` the promise — failures inside the cache layer
// are already swallowed there, and we must not block the DB write either way.
kudosTransactionSchema.post("save", function (doc) {
  void onKudosSaved(doc as unknown as { kind?: string });
});

kudosTransactionSchema.post("insertMany", function (docs) {
  void onKudosInsertMany(docs as unknown as { kind?: string }[]);
});

// Text index on displayName for fast case-insensitive user search
userSchema.index({ displayName: "text" });

const archivedLeaderboardSchema = new Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    topGivers: [
      {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        slackUserId: { type: String, required: true },
        displayName: { type: String, required: true },
        points: { type: Number, required: true },
      },
    ],
    topReceivers: [
      {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        slackUserId: { type: String, required: true },
        displayName: { type: String, required: true },
        points: { type: Number, required: true },
      },
    ],
  },
  { timestamps: { createdAt: "archivedAt", updatedAt: false }, versionKey: false },
);
archivedLeaderboardSchema.index({ year: 1, month: 1 }, { unique: true });

type UserCategoryDoc = InferSchemaType<typeof userCategorySchema> & { _id: Types.ObjectId };
type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
type UserGivingBalanceDoc = InferSchemaType<typeof userGivingBalanceSchema> & { _id: Types.ObjectId };
type ReceiverDailyCapDoc = InferSchemaType<typeof receiverDailyCapSchema> & { _id: Types.ObjectId };
type KudosTransactionDoc = InferSchemaType<typeof kudosTransactionSchema> & { _id: Types.ObjectId };
type ArchivedLeaderboardDoc = InferSchemaType<typeof archivedLeaderboardSchema> & { _id: Types.ObjectId };

const createModel = <T>(name: string, schema: Schema<T>): Model<T> =>
  (models[name] as Model<T> | undefined) ?? model<T>(name, schema);

export const UserCategoryModel = createModel<UserCategoryDoc>("UserCategory", userCategorySchema);
export const UserModel = createModel<UserDoc>("User", userSchema);
export const UserGivingBalanceModel = createModel<UserGivingBalanceDoc>(
  "UserGivingBalance",
  userGivingBalanceSchema,
);
export const ReceiverDailyCapModel = createModel<ReceiverDailyCapDoc>(
  "ReceiverDailyCap",
  receiverDailyCapSchema,
);
export const KudosTransactionModel = createModel<KudosTransactionDoc>(
  "KudosTransaction",
  kudosTransactionSchema,
);
export const ArchivedLeaderboardModel = createModel<ArchivedLeaderboardDoc>(
  "ArchivedLeaderboard",
  archivedLeaderboardSchema,
);
