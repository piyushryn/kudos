import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveKudosSlashText } from "../../services/kudos-command-resolve.service";
import { resolveSlackUserIdFromHandle } from "../../services/slack-user-resolve.service";
import { parseKudosAtHandleDraft, parseKudosUserIdMention } from "../parser";

vi.mock("../../services/slack-user-resolve.service", () => ({
  resolveSlackUserIdFromHandle: vi.fn(),
}));

describe("parseKudosUserIdMention", () => {
  it("parses a valid kudos command", () => {
    const parsed = parseKudosUserIdMention("<@U123456> 10 great debugging help today");
    expect(parsed).toEqual({
      receiverSlackUserId: "U123456",
      points: 10,
      message: "great debugging help today",
    });
  });

  it("parses mention with display label", () => {
    const parsed = parseKudosUserIdMention("<@U123456|rahul> 5 nice work");
    expect(parsed).toEqual({
      receiverSlackUserId: "U123456",
      points: 5,
      message: "nice work",
    });
  });

  it("allows no space between mention and points", () => {
    const parsed = parseKudosUserIdMention("<@U09ABC>10 thanks");
    expect(parsed).toEqual({
      receiverSlackUserId: "U09ABC",
      points: 10,
      message: "thanks",
    });
  });
});

describe("parseKudosAtHandleDraft", () => {
  it("parses plain @handle like Slack slash commands often send", () => {
    const draft = parseKudosAtHandleDraft("@swarnim 10 points");
    expect(draft).toEqual({
      handle: "swarnim",
      points: 10,
      message: "points",
    });
  });
});

describe("resolveKudosSlashText", () => {
  beforeEach(() => {
    vi.mocked(resolveSlackUserIdFromHandle).mockResolvedValue("U_RESOLVED");
  });

  it("resolves @handle via Slack user list lookup", async () => {
    const parsed = await resolveKudosSlashText("@rahul 10 great help");
    expect(parsed).toEqual({
      receiverSlackUserId: "U_RESOLVED",
      points: 10,
      message: "great help",
    });
    expect(resolveSlackUserIdFromHandle).toHaveBeenCalledWith("rahul");
  });

  it("prefers <@U…> without calling lookup", async () => {
    const parsed = await resolveKudosSlashText("<@U111> 3 hi");
    expect(parsed.receiverSlackUserId).toBe("U111");
    expect(resolveSlackUserIdFromHandle).not.toHaveBeenCalled();
  });

  it("throws for empty text", async () => {
    await expect(resolveKudosSlashText("   ")).rejects.toThrow(/Add who to thank/i);
  });

  it("throws for invalid command text", async () => {
    await expect(resolveKudosSlashText("invalid command")).rejects.toThrow(/Use one of these formats/i);
  });
});
