import { userRepository } from "../db/user.repository";
import { slackClient } from "../slack/client";

const fallbackDisplayName = (slackUserId: string): string => `@${slackUserId}`;

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
  const existing = await userRepository.findBySlackUserId(slackUserId);
  if (existing) {
    if (suggestedDisplayName && suggestedDisplayName !== existing.displayName) {
      return userRepository.updateDisplayName(existing.id, suggestedDisplayName);
    }
    return existing;
  }

  return userRepository.create(
    slackUserId,
    suggestedDisplayName ?? (await fetchSlackDisplayName(slackUserId)),
  );
};
