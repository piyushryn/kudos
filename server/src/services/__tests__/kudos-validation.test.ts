import { describe, expect, it } from "vitest";

import { giveKudos } from "../kudos.service";

describe("giveKudos validation", () => {
  it("blocks self-kudos before database access", async () => {
    await expect(
      giveKudos({
        giverSlackUserId: "U123",
        giverDisplayName: "giver",
        receiverSlackUserId: "U123",
        points: 10,
        message: "great work",
        slackChannelId: "C0TEST",
        slackChannelName: "general",
      }),
    ).rejects.toThrow(/cannot give kudos to yourself/i);
  });

  it("blocks non-positive points before database access", async () => {
    await expect(
      giveKudos({
        giverSlackUserId: "U123",
        giverDisplayName: "giver",
        receiverSlackUserId: "U456",
        points: 0,
        message: "great work",
        slackChannelId: "C0TEST",
        slackChannelName: "general",
      }),
    ).rejects.toThrow(/positive whole number/i);
  });
});
