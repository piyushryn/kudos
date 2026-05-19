/**
 * Centralized cache key builders. Bump the version segment (`v1`) when the
 * cached payload shape changes so stale entries are ignored without manual
 * flushing.
 */
const NAMESPACE = "kudos";
const LEADERBOARD_V = "v1";
const AUDIT_LOG_V = "v1";

export const LEADERBOARD_CURRENT_PREFIX = `${NAMESPACE}:leaderboard:current:${LEADERBOARD_V}:`;

export const publicLeaderboardKey = (limit: number): string =>
  `${LEADERBOARD_CURRENT_PREFIX}public:limit=${limit}`;

export const adminLeaderboardKey = (limit: number): string =>
  `${LEADERBOARD_CURRENT_PREFIX}admin:limit=${limit}`;

/**
 * Audit-log cache covers only the active (non-archived, default-filtered) view.
 * Archived / month-filtered queries bypass the cache because they're already
 * point-in-time snapshots.
 */
export const AUDIT_LOG_ACTIVE_PREFIX = `${NAMESPACE}:audit:${AUDIT_LOG_V}:active:`;

export const auditLogActiveKey = (page: number, pageSize: number): string =>
  `${AUDIT_LOG_ACTIVE_PREFIX}page=${page}:size=${pageSize}`;
