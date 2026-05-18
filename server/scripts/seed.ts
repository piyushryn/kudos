import { connectToDatabase, disconnectFromDatabase } from "../src/db/mongodb";
import { UserCategoryModel, UserModel } from "../src/db/models";

const SYSTEM_AUDIT_SLACK_USER_ID = "USLACK_SYSTEM_KUDOS_AUDIT";

const main = async (): Promise<void> => {
  await connectToDatabase();

  const employeeCategory = await UserCategoryModel.findOne({ key: "employee" }).lean().exec();
  if (!employeeCategory) {
    throw new Error("Missing default employee category.");
  }

  await UserModel.findOneAndUpdate(
    { slackUserId: SYSTEM_AUDIT_SLACK_USER_ID },
    {
      $set: { displayName: "System (admin audit)" },
      $setOnInsert: { userCategoryId: employeeCategory._id },
    },
    { upsert: true },
  ).exec();

  const users = [
    { slackUserId: "U_DEMO_TEST_USER_1", displayName: "TEST_USER_1" },
    { slackUserId: "U_DEMO_TEST_USER_2", displayName: "TEST_USER_2" },
    { slackUserId: "U_DEMO_TEST_USER_3", displayName: "TEST_USER_3" },
  ];

  await Promise.all(
    users.map((user) =>
      UserModel.findOneAndUpdate(
        { slackUserId: user.slackUserId },
        {
          $set: { displayName: user.displayName },
          $setOnInsert: { userCategoryId: employeeCategory._id },
        },
        { upsert: true },
      ).exec(),
    ),
  );
};

main()
  .then(async () => {
    await disconnectFromDatabase();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await disconnectFromDatabase();
    process.exit(1);
  });
