export type NavItem = {
  href: string;
  label: string;
};

export type NavSection = {
  /** Empty string hides the section label in the sidebar/menu. */
  title: string;
  items: NavItem[];
};

/**
 * Primary top-nav: shown to everyone, always.
 * The `Admin` entry is added by the shell so unauthenticated users still see
 * it (server-side guards do the gating).
 */
export const primaryNav: NavItem[] = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/me", label: "My stats" },
];

/**
 * Admin sub-nav: shown as pills under the top bar while inside `/admin/*`.
 */
export const adminNav: NavItem[] = [
  { href: "/admin", label: "Home" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/quotas", label: "Quotas" },
  { href: "/admin/leaderboard-reset", label: "Leaderboard reset" },
  { href: "/admin/rbac-users", label: "Access" },
];

/**
 * Mobile menu groups everything in one drawer.
 * Kept exported for backwards compat with any consumer that imported `navigation`.
 */
export const navigation: NavSection[] = [
  { title: "Workspace", items: primaryNav },
  { title: "Admin", items: adminNav },
];
