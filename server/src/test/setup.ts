process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kudos-test";
process.env.SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "test-signing-secret";
process.env.SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN ?? "xoxb-test-token";
process.env.USER_SESSION_SIGNING_SECRET =
  process.env.USER_SESSION_SIGNING_SECRET ?? "user-session-signing-secret-for-tests-1234567890";
process.env.SUPER_ADMIN_SLACK_USER_IDS = process.env.SUPER_ADMIN_SLACK_USER_IDS ?? "USUPERADMIN";
