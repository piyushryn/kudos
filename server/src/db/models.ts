import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

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

type UserCategoryDoc = InferSchemaType<typeof userCategorySchema> & { _id: Types.ObjectId };
type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
type UserGivingBalanceDoc = InferSchemaType<typeof userGivingBalanceSchema> & { _id: Types.ObjectId };
type KudosTransactionDoc = InferSchemaType<typeof kudosTransactionSchema> & { _id: Types.ObjectId };

const createModel = <T>(name: string, schema: Schema<T>): Model<T> =>
  (models[name] as Model<T> | undefined) ?? model<T>(name, schema);

export const UserCategoryModel = createModel<UserCategoryDoc>("UserCategory", userCategorySchema);
export const UserModel = createModel<UserDoc>("User", userSchema);
export const UserGivingBalanceModel = createModel<UserGivingBalanceDoc>(
  "UserGivingBalance",
  userGivingBalanceSchema,
);
export const KudosTransactionModel = createModel<KudosTransactionDoc>(
  "KudosTransaction",
  kudosTransactionSchema,
);
