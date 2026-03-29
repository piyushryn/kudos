"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { navigation } from "@/lib/navigation";

function pathIsActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("navOpen");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("navOpen");
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="appShell">
      {mobileOpen ? (
        <button type="button" className="sidebarBackdrop" aria-label="Close menu" onClick={closeMobile} />
      ) : null}

      <aside id="app-sidebar" className={`sidebar${mobileOpen ? " sidebarOpen" : ""}`} aria-label="Main navigation">
        <div className="sidebarInner">
          <div className="sidebarBrand">
            <div className="sidebarLogo" aria-hidden>
              K
            </div>
            <div className="sidebarBrandText">
              <span className="sidebarBrandTitle">Kudos</span>
              <span className="sidebarBrandSub">Slack workspace</span>
            </div>
          </div>

          <nav className="sidebarNav">
            {navigation.map((section, sectionIndex) => (
              <div key={section.title || `nav-${sectionIndex}`} className="sidebarSection">
                {section.title.trim() ? <p className="sidebarSectionLabel">{section.title}</p> : null}
                <ul className="sidebarList">
                  {section.items.map((item) => {
                    const active = pathIsActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`sidebarLink${active ? " sidebarLinkActive" : ""}`}
                          aria-current={active ? "page" : undefined}
                          onClick={closeMobile}
                        >
                          <span className="sidebarLinkText">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="mainColumn">
        <header className="mobileBar">
          <button
            type="button"
            className="mobileMenuBtn"
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <MenuIcon open={mobileOpen} />
            <span className="srOnly">{mobileOpen ? "Close menu" : "Open menu"}</span>
          </button>
          <span className="mobileBarTitle">Kudos</span>
        </header>

        <main className="mainInner" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
