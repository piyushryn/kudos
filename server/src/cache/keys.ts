/**
 * Centralized cache key builders. Bump the version segment (`v1`) when the
 * cached payload shape changes so stale entries are ignored without manual
 * flushing.
 */
const NAMESPACE = "kudos";
const LEADERBOARD_V = "v1";

export const LEADERBOARD_CURRENT_PREFIX = `${NAMESPACE}:leaderboard:current:${LEADERBOARD_V}:`;

export const publicLeaderboardKey = (limit: number): string =>
  `${LEADERBOARD_CURRENT_PREFIX}public:limit=${limit}`;

export const adminLeaderboardKey = (limit: number): string =>
  `${LEADERBOARD_CURRENT_PREFIX}admin:limit=${limit}`;
