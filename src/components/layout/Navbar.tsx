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

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* Top bar */}
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Logo / Title */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
            PD
          </span>
          <span className="text-sm font-semibold text-slate-800">
            PriceDiary
          </span>
        </Link>

        {/* Desktop nav links – показваме само ако потребителят е логнат */}
        <div className="hidden items-center gap-2 md:flex">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  isActiveLink(link.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
        </div>

        {/* Desktop auth controls */}
        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="text-xs text-slate-500">Зареждане…</span>
          ) : user ? (
            <>
              <span className="hidden text-xs text-slate-600 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
              >
                {isLoggingOut ? "Излизане…" : "Изход"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Вход
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Отвори менюто</span>
          {mobileOpen ? (
            // X icon
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3">
            {/* Nav links – само ако има логнат потребител */}
            <div className="flex flex-col gap-1">
              {user &&
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium transition",
                      isActiveLink(link.href)
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>

            {/* Auth controls */}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
              {loading ? (
                <span className="text-xs text-slate-500">Зареждане…</span>
              ) : user ? (
                <>
                  <span className="text-xs text-slate-600">{user.email}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    {isLoggingOut ? "Излизане…" : "Изход"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-md px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Вход
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-md bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-700"
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
