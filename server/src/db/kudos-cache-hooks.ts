import { invalidateCurrentLeaderboard } from "../cache/invalidations";
import { KudosEntryKind } from "./constants";

type KudosDocLike = { kind?: string };

/**
 * Handler invoked from the post-`save` Mongoose hook on
 * `kudosTransactionSchema`. Fire-and-forget; the cache layer swallows its
 * own errors so this returns a void promise.
 */
export const onKudosSaved = async (doc: KudosDocLike): Promise<void> => {
  if (doc?.kind !== KudosEntryKind.KUDO) {
    return;
  }
  await invalidateCurrentLeaderboard("kudos_transaction_save");
};

/**
 * Handler invoked from the post-`insertMany` Mongoose hook on
 * `kudosTransactionSchema`. We only invalidate when at least one inserted
 * document is a KUDO row — admin marker batches are no-ops.
 */
export const onKudosInsertMany = async (docs: KudosDocLike[] | KudosDocLike): Promise<void> => {
  const docsArray = Array.isArray(docs) ? docs : [docs];
  if (!docsArray.some((d) => d?.kind === KudosEntryKind.KUDO)) {
    return;
  }
  await invalidateCurrentLeaderboard("kudos_transaction_insert_many");
};
