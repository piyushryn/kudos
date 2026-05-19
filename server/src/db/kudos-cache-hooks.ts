import { invalidateAuditLog, invalidateCurrentLeaderboard } from "../cache/invalidations";
import { KudosEntryKind } from "./constants";

type KudosDocLike = { kind?: string };

/**
 * Handler invoked from the post-`save` Mongoose hook on
 * `kudosTransactionSchema`. Fire-and-forget; the cache layer swallows its
 * own errors so this returns a void promise.
 *
 * Every persisted row (kudos AND admin marker rows) shows up in the audit
 * log, so the audit cache always busts. Only KUDO rows affect aggregate
 * totals, so the leaderboard cache only busts for those.
 */
export const onKudosSaved = async (doc: KudosDocLike): Promise<void> => {
  const tasks: Promise<unknown>[] = [invalidateAuditLog("kudos_transaction_save")];
  if (doc?.kind === KudosEntryKind.KUDO) {
    tasks.push(invalidateCurrentLeaderboard("kudos_transaction_save"));
  }
  await Promise.all(tasks);
};

/**
 * Handler invoked from the post-`insertMany` Mongoose hook on
 * `kudosTransactionSchema`. Audit cache always busts; leaderboard cache
 * busts only when at least one inserted document is a KUDO row.
 */
export const onKudosInsertMany = async (docs: KudosDocLike[] | KudosDocLike): Promise<void> => {
  const docsArray = Array.isArray(docs) ? docs : [docs];
  if (docsArray.length === 0) {
    return;
  }
  const tasks: Promise<unknown>[] = [invalidateAuditLog("kudos_transaction_insert_many")];
  if (docsArray.some((d) => d?.kind === KudosEntryKind.KUDO)) {
    tasks.push(invalidateCurrentLeaderboard("kudos_transaction_insert_many"));
  }
  await Promise.all(tasks);
};
