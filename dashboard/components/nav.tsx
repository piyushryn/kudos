import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/audit-log", label: "Audit log" },
  { href: "/admin/categories", label: "Admin · Categories" },
  { href: "/admin/quotas", label: "Admin · Quotas" },
];

export function Nav() {
  return (
    <nav className="nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
