import type { UsersListResponse } from "@slack/web-api/dist/types/response/UsersListResponse";

import { slackClient } from "../slack/client";
import { AppError } from "../utils/errors";

type SlackMember = NonNullable<UsersListResponse["members"]>[number];

const normalizeHandle = (handle: string): string => handle.replace(/^@/, "").trim().toLowerCase();

const memberMatchesHandle = (member: SlackMember, handle: string): boolean => {
  if (member.deleted) {
    return false;
  }
  if (member.is_bot) {
    return false;
  }
  if (member.name?.toLowerCase() === handle) {
    return true;
  }
  const displayNorm = member.profile?.display_name_normalized?.toLowerCase();
  if (displayNorm && displayNorm === handle) {
    return true;
  }
  const realNorm = member.profile?.real_name_normalized?.toLowerCase();
  if (realNorm && realNorm === handle) {
    return true;
  }
  return false;
};

/**
 * Resolves plain @handle text (what Slack often sends for slash commands) to a user ID.
 * Prefer autocomplete mentions (<@U…>) when possible; this is a fallback for @username style input.
 */
export const resolveSlackUserIdFromHandle = async (handle: string): Promise<string> => {
  const q = normalizeHandle(handle);
  if (!q) {
    throw new AppError("Missing recipient handle.", 400);
  }

  let cursor: string | undefined;

  for (let page = 0; page < 40; page += 1) {
    const res = await slackClient.users.list(
      cursor ? { limit: 200, cursor } : { limit: 200 },
    );

    if (!res.ok || !res.members) {
      break;
    }

    const hit = res.members.find((m) => memberMatchesHandle(m, q));
    if (hit?.id) {
      return hit.id;
    }

    cursor = res.response_metadata?.next_cursor;
    if (!cursor) {
      break;
    }
  }

  throw new AppError(
    `Could not find a member matching *@${q}*. Use Slack’s @ autocomplete so the mention becomes a profile link, or use their exact Slack username / display name (no spaces).`,
    400,
  );
};
