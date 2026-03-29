import { slackClient } from "../slack/client";
import { AppError } from "../utils/errors";

/**
 * Ensures /kudos runs only in a workspace channel (public or private), not in DMs or group DMs.
 * Uses Slack conversations.info (requires conversations:read on the bot).
 */
export const assertKudosAllowedInChannel = async (
  channelId: string,
  fallbackChannelName?: string,
): Promise<{ channelId: string; channelName: string }> => {
  if (!channelId || channelId.trim().length === 0) {
    throw new AppError("Missing channel context for this command.", 400);
  }

  // Slack DM conversation IDs start with D — reject before calling the API.
  if (channelId.startsWith("D")) {
    throw new AppError(
      "You can only give kudos in a *channel* (public or private), not in a DM. Run `/kudos` from a channel where the app is present.",
      400,
    );
  }

  const info = await slackClient.conversations.info({ channel: channelId });

  if (!info.ok || !info.channel) {
    const detail =
      info.error === "missing_scope"
        ? "The app needs the *conversations:read* scope. Reinstall the Slack app with updated permissions."
        : info.error === "channel_not_found"
          ? "Slack could not read this channel. Invite the Kudos app to the channel and try again."
          : "Could not verify the channel. Check that the bot is installed and has *conversations:read*.";
    throw new AppError(detail, 400);
  }

  const ch = info.channel;
  if (ch.is_im === true || ch.is_mpim === true) {
    throw new AppError(
      "You can only give kudos in a *channel* (public or private), not in direct messages or group DMs.",
      400,
    );
  }

  const channelName =
    (typeof ch.name === "string" && ch.name.length > 0 ? ch.name : null) ??
    (fallbackChannelName && fallbackChannelName.length > 0 ? fallbackChannelName : null) ??
    channelId;

  return { channelId, channelName };
};
