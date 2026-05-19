import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as invalidations from "../../cache/invalidations";
import { KudosEntryKind } from "../constants";
import { onKudosInsertMany, onKudosSaved } from "../kudos-cache-hooks";

let invalidateSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  invalidateSpy = vi
    .spyOn(invalidations, "invalidateCurrentLeaderboard")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  invalidateSpy.mockRestore();
});

describe("onKudosSaved", () => {
  it("invalidates the leaderboard when a KUDO row is saved", async () => {
    await onKudosSaved({ kind: KudosEntryKind.KUDO });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith("kudos_transaction_save");
  });

  it("skips admin marker rows", async () => {
    await onKudosSaved({ kind: KudosEntryKind.ADMIN_RESET_ALL });
    await onKudosSaved({ kind: KudosEntryKind.ADMIN_RESET_USER });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("tolerates malformed docs without throwing", async () => {
    await expect(onKudosSaved({} as unknown as { kind?: string })).resolves.toBeUndefined();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("onKudosInsertMany", () => {
  it("invalidates once when any inserted doc is a KUDO row", async () => {
    await onKudosInsertMany([
      { kind: KudosEntryKind.ADMIN_RESET_USER },
      { kind: KudosEntryKind.KUDO },
      { kind: KudosEntryKind.KUDO },
    ]);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith("kudos_transaction_insert_many");
  });

  it("skips invalidation when no doc is a KUDO row", async () => {
    await onKudosInsertMany([{ kind: KudosEntryKind.ADMIN_RESET_ALL }]);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("accepts a single doc (non-array) shape", async () => {
    await onKudosInsertMany({ kind: KudosEntryKind.KUDO });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
