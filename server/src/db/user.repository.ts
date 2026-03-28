import { prisma } from "./prisma";

export const userRepository = {
  findBySlackUserId(slackUserId: string) {
    return prisma.user.findUnique({ where: { slackUserId } });
  },
  create(slackUserId: string, displayName: string) {
    return prisma.user.create({
      data: { slackUserId, displayName },
    });
  },
  updateDisplayName(id: string, displayName: string) {
    return prisma.user.update({
      where: { id },
      data: { displayName },
    });
  },
  findAllIds() {
    return prisma.user.findMany({ select: { id: true } });
  },
};
