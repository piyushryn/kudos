import mongoose from "mongoose";

import { config } from "../config";
import { EMPLOYEE_CATEGORY_KEY } from "../constants/user-category";
import { UserCategoryModel } from "./models";

const globalForMongoose = globalThis as unknown as {
  mongooseConnectionPromise?: Promise<typeof mongoose>;
};

export const connectToDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!globalForMongoose.mongooseConnectionPromise) {
    globalForMongoose.mongooseConnectionPromise = mongoose.connect(config.MONGODB_URI);
  }

  await globalForMongoose.mongooseConnectionPromise;
  await UserCategoryModel.findOneAndUpdate(
    { key: EMPLOYEE_CATEGORY_KEY },
    { $setOnInsert: { key: EMPLOYEE_CATEGORY_KEY, name: "Employee", monthlyGivingQuota: null } },
    { upsert: true },
  ).exec();
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  delete globalForMongoose.mongooseConnectionPromise;
};
