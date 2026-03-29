import { AppError } from "../utils/errors";

export type ParsedKudosCommand = {
  receiverSlackUserId: string;
  points: number;
  message: string;
};

// Slack autocomplete sends: <@USER_ID> or <@USER_ID|label>
const userMentionPattern =
  /^<@([A-Z0-9]+)(?:\|[^>]+)?>\s*(\d+)\s+([\s\S]+)$/iu;

// Many clients send plain legacy handle: @swarnim 10 thanks (no <@U…> token)
const atHandlePattern = /^@([\w.-]+)\s*(\d+)\s+([\s\S]+)$/iu;

export const stripInvisible = (value: string): string =>
  value.replace(/[\u200B-\u200D\uFEFF]/g, "");

export const parseKudosUserIdMention = (text: string): ParsedKudosCommand | null => {
  const trimmed = stripInvisible(text).trim();
  const match = userMentionPattern.exec(trimmed);
  if (!match) {
    return null;
  }

  const receiverSlackUserId = match[1] ?? "";
  const points = Number(match[2] ?? Number.NaN);
  const message = (match[3] ?? "").trim();

  if (!receiverSlackUserId || !Number.isInteger(points) || message.length === 0) {
    return null;
  }

  return { receiverSlackUserId, points, message };
};

export type KudosAtHandleDraft = {
  handle: string;
  points: number;
  message: string;
};

export const parseKudosAtHandleDraft = (text: string): KudosAtHandleDraft | null => {
  const trimmed = stripInvisible(text).trim();
  const match = atHandlePattern.exec(trimmed);
  if (!match) {
    return null;
  }

  const handle = (match[1] ?? "").trim();
  const points = Number(match[2] ?? Number.NaN);
  const message = (match[3] ?? "").trim();

  if (!handle || !Number.isInteger(points) || message.length === 0) {
    return null;
  }

  return { handle, points, message };
};

export const formatKudosUsageError = (): string =>
  [
    "Use one of these formats:",
    "• `/kudos @someone 10 great work` — type @ and pick the person *or* use their Slack username (what you see after @ in their profile).",
    "• `/kudos` with autocomplete so Slack inserts a mention token (shows as a linked name).",
  ].join("\n");
