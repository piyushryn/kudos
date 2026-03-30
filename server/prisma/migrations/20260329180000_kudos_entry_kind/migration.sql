-- CreateEnum
CREATE TYPE "KudosEntryKind" AS ENUM ('KUDO', 'ADMIN_RESET_USER', 'ADMIN_RESET_ALL');

-- AlterTable
ALTER TABLE "kudos_transactions" ADD COLUMN "kind" "KudosEntryKind" NOT NULL DEFAULT 'KUDO';
ALTER TABLE "kudos_transactions" ADD COLUMN "counts_toward_totals" BOOLEAN NOT NULL DEFAULT true;
