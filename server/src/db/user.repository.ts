import { EMPLOYEE_CATEGORY_KEY } from "../constants/user-category";
import { UserCategoryModel, UserModel } from "./models";
import { asObjectId, UserWithCategoryRecord } from "./mappers";

const toUserWithCategory = (user: any): UserWithCategoryRecord => ({
  id: String(user._id),
  slackUserId: user.slackUserId,
  displayName: user.displayName,
  userCategoryId: String(user.userCategoryId),
  createdAt: user.createdAt,
  userCategory: {
    id: String(user.userCategory._id),
    key: user.userCategory.key,
    name: user.userCategory.name,
    monthlyGivingQuota: user.userCategory.monthlyGivingQuota,
    createdAt: user.userCategory.createdAt,
  },
});

export const userRepository = {
  async findBySlackUserId(slackUserId: string): Promise<UserWithCategoryRecord | null> {
    const user = await UserModel.findOne({ slackUserId })
      .populate("userCategoryId")
      .lean()
      .exec();
    if (!user || !user.userCategoryId || typeof user.userCategoryId !== "object") {
      return null;
    }
    return toUserWithCategory({
      ...user,
      userCategory: user.userCategoryId,
    });
  },
  async create(slackUserId: string, displayName: string): Promise<UserWithCategoryRecord> {
    const employeeCategory = await UserCategoryModel.findOne({ key: EMPLOYEE_CATEGORY_KEY }).lean().exec();
    if (!employeeCategory) {
      throw new Error("Default employee category is missing.");
    }
    const created = await UserModel.create({
      slackUserId,
      displayName,
      userCategoryId: employeeCategory._id,
    });
    const createdWithCategory = await UserModel.findById(created._id).populate("userCategoryId").lean().exec();
    if (
      !createdWithCategory ||
      !createdWithCategory.userCategoryId ||
      typeof createdWithCategory.userCategoryId !== "object"
    ) {
      throw new Error("Unable to resolve created user category.");
    }
    return toUserWithCategory({
      ...createdWithCategory,
      userCategory: createdWithCategory.userCategoryId,
    });
  },
  async updateDisplayName(id: string, displayName: string): Promise<UserWithCategoryRecord> {
    const updated = await UserModel.findByIdAndUpdate(asObjectId(id), { displayName }, { new: true })
      .populate("userCategoryId")
      .lean()
      .exec();
    if (!updated || !updated.userCategoryId || typeof updated.userCategoryId !== "object") {
      throw new Error(`User not found: ${id}`);
    }
    return toUserWithCategory({
      ...updated,
      userCategory: updated.userCategoryId,
    });
  },
  async findAllIds(): Promise<Array<{ id: string }>> {
    const users = await UserModel.find({}, { _id: 1 }).lean().exec();
    return users.map((user) => ({ id: String(user._id) }));
  },
};
