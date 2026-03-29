import { EMPLOYEE_CATEGORY_KEY } from "../constants/user-category";
import { prisma } from "./prisma";

const userWithCategory = { userCategory: true } as const;

export const userRepository = {
  findBySlackUserId(slackUserId: string) {
    return prisma.user.findUnique({
      where: { slackUserId },
      include: userWithCategory,
    });
  },
  create(slackUserId: string, displayName: string) {
    return prisma.user.create({
      data: {
        slackUserId,
        displayName,
        userCategory: { connect: { key: EMPLOYEE_CATEGORY_KEY } },
      },
      include: userWithCategory,
    });
  },
  updateDisplayName(id: string, displayName: string) {
    return prisma.user.update({
      where: { id },
      data: { displayName },
      include: userWithCategory,
    });
  },
  findAllIds() {
    return prisma.user.findMany({ select: { id: true } });
  },
};
