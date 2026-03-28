-- Create users table
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "slack_user_id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create user_giving_balance table
CREATE TABLE "user_giving_balance" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "remaining_points" INTEGER NOT NULL,
  CONSTRAINT "user_giving_balance_pkey" PRIMARY KEY ("id")
);

-- Create kudos_transactions table
CREATE TABLE "kudos_transactions" (
  "id" TEXT NOT NULL,
  "giver_id" TEXT NOT NULL,
  "receiver_id" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  CONSTRAINT "kudos_transactions_pkey" PRIMARY KEY ("id")
);

-- Indexes and constraints
CREATE UNIQUE INDEX "users_slack_user_id_key" ON "users"("slack_user_id");
CREATE UNIQUE INDEX "user_giving_balance_user_id_month_year_key" ON "user_giving_balance"("user_id", "month", "year");
CREATE INDEX "user_giving_balance_month_year_idx" ON "user_giving_balance"("month", "year");
CREATE INDEX "kudos_transactions_receiver_id_month_year_idx" ON "kudos_transactions"("receiver_id", "month", "year");
CREATE INDEX "kudos_transactions_giver_id_month_year_idx" ON "kudos_transactions"("giver_id", "month", "year");
CREATE INDEX "kudos_transactions_created_at_idx" ON "kudos_transactions"("created_at");

-- Foreign keys
ALTER TABLE "user_giving_balance"
ADD CONSTRAINT "user_giving_balance_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kudos_transactions"
ADD CONSTRAINT "kudos_transactions_giver_id_fkey"
FOREIGN KEY ("giver_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "kudos_transactions"
ADD CONSTRAINT "kudos_transactions_receiver_id_fkey"
FOREIGN KEY ("receiver_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
