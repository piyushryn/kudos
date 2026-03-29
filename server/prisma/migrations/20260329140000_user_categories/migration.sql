-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_giving_quota" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_categories_key_key" ON "user_categories"("key");

INSERT INTO "user_categories" ("id", "key", "name", "monthly_giving_quota")
VALUES ('clucat000000employee01', 'employee', 'Employee', NULL);

ALTER TABLE "users" ADD COLUMN "user_category_id" TEXT;

UPDATE "users" SET "user_category_id" = 'clucat000000employee01' WHERE "user_category_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "user_category_id" SET NOT NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_user_category_id_fkey" FOREIGN KEY ("user_category_id") REFERENCES "user_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "users" DROP COLUMN "monthly_giving_quota";

CREATE INDEX "users_user_category_id_idx" ON "users"("user_category_id");
