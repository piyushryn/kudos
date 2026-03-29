import { AppError } from "../utils/errors";

export type ParsedKudosCommand = {
  receiverSlackUserId: string;
  points: number;
  message: string;
};

// Slack encodes @mentions as <@USER_ID> or <@USER_ID|display name> in slash command `text`.
// Plain "@name" without picking from autocomplete is not sent as <@...> — users must @-mention from the picker.
const commandPattern =
  /^<@([A-Z0-9]+)(?:\|[^>]+)?>\s*(\d+)\s+([\s\S]+)$/iu;

const stripInvisible = (value: string): string =>
  value.replace(/[\u200B-\u200D\uFEFF]/g, "");

export const parseKudosCommand = (text: string): ParsedKudosCommand => {
  const trimmed = stripInvisible(text).trim();

  if (trimmed.length === 0) {
    throw new AppError(
      "Add who to thank, how many points, and a short message. Example: `/kudos @Rahul 10 great debugging help` — use @ and choose them from the list so Slack inserts the mention.",
      400,
    );
  }

  if (!trimmed.includes("<@")) {
    throw new AppError(
      "Start with an @mention *from Slack’s autocomplete* (not plain text). Example: `/kudos @Rahul 10 great debugging help` — after @, pick the person from the list.",
      400,
    );
  }

  const match = commandPattern.exec(trimmed);

  if (!match) {
    throw new AppError(
      "Format: `/kudos @person points message` — e.g. `/kudos @Rahul 10 great debugging help`. Use @ + pick the user, then a whole number, then your message.",
      400,
    );
  }

  const receiverSlackUserId = match[1] ?? "";
  const points = Number(match[2] ?? Number.NaN);
  const message = (match[3] ?? "").trim();

  if (!receiverSlackUserId || !Number.isInteger(points) || message.length === 0) {
    throw new AppError("Invalid command arguments.", 400);
  }

  return { receiverSlackUserId, points, message };
};
