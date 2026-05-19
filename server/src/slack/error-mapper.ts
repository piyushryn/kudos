import { AppError } from "../utils/errors";

const slackErrorMessages: Record<string, string> = {
  not_authed: "Slack app auth is missing. Reinstall the app and try again.",
  invalid_auth: "Slack app authentication is invalid. Reinstall the app to refresh credentials.",
  token_revoked: "Slack app token was revoked. Reinstall the app to restore access.",
  account_inactive: "Slack app account is inactive. Reinstall or reconnect the app.",
  missing_scope:
    "The Slack app is missing required permissions. Reinstall the app with updated scopes.",
  channel_not_found:
    "Slack could not access this channel. Invite the Kudos app to the channel and try again.",
  not_in_channel:
    "The Kudos app is not in this channel. Invite it to the channel and run the command again.",
  is_archived: "This channel is archived. Use an active channel for kudos commands.",
  ratelimited: "Slack is rate limiting requests right now. Try again in a moment.",
  request_timeout: "Slack did not respond in time. Please try the command again.",
};

const asSlackErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const withData = error as { data?: { error?: unknown } };
  if (typeof withData.data?.error === "string" && withData.data.error.length > 0) {
    return withData.data.error;
  }

  const withError = error as { error?: unknown };
  if (typeof withError.error === "string" && withError.error.length > 0) {
    return withError.error;
  }

  return undefined;
};

export const mapSlackApiErrorToAppError = (
  error: unknown,
  fallbackMessage: string,
  statusCode = 400,
): AppError => {
  const slackErrorCode = asSlackErrorCode(error);
  if (slackErrorCode && slackErrorMessages[slackErrorCode]) {
    return new AppError(slackErrorMessages[slackErrorCode], statusCode);
  }
  return new AppError(fallbackMessage, statusCode);
};
