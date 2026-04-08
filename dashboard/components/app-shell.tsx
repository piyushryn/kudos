"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";

function pathIsActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onLinkClick,
  showAdminLogout,
}: {
  pathname: string;
  onLinkClick: () => void;
  showAdminLogout: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-3 py-5">
      <div className="mb-3 flex items-center gap-3 border-b border-white/10 px-2 pb-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-700 text-lg font-bold text-white shadow"
        >
          K
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-tight text-slate-100">Kudos</div>
          <div className="text-xs text-slate-400">Slack workspace</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5">
        {navigation.map((section, sectionIndex) => (
          <div key={section.title || `nav-${sectionIndex}`}>
            {section.title.trim() ? (
              <p className="px-2 pb-1 text-[0.68rem] font-semibold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = pathIsActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onLinkClick}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "text-slate-200 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="block truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {showAdminLogout ? (
        <div className="mt-auto border-t border-white/10 pt-4">
          <form action="/admin/logout" method="post">
            <Button type="submit" variant="outline" className="w-full border-white/20 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white">
              Log out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const showAdminLogout = useMemo(
    () => pathname.startsWith("/admin") && pathname !== "/admin/login",
    [pathname],
  );

  return (
    <div className="flex min-h-screen items-stretch">
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:block">
        <SidebarContent pathname={pathname} onLinkClick={closeMobile} showAdminLogout={showAdminLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-expanded={mobileOpen}
                aria-controls="app-sidebar-mobile"
                className="border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
              </Button>
            </SheetTrigger>
            <SheetContent id="app-sidebar-mobile" className="border-slate-800 bg-slate-950 p-0 text-slate-100">
              <SidebarContent pathname={pathname} onLinkClick={closeMobile} showAdminLogout={showAdminLogout} />
            </SheetContent>
          </Sheet>
          <span className="text-base font-semibold tracking-tight text-slate-900">Kudos</span>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
