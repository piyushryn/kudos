import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const users = [
    { slackUserId: "U_DEMO_PIYUSH", displayName: "Piyush" },
    { slackUserId: "U_DEMO_RAHUL", displayName: "Rahul" },
    { slackUserId: "U_DEMO_ALICE", displayName: "Alice" },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { slackUserId: user.slackUserId },
        update: { displayName: user.displayName },
        create: {
          slackUserId: user.slackUserId,
          displayName: user.displayName,
          userCategory: { connect: { key: "employee" } },
        },
      }),
    ),
  );
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
