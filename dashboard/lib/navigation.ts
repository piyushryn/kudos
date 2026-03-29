export type NavItem = {
  href: string;
  label: string;
};

export type NavSection = {
  /** Empty string hides the section label in the sidebar. */
  title: string;
  items: NavItem[];
};

/** Only `/leaderboard` is outside the `/admin` area; everything else is under Admin. */
export const navigation: NavSection[] = [
  {
    title: "Leaderboard",
    items: [{ href: "/leaderboard", label: "Leaderboard" }],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Home" },
      { href: "/admin/audit-log", label: "Audit log" },
      { href: "/admin/categories", label: "User categories" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/quotas", label: "Quotas & balances" },
    ],
  },
];
