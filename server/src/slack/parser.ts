import { AppError } from "../utils/errors";

export type ParsedKudosCommand = {
  receiverSlackUserId: string;
  points: number;
  message: string;
};

const commandPattern = /^<@([A-Z0-9]+)(?:\|[^>]+)?>\s+(\d+)\s+([\s\S]+)$/i;

export const parseKudosCommand = (text: string): ParsedKudosCommand => {
  const trimmed = text.trim();
  const match = commandPattern.exec(trimmed);

  if (!match) {
    throw new AppError(
      "Usage: /kudos @user points message (example: /kudos @rahul 10 great debugging help)",
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
