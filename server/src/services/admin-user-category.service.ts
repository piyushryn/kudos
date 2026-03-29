import { prisma } from "../db/prisma";
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
  const categories = await prisma.userCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return categories.map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    monthlyGivingQuota: c.monthlyGivingQuota,
    userCount: c._count.users,
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

  try {
    const c = await prisma.userCategory.create({
      data: {
        key,
        name,
        monthlyGivingQuota: input.monthlyQuota,
      },
      include: { _count: { select: { users: true } } },
    });
    return {
      id: c.id,
      key: c.key,
      name: c.name,
      monthlyGivingQuota: c.monthlyGivingQuota,
      userCount: c._count.users,
    };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      throw new AppError("A category with this key already exists.", 409);
    }
    throw e;
  }
};

export const updateUserCategory = async (
  id: string,
  input: { name?: string; monthlyQuota: number | null | undefined },
): Promise<UserCategoryDto> => {
  const existing = await prisma.userCategory.findUnique({ where: { id } });
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

  const c = await prisma.userCategory.update({
    where: { id },
    data,
    include: { _count: { select: { users: true } } },
  });
  return {
    id: c.id,
    key: c.key,
    name: c.name,
    monthlyGivingQuota: c.monthlyGivingQuota,
    userCount: c._count.users,
  };
};

export const deleteUserCategory = async (id: string): Promise<void> => {
  const existing = await prisma.userCategory.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) {
    throw new AppError("Category not found.", 404);
  }
  if (existing.key === EMPLOYEE_CATEGORY_KEY) {
    throw new AppError("The default employee category cannot be deleted.", 400);
  }
  if (existing._count.users > 0) {
    throw new AppError("Reassign or remove all users in this category before deleting it.", 400);
  }
  await prisma.userCategory.delete({ where: { id } });
};
