"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminNav, primaryNav } from "@/lib/navigation";

function pathIsActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/leaderboard" onClick={onClick} className="group flex items-center gap-2">
      <span className="font-display text-[1.65rem] italic leading-none text-ink-900">kudos</span>
      <span
        aria-hidden
        className="inline-block size-1.5 -translate-y-1 rounded-full bg-leaf-500 transition-transform group-hover:translate-y-0"
      />
    </Link>
  );
}

function MonthPill() {
  const now = new Date();
  const month = now.toLocaleString(undefined, { month: "long" });
  const year = now.getFullYear();
  return (
    <span className="hidden items-center gap-2 rounded-full border border-ink-200 bg-card px-3 py-1 text-xs font-medium text-ink-600 md:inline-flex">
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-leaf-500" />
      {month} {year}
    </span>
  );
}

function TopNavLink({
  href,
  label,
  pathname,
  onClick,
  forceActive,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
  forceActive?: boolean;
}) {
  const active = forceActive ?? pathIsActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center py-1 text-sm font-medium transition-colors",
        active ? "text-ink-900" : "text-ink-500 hover:text-ink-900",
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 -bottom-[18px] h-[2px] origin-center bg-ink-900 transition-transform",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />
    </Link>
  );
}

function PrimaryNav({
  pathname,
  inAdmin,
  onLinkClick,
}: {
  pathname: string;
  inAdmin: boolean;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex items-center gap-8">
      {primaryNav.map((item) => (
        <TopNavLink
          key={item.href}
          href={item.href}
          label={item.label}
          pathname={pathname}
          onClick={onLinkClick}
        />
      ))}
      <TopNavLink
        href="/admin"
        label="Admin"
        pathname={pathname}
        forceActive={inAdmin}
        onClick={onLinkClick}
      />
    </nav>
  );
}

function AdminSubNav({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <div className="sticky top-16 z-10 border-b border-ink-200 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-1 overflow-x-auto px-5 py-2 md:px-8 scrollbar-thin">
        {adminNav.map((item) => {
          const active = pathIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-ink-900 text-paper"
                  : "text-ink-500 hover:bg-ink-200/60 hover:text-ink-900",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileMenu({
  pathname,
  onLinkClick,
  showAdminLogout,
}: {
  pathname: string;
  onLinkClick: () => void;
  showAdminLogout: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-6 pt-12 text-ink-900">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="font-display text-2xl italic leading-none text-ink-900">kudos</span>
        <span aria-hidden className="inline-block size-1.5 -translate-y-1 rounded-full bg-leaf-500" />
      </div>

      <p className="px-2 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Workspace
      </p>
      {primaryNav.map((item) => {
        const active = pathIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-ink-900 text-paper" : "text-ink-700 hover:bg-ink-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <p className="mt-4 px-2 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      {adminNav.map((item) => {
        const active = pathIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-ink-900 text-paper" : "text-ink-700 hover:bg-ink-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {showAdminLogout ? (
        <form action="/admin/logout" method="post" className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const inAdmin = useMemo(
    () => pathname.startsWith("/admin") && pathname !== "/admin/login",
    [pathname],
  );

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-20 h-16 border-b border-ink-200 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-6 px-5 md:px-8">
          <Wordmark />

          <div className="hidden flex-1 items-center justify-center md:flex">
            <PrimaryNav pathname={pathname} inAdmin={inAdmin} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <MonthPill />
            {inAdmin ? (
              <form action="/admin/logout" method="post" className="hidden md:block">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-ink-200 bg-card text-ink-700 hover:bg-paper-2"
                >
                  Sign out
                </Button>
              </form>
            ) : null}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-expanded={mobileOpen}
                  aria-controls="app-mobile-menu"
                  className="border-ink-200 bg-card text-ink-900 hover:bg-paper-2 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">
                    {mobileOpen ? "Close menu" : "Open menu"}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                id="app-mobile-menu"
                className="border-ink-200 bg-paper p-0 text-ink-900"
              >
                <MobileMenu
                  pathname={pathname}
                  onLinkClick={closeMobile}
                  showAdminLogout={inAdmin}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {inAdmin ? <AdminSubNav pathname={pathname} /> : null}

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-10 md:px-8 md:py-14"
      >
        {children}
      </main>

      <footer className="border-t border-ink-200 bg-paper">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-ink-400 md:px-8">
          <span>Kudos for the Slack workspace.</span>
          <span className="font-display italic">Made for celebrating people.</span>
        </div>
      </footer>
    </div>
  );
}
