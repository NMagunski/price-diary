"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { loginWithEmail } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

const inputCls =
  "h-11 w-full rounded-lg border border-stroke bg-surface px-3 text-sm text-fg placeholder:text-muted-fg transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-sky-500/20";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Грешка при вход.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-fg">Вход</h1>
        <p className="mb-6 text-sm text-fg-2">Добре дошъл обратно.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg" htmlFor="email">
              Имейл
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg" htmlFor="password">
              Парола
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-danger-l px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-h disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Влизане…" : "Влез"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-fg-2">
          Нямаш акаунт?{" "}
          <Link href="/auth/register" className="font-medium text-accent underline-offset-2 hover:underline">
            Регистрирай се
          </Link>
        </p>
      </div>
    </main>
  );
}
