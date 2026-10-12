"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Въвеждане" },
  { href: "/stats", label: "Статистика" },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setMobileOpen(false);
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-stroke bg-surface/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setMobileOpen(false)}
        >
          <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-white">
            PD
          </span>
          <span className="text-sm font-semibold text-fg">PriceDiary</span>
        </Link>

        {/* Desktop — nav links */}
        <div className="hidden items-center gap-0.5 md:flex">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                  isActive(link.href)
                    ? "bg-accent-l text-accent"
                    : "text-fg-2 hover:bg-muted hover:text-fg",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
        </div>

        {/* Desktop — auth */}
        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="h-4 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <>
              <span className="hidden max-w-[160px] truncate text-xs text-fg-2 sm:block">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-muted hover:text-fg disabled:opacity-50"
              >
                {isLoggingOut ? "Излизане…" : "Изход"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-muted hover:text-fg"
              >
                Вход
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-accent-h"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>

        {/* Mobile — hamburger */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-muted hover:text-fg md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Затвори менюто" : "Отвори менюто"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile — dropdown panel */}
      {mobileOpen && (
        <div className="border-t border-stroke bg-surface md:hidden">
          <div className="mx-auto flex max-w-4xl flex-col px-4 py-3">
            {/* Nav links */}
            {user && (
              <div className="flex flex-col gap-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                      isActive(link.href)
                        ? "bg-accent-l text-accent"
                        : "text-fg-2 hover:bg-muted hover:text-fg",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Auth section */}
            <div className={[
              "flex flex-col gap-2 pt-3",
              user ? "mt-2 border-t border-stroke" : "",
            ].join(" ")}>
              {loading ? (
                <span className="h-4 w-32 animate-pulse rounded bg-muted" />
              ) : user ? (
                <>
                  <p className="px-1 text-xs text-fg-2">{user.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-10 w-full rounded-lg border border-stroke text-sm font-medium text-fg-2 transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
                  >
                    {isLoggingOut ? "Излизане…" : "Изход"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 items-center justify-center rounded-lg border border-stroke text-sm font-medium text-fg-2 transition-colors hover:bg-muted"
                  >
                    Вход
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-h"
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
