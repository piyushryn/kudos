import { userRepository } from "../db/user.repository";
import { slackClient } from "../slack/client";

const fallbackDisplayName = (slackUserId: string): string => `@${slackUserId}`;
const normalizeSuggestedDisplayName = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const fetchSlackDisplayName = async (slackUserId: string): Promise<string> => {
  try {
    const response = await slackClient.users.info({ user: slackUserId });
    const profile = response.user?.profile;
    return (
      response.user?.real_name ||
      profile?.display_name ||
      profile?.real_name ||
      fallbackDisplayName(slackUserId)
    );
  } catch {
    return fallbackDisplayName(slackUserId);
  }
};

export const getOrCreateUser = async (
  slackUserId: string,
  suggestedDisplayName?: string,
) => {
  const normalizedSuggestedDisplayName = normalizeSuggestedDisplayName(suggestedDisplayName);
  const existing = await userRepository.findBySlackUserId(slackUserId);
  if (existing) {
    if (
      normalizedSuggestedDisplayName &&
      normalizedSuggestedDisplayName !== existing.displayName
    ) {
      return userRepository.updateDisplayName(existing.id, normalizedSuggestedDisplayName);
    }
    return existing;
  }

  return userRepository.create(
    slackUserId,
    normalizedSuggestedDisplayName ?? (await fetchSlackDisplayName(slackUserId)),
  );
};
