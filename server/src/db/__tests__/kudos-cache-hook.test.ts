import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as invalidations from "../../cache/invalidations";
import { KudosEntryKind } from "../constants";
import { onKudosInsertMany, onKudosSaved } from "../kudos-cache-hooks";

let leaderboardSpy: ReturnType<typeof vi.spyOn>;
let auditSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  leaderboardSpy = vi
    .spyOn(invalidations, "invalidateCurrentLeaderboard")
    .mockResolvedValue(undefined);
  auditSpy = vi
    .spyOn(invalidations, "invalidateAuditLog")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  leaderboardSpy.mockRestore();
  auditSpy.mockRestore();
});

describe("onKudosSaved", () => {
  it("invalidates leaderboard AND audit when a KUDO row is saved", async () => {
    await onKudosSaved({ kind: KudosEntryKind.KUDO });
    expect(leaderboardSpy).toHaveBeenCalledTimes(1);
    expect(leaderboardSpy).toHaveBeenCalledWith("kudos_transaction_save");
    expect(auditSpy).toHaveBeenCalledTimes(1);
    expect(auditSpy).toHaveBeenCalledWith("kudos_transaction_save");
  });

  it("invalidates audit only (not leaderboard) for admin marker rows", async () => {
    await onKudosSaved({ kind: KudosEntryKind.ADMIN_RESET_ALL });
    await onKudosSaved({ kind: KudosEntryKind.ADMIN_RESET_USER });
    expect(leaderboardSpy).not.toHaveBeenCalled();
    expect(auditSpy).toHaveBeenCalledTimes(2);
  });

  it("tolerates malformed docs without throwing (still busts audit cache)", async () => {
    await expect(onKudosSaved({} as unknown as { kind?: string })).resolves.toBeUndefined();
    expect(leaderboardSpy).not.toHaveBeenCalled();
    expect(auditSpy).toHaveBeenCalledTimes(1);
  });
});

describe("onKudosInsertMany", () => {
  it("invalidates both caches once when any inserted doc is a KUDO row", async () => {
    await onKudosInsertMany([
      { kind: KudosEntryKind.ADMIN_RESET_USER },
      { kind: KudosEntryKind.KUDO },
      { kind: KudosEntryKind.KUDO },
    ]);
    expect(leaderboardSpy).toHaveBeenCalledTimes(1);
    expect(leaderboardSpy).toHaveBeenCalledWith("kudos_transaction_insert_many");
    expect(auditSpy).toHaveBeenCalledTimes(1);
    expect(auditSpy).toHaveBeenCalledWith("kudos_transaction_insert_many");
  });

  it("invalidates audit only when no doc is a KUDO row", async () => {
    await onKudosInsertMany([{ kind: KudosEntryKind.ADMIN_RESET_ALL }]);
    expect(leaderboardSpy).not.toHaveBeenCalled();
    expect(auditSpy).toHaveBeenCalledTimes(1);
  });

  it("is a no-op for an empty batch", async () => {
    await onKudosInsertMany([]);
    expect(leaderboardSpy).not.toHaveBeenCalled();
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it("accepts a single doc (non-array) shape", async () => {
    await onKudosInsertMany({ kind: KudosEntryKind.KUDO });
    expect(leaderboardSpy).toHaveBeenCalledTimes(1);
    expect(auditSpy).toHaveBeenCalledTimes(1);
  });
});
