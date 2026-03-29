import {
  formatKudosUsageError,
  parseKudosAtHandleDraft,
  parseKudosUserIdMention,
  stripInvisible,
} from "../slack/parser";
import { AppError } from "../utils/errors";
import { resolveSlackUserIdFromHandle } from "./slack-user-resolve.service";

export const resolveKudosSlashText = async (text: string): Promise<{
  receiverSlackUserId: string;
  points: number;
  message: string;
}> => {
  const trimmed = stripInvisible(text).trim();

  if (trimmed.length === 0) {
    throw new AppError(
      "Add who to thank, how many points, and a short message. Example: `/kudos @rahul 10 great work`.",
      400,
    );
  }

  const byMention = parseKudosUserIdMention(trimmed);
  if (byMention) {
    return byMention;
  }

  const byHandle = parseKudosAtHandleDraft(trimmed);
  if (byHandle) {
    const receiverSlackUserId = await resolveSlackUserIdFromHandle(byHandle.handle);
    return {
      receiverSlackUserId,
      points: byHandle.points,
      message: byHandle.message,
    };
  }

  throw new AppError(formatKudosUsageError(), 400);
};
