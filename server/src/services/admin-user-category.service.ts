import { asObjectId } from "../db/mappers";
import { UserCategoryModel, UserModel } from "../db/models";
import { EMPLOYEE_CATEGORY_KEY } from "../constants/user-category";
import { AppError } from "../utils/errors";

const CATEGORY_KEY_REGEX = /^[a-z][a-z0-9_]{1,62}$/;

const assertMonthlyQuotaField = (value: number | null): void => {
  if (value === null) {
    return;
  }
  if (!Number.isInteger(value) || value <= 0 || value > 1_000_000) {
    throw new AppError("monthlyQuota must be null or an integer between 1 and 1,000,000.", 400);
  }
};

export type UserCategoryDto = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
  userCount: number;
};

export const listUserCategories = async (): Promise<UserCategoryDto[]> => {
  const categories = await UserCategoryModel.find({}).sort({ name: 1 }).lean().exec();
  const ids = categories.map((category) => category._id);
  const counts = ids.length
    ? await UserModel.aggregate<{ _id: unknown; count: number }>([
        { $match: { userCategoryId: { $in: ids } } },
        { $group: { _id: "$userCategoryId", count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
  return categories.map((c) => ({
    id: String(c._id),
    key: c.key,
    name: c.name,
    monthlyGivingQuota: c.monthlyGivingQuota ?? null,
    userCount: countMap.get(String(c._id)) ?? 0,
  }));
};

export const createUserCategory = async (input: {
  key: string;
  name: string;
  monthlyQuota: number | null;
}): Promise<UserCategoryDto> => {
  const key = input.key.trim().toLowerCase();
  if (!CATEGORY_KEY_REGEX.test(key)) {
    throw new AppError(
      "key must be 2–63 chars: start with a letter, then lowercase letters, digits, or underscores.",
      400,
    );
  }
  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) {
    throw new AppError("name must be 1–120 characters.", 400);
  }
  assertMonthlyQuotaField(input.monthlyQuota);

  const existing = await UserCategoryModel.findOne({ key }).lean().exec();
  if (existing) {
    throw new AppError("A category with this key already exists.", 409);
  }
  const c = await UserCategoryModel.create({
    key,
    name,
    monthlyGivingQuota: input.monthlyQuota,
  });
  return {
    id: String(c._id),
    key: c.key,
    name: c.name,
    monthlyGivingQuota: c.monthlyGivingQuota ?? null,
    userCount: 0,
  };
};

export const updateUserCategory = async (
  id: string,
  input: { name?: string; monthlyQuota?: number | null },
): Promise<UserCategoryDto> => {
  const existing = await UserCategoryModel.findById(asObjectId(id)).lean().exec();
  if (!existing) {
    throw new AppError("Category not found.", 404);
  }

  const data: { name?: string; monthlyGivingQuota?: number | null } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 120) {
      throw new AppError("name must be 1–120 characters.", 400);
    }
    data.name = name;
  }
  if (input.monthlyQuota !== undefined) {
    assertMonthlyQuotaField(input.monthlyQuota);
    data.monthlyGivingQuota = input.monthlyQuota;
  }
  if (Object.keys(data).length === 0) {
    throw new AppError("Provide name and/or monthlyQuota.", 400);
  }

  const c = await UserCategoryModel.findByIdAndUpdate(asObjectId(id), data, { new: true }).lean().exec();
  if (!c) {
    throw new AppError("Category not found.", 404);
  }
  const userCount = await UserModel.countDocuments({ userCategoryId: c._id });
  return {
    id: String(c._id),
    key: c.key,
    name: c.name,
    monthlyGivingQuota: c.monthlyGivingQuota ?? null,
    userCount,
  };
};

export const deleteUserCategory = async (id: string): Promise<void> => {
  const existing = await UserCategoryModel.findById(asObjectId(id)).lean().exec();
  if (!existing) {
    throw new AppError("Category not found.", 404);
  }
  if (existing.key === EMPLOYEE_CATEGORY_KEY) {
    throw new AppError("The default employee category cannot be deleted.", 400);
  }
  const usersCount = await UserModel.countDocuments({ userCategoryId: existing._id });
  if (usersCount > 0) {
    throw new AppError("Reassign or remove all users in this category before deleting it.", 400);
  }
  await UserCategoryModel.findByIdAndDelete(existing._id).exec();
};
