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

  it("parses mention with display label", () => {
    const parsed = parseKudosCommand("<@U123456|rahul> 5 nice work");
    expect(parsed).toEqual({
      receiverSlackUserId: "U123456",
      points: 5,
      message: "nice work",
    });
  });

  it("allows no space between mention and points", () => {
    const parsed = parseKudosCommand("<@U09ABC>10 thanks");
    expect(parsed).toEqual({
      receiverSlackUserId: "U09ABC",
      points: 10,
      message: "thanks",
    });
  });

  it("throws for plain @name without Slack mention token", () => {
    expect(() => parseKudosCommand("@rahul 10 great help")).toThrow(/autocomplete/i);
  });

  it("throws for empty text", () => {
    expect(() => parseKudosCommand("   ")).toThrow(/Add who to thank/i);
  });

  it("throws for invalid command text", () => {
    expect(() => parseKudosCommand("invalid command")).toThrow(/autocomplete/i);
  });
});
