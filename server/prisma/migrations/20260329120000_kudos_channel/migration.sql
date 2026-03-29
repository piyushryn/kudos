-- AlterTable
ALTER TABLE "kudos_transactions" ADD COLUMN "channel_id" TEXT;
ALTER TABLE "kudos_transactions" ADD COLUMN "channel_name" TEXT;

-- CreateIndex
CREATE INDEX "kudos_transactions_channel_id_idx" ON "kudos_transactions"("channel_id");
