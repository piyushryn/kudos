import { describe, expect, it } from "vitest";

import { parseKudosCommand } from "../parser";

describe("parseKudosCommand", () => {
  it("parses a valid kudos command", () => {
    const parsed = parseKudosCommand("<@U123456> 10 great debugging help today");
    expect(parsed).toEqual({
      receiverSlackUserId: "U123456",
      points: 10,
      message: "great debugging help today",
    });
  });

  it("throws for invalid command text", () => {
    expect(() => parseKudosCommand("invalid command")).toThrow(/Usage:/);
  });
});
